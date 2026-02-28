"""
Knowledge Base router — upload text/documents and list stored sources.
Endpoints:
  POST /knowledge-base/upload      — embed + store text chunks in Supabase pgvector
  POST /knowledge-base/upload-file — upload PDF or DOCX file, extract text, then store
  GET  /knowledge-base/documents   — list all uploaded document sources
"""

import io
import logging
from typing import Annotated

from fastapi import APIRouter, File, HTTPException, UploadFile, status, Depends
from pydantic import BaseModel

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


@router.post("/upload-file", response_model=UploadResponse)
async def upload_file(
    file: Annotated[UploadFile, File()],
    current_user: Annotated[dict, Depends(get_current_user)],
):
    """
    Upload a PDF or DOCX file: extract text, chunk, embed, and store in the knowledge base.
    """
    fn = (file.filename or "").strip().lower()
    if not fn.endswith(".pdf") and not fn.endswith(".docx"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only PDF and DOCX files are allowed.",
        )
    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="File is empty.")

    try:
        text = _extract_text_from_file(content, fn)
    except Exception as exc:
        logger.warning(f"Extract text failed: {exc}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Could not extract text from file: {exc}",
        ) from exc

    if not (text or "").strip():
        raise HTTPException(status_code=400, detail="No text could be extracted from the file.")

    source_name = (file.filename or "uploaded_doc").rsplit(".", 1)[0].strip() or "uploaded_doc"
    try:
        chunks = _chunk_text(text.strip())
        from agents.sub_agents.knowledge_base.supabase_vector_store import upsert_document_chunks
        stored = upsert_document_chunks(
            [{"text": c} for c in chunks],
            source_name=source_name,
        )
        return UploadResponse(
            status="success",
            chunks_stored=stored,
            source_name=source_name,
        )
    except Exception as exc:
        logger.error(f"Upload file error: {exc}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Upload failed: {str(exc)}",
        ) from exc


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

def _extract_text_from_file(content: bytes, filename: str) -> str:
    """Extract plain text from PDF or DOCX file content."""
    if filename.endswith(".pdf"):
        try:
            import fitz  # PyMuPDF
        except ImportError:
            raise RuntimeError("PDF support requires PyMuPDF: pip install PyMuPDF")
        doc = fitz.open(stream=content, filetype="pdf")
        parts = []
        for page in doc:
            parts.append(page.get_text())
        doc.close()
        return "\n\n".join(parts).strip()
    if filename.endswith(".docx"):
        try:
            from docx import Document
        except ImportError:
            raise RuntimeError("DOCX support requires python-docx: pip install python-docx")
        doc = Document(io.BytesIO(content))
        return "\n\n".join(p.text for p in doc.paragraphs if p.text).strip()
    raise ValueError("Unsupported file type")


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
