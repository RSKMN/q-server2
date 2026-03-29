"""Bootstrap Milvus collection for similarity search.

Usage:
  python scripts/bootstrap_milvus.py
  python scripts/bootstrap_milvus.py --seed-count 50
"""

from __future__ import annotations

import argparse
from typing import Sequence

import numpy as np

from services.vector_store.milvus_client import MilvusVectorStore


def _build_seed_vectors(count: int, dim: int) -> Sequence[Sequence[float]]:
    rng = np.random.default_rng(seed=42)
    return rng.random((count, dim), dtype=np.float32).tolist()


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap Milvus collection")
    parser.add_argument("--host", default="localhost", help="Milvus host")
    parser.add_argument("--port", default="19530", help="Milvus port")
    parser.add_argument(
        "--collection",
        default="molecule_embeddings",
        help="Collection name",
    )
    parser.add_argument("--dimension", type=int, default=768, help="Embedding dimension")
    parser.add_argument(
        "--seed-count",
        type=int,
        default=0,
        help="Optional number of synthetic vectors to insert",
    )

    args = parser.parse_args()

    store = MilvusVectorStore(host=args.host, port=args.port)
    store.connect()
    store.create_collection(args.collection, args.dimension)
    print(f"Collection ready: {args.collection}")

    if args.seed_count > 0:
        ids = [f"seed_{i:06d}" for i in range(args.seed_count)]
        vectors = _build_seed_vectors(args.seed_count, args.dimension)
        store.insert_embeddings_batch(args.collection, ids, vectors, batch_size=1000)
        print(f"Inserted {args.seed_count} synthetic vectors")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
