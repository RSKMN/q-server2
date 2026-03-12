"""FastAPI router for embedding-related endpoints."""

import logging
import os
from fastapi import APIRouter, Depends, HTTPException, status

from api.schemas.embedding import EmbeddingInsertRequest, EmbeddingInsertResponse
from services.vector_store.milvus_client import MilvusVectorStore

logger = logging.getLogger(__name__)

router = APIRouter()

# Configuration
MILVUS_HOST = os.getenv("P3_MILVUS_HOST", "127.0.0.1")
MILVUS_PORT = os.getenv("P3_MILVUS_PORT", "19530")
COLLECTION_NAME = "molecule_embeddings"
EXPECTED_EMBEDDING_DIM = 768
BATCH_SIZE = 1000


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
