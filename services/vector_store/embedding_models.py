"""Pydantic models for vector-store embedding payloads."""

from datetime import datetime
from typing import List

from pydantic import BaseModel


class EmbeddingRecord(BaseModel):
    """Stored embedding record for a molecule."""

    molecule_id: str
    vector: List[float]
    model_version: str
    created_at: datetime


class SearchResult(BaseModel):
    """Similarity search result item."""

    molecule_id: str
    similarity_score: float
