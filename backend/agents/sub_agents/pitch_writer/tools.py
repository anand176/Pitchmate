"""
Pitch Writer tools — executive summary as PDF, elevator pitch output.
"""

import os
import re
from datetime import datetime

from core.config import config

_ARTIFACTS_DIR = getattr(config, "artifacts_root_dir", "./artifacts")


def _sanitize_filename(name: str) -> str:
    """Return a safe filename stem (no path, no extension)."""
    stem = re.sub(r"[^\w\s-]", "", (name or "pitch").strip())[:80]
    return stem or "pitch"


def create_executive_summary_pdf(
    executive_summary_text: str,
    company_name: str = "Executive Summary",
) -> str:
    """
    Create a one-page PDF from the executive summary text and save it to the artifacts directory.

    Call this after you have composed the one-page executive summary. The PDF will be
    saved so the user can download or share it.

    Args:
        executive_summary_text: The full executive summary content (company name, problem,
                               solution, market, traction, team, business model, ask).
        company_name: Company or document title used for the filename and optional header.

    Returns:
        A message with the file path to the created PDF, or an error message if creation failed.
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

    if not (executive_summary_text or "").strip():
        return "No executive summary text provided. Compose the summary first, then call this tool with the full text."

    os.makedirs(_ARTIFACTS_DIR, exist_ok=True)
    safe_name = _sanitize_filename(company_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"executive_summary_{safe_name}_{timestamp}.pdf"
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

        story = []
        story.append(Paragraph(company_name.replace("&", "&amp;"), title_style))
        story.append(Spacer(1, 0.15 * inch))

        for block in executive_summary_text.strip().split("\n\n"):
            block = block.strip()
            if not block:
                continue
            block_escaped = block.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            story.append(Paragraph(block_escaped.replace("\n", "<br/>"), body_style))

        doc.build(story)
        abs_path = os.path.abspath(filepath)
        return f"Executive summary PDF created: {abs_path}"
    except Exception as e:
        return f"PDF creation failed: {str(e)}"


def save_elevator_pitch(pitch_text: str, company_name: str = "Startup") -> str:
    """
    Save the elevator pitch text to a .txt file in the artifacts directory.

    Call this with the final elevator pitch (30–60 seconds, ~100–150 words) so the
    user can download or reuse it.

    Args:
        pitch_text: The full elevator pitch script.
        company_name: Company name used for the filename.

    Returns:
        A message with the file path to the saved .txt file, or an error message.
    """
    if not (pitch_text or "").strip():
        return "No elevator pitch text provided. Write the pitch first, then call this tool with the full text."

    os.makedirs(_ARTIFACTS_DIR, exist_ok=True)
    safe_name = _sanitize_filename(company_name)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    filename = f"elevator_pitch_{safe_name}_{timestamp}.txt"
    filepath = os.path.join(_ARTIFACTS_DIR, filename)

    try:
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(f"# Elevator pitch — {company_name}\n\n")
            f.write(pitch_text.strip())
        abs_path = os.path.abspath(filepath)
        return f"Elevator pitch saved: {abs_path}"
    except Exception as e:
        return f"Failed to save elevator pitch: {str(e)}"
