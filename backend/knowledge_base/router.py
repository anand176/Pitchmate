"""
Knowledge Base router — upload text/documents and list stored sources.
Endpoints:
  POST /knowledge-base/upload   — embed + store text chunks in Supabase pgvector
  GET  /knowledge-base/documents — list all uploaded document sources
"""

from typing import Annotated
from fastapi import APIRouter, HTTPException, status, Depends
from pydantic import BaseModel
import logging

from auth.dependencies import get_current_user

logger = logging.getLogger("knowledge_base_router")
router = APIRouter(prefix="/knowledge-base", tags=["Knowledge Base"])


class UploadRequest(BaseModel):
    text: str                          # Raw text content to embed and store
    source_name: str = "uploaded_doc"  # Label / filename for this document


class UploadResponse(BaseModel):
    status: str
    chunks_stored: int
    source_name: str


class DocumentsResponse(BaseModel):
    documents: list[dict]


# ─── Endpoints ───────────────────────────────────────────────────────────────

@router.post("/upload", response_model=UploadResponse)
async def upload_document(
    req: UploadRequest,
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Chunk a text document, embed it with text-embedding-004,
    and upsert into the Supabase pgvector documents table.
    """
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="text body is empty.")

    try:
        chunks = _chunk_text(req.text)

        from agents.sub_agents.knowledge_base.supabase_vector_store import upsert_document_chunks
        stored = upsert_document_chunks(
            [{"text": c} for c in chunks],
            source_name=req.source_name,
        )
        return UploadResponse(
            status="success",
            chunks_stored=stored,
            source_name=req.source_name,
        )
    except Exception as exc:
        logger.error(f"Upload error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(exc)}",
        )


@router.get("/documents", response_model=DocumentsResponse)
async def list_documents(
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """List all document sources stored in the knowledge base."""
    try:
        from agents.sub_agents.knowledge_base.supabase_vector_store import list_all_sources
        sources = list_all_sources()
        return DocumentsResponse(documents=sources)
    except Exception as exc:
        logger.error(f"List documents error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Could not list documents: {str(exc)}",
        )


# ─── Helpers ─────────────────────────────────────────────────────────────────

def _chunk_text(text: str, chunk_size: int = 800, overlap: int = 100) -> list[str]:
    """
    Split text into overlapping chunks of ~chunk_size characters.
    Simple sliding-window splitter — no external library needed.
    """
    text = text.strip()
    if len(text) <= chunk_size:
        return [text]

    chunks = []
    start = 0
    while start < len(text):
        end = start + chunk_size
        # Try to break on a sentence boundary
        if end < len(text):
            boundary = text.rfind(". ", start, end)
            if boundary != -1 and boundary > start + chunk_size // 2:
                end = boundary + 1  # include the period
        chunks.append(text[start:end].strip())
        start = end - overlap
    return [c for c in chunks if c]
