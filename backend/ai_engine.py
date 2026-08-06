"""AI analysis engine — Groq for reasoning plus conversation-aware retrieval orchestration."""

import json
import os
import re
from typing import Dict, List

from dotenv import load_dotenv
from groq import Groq

from vector_store import store

load_dotenv()

# Groq client — free tier: 14,400 requests/day, 30 RPM on llama-3.3-70b-versatile
GROQ_MODEL = "llama-3.3-70b-versatile"
client = Groq(api_key=os.getenv("GROQ_API_KEY"))


def answer_query(question: str, context_chunks: List[Dict], detail_mode: str = "detailed") -> Dict:
    """Answer a question using retrieved context chunks."""
    context_text = _format_context(context_chunks, detail_mode)

    detail_instruction = (
        "Give a concise 2-3 sentence answer."
        if detail_mode == "simple"
        else (
            "Give a thorough answer of at least 4-6 well-developed paragraphs. "
            "Directly cite specific evidence, mechanisms, numbers, and examples from the context for each claim you make. "
            "Do not summarize briefly - explain fully, as you would in a research report."
        )
    )

    prompt = f"""{detail_instruction}

QUESTION: {question}

CONTEXT:
{context_text}

Respond ONLY with valid JSON, no extra text:
{{
    "answer": "Your answer here",
    "confidence_score": 0.85,
    "why_this_answer": "Brief explanation of evidence used",
    "citations": [
        {{
            "doc_name": "document name",
            "page_number": 1,
            "snippet": "exact short quote"
        }}
    ]
}}"""

    tokens = 2500 if detail_mode == "detailed" else 600
    return _call_llm(prompt, max_tokens=tokens)


def compare_documents(doc_chunks: Dict[str, List[Dict]], detail_mode: str = "detailed") -> Dict:
    """Compare key ideas across all documents."""
    context = _format_multi_doc_context(doc_chunks, detail_mode)
    detail_instruction = (
        "Give a concise comparison."
        if detail_mode == "simple"
        else "Give a thorough cross-document synthesis with concrete evidence and explicit document-to-document comparisons."
    )

    prompt = f"""{detail_instruction}

Compare these academic documents. Respond ONLY with valid JSON:
{{
    "comparison": {{
        "key_ideas": [
            {{
                "topic": "topic name",
                "documents": [
                    {{
                        "doc_name": "name",
                        "position": "what this doc says",
                        "snippet": "short quote"
                    }}
                ]
            }}
        ],
        "similarities": ["shared idea 1"],
        "differences": ["difference 1"],
        "summary": "Overall comparison"
    }},
    "citations": [{{"doc_name": "name", "page_number": 1, "snippet": "quote"}}],
    "confidence_score": 0.8
}}

DOCUMENTS:
{context}"""

    tokens = 2500 if detail_mode == "detailed" else 800
    return _call_llm(prompt, max_tokens=tokens)


def detect_contradictions(doc_chunks: Dict[str, List[Dict]], detail_mode: str = "detailed") -> Dict:
    """Detect contradictions between documents."""
    context = _format_multi_doc_context(doc_chunks, detail_mode)
    detail_instruction = (
        "Give a concise contradiction summary."
        if detail_mode == "simple"
        else "Give a detailed contradiction analysis with explicit conflicting claims and supporting evidence."
    )

    prompt = f"""{detail_instruction}

Find contradictions between these academic documents. Respond ONLY with valid JSON:
{{
    "contradictions": [
        {{
            "topic": "contradiction topic",
            "statement_a": {{
                "doc_name": "first doc",
                "statement": "what it says",
                "snippet": "exact quote"
            }},
            "statement_b": {{
                "doc_name": "second doc",
                "statement": "what it says",
                "snippet": "exact quote"
            }},
            "explanation": "why they conflict"
        }}
    ],
    "summary": "Overall summary of contradictions",
    "confidence_score": 0.8
}}

DOCUMENTS:
{context}"""

    tokens = 2500 if detail_mode == "detailed" else 800
    return _call_llm(prompt, max_tokens=tokens)


def summarize_trends(doc_chunks: Dict[str, List[Dict]], detail_mode: str = "detailed") -> Dict:
    """Identify common themes and trends."""
    context = _format_multi_doc_context(doc_chunks, detail_mode)
    detail_instruction = (
        "Give a concise trend summary."
        if detail_mode == "simple"
        else "Give a detailed synthesis of recurring themes, mechanisms, and evidence across the documents."
    )

    prompt = f"""{detail_instruction}

Identify trends across these academic documents. Respond ONLY with valid JSON:
{{
    "trends": [
        {{
            "theme": "theme name",
            "description": "description",
            "supporting_documents": ["doc1"],
            "evidence": [{{"doc_name": "name", "snippet": "quote"}}]
        }}
    ],
    "unified_summary": "Comprehensive synthesis of all documents",
    "citations": [{{"doc_name": "name", "page_number": 1, "snippet": "quote"}}],
    "confidence_score": 0.8
}}

DOCUMENTS:
{context}"""

    tokens = 2500 if detail_mode == "detailed" else 800
    return _call_llm(prompt, max_tokens=tokens)


def condense_query(history: List[Dict], follow_up: str) -> str:
    if not history:
        return follow_up

    history_text = "\n".join(f"{m['role']}: {m['content']}" for m in history[-6:])
    prompt = f"""Conversation so far:
{history_text}

Follow-up question: {follow_up}

Rewrite the follow-up as a fully standalone question that includes any necessary
context from the conversation. If the follow-up is already standalone, return it unchanged.
Respond with only the rewritten question, no explanation."""

    rewritten = _call_text_llm(prompt, max_tokens=150).strip()
    return rewritten or follow_up


def answer_query_stateful(conversation_id: str, user_id: str, question: str, detail_mode: str = "detailed") -> Dict:
    history = store.get_recent_messages(conversation_id, user_id, limit=6)
    last_assistant_msg = next((m for m in reversed(history) if m["role"] == "assistant"), None)

    chunks = []
    if last_assistant_msg and last_assistant_msg.get("source_chunk_ids") and _is_meta_follow_up(question):
        chunks = store.get_chunks_by_ids(last_assistant_msg["source_chunk_ids"], user_id)

    if not chunks:
        standalone_q = condense_query(history, question)
        chunks = store.retrieve(standalone_q, user_id)

    result = answer_query(question, chunks, detail_mode)
    chunk_ids = [c["chunk_id"] for c in chunks]

    store.save_message(conversation_id, "user", question, source_chunk_ids=None)
    store.save_message(conversation_id, "assistant", result.get("answer", ""), source_chunk_ids=chunk_ids or None)

    if isinstance(result, dict):
        result.setdefault("conversation_id", conversation_id)
    return result


def _is_meta_follow_up(question: str) -> bool:
    normalized = question.lower().strip()
    meta_phrases = (
        "page number",
        "which page",
        "what page",
        "citation",
        "citations",
        "cite",
        "source",
        "reference",
        "references",
        "for that",
        "for it",
        "for this",
        "about that",
        "about it",
        "about this",
    )
    if any(phrase in normalized for phrase in meta_phrases):
        return True

    return bool(re.search(r"\b(what|where|which|give)\b.*\b(it|that|this|those|these)\b", normalized))


def _format_context(chunks: List[Dict], detail_mode: str = "detailed") -> str:
    """Format context chunks into a prompt string with detail-aware truncation."""
    n = 8 if detail_mode == "detailed" else 4
    char_limit = 900 if detail_mode == "detailed" else 400
    parts = []
    for c in chunks[:n]:
        text = c["text"][:char_limit]
        parts.append(f"[Source: {c['doc_name']}, Page {c['page_number']}]\n{text}")
    return "\n\n".join(parts)


def _format_multi_doc_context(doc_chunks: Dict[str, List[Dict]], detail_mode: str = "detailed") -> str:
    n = 8 if detail_mode == "detailed" else 5
    char_limit = 600 if detail_mode == "detailed" else 200
    context = []
    for doc_name, chunks in doc_chunks.items():
        text = " ".join(c["text"][:char_limit] for c in chunks[:n])
        context.append(f"\n\n--- {doc_name} ---\n{text}")
    return "".join(context)


def _call_llm(prompt: str, max_tokens: int = 1500) -> Dict:
    """Call Groq API and parse JSON response."""
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {
                    "role": "system",
                    "content": "You are a precise research analyst. Always respond with valid JSON only, no extra text, no markdown fences.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.2,
            max_tokens=max_tokens,
        )

        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return json.loads(content)

    except json.JSONDecodeError as e:
        return {"error": f"Failed to parse AI response: {e}"}
    except Exception as e:
        return {"error": str(e)}


def _call_text_llm(prompt: str, max_tokens: int = 150) -> str:
    """Call Groq API and return plain text content."""
    try:
        response = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": "You rewrite text precisely and return only the rewritten text."},
                {"role": "user", "content": prompt},
            ],
            temperature=0.0,
            max_tokens=max_tokens,
        )
        content = response.choices[0].message.content.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"):
                content = content[4:]
        return content.strip()
    except Exception:
        return ""
