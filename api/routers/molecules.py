"""FastAPI router for molecule-related endpoints."""

import logging
import os
from typing import List
import numpy as np
from fastapi import APIRouter, Body, Depends, HTTPException, Query, status

from api.schemas.molecule import (
    MoleculeSimilarityRequest,
    MoleculeSimilarityResponse,
    MoleculeSimilarityResult,
)
from services.vector_store.milvus_client import MilvusVectorStore

logger = logging.getLogger(__name__)

router = APIRouter()

# Configuration
MILVUS_HOST = os.getenv("P3_MILVUS_HOST", "127.0.0.1")
MILVUS_PORT = os.getenv("P3_MILVUS_PORT", "19530")
COLLECTION_NAME = "molecule_embeddings"
EMBEDDING_DIM = 768


# Placeholder SMILES encoder
def encode_smiles_to_embedding(smiles: str) -> List[float]:
    """
    Placeholder encoder that converts SMILES string to embedding vector.
    
    In production, this should use a proper model like MolBERT, ChemBERTa,
    or other molecular embedding models.
    
    Args:
        smiles: SMILES string representation of molecule
        
    Returns:
        List of floats representing the embedding vector
    """
    # For now, generate a deterministic pseudo-embedding based on SMILES hash
    # This allows testing without a real model
    np.random.seed(hash(smiles) % (2**32))
    embedding = np.random.randn(EMBEDDING_DIM).astype(float).tolist()
    logger.info(f"Generated placeholder embedding for SMILES: {smiles[:50]}...")
    return embedding


# Dependency injection for Milvus client
def get_milvus_client() -> MilvusVectorStore:
    """
    Dependency that provides a configured MilvusVectorStore instance.
    
    Returns:
        MilvusVectorStore: Connected Milvus client
    """
    client = MilvusVectorStore(host=MILVUS_HOST, port=MILVUS_PORT)
    try:
        logger.info("Connecting to Milvus at %s:%s", MILVUS_HOST, MILVUS_PORT)
        client.connect()
        return client
    except Exception as e:
        logger.error(f"Failed to connect to Milvus: {e}")
        raise HTTPException(
            status_code=503,
            detail="Vector store service unavailable"
        )


@router.post("/molecules/similar", response_model=MoleculeSimilarityResponse)
async def find_similar_molecules(
    request: MoleculeSimilarityRequest | None = Body(
        default=None,
        description="Similarity query payload",
    ),
    smiles: str | None = Query(default=None, description="SMILES string of the query molecule"),
    top_k: int | None = Query(default=None, ge=1, le=100, description="Number of similar molecules to return"),
    milvus_client: MilvusVectorStore = Depends(get_milvus_client)
):
    """
    Find molecules similar to the query molecule based on structural embeddings.
    
    This endpoint:
    1. Converts the input SMILES string into an embedding vector
    2. Searches the vector store for the most similar molecule embeddings
    3. Returns the top-k most similar molecules with their similarity scores
    
    Args:
        smiles: SMILES string representation of the query molecule
        top_k: Number of similar molecules to return (default: 5)
        milvus_client: Injected Milvus vector store client
        
    Returns:
        MoleculeSimilarityResponse containing query SMILES and list of similar molecules
        
    Raises:
        HTTPException: If SMILES is invalid or vector store query fails
    """
    try:
        # Support both JSON body and query params, with query taking precedence.
        resolved_smiles = smiles if smiles is not None else (request.smiles if request else None)
        resolved_top_k = top_k if top_k is not None else (request.top_k if request else 5)

        if not resolved_smiles:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="'smiles' is required in query params or JSON body",
            )

        # Step 1: Convert SMILES to embedding vector
        logger.info(f"Processing similarity search for SMILES: {resolved_smiles[:50]}...")
        query_embedding = encode_smiles_to_embedding(resolved_smiles)
        
        # Step 2: Query Milvus vector store
        search_results = milvus_client.search(
            collection_name=COLLECTION_NAME,
            query_vector=query_embedding,
            top_k=resolved_top_k
        )
        
        # Step 3: Format response
        results = [
            MoleculeSimilarityResult(
                molecule_id=result["molecule_id"],
                score=result["score"]
            )
            for result in search_results
        ]
        
        logger.info(f"Found {len(results)} similar molecules")
        
        return MoleculeSimilarityResponse(
            query_smiles=resolved_smiles,
            results=results
        )
        
    except ValueError as e:
        logger.error(f"Invalid input: {e}")
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error during similarity search: {e}")
        raise HTTPException(
            status_code=500,
            detail="Failed to process similarity search"
        )
