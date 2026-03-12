"""Utilities for storing feature extraction metadata."""

from __future__ import annotations

import json
from datetime import UTC, datetime
from pathlib import Path


def save_feature_metadata(
	dataset_version: str,
	num_molecules: int,
	feature_dimension: int,
	fingerprint_size: int,
	creation_time: datetime | None = None,
) -> Path:
	"""Save feature extraction run metadata to a JSON file.

	Args:
		dataset_version: Version identifier of the source dataset.
		num_molecules: Number of molecules processed in this run.
		feature_dimension: Total feature dimension for downstream consumers.
		fingerprint_size: Fingerprint vector size used in feature extraction.
		creation_time: Optional timestamp; defaults to current UTC time.

	Returns:
		Path to the saved metadata JSON file.
	"""
	timestamp = creation_time or datetime.now(UTC)
	output_dir = Path("data/metadata/features")
	output_dir.mkdir(parents=True, exist_ok=True)

	payload = {
		"dataset_version": dataset_version,
		"num_molecules": num_molecules,
		"feature_dimension": feature_dimension,
		"fingerprint_size": fingerprint_size,
		"creation_time": timestamp.isoformat(),
	}

	file_name = f"feature_metadata_{timestamp.strftime('%Y%m%d_%H%M%S')}.json"
	output_path = output_dir / file_name
	output_path.write_text(json.dumps(payload, indent=2), encoding="utf-8")
	return output_path
