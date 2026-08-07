"""Supabase pgvector-backed vector store and conversation persistence helpers."""

import os
import time
from typing import Dict, List, Optional

import google.generativeai as genai
from dotenv import load_dotenv
from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

load_dotenv()

EMBEDDING_MODEL = "models/gemini-embedding-001"
EMBEDDING_DIMENSION = 3072

_api_key = os.getenv("GEMINI_API_KEY") or os.getenv("GOOGLE_API_KEY") or os.getenv("OPENAI_API_KEY")
genai.configure(api_key=_api_key)

_DATABASE_URL = os.environ["DATABASE_URL"]
_sync_url = _DATABASE_URL
if _sync_url.startswith("postgresql+asyncpg://"):
    _sync_url = _sync_url.replace("postgresql+asyncpg://", "postgresql://", 1)
elif _sync_url.startswith("postgres://"):
    _sync_url = _sync_url.replace("postgres://", "postgresql://", 1)

engine = create_engine(_sync_url, pool_pre_ping=True, pool_size=5, max_overflow=10)
SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


def _get_session() -> Session:
    return SessionLocal()


class VectorStore:
    """Supabase-backed vector store using pgvector similarity search."""

    def add_chunks(self, chunks: List[Dict], user_id: str) -> str:
        """Embed chunks and persist them to Supabase, returning the document id."""
        if not chunks:
            raise ValueError("No chunks provided")

        texts = [c["text"] for c in chunks]
        embeddings = self._get_embeddings(texts, task_type="retrieval_document")

        session = _get_session()
        try:
            doc_name = chunks[0]["doc_name"]
            page_count = max(int(c.get("page_number") or 0) for c in chunks)
            chunk_count = len(chunks)

            document_id = session.execute(
                text(
                    """
                    INSERT INTO documents (user_id, filename, page_count, chunk_count)
                    VALUES (:uid, :filename, :page_count, :chunk_count)
                    RETURNING id
                    """
                ),
                {
                    "uid": user_id,
                    "filename": doc_name,
                    "page_count": page_count,
                    "chunk_count": chunk_count,
                },
            ).scalar_one()

            for chunk, embedding in zip(chunks, embeddings):
                session.execute(
                    text(
                        """
                        INSERT INTO chunks
                            (document_id, content, embedding, chunk_index, page_number)
                        VALUES
                            (:document_id, :content, CAST(:embedding AS vector), :chunk_index, :page_number)
                        """
                    ),
                    {
                        "document_id": document_id,
                        "content": chunk["text"],
                        "embedding": str(embedding),
                        "chunk_index": chunk.get("chunk_index"),
                        "page_number": chunk.get("page_number"),
                    },
                )

            session.commit()
            return str(document_id)
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def retrieve(self, query: str, user_id: str, doc_ids: Optional[List[str]] = None, top_k: int = 8) -> List[Dict]:
        """Retrieve the top-k chunks for a user, optionally scoped to selected document ids."""
        query_embedding = self._get_embeddings([query], task_type="retrieval_query")[0]
        query_vec_str = str(query_embedding)

        sql = """
            SELECT
                chunks.id AS chunk_id,
                chunks.content,
                chunks.page_number,
                documents.filename AS doc_name,
                1 - (chunks.embedding <=> CAST(:q AS vector)) AS score
            FROM chunks
            JOIN documents ON chunks.document_id = documents.id
            WHERE documents.user_id = :uid
        """
        params: Dict[str, object] = {"uid": user_id, "q": query_vec_str, "k": top_k}
        if doc_ids:
            sql += " AND chunks.document_id = ANY(CAST(:doc_ids AS uuid[]))"
            params["doc_ids"] = doc_ids
        sql += " ORDER BY chunks.embedding <=> CAST(:q AS vector) LIMIT :k"

        session = _get_session()
        try:
            rows = session.execute(text(sql), params).fetchall()
            return [
                {
                    "chunk_id": str(r.chunk_id),
                    "text": r.content,
                    "page_number": r.page_number,
                    "doc_name": r.doc_name,
                    "score": float(r.score),
                }
                for r in rows
            ]
        finally:
            session.close()

    def search(self, query: str, user_id: str, top_k: int = 10) -> List[Dict]:
        """Backward-compatible wrapper around retrieve()."""
        return self.retrieve(query, user_id, top_k=top_k)

    def get_documents(self, user_id: str) -> List[Dict]:
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT id, filename, page_count, chunk_count, uploaded_at
                    FROM documents
                    WHERE user_id = :uid
                    ORDER BY uploaded_at
                    """
                ),
                {"uid": user_id},
            ).fetchall()

            return [
                {
                    "id": str(r.id),
                    "name": r.filename,
                    "num_pages": r.page_count,
                    "num_chunks": r.chunk_count,
                    "uploaded_at": r.uploaded_at.isoformat() if r.uploaded_at else None,
                }
                for r in rows
            ]
        finally:
            session.close()

    def get_all_chunks_for_doc(self, doc_name: str, user_id: str) -> List[Dict]:
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT
                        chunks.id AS chunk_id,
                        documents.filename AS doc_name,
                        chunks.page_number,
                        chunks.chunk_index,
                        chunks.content
                    FROM chunks
                    JOIN documents ON chunks.document_id = documents.id
                    WHERE documents.filename = :doc_name AND documents.user_id = :uid
                    ORDER BY chunks.chunk_index
                    """
                ),
                {"doc_name": doc_name, "uid": user_id},
            ).fetchall()

            return [
                {
                    "chunk_id": str(r.chunk_id),
                    "doc_name": r.doc_name,
                    "page_number": r.page_number,
                    "chunk_index": r.chunk_index,
                    "text": r.content,
                }
                for r in rows
            ]
        finally:
            session.close()

    def get_chunks_by_ids(self, chunk_ids: List[str], user_id: str) -> List[Dict]:
        if not chunk_ids:
            return []

        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT
                        chunks.id AS chunk_id,
                        documents.filename AS doc_name,
                        chunks.page_number,
                        chunks.chunk_index,
                        chunks.content
                    FROM chunks
                    JOIN documents ON chunks.document_id = documents.id
                    WHERE documents.user_id = :uid
                      AND chunks.id = ANY(CAST(:chunk_ids AS uuid[]))
                    ORDER BY chunks.chunk_index
                    """
                ),
                {"uid": user_id, "chunk_ids": chunk_ids},
            ).fetchall()

            return [
                {
                    "chunk_id": str(r.chunk_id),
                    "doc_name": r.doc_name,
                    "page_number": r.page_number,
                    "chunk_index": r.chunk_index,
                    "text": r.content,
                }
                for r in rows
            ]
        finally:
            session.close()

    def remove_document(self, doc_name: str, user_id: str) -> bool:
        session = _get_session()
        try:
            document_id = session.execute(
                text(
                    """
                    SELECT id
                    FROM documents
                    WHERE filename = :filename AND user_id = :uid
                    ORDER BY uploaded_at DESC
                    LIMIT 1
                    """
                ),
                {"filename": doc_name, "uid": user_id},
            ).scalar_one_or_none()

            if not document_id:
                return False

            session.execute(text("DELETE FROM documents WHERE id = :document_id"), {"document_id": document_id})
            session.commit()
            return True
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def create_conversation(self, user_id: str, title: Optional[str] = None) -> str:
        session = _get_session()
        try:
            conversation_id = session.execute(
                text(
                    """
                    INSERT INTO conversations (user_id, title)
                    VALUES (:uid, :title)
                    RETURNING id
                    """
                ),
                {"uid": user_id, "title": title},
            ).scalar_one()
            session.commit()
            return str(conversation_id)
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def conversation_exists(self, conversation_id: str, user_id: str) -> bool:
        session = _get_session()
        try:
            exists = session.execute(
                text("SELECT 1 FROM conversations WHERE id = :conversation_id AND user_id = :uid"),
                {"conversation_id": conversation_id, "uid": user_id},
            ).fetchone()
            return exists is not None
        finally:
            session.close()

    def get_conversations(self, user_id: str) -> List[Dict]:
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT id, title, created_at
                    FROM conversations
                    WHERE user_id = :uid
                    ORDER BY created_at DESC
                    """
                ),
                {"uid": user_id},
            ).fetchall()
            return [
                {
                    "id": str(r.id),
                    "title": r.title or "New conversation",
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
        finally:
            session.close()

    def update_conversation_title(self, conversation_id: str, user_id: str, title: str) -> bool:
        session = _get_session()
        try:
            session.execute(
                text(
                    """
                    UPDATE conversations
                    SET title = :title
                    WHERE id = :conversation_id AND user_id = :uid
                    """
                ),
                {"title": title, "conversation_id": conversation_id, "uid": user_id},
            )
            session.commit()
            return True
        except Exception:
            session.rollback()
            return False
        finally:
            session.close()

    def get_recent_messages(self, conversation_id: str, user_id: str, limit: int = 6) -> List[Dict]:
        session = _get_session()
        try:
            rows = session.execute(
                text(
                    """
                    SELECT messages.id, messages.role, messages.content, messages.source_chunk_ids, messages.created_at
                    FROM messages
                    JOIN conversations ON messages.conversation_id = conversations.id
                    WHERE messages.conversation_id = :conversation_id
                      AND conversations.user_id = :uid
                    ORDER BY messages.created_at DESC
                    LIMIT :limit
                    """
                ),
                {"conversation_id": conversation_id, "uid": user_id, "limit": limit},
            ).fetchall()

            messages = [
                {
                    "id": str(r.id),
                    "role": r.role,
                    "content": r.content,
                    "source_chunk_ids": [str(chunk_id) for chunk_id in r.source_chunk_ids] if r.source_chunk_ids else None,
                    "created_at": r.created_at.isoformat() if r.created_at else None,
                }
                for r in rows
            ]
            return list(reversed(messages))
        finally:
            session.close()

    def save_message(
        self,
        conversation_id: str,
        role: str,
        content: str,
        source_chunk_ids: Optional[List[str]] = None,
    ) -> str:
        session = _get_session()
        try:
            message_id = session.execute(
                text(
                    """
                    INSERT INTO messages (conversation_id, role, content, source_chunk_ids)
                    VALUES (:conversation_id, :role, :content, CAST(:source_chunk_ids AS uuid[]))
                    RETURNING id
                    """
                ),
                {
                    "conversation_id": conversation_id,
                    "role": role,
                    "content": content,
                    "source_chunk_ids": source_chunk_ids or None,
                },
            ).scalar_one()
            session.commit()
            return str(message_id)
        except Exception:
            session.rollback()
            raise
        finally:
            session.close()

    def _get_embeddings(self, texts: List[str], task_type: str) -> List[List[float]]:
        """Get embeddings in batches from Gemini with a stable output dimensionality."""
        all_embeddings = []
        batch_size = 100

        for i in range(0, len(texts), batch_size):
            batch = texts[i : i + batch_size]
            response = genai.embed_content(
                model=EMBEDDING_MODEL,
                content=batch,
                task_type=task_type,
                output_dimensionality=EMBEDDING_DIMENSION,
            )
            all_embeddings.extend(response["embedding"])

            if i + batch_size < len(texts):
                time.sleep(4)

        return all_embeddings


store = VectorStore()
