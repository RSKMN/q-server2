"""FastAPI router for dataset discovery and previews."""

from __future__ import annotations

from pathlib import Path
from typing import Any

import pandas as pd
from pandas.errors import EmptyDataError
from fastapi import APIRouter, HTTPException, status


router = APIRouter()

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATASETS_DIR = PROJECT_ROOT / "data" / "datasets"


def _dataset_path(name: str) -> Path:
    normalized = name.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset name is required.",
        )

    filename = normalized if normalized.lower().endswith(".csv") else f"{normalized}.csv"
    path = (DATASETS_DIR / filename).resolve()

    try:
        path.relative_to(DATASETS_DIR.resolve())
    except ValueError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid dataset name.",
        ) from exc

    return path


def _clean_value(value: Any) -> Any:
    if pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def _clean_records(frame: pd.DataFrame) -> list[dict[str, Any]]:
    records = frame.to_dict(orient="records")
    cleaned: list[dict[str, Any]] = []
    for row in records:
        cleaned.append({key: _clean_value(value) for key, value in row.items()})
    return cleaned


@router.get("/datasets")
def list_datasets() -> dict[str, Any]:
    if not DATASETS_DIR.exists():
        return {"count": 0, "datasets": []}

    datasets = sorted(path.stem for path in DATASETS_DIR.glob("*.csv") if path.is_file())
    return {
        "count": len(datasets),
        "datasets": datasets,
    }


@router.get("/datasets/{name}")
def get_dataset(name: str) -> dict[str, Any]:
    path = _dataset_path(name)

    if not path.exists() or not path.is_file():
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Dataset '{name}' not found.",
        )

    try:
        frame = pd.read_csv(path)
    except EmptyDataError:
        frame = pd.DataFrame()

    preview_frame = frame.head(10)

    return {
        "name": path.stem,
        "file": str(path.relative_to(PROJECT_ROOT).as_posix()),
        "count": int(len(frame)),
        "preview": _clean_records(preview_frame),
    }