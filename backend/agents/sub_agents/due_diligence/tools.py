"""
Due Diligence tools — generate investor Q&A PDF for meeting prep.
"""

import os
import re
from datetime import datetime

from core.config import config

_ARTIFACTS_DIR = getattr(config, "artifacts_root_dir", "./artifacts")


def _sanitize_filename(name: str) -> str:
    """Return a safe filename stem (no path, no extension)."""
    stem = re.sub(r"[^\w\s-]", "", (name or "startup").strip())[:80]
    return stem or "startup"


def create_due_diligence_qa_pdf(
    qa_content: str,
    company_name: str = "Startup",
) -> str:
    """
    Create a due diligence Q&A PDF from structured text and save it to the artifacts directory.

    Call this after you have generated the full Q&A content. The PDF will be saved so the user
    can download it. Return the filename in the message so the frontend can offer a download link.

    Args:
        qa_content: Full Q&A document text. Use clear sections (e.g. "## Section" or "### Question").
                    Include: anticipated investor questions, suggested answers, red flags to address,
                    and prep tips. Use newlines and headings for structure.
        company_name: Company or document title used for the filename and optional header.

    Returns:
        A message including the filename for download, e.g. "Due diligence Q&A PDF created. Download: filename.pdf"
    """
    try:
        from reportlab.lib.pagesizes import letter
        from reportlab.lib.units import inch
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except ImportError:
        return (
            "PDF creation failed: reportlab is not installed. "
            "Install with: pip install reportlab"
        )

    from core.doc_style import get_pdf_styles, make_page_decorator, escape_pdf_text, cover_flowables, today_str

    if not (qa_content or "").strip():
        return "No Q&A content provided. Generate the investor Q&A document first, then call this tool with the full text."

    os.makedirs(_ARTIFACTS_DIR, exist_ok=True)
    safe_name = _sanitize_filename(company_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"due_diligence_qa_{safe_name}_{timestamp}.pdf"
    filepath = os.path.join(_ARTIFACTS_DIR, filename)

    try:
        doc = SimpleDocTemplate(
            filepath,
            pagesize=letter,
            leftMargin=0.75 * inch,
            rightMargin=0.75 * inch,
            topMargin=0.85 * inch,
            bottomMargin=0.85 * inch,
        )
        styles = get_pdf_styles()

        story = cover_flowables(
            company_name,
            "Due Diligence Q&A",
            [today_str(), "Anticipated investor questions and suggested answers"],
        )

        for block in qa_content.strip().split("\n\n"):
            block = block.strip()
            if not block:
                continue
            block_escaped = escape_pdf_text(block)
            if block.startswith("## ") or block.startswith("### "):
                block_escaped = block_escaped.lstrip("#").strip()
                story.append(Paragraph(block_escaped.replace("\n", "<br/>"), styles["h2"]))
            else:
                story.append(Paragraph(block_escaped.replace("\n", "<br/>"), styles["body"]))

        on_first, on_later = make_page_decorator(company_name, footer_label=f"{company_name} — Due Diligence Q&A")
        doc.build(story, onFirstPage=on_first, onLaterPages=on_later)
        return f"Due diligence Q&A PDF created. Download: {filename}"
    except Exception as e:
        return f"PDF creation failed: {str(e)}"
