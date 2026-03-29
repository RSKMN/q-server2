"""Bootstrap Milvus collection for similarity search.

Usage:
  python scripts/bootstrap_milvus.py
  python scripts/bootstrap_milvus.py --seed-count 50
    python scripts/bootstrap_milvus.py --uri https://<zilliz-endpoint> --token <token> --seed-count 100
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path
from typing import Sequence

import numpy as np

try:
        from services.vector_store.milvus_client import MilvusVectorStore
except ModuleNotFoundError:
        sys.path.append(str(Path(__file__).resolve().parents[1]))
        from services.vector_store.milvus_client import MilvusVectorStore


def _build_seed_vectors(count: int, dim: int) -> Sequence[Sequence[float]]:
    rng = np.random.default_rng(seed=42)
    return rng.random((count, dim), dtype=np.float32).tolist()


def main() -> int:
    parser = argparse.ArgumentParser(description="Bootstrap Milvus collection")
    parser.add_argument("--uri", default=None, help="Milvus/Zilliz endpoint URI")
    parser.add_argument(
        "--token",
        default=None,
        help="Milvus/Zilliz auth token (if omitted, uses P3_MILVUS_TOKEN)",
    )
    parser.add_argument(
        "--host",
        default=None,
        help="Legacy alias for --uri",
    )
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

    resolved_uri = args.uri or args.host or os.getenv("P3_MILVUS_HOST")
    resolved_token = args.token or os.getenv("P3_MILVUS_TOKEN")

    if not resolved_uri:
        raise SystemExit(
            "Missing Milvus URI. Provide --uri (or --host) or set P3_MILVUS_HOST."
        )
    if not resolved_token:
        raise SystemExit(
            "Missing Milvus token. Provide --token or set P3_MILVUS_TOKEN."
        )

    os.environ["P3_MILVUS_HOST"] = resolved_uri
    os.environ["P3_MILVUS_TOKEN"] = resolved_token

    store = MilvusVectorStore()
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
