"""Prefect flow for molecule feature extraction.

Run from repository root:
	python -m pipelines.flows.feature_flow
"""

from __future__ import annotations

import argparse
import logging
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Sequence

from prefect import flow, get_run_logger, task

from pipelines.features.feature_pipeline import (
	DEFAULT_BATCH_SIZE,
	DEFAULT_FINGERPRINT_SIZE,
	estimate_total_molecules,
	extract_features_batch,
	load_dataset,
	store_features_file,
)
from pipelines.features.metadata import save_feature_metadata


logger = logging.getLogger("feature_flow")


@task(name="load_molecules")
def load_molecules_task(
	molecule_ids: Sequence[str],
	smiles_batch: Sequence[str],
	batch_number: int,
) -> tuple[list[str], list[str]]:
	"""Task wrapper for loaded molecule batches."""
	run_logger = get_run_logger()
	run_logger.info("Loaded batch %d with %d molecules", batch_number, len(molecule_ids))
	return list(molecule_ids), list(smiles_batch)


@task(name="generate_molecular_features")
def generate_molecular_features_task(
	smiles_batch: Sequence[str],
	fingerprint_size: int,
	batch_number: int,
) -> tuple[object, object, object, list[list[float]]]:
	"""Generate placeholder molecular features for one batch."""
	run_logger = get_run_logger()
	run_logger.info("Generating molecular features for batch %d", batch_number)
	return extract_features_batch(smiles_batch=smiles_batch, fingerprint_size=fingerprint_size)


@task(name="save_feature_parquet_file")
def save_feature_parquet_file_task(
	output_path: str,
	molecule_ids: Sequence[str],
	molecular_weight: object,
	num_atoms: object,
	num_bonds: object,
	fingerprint_vectors: Sequence[Sequence[float]],
	batch_number: int,
) -> str:
	"""Save a single feature batch as a parquet part file."""
	run_logger = get_run_logger()
	base_path = Path(output_path)
	part_path = base_path.with_name(f"{base_path.stem}_part_{batch_number:06d}{base_path.suffix}")

	writer = store_features_file(
		output_path=part_path,
		molecule_ids=molecule_ids,
		molecular_weight=molecular_weight,
		num_atoms=num_atoms,
		num_bonds=num_bonds,
		fingerprint_vectors=fingerprint_vectors,
		writer=None,
	)
	writer.close()

	run_logger.info("Saved parquet batch file: %s", part_path)
	return str(part_path)


@task(name="store_metadata")
def store_metadata_task(
	dataset_version: str,
	num_molecules: int,
	feature_dimension: int,
	fingerprint_size: int,
) -> str:
	"""Store feature extraction run metadata."""
	run_logger = get_run_logger()
	metadata_path = save_feature_metadata(
		dataset_version=dataset_version,
		num_molecules=num_molecules,
		feature_dimension=feature_dimension,
		fingerprint_size=fingerprint_size,
	)
	run_logger.info("Stored feature metadata: %s", metadata_path)
	return str(metadata_path)


@flow(name="feature_generation_flow")
def feature_generation_flow(
	processed_dir: str = "data/processed",
	output_dir: str = "data/processed/features",
) -> dict[str, object]:
	"""Orchestrate molecule feature extraction workflow."""
	run_logger = get_run_logger()

	batch_size = int(os.getenv("P3_FEATURE_BATCH_SIZE", str(DEFAULT_BATCH_SIZE)))
	fingerprint_size = int(os.getenv("P3_FINGERPRINT_SIZE", str(DEFAULT_FINGERPRINT_SIZE)))

	if batch_size <= 0:
		raise ValueError("P3_FEATURE_BATCH_SIZE must be a positive integer")
	if fingerprint_size <= 0:
		raise ValueError("P3_FINGERPRINT_SIZE must be a positive integer")

	output_base = Path(output_dir)
	output_base.mkdir(parents=True, exist_ok=True)

	run_id = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
	output_path = output_base / f"molecule_features_{run_id}.parquet"
	dataset_version = f"features_{run_id}"

	estimated_total = estimate_total_molecules(Path(processed_dir))
	run_logger.info("Starting feature_generation_flow")
	run_logger.info("Estimated total molecules: %d", estimated_total)

	total_processed = 0
	batch_count = 0
	part_files: list[str] = []

	for batch_number, (molecule_ids, smiles_batch) in enumerate(
		load_dataset(Path(processed_dir), batch_size=batch_size), start=1
	):
		loaded_ids, loaded_smiles = load_molecules_task(
			molecule_ids=molecule_ids,
			smiles_batch=smiles_batch,
			batch_number=batch_number,
		)

		molecular_weight, num_atoms, num_bonds, fingerprint_vectors = generate_molecular_features_task(
			smiles_batch=loaded_smiles,
			fingerprint_size=fingerprint_size,
			batch_number=batch_number,
		)

		part_file = save_feature_parquet_file_task(
			output_path=str(output_path),
			molecule_ids=loaded_ids,
			molecular_weight=molecular_weight,
			num_atoms=num_atoms,
			num_bonds=num_bonds,
			fingerprint_vectors=fingerprint_vectors,
			batch_number=batch_number,
		)

		part_files.append(part_file)
		total_processed += len(loaded_ids)
		batch_count += 1
		run_logger.info("Processed molecules so far: %d", total_processed)

	feature_dimension = 3 + fingerprint_size
	metadata_path = store_metadata_task(
		dataset_version=dataset_version,
		num_molecules=total_processed,
		feature_dimension=feature_dimension,
		fingerprint_size=fingerprint_size,
	)

	run_logger.info("feature_generation_flow completed successfully")
	return {
		"dataset_version": dataset_version,
		"total_processed": total_processed,
		"batch_count": batch_count,
		"parquet_part_files": part_files,
		"metadata_path": metadata_path,
	}


def _configure_logging() -> None:
	logging.basicConfig(
		level=logging.INFO,
		format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
	)


def main() -> int:
	parser = argparse.ArgumentParser(description="Run feature_generation_flow")
	parser.add_argument("--processed-dir", default="data/processed")
	parser.add_argument("--output-dir", default="data/processed/features")
	args = parser.parse_args()

	_configure_logging()
	result = feature_generation_flow(processed_dir=args.processed_dir, output_dir=args.output_dir)
	logger.info("Flow result: %s", result)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
