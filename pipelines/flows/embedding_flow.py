"""Prefect flow for embedding generation and Milvus ingestion.

Run from repository root:
	python -m pipelines.flows.embedding_flow
"""

from __future__ import annotations

import argparse
import logging
import os
from datetime import UTC, datetime
from pathlib import Path
from typing import Sequence

from prefect import flow, get_run_logger, task

from pipelines.embeddings.embedding_pipeline import (
	DEFAULT_COLLECTION_NAME,
	DEFAULT_DIMENSION,
	encode_smiles_batch,
	insert_embeddings_milvus,
	load_dataset,
	store_embeddings_file,
)
from services.vector_store.milvus_client import MilvusVectorStore


logger = logging.getLogger("embedding_flow")


@task(name="load_molecules")
def load_molecules_task(processed_dir: str, batch_size: int) -> list[tuple[list[str], list[str]]]:
	"""Load molecule IDs and SMILES in batches from processed datasets."""
	run_logger = get_run_logger()
	run_logger.info("Loading molecule batches from: %s", processed_dir)
	batches = list(load_dataset(Path(processed_dir), batch_size=batch_size))
	run_logger.info("Loaded %d molecule batches", len(batches))
	return batches


@task(name="generate_embeddings")
def generate_embeddings_task(smiles_batch: Sequence[str], dimension: int) -> list[list[float]]:
	"""Generate embedding vectors for one SMILES batch."""
	run_logger = get_run_logger()
	run_logger.info("Generating embeddings for batch of size %d", len(smiles_batch))
	return encode_smiles_batch(smiles_batch=smiles_batch, dimension=dimension)


@task(name="store_embeddings_file")
def store_embeddings_file_task(
	output_path: str,
	molecule_ids: Sequence[str],
	vectors: Sequence[Sequence[float]],
	model_version: str,
	batch_index: int,
) -> str:
	"""Store one batch as a parquet part file."""
	run_logger = get_run_logger()
	base_path = Path(output_path)
	part_path = base_path.with_name(f"{base_path.stem}_part_{batch_index:06d}{base_path.suffix}")

	writer = store_embeddings_file(
		output_path=part_path,
		molecule_ids=molecule_ids,
		vectors=vectors,
		model_version=model_version,
		writer=None,
	)
	writer.close()
	run_logger.info("Stored embeddings batch %d to: %s", batch_index, part_path)
	return str(part_path)


@task(name="insert_embeddings_milvus", retries=3, retry_delay_seconds=5)
def insert_embeddings_milvus_task(
	collection_name: str,
	molecule_ids: Sequence[str],
	vectors: Sequence[Sequence[float]],
) -> int:
	"""Insert one embedding batch into Milvus with retries."""
	run_logger = get_run_logger()
	run_logger.info("Inserting batch of %d embeddings into Milvus", len(molecule_ids))

	vector_store = MilvusVectorStore(host="localhost", port="19530")
	vector_store.connect()
	vector_store.create_collection(collection_name, DEFAULT_DIMENSION)
	insert_embeddings_milvus(
		vector_store=vector_store,
		collection_name=collection_name,
		molecule_ids=molecule_ids,
		vectors=vectors,
	)
	return len(molecule_ids)


@flow(name="embedding_generation_flow")
def embedding_generation_flow(
	processed_dir: str = "data/processed",
	output_dir: str = "data/processed/embeddings",
	collection_name: str = DEFAULT_COLLECTION_NAME,
	model_version: str = "placeholder_encoder_v1",
	dimension: int = DEFAULT_DIMENSION,
) -> dict[str, object]:
	"""Orchestrate embedding generation, storage, and Milvus insertion."""
	run_logger = get_run_logger()

	batch_size = int(os.getenv("P3_EMBEDDING_BATCH_SIZE", "128"))
	if batch_size <= 0:
		raise ValueError("P3_EMBEDDING_BATCH_SIZE must be a positive integer")

	output_base = Path(output_dir)
	output_base.mkdir(parents=True, exist_ok=True)
	run_id = datetime.now(UTC).strftime("%Y%m%d_%H%M%S")
	output_path = output_base / f"molecule_embeddings_{run_id}.parquet"

	run_logger.info("Starting embedding_generation_flow")
	run_logger.info("Batch size: %d", batch_size)
	run_logger.info("Processed dir: %s", processed_dir)
	run_logger.info("Milvus collection: %s", collection_name)

	batches = load_molecules_task(processed_dir=processed_dir, batch_size=batch_size)

	total_processed = 0
	parquet_parts: list[str] = []

	for batch_index, (molecule_ids, smiles_batch) in enumerate(batches, start=1):
		vectors = generate_embeddings_task(smiles_batch=smiles_batch, dimension=dimension)
		part_file = store_embeddings_file_task(
			output_path=str(output_path),
			molecule_ids=molecule_ids,
			vectors=vectors,
			model_version=model_version,
			batch_index=batch_index,
		)
		inserted_count = insert_embeddings_milvus_task(
			collection_name=collection_name,
			molecule_ids=molecule_ids,
			vectors=vectors,
		)

		parquet_parts.append(part_file)
		total_processed += inserted_count
		run_logger.info("Processed molecules so far: %d", total_processed)

	run_logger.info("embedding_generation_flow completed. Total molecules processed: %d", total_processed)

	return {
		"total_processed": total_processed,
		"batch_count": len(parquet_parts),
		"parquet_parts": parquet_parts,
		"collection_name": collection_name,
	}


def _configure_logging() -> None:
	logging.basicConfig(
		level=logging.INFO,
		format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
	)


def main() -> int:
	parser = argparse.ArgumentParser(description="Run embedding_generation_flow")
	parser.add_argument("--processed-dir", default="data/processed")
	parser.add_argument("--output-dir", default="data/processed/embeddings")
	parser.add_argument("--collection-name", default=DEFAULT_COLLECTION_NAME)
	parser.add_argument("--model-version", default="placeholder_encoder_v1")
	args = parser.parse_args()

	_configure_logging()
	result = embedding_generation_flow(
		processed_dir=args.processed_dir,
		output_dir=args.output_dir,
		collection_name=args.collection_name,
		model_version=args.model_version,
	)
	logger.info("Flow result: %s", result)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
