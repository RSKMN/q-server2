"""Pydantic schemas for molecule API endpoints."""

from typing import List
from pydantic import BaseModel, Field


class MoleculeSimilarityResult(BaseModel):
    """Single molecule similarity search result."""
    
    molecule_id: str = Field(..., description="Unique molecule identifier")
    score: float = Field(..., description="Similarity score (0-1, higher is more similar)")


class MoleculeSimilarityResponse(BaseModel):
    """Response model for molecule similarity search."""
    
    query_smiles: str = Field(..., description="Input SMILES string queried")
    results: List[MoleculeSimilarityResult] = Field(
        default_factory=list,
        description="List of similar molecules ordered by similarity score"
    )


class MoleculeSimilarityRequest(BaseModel):
    """Request model for molecule similarity search."""

    smiles: str = Field(..., description="SMILES string of the query molecule")
    top_k: int = Field(default=5, ge=1, le=100, description="Number of similar molecules to return")
