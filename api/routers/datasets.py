"""FastAPI router for dataset discovery and previews."""

from __future__ import annotations

import logging
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

from fastapi import APIRouter, HTTPException, status

from services.database.dataset_catalog import get_dataset_catalog_entry, list_dataset_catalog
from services.database.postgres_client import get_session


router = APIRouter()
logger = logging.getLogger(__name__)
PROJECT_ROOT = Path(__file__).resolve().parents[2]
DATASETS_DIR = PROJECT_ROOT / "data" / "datasets"


def _list_filesystem_dataset_names() -> list[str]:
    if not DATASETS_DIR.exists() or not DATASETS_DIR.is_dir():
        return []
    return sorted(path.stem for path in DATASETS_DIR.glob("*.csv") if path.is_file())


def _filesystem_dataset_payload(name: str) -> dict[str, Any] | None:
    candidate = DATASETS_DIR / f"{name}.csv"
    if not candidate.exists() or not candidate.is_file():
        return None

    created = datetime.fromtimestamp(candidate.stat().st_mtime, tz=timezone.utc).isoformat()
    return {
        "dataset_id": f"file-{name}",
        "name": name,
        "source": "filesystem-fallback",
        "version": "local",
        "created_at": created,
        "file": candidate.as_posix(),
        "count": 0,
        "preview": [],
    }


@router.get("/datasets")
def list_datasets() -> dict[str, Any]:
    logger.info("GET /datasets")
    session = get_session()
    try:
        datasets = list_dataset_catalog(session)
        names = [dataset["name"] for dataset in datasets]
        return {
            "count": len(names),
            "datasets": names,
            "source": "database",
        }
    except Exception as exc:
        logger.exception("GET /datasets failed against database, using filesystem fallback: %s", exc)
        names = _list_filesystem_dataset_names()
        return {
            "count": len(names),
            "datasets": names,
            "source": "filesystem-fallback",
        }
    finally:
        session.close()


@router.get("/datasets/{name}")
def get_dataset(name: str) -> dict[str, Any]:
    logger.info("GET /datasets/%s", name)
    normalized = name.strip()
    if not normalized:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Dataset name is required.",
        )

    session = get_session()
    try:
        dataset = get_dataset_catalog_entry(session, normalized)
        if dataset is None:
            fallback_dataset = _filesystem_dataset_payload(normalized)
            if fallback_dataset is not None:
                return fallback_dataset

            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{name}' not found.",
            )

        return dataset
    except HTTPException:
        raise
    except Exception as exc:
        logger.exception("GET /datasets/%s failed against database, checking filesystem fallback: %s", name, exc)
        fallback_dataset = _filesystem_dataset_payload(normalized)
        if fallback_dataset is not None:
            return fallback_dataset
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch dataset metadata.",
        ) from exc
    finally:
        session.close()