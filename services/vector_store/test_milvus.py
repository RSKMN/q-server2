"""
Milvus integration smoke test for molecule embeddings.

Run from repository root:

    python -m services.vector_store.test_milvus
"""

from __future__ import annotations

import logging
from typing import List

import numpy as np

try:
    # Preferred import when running as module
    from services.vector_store.milvus_client import MilvusVectorStore
except ModuleNotFoundError:
    # Fallback when running directly
    from milvus_client import MilvusVectorStore


def generate_random_embeddings(n: int, dim: int) -> List[List[float]]:
    """Generate random float vectors."""
    return np.random.rand(n, dim).astype(np.float32).tolist()


def main() -> None:

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )

    logger = logging.getLogger("milvus_test")

    collection_name = "molecule_embeddings"
    dimension = 768
    num_vectors = 5

    logger.info("Starting Milvus smoke test")

    # 1️⃣ Connect to Milvus
    store = MilvusVectorStore(host="127.0.0.1", port="19530")
    store.connect()

    # 2️⃣ Create collection with schema + index
    collection = store.create_collection(
        collection_name=collection_name,
        dimension=dimension,
    )

    logger.info("Collection ready: %s", collection_name)

    # 3️⃣ Insert test embeddings
    ids = [f"MOL-TEST-{i+1:03d}" for i in range(num_vectors)]
    vectors = generate_random_embeddings(num_vectors, dimension)

    store.insert_embeddings(
        collection_name=collection_name,
        ids=ids,
        vectors=vectors,
    )

    logger.info("Inserted %d embeddings", num_vectors)

    # 4️⃣ Run similarity search
    query_vector = generate_random_embeddings(1, dimension)[0]

    results = store.search(
        collection_name=collection_name,
        query_vector=query_vector,
        top_k=3,
    )

    # 5️⃣ Print results
    print("\nTop 3 Similar Molecules:")
    print("-" * 40)

    for rank, item in enumerate(results, start=1):
        print(
            f"{rank}. molecule_id={item['molecule_id']} "
            f"score={item['score']:.6f}"
        )

    print("\nMilvus smoke test completed successfully")


if __name__ == "__main__":
    main()