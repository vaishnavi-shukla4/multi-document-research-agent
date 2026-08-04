"""
Supabase pgvector-backed vector store.

All public methods take a `user_id` parameter and scope every query to that
user — the backend is the security boundary (RLS is off on these tables).

Table schemas (run in Supabase SQL editor before starting):

    create extension if not exists vector;

    create table documents (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      doc_name text not null,
      page_count int not null default 0,
      chunk_count int not null default 0,
      created_at timestamptz default now()
    );

    create table chunks (
      id uuid primary key default gen_random_uuid(),
      user_id uuid not null references auth.users(id) on delete cascade,
      doc_name text not null,
      page_number int,
      chunk_index int,
      text text not null,
      embedding vector(3072),
      created_at timestamptz default now()
    );

NOTE on embedding dimensions:
    gemini-embedding-001 returns 3072-dim vectors. pgvector's ivfflat/hnsw
    indexes cap at 2000 dims, so we deliberately skip indexing and use an
    exact cosine scan (ORDER BY embedding <=> query LIMIT k). This matches
    the old NumPy brute-force behaviour and is fast enough for personal-scale
    document sets.
"""

import os
import time
from typing import List, Dict

import google.generativeai as genai
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker, Session

load_dotenv()

# ── Gemini embeddings ────────────────────────────────────────────────────────

_api_key = (
    os.getenv("GEMINI_API_KEY")
    or os.getenv("GOOGLE_API_KEY")
    or os.getenv("OPENAI_API_KEY")
)
genai.configure(api_key=_api_key)

# ── Database engine ──────────────────────────────────────────────────────────

_DATABASE_URL = os.environ["DATABASE_URL"]

# Normalise URL scheme for SQLAlchemy sync driver
_sync_url = _DATABASE_URL
if _sync_url.startswith("postgresql+asyncpg://"):
    _sync_url = _sync_url.replace("postgresql+asyncpg://", "postgresql://", 1)
elif _sync_url.startswith("postgres://"):
    _sync_url = _sync_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(
    _sync_url,
    pool_pre_ping=True,
    pool_size=5,
    max_overflow=10,
)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def _get_session() -> Session:
    return SessionLocal()


# ── VectorStore ──────────────────────────────────────────────────────────────

class VectorStore:
    """
    Supabase-backed vector store using pgvector for similarity search.
    Every method is user-scoped via the required `user_id` parameter.
    """

    def add_chunks(self, chunks: List[Dict], user_id: str) -> None:
        """Embed chunks and persist them to Supabase with the caller's user_id."""
        if not chunks:
            return

        texts = [c["text"] for c in chunks]
        embeddings = self._get_embeddings(texts)

        session = _get_session()
        try:
            doc_name = chunks[0]["doc_name"]
            page_count = max(int(c["page_number"]) for c in chunks)
            chunk_count = len(chunks)

            session.execute(
                text(
                    """
                    INSERT INTO documents (user_id, doc_name, page_count, chunk_count)
                    VALUES (:uid, :doc_name, :page_count, :chunk_count)
                    ON CONFLICT DO NOTHING
                    """
                ),
                {"uid": user_id, "doc_name": doc_name,
                 "page_count": page_count, "chunk_count": chunk_count},
            )

            for chunk, embedding in zip(chunks, embeddings):
                session.execute(
                    text(
                        """
                        INSERT INTO chunks
                            (user_id, doc_name, page_number, chunk_index, text, embedding)
                        VALUES
                            (:uid, :doc_name, :page_number, :chunk_index, :text,
                             CAST(:embedding AS vector))
                        """
                    ),
                    {
                        "uid": user_id,
                        "doc_name": chunk["doc_name"],
                        "page_number": chunk.get("page_number"),
                        "chunk_index": chunk.get("chunk_index"),
                        "text": chunk["text"],
                        "embedding": str(embedding),
                    },
                )

            session.commit()
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def search(self, query: str, user_id: str, top_k: int = 10) -> List[Dict]:
        """Find the top-k most similar chunks for this user using cosine distance."""
        query_embedding = self._get_embeddings([query])[0]
        query_vec_str = str(query_embedding)

        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT
                        doc_name, page_number, chunk_index, text,
                        1 - (embedding <=> CAST(:q AS vector)) AS score
                    FROM chunks
                    WHERE user_id = :uid
                    ORDER BY embedding <=> CAST(:q AS vector)
                    LIMIT :k
                    """
                ),
                {"uid": user_id, "q": query_vec_str, "k": top_k},
            ).fetchall()

            return [
                {
                    "doc_name": r.doc_name,
                    "page_number": r.page_number,
                    "chunk_index": r.chunk_index,
                    "text": r.text,
                    "score": float(r.score),
                }
                for r in rows
            ]
        finally:
            session.close()

    def get_documents(self, user_id: str) -> List[Dict]:
        """
        List all documents owned by this user.
        Returns dicts with keys: name, num_pages, num_chunks
        (same shape as the old in-memory store so Sidebar needs no changes).
        """
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT doc_name, page_count, chunk_count
                    FROM documents
                    WHERE user_id = :uid
                    ORDER BY created_at
                    """
                ),
                {"uid": user_id},
            ).fetchall()

            return [
                {"name": r.doc_name, "num_pages": r.page_count, "num_chunks": r.chunk_count}
                for r in rows
            ]
        finally:
            session.close()

    def get_all_chunks_for_doc(self, doc_name: str, user_id: str) -> List[Dict]:
        """Return all chunks for a document owned by this user."""
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT doc_name, page_number, chunk_index, text
                    FROM chunks
                    WHERE doc_name = :doc_name AND user_id = :uid
                    ORDER BY chunk_index
                    """
                ),
                {"doc_name": doc_name, "uid": user_id},
            ).fetchall()

            return [
                {
                    "doc_name": r.doc_name,
                    "page_number": r.page_number,
                    "chunk_index": r.chunk_index,
                    "text": r.text,
                }
                for r in rows
            ]
        finally:
            session.close()

    def remove_document(self, doc_name: str, user_id: str) -> bool:
        """Delete a document and all its chunks for this user. Returns False if not found."""
        session = _get_session()
        try:
            exists = session.execute(
                text("SELECT 1 FROM documents WHERE doc_name = :doc_name AND user_id = :uid"),
                {"doc_name": doc_name, "uid": user_id},
            ).fetchone()

            if not exists:
                return False

            session.execute(
                text("DELETE FROM chunks WHERE doc_name = :doc_name AND user_id = :uid"),
                {"doc_name": doc_name, "uid": user_id},
            )
            session.execute(
                text("DELETE FROM documents WHERE doc_name = :doc_name AND user_id = :uid"),
                {"doc_name": doc_name, "uid": user_id},
            )
            session.commit()
            return True
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def _get_embeddings(self, texts: List[str]) -> List[List[float]]:
        """Get embeddings in small batches from the Gemini API (4s sleep between batches)."""
        all_embeddings = []
        batch_size = 100

        for i in range(0, len(texts), batch_size):
            batch = texts[i: i + batch_size]
            response = genai.embed_content(
                model="models/gemini-embedding-001",
                content=batch,
                task_type="retrieval_document",
            )
            all_embeddings.extend(response["embedding"])

            if i + batch_size < len(texts):
                time.sleep(4)

        return all_embeddings


# Module-level singleton (stateless — all state lives in Postgres)
store = VectorStore()
