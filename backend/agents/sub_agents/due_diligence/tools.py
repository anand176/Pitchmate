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
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.lib.units import inch
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer
    except ImportError:
        return (
            "PDF creation failed: reportlab is not installed. "
            "Install with: pip install reportlab"
        )

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
            topMargin=0.75 * inch,
            bottomMargin=0.75 * inch,
        )
        styles = getSampleStyleSheet()
        body_style = ParagraphStyle(
            name="BodySmall",
            parent=styles["Normal"],
            fontSize=10,
            leading=12,
            spaceAfter=6,
        )
        title_style = ParagraphStyle(
            name="DocTitle",
            parent=styles["Heading1"],
            fontSize=14,
            spaceAfter=12,
        )
        heading2_style = ParagraphStyle(
            name="Heading2",
            parent=styles["Heading2"],
            fontSize=12,
            spaceBefore=10,
            spaceAfter=6,
        )

        story = []
        story.append(Paragraph(f"Due Diligence Q&A — {company_name}".replace("&", "&amp;"), title_style))
        story.append(Paragraph("Anticipated investor questions and suggested answers", body_style))
        story.append(Spacer(1, 0.2 * inch))

        for block in qa_content.strip().split("\n\n"):
            block = block.strip()
            if not block:
                continue
            block_escaped = block.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            if block.startswith("## ") or block.startswith("### "):
                story.append(Paragraph(block_escaped.replace("\n", "<br/>"), heading2_style))
            else:
                story.append(Paragraph(block_escaped.replace("\n", "<br/>"), body_style))

        doc.build(story)
        return f"Due diligence Q&A PDF created. Download: {filename}"
    except Exception as e:
        return f"PDF creation failed: {str(e)}"
