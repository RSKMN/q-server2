"""Pydantic schemas for embedding API endpoints."""

from typing import List
from pydantic import BaseModel, Field, field_validator


class EmbeddingInsertRequest(BaseModel):
    """Request model for inserting embeddings into vector store."""
    
    ids: List[str] = Field(
        ...,
        description="List of unique identifiers for molecules",
        min_length=1
    )
    vectors: List[List[float]] = Field(
        ...,
        description="List of embedding vectors (each vector is a list of floats)",
        min_length=1
    )
    
    @field_validator('ids')
    @classmethod
    def validate_ids(cls, v):
        """Ensure all IDs are non-empty strings."""
        if not all(id_str.strip() for id_str in v):
            raise ValueError("All IDs must be non-empty strings")
        if len(v) != len(set(v)):
            raise ValueError("All IDs must be unique")
        return v
    
    @field_validator('vectors')
    @classmethod
    def validate_vectors(cls, v):
        """Ensure all vectors have the same dimension."""
        if not v:
            raise ValueError("Vectors list cannot be empty")
        
        first_dim = len(v[0])
        if first_dim == 0:
            raise ValueError("Vectors cannot be empty")
        
        for i, vec in enumerate(v):
            if len(vec) != first_dim:
                raise ValueError(
                    f"All vectors must have the same dimension. "
                    f"Vector at index {i} has dimension {len(vec)}, expected {first_dim}"
                )
        return v


class EmbeddingInsertResponse(BaseModel):
    """Response model for embedding insertion."""
    
    status: str = Field(..., description="Operation status (success or error)")
    inserted: int = Field(..., description="Number of embeddings successfully inserted")
