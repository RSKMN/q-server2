"""FastAPI router for showcasing generated project results."""

from __future__ import annotations

import csv
from pathlib import Path
from typing import Any

from fastapi import APIRouter, Query


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]


def _read_csv_rows(path: Path, limit: int | None = None) -> list[dict[str, str]]:
    """Read CSV rows safely; return an empty list when file is unavailable."""
    if not path.exists() or not path.is_file():
        return []

    rows: list[dict[str, str]] = []
    with path.open("r", encoding="utf-8-sig", newline="") as handle:
        reader = csv.DictReader(handle)
        for row in reader:
            rows.append({k: (v.strip() if isinstance(v, str) else "") for k, v in row.items()})
            if limit is not None and len(rows) >= limit:
                break
    return rows


def _to_number(value: str | None) -> int | float | None:
    if value is None:
        return None
    cleaned = value.strip()
    if cleaned == "":
        return None
    try:
        as_float = float(cleaned)
    except ValueError:
        return None
    if as_float.is_integer():
        return int(as_float)
    return as_float


def _typed_row(row: dict[str, str]) -> dict[str, Any]:
    typed: dict[str, Any] = {}
    for key, raw_value in row.items():
        numeric_value = _to_number(raw_value)
        typed[key] = numeric_value if numeric_value is not None else raw_value
    return typed


def _relative_path(path: Path) -> str:
    try:
        return path.relative_to(PROJECT_ROOT).as_posix()
    except ValueError:
        return path.as_posix()


@router.get("/results/overview")
def get_results_overview() -> dict[str, Any]:
    existing_ranked_path = PROJECT_ROOT / "existing_candidates_ranked.csv"
    generated_path = PROJECT_ROOT / "generated_candidates.csv"
    qm_path = PROJECT_ROOT / "qm" / "qm_results.csv"
    md_stability_path = PROJECT_ROOT / "md" / "stability.csv"
    md_rmsd_path = PROJECT_ROOT / "md" / "rmsd_summary.csv"

    existing_rows = _read_csv_rows(existing_ranked_path)
    generated_rows = _read_csv_rows(generated_path)
    qm_rows = _read_csv_rows(qm_path)
    md_stability_rows = _read_csv_rows(md_stability_path)
    md_rmsd_rows = _read_csv_rows(md_rmsd_path)

    top_existing = existing_rows[0] if existing_rows else {}
    best_qm = min(
        qm_rows,
        key=lambda row: _to_number(row.get("affinity_kcal_mol"))
        if _to_number(row.get("affinity_kcal_mol")) is not None
        else 10**9,
        default={},
    )

    return {
        "counts": {
            "existing_ranked": len(existing_rows),
            "generated_candidates": len(generated_rows),
            "qm_profiles": len(qm_rows),
            "md_stability": len(md_stability_rows),
            "md_rmsd": len(md_rmsd_rows),
            "md_summaries": len(list((PROJECT_ROOT / "md" / "summaries").glob("*.txt"))),
            "qm_summaries": len(list((PROJECT_ROOT / "qm" / "summaries").glob("*.txt"))),
            "docking_result_files": len(list((PROJECT_ROOT / "phase2_docking" / "results").glob("*.csv"))),
        },
        "highlights": {
            "top_existing": _typed_row(top_existing) if top_existing else None,
            "best_qm": _typed_row(best_qm) if best_qm else None,
        },
        "sources": {
            "existing_candidates": _relative_path(existing_ranked_path),
            "generated_candidates": _relative_path(generated_path),
            "qm_results": _relative_path(qm_path),
            "md_stability": _relative_path(md_stability_path),
            "md_rmsd": _relative_path(md_rmsd_path),
        },
    }


@router.get("/results/candidates")
def get_ranked_candidates(
    source: str = Query(default="existing", pattern="^(existing|generated)$"),
    limit: int = Query(default=25, ge=1, le=500),
) -> dict[str, Any]:
    source_path = (
        PROJECT_ROOT / "existing_candidates_ranked.csv"
        if source == "existing"
        else PROJECT_ROOT / "generated_candidates.csv"
    )

    rows = _read_csv_rows(source_path)
    rows = rows[:limit]

    return {
        "source": source,
        "file": _relative_path(source_path),
        "count": len(rows),
        "items": [_typed_row(row) for row in rows],
    }


@router.get("/results/profiles")
def get_candidate_profiles(limit: int = Query(default=100, ge=1, le=1000)) -> dict[str, Any]:
    qm_rows = _read_csv_rows(PROJECT_ROOT / "qm" / "qm_results.csv")
    stability_rows = _read_csv_rows(PROJECT_ROOT / "md" / "stability.csv")
    rmsd_rows = _read_csv_rows(PROJECT_ROOT / "md" / "rmsd_summary.csv")

    merged: dict[tuple[str, str], dict[str, Any]] = {}

    for row in qm_rows:
        key = (row.get("candidate_id", ""), row.get("target", ""))
        if key[0]:
            merged[key] = _typed_row(row)

    for row in stability_rows:
        key = (row.get("candidate_id", ""), row.get("target", ""))
        if key[0]:
            merged.setdefault(key, {}).update(_typed_row(row))

    for row in rmsd_rows:
        key = (row.get("candidate_id", ""), row.get("target", ""))
        if key[0]:
            merged.setdefault(key, {}).update(_typed_row(row))

    items = list(merged.values())[:limit]

    return {
        "count": len(items),
        "items": items,
    }


@router.get("/results/artifacts")
def get_result_artifacts(limit: int = Query(default=200, ge=1, le=1000)) -> dict[str, Any]:
    candidates: list[Path] = []
    candidates.extend(sorted((PROJECT_ROOT / "md" / "summaries").glob("*.txt")))
    candidates.extend(sorted((PROJECT_ROOT / "qm" / "summaries").glob("*.txt")))
    candidates.extend(sorted((PROJECT_ROOT / "phase2_docking" / "results").glob("*")))

    files = [path for path in candidates if path.is_file()][:limit]

    return {
        "count": len(files),
        "items": [
            {
                "path": _relative_path(path),
                "name": path.name,
                "size_bytes": path.stat().st_size,
            }
            for path in files
        ],
    }