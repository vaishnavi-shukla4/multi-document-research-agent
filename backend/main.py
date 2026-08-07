"""
Multi-Document Research Agent — FastAPI Backend
"""

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
from dotenv import load_dotenv

load_dotenv()

from pdf_utils import extract_text_from_pdf
from chunker import chunk_pages
from vector_store import store
from ai_engine import answer_query, answer_query_stateful, compare_documents, detect_contradictions, summarize_trends
from auth import get_current_user

app = FastAPI(
    title="Multi-Document Research Agent",
    description="AI-powered multi-document analysis with citation tracking",
    version="2.0.0",
)

# Update ALLOWED_ORIGINS on Render to include your Vercel domain.
# e.g. ALLOWED_ORIGINS=https://your-app.vercel.app,http://localhost:5173
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:5173",
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Request / Response Models ──────────────────────────────────────────

class QueryRequest(BaseModel):
    question: str
    detail_mode: str = "detailed"  # "simple" | "detailed"
    top_k: int = 10
    conversation_id: Optional[str] = None


class CreateConversationRequest(BaseModel):
    title: Optional[str] = None


class ConversationMessageRequest(BaseModel):
    question: str
    detail_mode: str = "detailed"


# ── Public Endpoints ───────────────────────────────────────────────────

@app.get("/")
def root():
    return {"status": "ok", "message": "Multi-Document Research Agent API v2"}


# ── Protected Endpoints (require valid Supabase JWT) ───────────────────

@app.post("/upload")
async def upload_documents(
    files: List[UploadFile] = File(...),
    user_id: str = Depends(get_current_user),
):
    """Upload one or more PDF files, extract text, chunk, embed, and persist."""
    results = []

    for file in files:
        if not file.filename.lower().endswith(".pdf"):
            raise HTTPException(status_code=400, detail=f"{file.filename} is not a PDF")

        content = await file.read()
        doc_name = file.filename

        try:
            pages = extract_text_from_pdf(content, doc_name)
            if not pages:
                print(f"UPLOAD ERROR: No text extracted from {doc_name}")
                results.append({"doc_name": doc_name, "status": "error", "message": "No text extracted"})
                continue

            chunks = chunk_pages(pages)
            store.add_chunks(chunks, user_id)

            print(f"UPLOAD SUCCESS: {doc_name} uploaded by user {user_id[:8]}…")
            results.append({
                "doc_name": doc_name,
                "status": "success",
                "pages_extracted": len(pages),
                "chunks_created": len(chunks),
            })
        except Exception as e:
            print(f"UPLOAD EXCEPTION FOR {doc_name}: {str(e)}")
            results.append({"doc_name": doc_name, "status": "error", "message": str(e)})
            continue

    return {
        "uploaded": results,
        "total_documents": len(store.get_documents(user_id)),
    }


@app.get("/documents")
def list_documents(user_id: str = Depends(get_current_user)):
    """List all documents uploaded by the authenticated user."""
    return {"documents": store.get_documents(user_id)}


@app.delete("/documents/{doc_name}")
def delete_document(
    doc_name: str,
    user_id: str = Depends(get_current_user),
):
    """Remove a document from the store (scoped to authenticated user)."""
    success = store.remove_document(doc_name, user_id)
    if not success:
        raise HTTPException(status_code=404, detail="Document not found")
    return {"status": "removed", "doc_name": doc_name}


@app.post("/query")
def query_documents(
    req: QueryRequest,
    user_id: str = Depends(get_current_user),
):
    """Ask a question across the user's documents. Returns answer + citations."""
    if not store.get_documents(user_id):
        raise HTTPException(status_code=400, detail="No documents uploaded yet")

    if req.conversation_id:
        if not store.conversation_exists(req.conversation_id, user_id):
            raise HTTPException(status_code=404, detail="Conversation not found")
        return answer_query_stateful(req.conversation_id, user_id, req.question, detail_mode=req.detail_mode)

    context_chunks = store.search(req.question, user_id, top_k=req.top_k)
    result = answer_query(req.question, context_chunks, detail_mode=req.detail_mode)
    return result


@app.get("/conversations")
def list_conversations(
    user_id: str = Depends(get_current_user),
):
    return {"conversations": store.get_conversations(user_id)}


@app.post("/conversations")
def create_conversation(
    req: CreateConversationRequest,
    user_id: str = Depends(get_current_user),
):
    conversation_id = store.create_conversation(user_id, title=req.title)
    return {"conversation_id": conversation_id}


@app.post("/conversations/{conversation_id}/messages")
def send_conversation_message(
    conversation_id: str,
    req: ConversationMessageRequest,
    user_id: str = Depends(get_current_user),
):
    if not store.conversation_exists(conversation_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return answer_query_stateful(conversation_id, user_id, req.question, detail_mode=req.detail_mode)


@app.get("/conversations/{conversation_id}/messages")
def get_conversation_messages(
    conversation_id: str,
    user_id: str = Depends(get_current_user),
):
    if not store.conversation_exists(conversation_id, user_id):
        raise HTTPException(status_code=404, detail="Conversation not found")
    return {"conversation_id": conversation_id, "messages": store.get_recent_messages(conversation_id, user_id, limit=100)}


@app.post("/compare")
def compare(detail_mode: str = "detailed", user_id: str = Depends(get_current_user)):
    """Compare key ideas across the user's uploaded documents."""
    docs = store.get_documents(user_id)
    if len(docs) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 documents to compare")

    doc_chunks = {
        doc["name"]: store.get_all_chunks_for_doc(doc["name"], user_id)
        for doc in docs
    }
    return compare_documents(doc_chunks, detail_mode=detail_mode)


@app.post("/contradictions")
def find_contradictions(detail_mode: str = "detailed", user_id: str = Depends(get_current_user)):
    """Detect contradictions between the user's uploaded documents."""
    docs = store.get_documents(user_id)
    if len(docs) < 2:
        raise HTTPException(status_code=400, detail="Need at least 2 documents to find contradictions")

    doc_chunks = {
        doc["name"]: store.get_all_chunks_for_doc(doc["name"], user_id)
        for doc in docs
    }
    return detect_contradictions(doc_chunks, detail_mode=detail_mode)


@app.post("/trends")
def find_trends(detail_mode: str = "detailed", user_id: str = Depends(get_current_user)):
    """Identify common themes and trends across the user's documents."""
    docs = store.get_documents(user_id)
    if not docs:
        raise HTTPException(status_code=400, detail="No documents uploaded yet")

    doc_chunks = {
        doc["name"]: store.get_all_chunks_for_doc(doc["name"], user_id)
        for doc in docs
    }
    return summarize_trends(doc_chunks, detail_mode=detail_mode)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
