"""FastAPI router for dataset discovery and previews."""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException, status

from services.database.dataset_catalog import get_dataset_catalog_entry, list_dataset_catalog
from services.database.postgres_client import get_session


router = APIRouter()


@router.get("/datasets")
def list_datasets() -> dict[str, Any]:
    session = get_session()
    try:
        datasets = list_dataset_catalog(session)
        return {
            "count": len(datasets),
            "datasets": [dataset["name"] for dataset in datasets],
        }
    finally:
        session.close()


@router.get("/datasets/{name}")
def get_dataset(name: str) -> dict[str, Any]:
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
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Dataset '{name}' not found.",
            )

        return dataset
    finally:
        session.close()