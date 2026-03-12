"""Milvus vector store client utilities.

This module provides a lightweight wrapper around pymilvus for storing
molecule embeddings and running similarity search.
"""

from __future__ import annotations

import logging
from typing import Any, Dict, List, Sequence

from pymilvus import (
    Collection,
    CollectionSchema,
    DataType,
    FieldSchema,
    connections,
    utility
)

logger = logging.getLogger(__name__)


class MilvusVectorStore:
    """Simple vector-store wrapper for Milvus operations."""

    def __init__(
        self,
        host: str = "127.0.0.1",
        port: str = "19530",
        alias: str = "default",
    ) -> None:
        self.host = host
        self.port = port
        self.alias = alias
        self._connected = False
        timeout=30

    def connect(self) -> None:
        """Connect to a Milvus server."""
        if self._connected:
            logger.debug(
                "Milvus already connected (alias=%s, host=%s, port=%s)",
                self.alias,
                self.host,
                self.port,
            )
            return

        logger.info(
            "Connecting to Milvus server at %s:%s (alias=%s)",
            self.host,
            self.port,
            self.alias,
        )
        try:
            connections.connect(alias=self.alias, host=self.host, port=self.port)
            self._connected = True
            logger.info("Connected to Milvus successfully")
        except Exception:
            logger.exception("Failed to connect to Milvus")
            raise

    from pymilvus import (
    connections,
    FieldSchema,
    CollectionSchema,
    DataType,
    Collection,
)

    def create_collection(self, collection_name: str, dimension: int = 768):

        if utility.has_collection(collection_name):
            print(f"Collection {collection_name} already exists")
            return Collection(collection_name)

        fields = [
            FieldSchema(
                name="molecule_id",
                dtype=DataType.VARCHAR,
                is_primary=True,
                max_length=64
            ),
            FieldSchema(
                name="embedding",
                dtype=DataType.FLOAT_VECTOR,
                dim=dimension
            )
        ]

        schema = CollectionSchema(
            fields,
            description="Molecule embedding vectors"
        )

        collection = Collection(
            name=collection_name,
            schema=schema
        )

        print("Collection created")

        index_params = {
            "metric_type": "COSINE",
            "index_type": "IVF_FLAT",
            "params": {"nlist": 1024}
        }

        collection.create_index(
            field_name="embedding",
            index_params=index_params
        )

        print("Index created")

        collection.load()

        print("Collection loaded")

        return collection


    def insert_embeddings(
        self,
        collection_name: str,
        ids: Sequence[str],
        vectors: Sequence[Sequence[float]],
    ) -> None:
        """Insert molecule IDs and embedding vectors into a collection."""
        self.connect()

        if len(ids) != len(vectors):
            raise ValueError("'ids' and 'vectors' must have the same length")
        if not ids:
            logger.warning("No embeddings provided for insert into '%s'", collection_name)
            return

        if not utility.has_collection(collection_name, using=self.alias):
            raise ValueError(f"Collection '{collection_name}' does not exist")

        collection = Collection(name=collection_name, using=self.alias)
        logger.info(
            "Inserting %d embeddings into collection '%s'",
            len(ids),
            collection_name,
        )

        collection.insert([list(ids), list(vectors)])
        collection.flush()
        logger.info("Insert completed for collection '%s'", collection_name)

    def insert_embeddings_batch(
        self,
        collection_name: str,
        ids: Sequence[str],
        vectors: Sequence[Sequence[float]],
        batch_size: int = 1000,
    ) -> None:
        """Insert embeddings in configurable batches and flush after completion."""
        self.connect()

        if len(ids) != len(vectors):
            raise ValueError("'ids' and 'vectors' must have the same length")
        if batch_size <= 0:
            raise ValueError("'batch_size' must be a positive integer")
        if not ids:
            logger.warning("No embeddings provided for batch insert into '%s'", collection_name)
            return

        if not utility.has_collection(collection_name, using=self.alias):
            raise ValueError(f"Collection '{collection_name}' does not exist")

        collection = Collection(name=collection_name, using=self.alias)
        total = len(ids)
        inserted = 0

        logger.info(
            "Starting batch insert of %d embeddings into collection '%s' (batch_size=%d)",
            total,
            collection_name,
            batch_size,
        )

        for start in range(0, total, batch_size):
            end = min(start + batch_size, total)
            batch_ids = list(ids[start:end])
            batch_vectors = list(vectors[start:end])

            collection.insert([batch_ids, batch_vectors])
            inserted += len(batch_ids)
            logger.info(
                "Batch insert progress for '%s': %d/%d",
                collection_name,
                inserted,
                total,
            )

        collection.flush()
        logger.info("Batch insert completed for collection '%s'", collection_name)

    def search(
        self,
        collection_name: str,
        query_vector: Sequence[float],
        top_k: int = 5,
    ) -> List[Dict[str, Any]]:
        """Search for top-k most similar embeddings using cosine similarity."""
        self.connect()

        if not utility.has_collection(collection_name, using=self.alias):
            raise ValueError(f"Collection '{collection_name}' does not exist")

        collection = Collection(name=collection_name, using=self.alias)
        collection.load()

        logger.info(
            "Searching collection '%s' for top_k=%d similar embeddings",
            collection_name,
            top_k,
        )
        search_results = collection.search(
            data=[list(query_vector)],
            anns_field="embedding",
            param={"metric_type": "COSINE", "params": {}},
            limit=top_k,
            output_fields=["molecule_id"],
        )

        hits = search_results[0] if search_results else []
        output = [
            {
                "molecule_id": hit.entity.get("molecule_id"),
                "score": float(hit.score),
            }
            for hit in hits
        ]
        logger.info("Search completed with %d results", len(output))
        return output
