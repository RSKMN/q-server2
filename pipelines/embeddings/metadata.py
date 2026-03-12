"""Utilities for storing embedding generation metadata."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path


def save_embedding_metadata(
	dataset_version: str,
	model_name: str,
	embedding_dimension: int,
	num_vectors: int,
	creation_time: datetime | None = None,
) -> Path:
	"""Save embedding generation metadata to a JSON file.

	Args:
		dataset_version: Version label of the source dataset.
		model_name: Name of the embedding model used.
		embedding_dimension: Size of each embedding vector.
		num_vectors: Total number of vectors generated.
		creation_time: Metadata creation timestamp (defaults to current UTC).

	Returns:
		Path to the written metadata JSON file.
	"""
	timestamp = creation_time or datetime.now(UTC)
	output_dir = Path("data/metadata/embeddings")
	output_dir.mkdir(parents=True, exist_ok=True)

	payload = {
		"dataset_version": dataset_version,
		"model_name": model_name,
		"embedding_dimension": embedding_dimension,
		"num_vectors": num_vectors,
		"creation_time": timestamp.isoformat(),
	}

	file_name = f"embedding_metadata_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
	output_path = output_dir / file_name
	output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
	return output_path
