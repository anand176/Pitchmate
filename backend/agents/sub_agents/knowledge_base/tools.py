"""
Knowledge Base tools — search and list documents via Supabase pgvector.
Replaces the previous Pinecone implementation.
"""

import logging

logger = logging.getLogger("knowledge_base_agent")


def _query_vectors(query_text: str, top_k: int) -> list[dict]:
    from agents.sub_agents.knowledge_base.supabase_vector_store import query_vectors
    return query_vectors(query_text, top_k=top_k)


def _list_sources() -> list[dict]:
    from agents.sub_agents.knowledge_base.supabase_vector_store import list_all_sources
    return list_all_sources()


def search_knowledge_base(query: str, top_k: int = 6) -> str:
    """
    Search the Supabase pgvector knowledge base for passages relevant to the query.
    Use this to answer questions about uploaded pitch-related documents, frameworks, or research.

    Args:
        query: The search query derived from the user's question.
        top_k: Number of results to return (default 6, max 10).
    """
    if not query or not str(query).strip():
        return "No search query provided. Please specify what you are looking for."
    try:
        documents = _query_vectors(str(query).strip(), top_k=min(top_k, 10))
    except RuntimeError as e:
        return (
            "Knowledge base (Supabase pgvector) is not available. "
            "Please ensure SUPABASE_URL and SUPABASE_SERVICE_KEY are set and the documents table exists."
        )
    except Exception as e:
        logger.exception("Knowledge base search failed")
        return f"Search failed: {str(e)}."

    if not documents:
        return (
            f'No relevant passages found for: "{query}". '
            "Try different keywords or check that documents have been uploaded to the knowledge base."
        )

    parts = []
    for i, doc in enumerate(documents, 1):
        text = doc.get("text", "").strip()
        meta = doc.get("metadata") or {}
        source = meta.get("source") or meta.get("file_name") or "Unknown"
        score = doc.get("score")
        score_str = f" (relevance: {score:.2f})" if score is not None else ""
        parts.append(f"[{i}] Source: {source}{score_str}\n{text}")

    return "\n\n---\n\n".join(parts)


def list_uploaded_documents() -> str:
    """
    List all documents currently stored in the Supabase knowledge base.
    Call this when the user asks what documents are available or what they can ask about.
    """
    try:
        sources = _list_sources()
    except RuntimeError:
        return "Knowledge base is not available. No documents are loaded."
    except Exception as e:
        logger.exception("List sources failed")
        return f"Could not list documents: {str(e)}."

    if not sources:
        return "No documents have been uploaded to the knowledge base yet."

    lines = []
    for s in sources:
        name = s.get("file_name") or s.get("source", "Unknown")
        count = s.get("count", 0)
        lines.append(f"- {name} ({count} chunks)")
    return "Uploaded documents:\n" + "\n".join(lines)
