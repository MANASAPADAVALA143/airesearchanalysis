"""Export starred ideas to a simple PDF."""

from __future__ import annotations

from io import BytesIO
from xml.sax.saxutils import escape

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import cm
from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer


def _esc(text: str) -> str:
    return escape(str(text), entities={'"': "&quot;", "'": "&apos;"})


def starred_ideas_to_pdf_bytes(items: list[dict]) -> bytes:
    buf = BytesIO()
    doc = SimpleDocTemplate(
        buf,
        pagesize=A4,
        rightMargin=2 * cm,
        leftMargin=2 * cm,
        topMargin=2 * cm,
        bottomMargin=2 * cm,
    )
    styles = getSampleStyleSheet()
    title_style = ParagraphStyle(
        "DocTitle",
        parent=styles["Heading1"],
        fontSize=16,
        spaceAfter=12,
    )
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontSize=12, spaceAfter=8, spaceBefore=14)
    body = ParagraphStyle("Body", parent=styles["Normal"], fontSize=10, leading=14)

    story: list = [Paragraph(_esc("Starred opportunities"), title_style), Spacer(1, 0.3 * cm)]

    if not items:
        story.append(Paragraph(_esc("No starred ideas."), body))
        doc.build(story)
        return buf.getvalue()

    for i, row in enumerate(items, start=1):
        title = row.get("pain_title") or row.get("painTitle") or "Untitled"
        query = row.get("query", "")
        story.append(Paragraph(_esc(f"{i}. {title}"), h2))
        story.append(Paragraph(_esc(f"Industry / query: {query}"), body))
        for label, key in (
            ("Impact", "pain_impact"),
            ("Difficulty", "difficulty"),
            ("TAM", "tam"),
            ("Demand", "demand"),
            ("AI solution", "ai_solution"),
        ):
            val = row.get(key)
            if val:
                story.append(Paragraph(_esc(f"{label}: {val}"), body))
        bp = row.get("buildPaths") or row.get("build_paths")
        if isinstance(bp, list) and bp:
            story.append(Paragraph(_esc("Build paths (summary)"), h2))
            for j, path in enumerate(bp, start=1):
                if not isinstance(path, dict):
                    continue
                line = f"{j}. {path.get('type', '')} — {path.get('name', '')}"
                story.append(Paragraph(_esc(line), body))
                if path.get("tagline"):
                    story.append(Paragraph(_esc(str(path["tagline"])), body))
        story.append(Spacer(1, 0.4 * cm))

    doc.build(story)
    return buf.getvalue()
