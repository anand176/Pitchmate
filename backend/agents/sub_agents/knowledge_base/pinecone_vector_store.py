"""
Pinecone vector store helper — embed text locally using SentenceTransformers
and perform similarity search via Pinecone.

NOTE: all-MiniLM-L6-v2 produces 384-dim vectors. Create your Pinecone index
with dimension=384 and metric="cosine" (or let this module auto-create a
serverless index on first use — see _get_index() below).

Required env vars:
  PINECONE_API_KEY   — from https://app.pinecone.io
  PINECONE_INDEX     — index name (default: "pitchmate")

Optional env vars (only used if the index needs to be auto-created):
  PINECONE_CLOUD     — default "aws"
  PINECONE_REGION    — default "us-east-1"
  PINECONE_NAMESPACE — default "" (Pinecone's default namespace)
"""

import logging
import os
import uuid
from functools import lru_cache

logger = logging.getLogger("pinecone_vector_store")

MODEL_NAME = "all-MiniLM-L6-v2"
EMBEDDING_DIM = 384


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


def _namespace() -> str:
    return os.environ.get("PINECONE_NAMESPACE", "") or None


@lru_cache(maxsize=1)
def _get_index():
    """Return (and lazily initialise) the Pinecone index singleton."""
    try:
        from pinecone import Pinecone, ServerlessSpec
    except ImportError:
        raise RuntimeError("pinecone package is not installed. Install with: pip install pinecone")

    api_key = os.environ.get("PINECONE_API_KEY", "")
    if not api_key:
        raise RuntimeError("PINECONE_API_KEY environment variable must be set.")
    index_name = os.environ.get("PINECONE_INDEX", "pitchmate")

    pc = Pinecone(api_key=api_key)

    existing = {idx["name"] for idx in pc.list_indexes()}
    if index_name not in existing:
        logger.info(f"Creating Pinecone index '{index_name}' (dim={EMBEDDING_DIM}, cosine)")
        pc.create_index(
            name=index_name,
            dimension=EMBEDDING_DIM,
            metric="cosine",
            spec=ServerlessSpec(
                cloud=os.environ.get("PINECONE_CLOUD", "aws"),
                region=os.environ.get("PINECONE_REGION", "us-east-1"),
            ),
        )

    return pc.Index(index_name)


def init_pinecone():
    """Eagerly initialise the Pinecone index singleton (call on app startup)."""
    _get_index()


def query_vectors(query_text: str, top_k: int = 6, filter: dict | None = None) -> list[dict]:
    """
    Embed *query_text* and retrieve the top_k most similar documents from Pinecone.
    Returns a list of dicts with keys: text, metadata, score.
    """
    embedding = _embed(query_text)
    index = _get_index()

    response = index.query(
        vector=embedding,
        top_k=top_k,
        include_metadata=True,
        filter=filter or None,
        namespace=_namespace(),
    )

    results = []
    for match in response.matches:
        meta = dict(match.metadata or {})
        text = meta.pop("text", "")
        results.append({"text": text, "metadata": meta, "score": match.score})
    return results


def list_all_sources() -> list[dict]:
    """Return distinct document sources with chunk counts."""
    index = _get_index()
    namespace = _namespace()

    counts: dict[str, int] = {}
    for id_batch in index.list(namespace=namespace):
        if not id_batch:
            continue
        fetched = index.fetch(ids=list(id_batch), namespace=namespace)
        for vec in fetched.vectors.values():
            meta = vec.metadata or {}
            source = meta.get("source") or meta.get("file_name") or "Unknown"
            counts[source] = counts.get(source, 0) + 1

    return [{"file_name": name, "count": count} for name, count in sorted(counts.items())]


def upsert_document_chunks(chunks: list[dict], source_name: str) -> int:
    """
    Embed and upsert text chunks into Pinecone.

    Raises:
        RuntimeError: if embedding or the Pinecone index is unavailable.
    Returns:
        Number of chunks successfully upserted.
    """
    index = _get_index()
    vectors = []
    for chunk in chunks:
        text = chunk.get("text") or chunk.get("content", "")
        if not text.strip():
            continue
        meta = {**(chunk.get("metadata") or {}), "source": source_name, "text": text}
        embedding = _embed_document(text)  # raises on failure
        vectors.append({"id": str(uuid.uuid4()), "values": embedding, "metadata": meta})

    if not vectors:
        return 0

    index.upsert(vectors=vectors, namespace=_namespace())
    return len(vectors)
