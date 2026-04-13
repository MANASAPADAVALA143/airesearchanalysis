"""Parse and normalize Claude JSON outputs."""

from __future__ import annotations

import json
import re
from typing import Any


def extract_json_object(text: str) -> dict[str, Any]:
    s = text.strip()
    fence = re.match(r"^```(?:json)?\s*\n?(.*?)\n?```\s*$", s, re.DOTALL | re.IGNORECASE)
    if fence:
        s = fence.group(1).strip()
    try:
        data = json.loads(s)
    except json.JSONDecodeError:
        start = s.find("{")
        end = s.rfind("}")
        if start == -1 or end == -1 or end <= start:
            raise ValueError("No JSON object found in model response")
        data = json.loads(s[start : end + 1])
    if not isinstance(data, dict):
        raise ValueError("Top-level JSON must be an object")
    return data


def normalize_research_payload(data: dict[str, Any]) -> dict[str, Any]:
    for key in ("market", "sourceSignals", "painPoints"):
        if key not in data:
            raise ValueError(f"Missing key: {key}")

    signals = data["sourceSignals"]
    if not isinstance(signals, dict):
        raise ValueError("sourceSignals must be an object")

    for k in (
        "reddit",
        "quora",
        "youtube",
        "linkedin",
        "reviews",
        "twitter",
        "googleTrends",
        "india",
    ):
        if k not in signals:
            signals[k] = ""

    pains = data["painPoints"]
    if not isinstance(pains, list):
        raise ValueError("painPoints must be an array")

    normalized_pains: list[dict[str, Any]] = []
    for p in pains:
        if not isinstance(p, dict):
            continue
        normalized_pains.append(
            {
                "title": str(p.get("title", "")),
                "impact": str(p.get("impact", "")),
                "sourceValidation": str(p.get("sourceValidation", "")),
                "difficulty": str(p.get("difficulty", "Medium")),
                "tam": str(p.get("tam", "Niche TAM")),
                "demand": str(p.get("demand", "High")),
                "aiSolution": str(p.get("aiSolution", "")),
            }
        )

    data["painPoints"] = normalized_pains[:10]
    return data


def normalize_build_payload(data: dict[str, Any]) -> dict[str, Any]:
    pain_deep = str(data.get("painDeep", ""))
    competitor_gap = str(data.get("competitorGap", ""))

    raw_ev = data.get("sourceEvidence", {})
    if not isinstance(raw_ev, dict):
        raw_ev = {}
    source_evidence: dict[str, str] = {}
    for k in (
        "reddit",
        "quora",
        "youtube",
        "linkedin",
        "reviews",
        "twitter",
        "googleTrends",
        "india",
    ):
        source_evidence[k] = str(raw_ev.get(k, ""))

    paths = data.get("buildPaths", [])
    if not isinstance(paths, list):
        paths = []

    normalized_paths: list[dict[str, Any]] = []
    for p in paths:
        if not isinstance(p, dict):
            continue
        tools = p.get("tools", [])
        features = p.get("features", [])
        if not isinstance(tools, list):
            tools = [str(tools)]
        if not isinstance(features, list):
            features = [str(features)]
        normalized_paths.append(
            {
                "type": str(p.get("type", "AI Software")),
                "name": str(p.get("name", "")),
                "tagline": str(p.get("tagline", "")),
                "description": str(p.get("description", "")),
                "buildTime": str(p.get("buildTime", "")),
                "priceRange": str(p.get("priceRange", "")),
                "revenueTarget": str(p.get("revenueTarget", "")),
                "tools": [str(t) for t in tools][:20],
                "features": [str(f) for f in features][:12],
                "idealCustomer": str(p.get("idealCustomer", "")),
                "unfairAdvantage": str(p.get("unfairAdvantage", "")),
            }
        )

    expected_types = ("AI Software", "AI Coaching Program", "AI Service")
    by_type = {x.get("type"): x for x in normalized_paths}
    ordered: list[dict[str, Any]] = []
    for t in expected_types:
        if t in by_type:
            ordered.append(by_type[t])
    for x in normalized_paths:
        if x not in ordered:
            ordered.append(x)
    ordered = ordered[:3]

    while len(ordered) < 3:
        idx = len(ordered)
        ordered.append(
            {
                "type": expected_types[idx],
                "name": "",
                "tagline": "",
                "description": "",
                "buildTime": "",
                "priceRange": "",
                "revenueTarget": "",
                "tools": [],
                "features": [],
                "idealCustomer": "",
                "unfairAdvantage": "",
            }
        )

    return {
        "painDeep": pain_deep,
        "competitorGap": competitor_gap,
        "sourceEvidence": source_evidence,
        "buildPaths": ordered[:3],
    }
