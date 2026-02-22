"""
Supabase pgvector helper — embed text locally using SentenceTransformers
and perform similarity search via Supabase pgvector.

NOTE: all-MiniLM-L6-v2 produces 384-dim vectors.
Your Supabase table must use vector(384). Run the SQL below once:
--------------------------------------------------------------
create extension if not exists vector;

create table if not exists documents (
  id        bigserial primary key,
  content   text,
  metadata  jsonb,
  embedding vector(384)          -- 384 for all-MiniLM-L6-v2
);

create or replace function match_documents (
  query_embedding vector(384),
  match_count     int  default 6,
  filter          jsonb default '{}'
)
returns table (id bigint, content text, metadata jsonb, similarity float)
language plpgsql as $$
begin
  return query
  select id, content, metadata,
         1 - (embedding <=> query_embedding) as similarity
  from   documents
  where  metadata @> filter
  order  by embedding <=> query_embedding
  limit  match_count;
end;
$$;
--------------------------------------------------------------
"""

import logging
from functools import lru_cache
from typing import Any

logger = logging.getLogger("supabase_vector_store")

MODEL_NAME = "all-MiniLM-L6-v2"


@lru_cache(maxsize=1)
def _get_model():
    """Load SentenceTransformer model once and cache it."""
    from sentence_transformers import SentenceTransformer
    logger.info(f"Loading embedding model: {MODEL_NAME}")
    return SentenceTransformer(MODEL_NAME)


def _embed(text: str) -> list[float]:
    """Embed text for similarity query."""
    model = _get_model()
    return model.encode(text, normalize_embeddings=True).tolist()


def _embed_document(text: str) -> list[float]:
    """Embed text for document storage (same model, same dimension)."""
    return _embed(text)


def _supabase():
    from core.supabase_client import get_supabase_client
    return get_supabase_client()


def query_vectors(query_text: str, top_k: int = 6, filter: dict | None = None) -> list[dict]:
    """
    Embed *query_text* and retrieve the top_k most similar documents from Supabase pgvector.
    Returns a list of dicts with keys: text, metadata, score.
    """
    embedding = _embed(query_text)

    sb = _supabase()
    response = sb.rpc(
        "match_documents",
        {
            "query_embedding": embedding,
            "match_count": top_k,
            "filter": filter or {},
        },
    ).execute()

    if not response.data:
        return []

    return [
        {
            "text": row.get("content", ""),
            "metadata": row.get("metadata", {}),
            "score": row.get("similarity"),
        }
        for row in response.data
    ]


def list_all_sources() -> list[dict]:
    """Return distinct document sources with chunk counts."""
    sb = _supabase()
    response = sb.table("documents").select("metadata").execute()

    if not response.data:
        return []

    counts: dict[str, int] = {}
    for row in response.data:
        meta = row.get("metadata") or {}
        source = meta.get("source") or meta.get("file_name") or "Unknown"
        counts[source] = counts.get(source, 0) + 1

    return [{"file_name": name, "count": count} for name, count in sorted(counts.items())]


def upsert_document_chunks(chunks: list[dict], source_name: str) -> int:
    """
    Embed and upsert text chunks into the Supabase `documents` table.

    Raises:
        RuntimeError: if embedding fails.
    Returns:
        Number of chunks successfully upserted.
    """
    sb = _supabase()
    rows = []
    for chunk in chunks:
        text = chunk.get("text") or chunk.get("content", "")
        if not text.strip():
            continue
        meta = {**(chunk.get("metadata") or {}), "source": source_name}
        embedding = _embed_document(text)  # raises on failure
        rows.append({"content": text, "metadata": meta, "embedding": embedding})

    if not rows:
        return 0

    sb.table("documents").upsert(rows).execute()
    return len(rows)
