"""
Pain Point Research Platform — FastAPI backend.
"""

from __future__ import annotations

import json
import threading
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Any

from anthropic import Anthropic
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field
from pydantic_settings import BaseSettings, SettingsConfigDict

from claude_utils import extract_json_object, normalize_build_payload, normalize_research_payload
from db import get_connection, init_db, resolve_db_path, row_to_dict, utc_now_iso
from pdf_export import starred_ideas_to_pdf_bytes
from prompts import BUILD_SYSTEM, RESEARCH_SYSTEM, build_build_user_prompt, build_research_user_prompt

BASE_DIR = Path(__file__).resolve().parent

_db_lock = threading.Lock()


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    anthropic_api_key: str = ""
    anthropic_model: str = "claude-sonnet-4-5-20250929"
    database_url: str = "./research.db"
    cors_origins: str = (
        "http://localhost:5173,http://localhost:3000,"
        "http://127.0.0.1:5173,http://127.0.0.1:3000"
    )
    backend_public_url: str = ""


settings = Settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    db_path = resolve_db_path(settings.database_url, BASE_DIR)
    init_db(db_path)
    app.state.db_path = db_path
    yield


app = FastAPI(title="Pain Point Research API", version="1.0.0", lifespan=lifespan)

_origins = [o.strip() for o in settings.cors_origins.split(",") if o.strip()]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins or ["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def get_client() -> Anthropic:
    if not settings.anthropic_api_key:
        raise HTTPException(
            status_code=503,
            detail="ANTHROPIC_API_KEY is not configured. Set it in backend/.env",
        )
    return Anthropic(api_key=settings.anthropic_api_key)


def claude_text_response(system: str, user: str) -> str:
    client = get_client()
    try:
        message = client.messages.create(
            model=settings.anthropic_model,
            max_tokens=8192,
            temperature=0.35,
            system=system,
            messages=[{"role": "user", "content": user}],
        )
    except Exception as exc:
        raise HTTPException(status_code=502, detail=f"Claude API error: {exc!s}") from exc

    if not message.content:
        raise HTTPException(status_code=502, detail="Empty response from Claude")

    parts: list[str] = []
    for block in message.content:
        if hasattr(block, "text"):
            parts.append(block.text)
    raw = "".join(parts).strip()
    if not raw:
        raise HTTPException(status_code=502, detail="No text in Claude response")
    return raw


class ResearchRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)


class ResearchResponse(BaseModel):
    market: str
    sourceSignals: dict[str, str]
    painPoints: list[dict[str, Any]]


class BuildRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    painPoint: dict[str, Any]


class StarRequest(BaseModel):
    query: str = Field(min_length=1, max_length=500)
    painPoint: dict[str, Any]
    buildPaths: list[Any] | None = None


class ExportPdfRequest(BaseModel):
    starred_ideas: list[dict[str, Any]]


def _db(request: Request) -> Path:
    """Resolve SQLite path; lazy-init if lifespan did not set app.state (e.g. some test/proxy setups)."""
    state = request.app.state
    if getattr(state, "db_path", None) is not None:
        return state.db_path
    with _db_lock:
        if getattr(state, "db_path", None) is None:
            db_path = resolve_db_path(settings.database_url, BASE_DIR)
            init_db(db_path)
            state.db_path = db_path
    return state.db_path


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/stats")
def api_stats(request: Request) -> dict[str, int]:
    db_path = _db(request)
    with get_connection(db_path) as conn:
        cur = conn.execute("SELECT COUNT(*) AS c FROM search_history")
        total_searches = int(cur.fetchone()["c"])
        cur = conn.execute("SELECT COALESCE(SUM(pain_count), 0) AS s FROM search_history")
        pain_points = int(cur.fetchone()["s"])
        cur = conn.execute("SELECT COUNT(*) AS c FROM starred_ideas")
        starred = int(cur.fetchone()["c"])
        cur = conn.execute(
            """
            SELECT COUNT(*) AS c FROM starred_ideas
            WHERE build_paths_json IS NOT NULL AND build_paths_json != '' AND build_paths_json != '[]'
            """
        )
        with_build = int(cur.fetchone()["c"])
    return {
        "totalSearches": total_searches,
        "opportunitiesFound": pain_points,
        "painPoints": pain_points,
        "buildPaths": with_build,
        "starredCount": starred,
    }


@app.post("/api/research", response_model=ResearchResponse)
def research(body: ResearchRequest, request: Request) -> ResearchResponse:
    user_prompt = build_research_user_prompt(body.query.strip())
    raw = claude_text_response(RESEARCH_SYSTEM, user_prompt)
    try:
        parsed = extract_json_object(raw)
        payload = normalize_research_payload(parsed)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned invalid JSON: {exc!s}. First 500 chars: {raw[:500]!r}",
        ) from exc

    resp = ResearchResponse(
        market=str(payload["market"]),
        sourceSignals={k: str(v) for k, v in payload["sourceSignals"].items()},
        painPoints=list(payload["painPoints"]),
    )

    db_path = _db(request)
    with get_connection(db_path) as conn:
        conn.execute(
            "INSERT INTO search_history (query, pain_count, created_at) VALUES (?, ?, ?)",
            (body.query.strip(), len(resp.painPoints), utc_now_iso()),
        )
        conn.commit()

    return resp


@app.post("/api/build")
def api_build(body: BuildRequest) -> dict[str, Any]:
    user_prompt = build_build_user_prompt(body.query.strip(), body.painPoint)
    raw = claude_text_response(BUILD_SYSTEM, user_prompt)
    try:
        parsed = extract_json_object(raw)
        payload = normalize_build_payload(parsed)
    except (json.JSONDecodeError, ValueError) as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Model returned invalid JSON: {exc!s}. First 500 chars: {raw[:500]!r}",
        ) from exc
    return payload


@app.get("/api/history")
def api_history(request: Request) -> list[dict[str, Any]]:
    db_path = _db(request)
    with get_connection(db_path) as conn:
        cur = conn.execute(
            "SELECT id, query, pain_count, created_at FROM search_history ORDER BY id DESC LIMIT 200"
        )
        rows = [row_to_dict(r) for r in cur.fetchall()]
    return rows


@app.post("/api/star")
def api_star(body: StarRequest, request: Request) -> dict[str, Any]:
    pp = body.painPoint
    title = str(pp.get("title", ""))
    impact = str(pp.get("impact", ""))
    difficulty = str(pp.get("difficulty", ""))
    tam = str(pp.get("tam", ""))
    demand = str(pp.get("demand", ""))
    ai_solution = str(pp.get("aiSolution", pp.get("ai_solution", "")))
    build_json = json.dumps(body.buildPaths or [], ensure_ascii=False)

    db_path = _db(request)
    with get_connection(db_path) as conn:
        cur = conn.execute(
            """
            INSERT INTO starred_ideas
            (query, pain_title, pain_impact, difficulty, tam, demand, ai_solution, build_paths_json, created_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                body.query.strip(),
                title,
                impact,
                difficulty,
                tam,
                demand,
                ai_solution,
                build_json,
                utc_now_iso(),
            ),
        )
        new_id = cur.lastrowid
        conn.commit()

    return {"id": new_id, "ok": True}


@app.get("/api/starred")
def api_starred(request: Request) -> list[dict[str, Any]]:
    db_path = _db(request)
    with get_connection(db_path) as conn:
        cur = conn.execute(
            """
            SELECT id, query, pain_title, pain_impact, difficulty, tam, demand, ai_solution,
                   build_paths_json, created_at
            FROM starred_ideas ORDER BY id DESC
            """
        )
        out: list[dict[str, Any]] = []
        for r in cur.fetchall():
            d = row_to_dict(r)
            raw_bp = d.pop("build_paths_json", "[]")
            try:
                d["buildPaths"] = json.loads(raw_bp) if isinstance(raw_bp, str) else raw_bp
            except json.JSONDecodeError:
                d["buildPaths"] = []
            out.append(d)
    return out


@app.delete("/api/starred/{idea_id}")
def api_delete_starred(idea_id: int, request: Request) -> dict[str, bool]:
    db_path = _db(request)
    with get_connection(db_path) as conn:
        cur = conn.execute("DELETE FROM starred_ideas WHERE id = ?", (idea_id,))
        conn.commit()
        if cur.rowcount == 0:
            raise HTTPException(status_code=404, detail="Starred idea not found")
    return {"ok": True}


@app.post("/api/export-pdf")
def api_export_pdf(body: ExportPdfRequest) -> StreamingResponse:
    if not body.starred_ideas:
        raise HTTPException(status_code=400, detail="starred_ideas must be a non-empty array")
    try:
        data = starred_ideas_to_pdf_bytes(body.starred_ideas)
    except Exception as exc:
        raise HTTPException(status_code=500, detail=f"PDF generation failed: {exc!s}") from exc

    return StreamingResponse(
        iter([data]),
        media_type="application/pdf",
        headers={"Content-Disposition": 'attachment; filename="starred-ideas.pdf"'},
    )
