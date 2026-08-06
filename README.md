# Multi-Document Research Agent

An AI-powered full-stack web application for deep cross-document analysis of research papers — featuring Q&A, contradiction detection, trend summarization, and document comparison with citation tracking and confidence scoring.

🔗 **[Live Demo]([https://your-vercel-url.vercel.app](https://multi-document-research-agent-two.vercel.app/))** &nbsp;|&nbsp;

---

## Features

- 📄 **Multi-PDF Upload** — Upload and manage multiple research papers simultaneously
- 🔍 **Cross-Document Q&A** — Ask questions across all uploaded documents with page-level citations
- 💬 **Stateful Follow-Ups** — Persist conversation history so pronoun and meta follow-ups work across refreshes
- ⚖️ **Contradiction Detection** — Automatically identifies conflicting statements between papers
- 📊 **Trend Summarization** — Surfaces common themes and patterns across documents
- 🔄 **Document Comparison** — Side-by-side analysis of key ideas across sources
- 🎯 **Confidence Scoring** — Every answer includes a confidence score and reasoning
- 📌 **Citation Tracking** — Responses reference exact document, page number, and snippet

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19 + Vite |
| Backend | Python + FastAPI |
| LLM | Groq — LLaMA 3.3 70B |
| Embeddings | Google Gemini (`gemini-embedding-001`, 3072-dim) |
| Vector Search | Supabase Postgres + pgvector |
| PDF Parsing | PyPDF2 |
| Deployment | Vercel (frontend) + Render (backend) |

---

## Architecture

```
PDF Upload
    ↓
pdf_utils.py     →  page-by-page text extraction
    ↓
chunker.py       →  sentence-aware chunks (800 chars, 200 overlap)
    ↓
vector_store.py  →  Gemini embeddings → Supabase pgvector rows
    ↓
User Query
    ↓
vector_store.py  →  embed query → pgvector cosine similarity → top-k chunks
    ↓
ai_engine.py     →  build prompt → Groq LLaMA 3.3 70B → structured JSON
    ↓
Frontend         →  renders answer + citations + confidence score
```

---

## Getting Started

### Prerequisites

- Python 3.9+
- Node.js 18+
- [Groq API Key](https://console.groq.com/)
- [Google Gemini API Key](https://aistudio.google.com/)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in `/backend`:

```env
GROQ_API_KEY=your_groq_api_key
GEMINI_API_KEY=your_gemini_api_key
DATABASE_URL=your_supabase_database_url
SUPABASE_URL=your_supabase_project_url
```

Run the schema migration in [backend/supabase_schema.sql](backend/supabase_schema.sql) before uploading documents.

```bash
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev   # → http://localhost:5173
```

---

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/` | Health check |
| `POST` | `/upload` | Upload PDF(s); extract, chunk, and embed |
| `GET` | `/documents` | List all uploaded documents |
| `DELETE` | `/documents/{doc_name}` | Remove a document and rebuild index |
| `POST` | `/query` | Q&A with citations and confidence score |
| `POST` | `/conversations` | Create a persisted conversation |
| `GET` | `/conversations/{id}/messages` | Load conversation history |
| `POST` | `/conversations/{id}/messages` | Ask a stateful follow-up |
| `POST` | `/compare` | Cross-document comparison |
| `POST` | `/contradictions` | Detect conflicting statements |
| `POST` | `/trends` | Identify common themes |

### Query Response Schema

```json
{
  "answer": "...",
  "confidence_score": 0.85,
  "why_this_answer": "...",
  "citations": [
    { "doc_name": "paper.pdf", "page_number": 3, "snippet": "..." }
  ]
}
```

---

## Known Limitations

- **Database migration required** — Supabase must have the pgvector, documents, chunks, conversations, and messages tables before uploads work
- **Scanned PDFs** — PyPDF2 extracts digital text only; scanned/image PDFs are not supported
- **Rate limits** — Gemini free tier requires a 4-second delay between embedding batches
- **Auth required** — The backend expects a valid Supabase JWT for protected routes

---

## License

MIT
