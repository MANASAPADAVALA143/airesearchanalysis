"""SQLite helpers for search history and starred ideas."""

from __future__ import annotations

import sqlite3
from contextlib import contextmanager
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Generator


def resolve_db_path(database_url: str, base_dir: Path) -> Path:
    raw = database_url.strip()
    if raw.startswith("sqlite:///"):
        raw = raw.replace("sqlite:///", "", 1)
    p = Path(raw)
    if not p.is_absolute():
        p = (base_dir / p).resolve()
    return p


def utc_now_iso() -> str:
    return datetime.now(timezone.utc).replace(microsecond=0).isoformat()


def init_db(db_path: Path) -> None:
    db_path.parent.mkdir(parents=True, exist_ok=True)
    with sqlite3.connect(db_path) as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS search_history (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                pain_count INTEGER NOT NULL DEFAULT 0,
                created_at TEXT NOT NULL
            );

            CREATE TABLE IF NOT EXISTS starred_ideas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                query TEXT NOT NULL,
                pain_title TEXT NOT NULL DEFAULT '',
                pain_impact TEXT NOT NULL DEFAULT '',
                difficulty TEXT NOT NULL DEFAULT '',
                tam TEXT NOT NULL DEFAULT '',
                demand TEXT NOT NULL DEFAULT '',
                ai_solution TEXT NOT NULL DEFAULT '',
                build_paths_json TEXT NOT NULL DEFAULT '[]',
                created_at TEXT NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_search_history_created
            ON search_history(created_at DESC);

            CREATE INDEX IF NOT EXISTS idx_starred_created
            ON starred_ideas(created_at DESC);
            """
        )
        conn.commit()


@contextmanager
def get_connection(db_path: Path) -> Generator[sqlite3.Connection, None, None]:
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    try:
        yield conn
    finally:
        conn.close()


def row_to_dict(row: sqlite3.Row) -> dict[str, Any]:
    return {k: row[k] for k in row.keys()}
