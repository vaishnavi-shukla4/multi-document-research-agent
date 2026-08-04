# 🔬 Multi-Document Research Agent — Codebase Summary

## Overview

An AI-powered full-stack web application that allows users to upload multiple PDF research papers and perform cross-document analysis: Q&A, comparison, contradiction detection, and trend summarization — all with citation tracking.

---

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    FRONTEND (React + Vite)               │
│  Sidebar  ──►  QueryPanel  ──►  CitationPanel           │
│   :5173                                                  │
└─────────────────────────┬───────────────────────────────┘
                          │ HTTP / REST
┌─────────────────────────▼───────────────────────────────┐
│                 BACKEND (Python + FastAPI)               │
│   main.py → pdf_utils → chunker → vector_store          │
│                        ↓                                 │
│               ai_engine (Groq LLaMA 3.3 70B)            │
│   :8000                                                  │
└──────────┬──────────────────────────┬───────────────────┘
           │                          │
  ┌────────▼──────────┐    ┌──────────▼──────────┐
  │  Google Gemini    │    │  Groq API            │
  │  (Embeddings)     │    │  llama-3.3-70b       │
  │  gemini-embed-001 │    │  (Text Reasoning)    │
  └───────────────────┘    └─────────────────────┘
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite |
| Backend | Python + FastAPI |
| LLM (Reasoning) | Groq API — `llama-3.3-70b-versatile` |
| Embeddings | Google Gemini — `gemini-embedding-001` |
| Vector DB | In-memory NumPy (cosine similarity, no FAISS) |
| PDF Parsing | PyPDF2 |
| Env Config | python-dotenv |

---

## Project File Tree

```
multi-document-research-agent/
├── .env                          # Root-level env (unused; backend has its own)
├── README.md
├── backend/
│   ├── main.py                   # FastAPI app & all endpoints
│   ├── ai_engine.py              # LLM reasoning (Groq)
│   ├── vector_store.py           # In-memory vector store (NumPy)
│   ├── chunker.py                # Text chunking with overlap
│   ├── pdf_utils.py              # PDF → page text extraction
│   ├── generate_samples.py       # Sample data generator (dev utility)
│   ├── requirements.txt          # Python dependencies
│   ├── .python-version           # Python version pin
│   └── .gitignore
└── frontend/
    ├── index.html
    ├── vite.config.js
    ├── package.json
    ├── eslint.config.js
    └── src/
        ├── main.jsx              # React entry point
        ├── App.jsx               # Root component + state management
        ├── api.js                # Fetch-based API client
        ├── index.css             # Full design system (17KB)
        ├── App.css               # Minimal app-level overrides
        └── components/
            ├── Sidebar.jsx       # Document list + action buttons
            ├── QueryPanel.jsx    # Q&A input + response rendering
            └── CitationPanel.jsx # Citation list display
```

---

## Backend — File-by-File

### [`main.py`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/backend/main.py)
FastAPI application entry point. Wires together all modules and exposes 7 REST endpoints.

**Endpoints:**

| Method | Route | Description |
|--------|-------|-------------|
| `GET` | `/` | Health check |
| `POST` | `/upload` | Upload 1+ PDFs → extract → chunk → embed → store |
| `GET` | `/documents` | List all stored documents |
| `DELETE` | `/documents/{doc_name}` | Remove a document from the store |
| `POST` | `/query` | RAG-based Q&A with citations |
| `POST` | `/compare` | Cross-document comparison |
| `POST` | `/contradictions` | Contradiction detection (requires 2+ docs) |
| `POST` | `/trends` | Trend/theme summarization |

**Request Model:**
```python
class QueryRequest(BaseModel):
    question: str
    detail_mode: str = "detailed"  # "simple" | "detailed"
    top_k: int = 10
```

CORS is wide-open (`allow_origins=["*"]`) for local dev.

---

### [`pdf_utils.py`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/backend/pdf_utils.py)
Thin wrapper around `PyPDF2`. Extracts text page-by-page from uploaded PDF bytes.

**Output format:**
```python
[{ "doc_name": str, "page_number": int, "text": str }, ...]
```

Silently skips blank pages. Does **not** support scanned/image PDFs (no OCR).

---

### [`chunker.py`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/backend/chunker.py)
Splits page-level text into overlapping chunks for better retrieval.

**Strategy:**
- Sentence-aware splitting (regex on `.!?`)
- **Chunk size:** 800 characters
- **Overlap:** 200 characters (tail of previous chunk prepended to next)
- Preserves metadata: `doc_name`, `page_number`, `chunk_index`

**Output format:**
```python
[{ "doc_name": str, "page_number": int, "chunk_index": int, "text": str }, ...]
```

---

### [`vector_store.py`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/backend/vector_store.py)
In-memory vector store using **NumPy** (no FAISS dependency). A global singleton `store` is shared across all requests.

**Class: `VectorStore`**

| Method | Description |
|--------|-------------|
| `add_chunks(chunks)` | Embed texts via Gemini, L2-normalize, stack into NumPy array |
| `search(query, top_k)` | Embed query, compute cosine similarity, return top-k chunks |
| `get_all_chunks_for_doc(doc_name)` | Filter metadata by document name |
| `get_documents()` | Return list of all tracked documents with page/chunk counts |
| `remove_document(doc_name)` | Filter out chunks, rebuild the store |
| `_get_embeddings(texts)` | Batch Gemini embedding calls (100/batch, 4s sleep between batches for rate limits) |

**Embedding model:** `models/gemini-embedding-001` with `task_type="retrieval_document"`  
**Similarity:** Cosine (dot product of L2-normalized vectors)  
**Persistence:** None — restarting the server clears all data.

> [!WARNING]
> The `dimension` param defaults to `1536` but Gemini `gemini-embedding-001` outputs **3072-dim** vectors. This mismatch is harmless since the store dynamically accepts whatever shape is returned, but it's a misleading default.

---

### [`ai_engine.py`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/backend/ai_engine.py)
All LLM reasoning via **Groq API** (`llama-3.3-70b-versatile`, temp=0.2, max_tokens=1500). All functions prompt the model to return **strict JSON** and parse the response.

**Functions:**

| Function | Input | JSON Output Keys |
|----------|-------|-----------------|
| `answer_query(question, chunks, detail_mode)` | Top-k retrieved chunks | `answer`, `confidence_score`, `why_this_answer`, `citations[]` |
| `compare_documents(doc_chunks)` | All chunks per doc (first 5, 200 chars each) | `comparison.key_ideas[]`, `similarities[]`, `differences[]`, `summary`, `citations[]`, `confidence_score` |
| `detect_contradictions(doc_chunks)` | Same as compare | `contradictions[]` (topic, statement_a, statement_b, explanation), `summary`, `confidence_score` |
| `summarize_trends(doc_chunks)` | Same as compare | `trends[]` (theme, description, supporting_documents, evidence), `unified_summary`, `citations[]`, `confidence_score` |

**`_call_llm(prompt)`** — shared internal helper:
- Calls Groq chat completions API
- Strips markdown fences if model wraps output
- Returns parsed dict, or `{"error": ...}` on failure

**Context window strategy for compare/contradictions/trends:** Only first 5 chunks × 200 chars per document are passed (to avoid token limits).

---

## Frontend — File-by-File

### [`src/api.js`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/api.js)
Pure fetch-based HTTP client. Base URL from `VITE_API_URL` env var, defaulting to `http://localhost:8000`.

| Export | Maps to |
|--------|---------|
| `uploadDocuments(files)` | `POST /upload` (multipart form) |
| `getDocuments()` | `GET /documents` |
| `deleteDocument(docName)` | `DELETE /documents/:name` |
| `queryDocuments(question, detailMode, topK)` | `POST /query` |
| `compareDocuments()` | `POST /compare` |
| `findContradictions()` | `POST /contradictions` |
| `summarizeTrends()` | `POST /trends` |

---

### [`src/App.jsx`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/App.jsx)
Root component — owns all application state and event handlers. Renders a 3-panel layout.

**State:**
```js
documents     // List of uploaded docs from backend
uploading     // Upload in-progress flag
loading       // Query/analysis in-progress flag
response      // Current AI response object
responseType  // "query" | "compare" | "contradictions" | "trends"
citations     // Extracted citations for CitationPanel
error         // Error message string
detailMode    // "simple" | "detailed"
```

**Layout:**
```
┌──────────┬──────────────────────────┬──────────────┐
│ Sidebar  │      QueryPanel          │ CitationPanel│
│ (docs +  │  (input + AI response)   │ (citations)  │
│ actions) │                          │              │
└──────────┴──────────────────────────┴──────────────┘
```

---

### [`src/components/Sidebar.jsx`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/components/Sidebar.jsx)
Left panel. Displays uploaded documents and global action buttons.

- Hidden `<input type="file" multiple accept=".pdf">` triggered by "+ Upload PDFs" button
- Each document shows: name, page count, chunk count, remove (✕) button
- Action buttons: **Compare Documents** (needs 2+ docs), **Find Contradictions** (needs 2+ docs), **Summarize Trends** (needs 1+ doc)

---

### [`src/components/QueryPanel.jsx`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/components/QueryPanel.jsx)
Center panel. Contains the question input and renders all 4 response types as sub-components.

**Sub-components (all in same file):**

| Component | Renders |
|-----------|---------|
| `QueryResponse` | Answer text, confidence bar (high/medium/low), collapsible "Why this answer?" |
| `CompareResponse` | Topic-by-topic comparison table, similarities/differences lists |
| `ContradictionResponse` | Side-by-side Statement A vs B cards per contradiction |
| `TrendsResponse` | Theme cards with descriptions and supporting document tags |

- Simple/Detailed toggle switches `detailMode` in App state
- Loading spinner with context-aware text per `responseType`

---

### [`src/components/CitationPanel.jsx`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/components/CitationPanel.jsx)
Right panel. Displays citations returned by the AI for the current response.

Each citation shows: `doc_name`, `page_number` (if present), and `snippet` (quoted text).

---

### [`src/index.css`](file:///c:/Users/Vaishnavi/Downloads/multi-document-research-agent/frontend/src/index.css)
Full design system (17KB). Defines CSS custom properties (variables), layout, all component styles, animations, confidence bar levels, and responsive adjustments.

---

## Data Flow

### Upload Flow
```
User selects PDFs
  → Sidebar.handleFiles()
    → App.handleUpload()
      → api.uploadDocuments() [POST /upload]
        → main.py: extract_text_from_pdf() [pdf_utils]
          → chunk_pages() [chunker]
            → store.add_chunks() [vector_store]
              → _get_embeddings() via Gemini API
                → NumPy array stored in memory
```

### Query Flow
```
User types question + clicks "Ask AI"
  → App.handleQuery()
    → api.queryDocuments() [POST /query]
      → main.py: store.search(question, top_k=10)
        → Cosine similarity lookup → top-k chunks
          → ai_engine.answer_query(question, chunks)
            → Groq LLaMA 3.3 70B → JSON response
              → { answer, confidence_score, why_this_answer, citations }
                → QueryPanel renders response
                  → CitationPanel renders citations
```

### Compare / Contradictions / Trends Flow
```
User clicks action button
  → App.handle[Compare|Contradictions|Trends]()
    → api.[compareDocuments|findContradictions|summarizeTrends]()
      → main.py: store.get_all_chunks_for_doc() for each doc
        → ai_engine.[compare_documents|detect_contradictions|summarize_trends]()
          → Groq LLaMA 3.3 70B → structured JSON
            → QueryPanel renders typed response view
```

---

## Dependencies

### Backend (`requirements.txt`)
| Package | Version | Purpose |
|---------|---------|---------|
| `fastapi` | 0.115.0 | REST API framework |
| `uvicorn[standard]` | 0.30.0 | ASGI server |
| `python-multipart` | 0.0.9 | File upload parsing |
| `PyPDF2` | 3.0.1 | PDF text extraction |
| `numpy` | <2.0.0 | Vector math |
| `google-generativeai` | ≥0.8.0 | Gemini embeddings |
| `groq` | ≥0.11.0 | Groq LLM API client |
| `python-dotenv` | 1.0.1 | `.env` loading |
| `httpx` | 0.27.2 | Async HTTP (transitive) |

### Frontend (`package.json` key deps)
| Package | Purpose |
|---------|---------|
| `react` + `react-dom` | UI framework |
| `vite` | Dev server + bundler |
| `eslint` | Linting |

---

## Environment Variables

Create a `.env` file in `backend/`:
```env
GROQ_API_KEY=gsk_...        # For LLM reasoning (Groq)
GEMINI_API_KEY=AIza...      # For embeddings (Google Gemini)
# OR
GOOGLE_API_KEY=AIza...      # Alternate key name (also accepted)
```

Frontend (optional, `frontend/.env`):
```env
VITE_API_URL=http://localhost:8000
```

---

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| **Groq for LLM** | Free tier: 14,400 req/day, very fast inference |
| **Gemini for embeddings** | High quality, free tier available |
| **NumPy instead of FAISS** | Simpler dependency, sufficient for small-medium doc sets |
| **In-memory store** | Simplicity — no persistence layer needed for prototype |
| **Sentence-aware chunking** | Avoids cutting sentences mid-way for better context quality |
| **200-char overlap** | Preserves context across chunk boundaries |
| **4s sleep between embed batches** | Avoids Google free-tier 429 rate-limit errors |
| **JSON-only LLM prompting** | Structured, parseable responses without extra post-processing |
| **3-panel layout** | Mirrors research tool UX (docs | analysis | citations) |

---

## Limitations & Known Issues

> [!WARNING]
> - **No OCR**: Scanned/image PDFs will yield empty text and fail silently
> - **No persistence**: Restarting the backend clears all uploaded documents
> - **Context truncation**: Compare/Contradictions/Trends only pass first 5 chunks × 200 chars per doc — long papers are underrepresented
> - **Dimension mismatch**: `VectorStore` defaults to `dimension=1536` but Gemini returns 3072-dim vectors (harmless but misleading)
> - **No auth**: CORS is wide open, suitable for local dev only
> - **Single-user**: Global `store` singleton is shared across all HTTP requests — concurrent uploads will race
