"""FastAPI router for embedding-related endpoints."""

import hashlib
import logging
import math
import os
from typing import Any

import pandas as pd
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select

from api.schemas.embedding import EmbeddingInsertRequest, EmbeddingInsertResponse
from services.database.dataset_catalog import resolve_datasets_dir
from services.database.models import Dataset, Molecule
from services.database.postgres_client import get_session
from services.vector_store.milvus_client import MilvusVectorStore

logger = logging.getLogger(__name__)

router = APIRouter()

# Configuration
MILVUS_HOST = os.getenv("P3_MILVUS_HOST", "127.0.0.1")
MILVUS_PORT = os.getenv("P3_MILVUS_PORT", "19530")
COLLECTION_NAME = "molecule_embeddings"
EXPECTED_EMBEDDING_DIM = 768
BATCH_SIZE = 1000


def _stable_unit_interval(text: str, salt: str) -> float:
    digest = hashlib.sha256(f"{salt}:{text}".encode("utf-8")).digest()
    raw = int.from_bytes(digest[:8], "big")
    return raw / float(2**64 - 1)


def _clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def _coerce_float(value: Any, default: float) -> float:
    if value is None:
        return default
    if isinstance(value, (int, float)):
        if math.isnan(float(value)):
            return default
        return float(value)
    try:
        parsed = float(str(value))
        if math.isnan(parsed):
            return default
        return parsed
    except (TypeError, ValueError):
        return default


def _estimate_qed(mw: float, logp: float) -> float:
    mw_penalty = abs(mw - 350.0) / 500.0
    logp_penalty = abs(logp - 2.2) / 6.0
    score = 1.0 - (0.65 * mw_penalty + 0.35 * logp_penalty)
    return _clamp(score, 0.05, 0.98)


def _embedding_source(dataset_name: str) -> str:
    normalized = dataset_name.lower()
    if "fda" in normalized:
        return "fda"
    if "generated" in normalized:
        return "generated"
    return "dataset"


def _build_point(
    molecule_id: str,
    dataset_name: str,
    mw: float,
    logp: float,
    qed: float,
) -> dict[str, Any]:
    # Deterministic pseudo-projection so points remain stable across refreshes.
    jitter_x = (_stable_unit_interval(molecule_id, "x") - 0.5) * 2.1
    jitter_y = (_stable_unit_interval(molecule_id, "y") - 0.5) * 2.1
    dataset_shift_x = (_stable_unit_interval(dataset_name, "dx") - 0.5) * 1.6
    dataset_shift_y = (_stable_unit_interval(dataset_name, "dy") - 0.5) * 1.3

    x = ((mw - 350.0) / 120.0) + dataset_shift_x + jitter_x
    y = ((qed - 0.55) * 4.2) - ((logp - 2.5) / 3.2) + dataset_shift_y + jitter_y

    return {
        "x": round(x, 5),
        "y": round(y, 5),
        "molecule_id": molecule_id,
        "dataset": dataset_name,
        "qed": round(qed, 5),
        "mw": round(mw, 5),
        "logp": round(logp, 5),
        "source": _embedding_source(dataset_name),
    }


def _load_points_from_db(dataset: str | None, limit: int) -> list[dict[str, Any]]:
    session = get_session()
    try:
        statement = (
            select(
                Molecule.molecule_id,
                Molecule.molecular_weight,
                Molecule.logp,
                Molecule.smiles,
                Dataset.name,
            )
            .join(Dataset, Molecule.dataset_id == Dataset.dataset_id)
            .order_by(Molecule.created_at.desc(), Molecule.molecule_id.asc())
            .limit(limit)
        )

        if dataset:
            statement = statement.where(Dataset.name == dataset)

        rows = session.execute(statement).all()
        points: list[dict[str, Any]] = []
        for row in rows:
            dataset_name = str(row.name)
            mw = _coerce_float(row.molecular_weight, 350.0)
            logp = _coerce_float(row.logp, 2.2)
            qed = _estimate_qed(mw, logp)
            points.append(
                _build_point(
                    molecule_id=str(row.molecule_id),
                    dataset_name=dataset_name,
                    mw=mw,
                    logp=logp,
                    qed=qed,
                )
            )
        return points
    finally:
        session.close()


def _load_points_from_csv(dataset: str | None, limit: int) -> list[dict[str, Any]]:
    datasets_dir = resolve_datasets_dir()
    if not datasets_dir.exists() or not datasets_dir.is_dir():
        return []

    csv_files = sorted(path for path in datasets_dir.glob("*.csv") if path.is_file())
    points: list[dict[str, Any]] = []

    for csv_file in csv_files:
        if len(points) >= limit:
            break

        dataset_name = csv_file.stem
        if dataset and dataset_name != dataset:
            continue

        try:
            frame = pd.read_csv(csv_file)
        except Exception:
            continue

        for idx, (_, row) in enumerate(frame.iterrows()):
            if len(points) >= limit:
                break

            smiles = str(row.get("smiles", "")).strip()
            if not smiles:
                continue

            molecule_id = str(row.get("molecule_id", "")).strip() or f"{dataset_name}_{idx + 1:06d}"
            mw = _coerce_float(row.get("mw", row.get("molecular_weight")), 350.0)
            logp = _coerce_float(row.get("logp"), 2.2)
            qed = _coerce_float(row.get("qed"), _estimate_qed(mw, logp))

            points.append(
                _build_point(
                    molecule_id=molecule_id,
                    dataset_name=dataset_name,
                    mw=mw,
                    logp=logp,
                    qed=qed,
                )
            )

    return points


# Dependency injection for Milvus client
def get_milvus_client() -> MilvusVectorStore:
    """
    Dependency that provides a configured MilvusVectorStore instance.
    
    Returns:
        MilvusVectorStore: Connected Milvus client
    """
    client = MilvusVectorStore(host=MILVUS_HOST, port=MILVUS_PORT)
    try:
        client.connect()
        return client
    except Exception as e:
        logger.error(f"Failed to connect to Milvus: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Vector store service unavailable"
        )


@router.post("/embeddings", response_model=EmbeddingInsertResponse, status_code=status.HTTP_201_CREATED)
async def insert_embeddings(
    request: EmbeddingInsertRequest,
    milvus_client: MilvusVectorStore = Depends(get_milvus_client)
):
    """
    Insert molecule embeddings into the vector store.
    
    This endpoint:
    1. Validates that IDs and vectors have matching lengths
    2. Validates that all vectors have the expected dimensionality
    3. Inserts embeddings in batches using MilvusVectorStore.insert_embeddings_batch()
    4. Returns confirmation with the number of inserted vectors
    
    Args:
        request: EmbeddingInsertRequest containing IDs and vectors
        milvus_client: Injected Milvus vector store client
        
    Returns:
        EmbeddingInsertResponse with status and count of inserted embeddings
        
    Raises:
        HTTPException: If validation fails or insertion encounters errors
    """
    try:
        # Step 1: Validate IDs and vectors have the same length
        if len(request.ids) != len(request.vectors):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Number of IDs ({len(request.ids)}) must match number of vectors ({len(request.vectors)})"
            )
        
        # Step 2: Validate vector dimensions
        vector_dim = len(request.vectors[0]) if request.vectors else 0
        
        if vector_dim != EXPECTED_EMBEDDING_DIM:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Expected embedding dimension {EXPECTED_EMBEDDING_DIM}, got {vector_dim}"
            )
        
        logger.info(
            f"Inserting {len(request.ids)} embeddings with dimension {vector_dim} "
            f"into collection '{COLLECTION_NAME}'"
        )
        
        # Step 3: Insert embeddings using batch insertion
        milvus_client.insert_embeddings_batch(
            collection_name=COLLECTION_NAME,
            ids=request.ids,
            vectors=request.vectors,
            batch_size=BATCH_SIZE
        )
        
        # Step 4: Return success response
        inserted_count = len(request.ids)
        logger.info(f"Successfully inserted {inserted_count} embeddings")
        
        return EmbeddingInsertResponse(
            status="success",
            inserted=inserted_count
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions as-is
        raise
    except ValueError as e:
        logger.error(f"Validation error: {e}")
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error during embedding insertion: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to insert embeddings into vector store"
        )


@router.get("/embedding/umap")
def get_embedding_umap(
    dataset: str | None = Query(default=None, description="Optional dataset name filter"),
    limit: int = Query(default=5000, ge=1, le=20000, description="Maximum number of points"),
) -> list[dict[str, Any]]:
    """Return chemical-space points for the frontend UMAP view.

    This endpoint returns a frontend-compatible point schema:
    x, y, molecule_id, dataset, qed, mw, logp, source.
    """

    selected_dataset = dataset.strip() if isinstance(dataset, str) and dataset.strip() else None

    try:
        points = _load_points_from_db(selected_dataset, limit)
        if points:
            return points
    except Exception as exc:
        logger.warning("Failed loading embedding map from database: %s", exc)

    # Fallback to CSV-backed points to keep Chemical Space usable in local/dev demos.
    return _load_points_from_csv(selected_dataset, limit)
