from __future__ import annotations

import argparse
import hashlib
import importlib
import json
import logging
import os
import sys
import threading
import time
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable, Generator, Iterable, Sequence, TypeVar
from uuid import uuid4

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from pymilvus import Collection

if importlib.util.find_spec("psutil") is not None:
	psutil = importlib.import_module("psutil")
else:  # pragma: no cover - optional dependency
	psutil = None

try:
	from services.vector_store.milvus_client import MilvusVectorStore
	from services.database.models import Embedding
	from services.database.postgres_client import get_session
except ModuleNotFoundError:
	# Allow running with: python pipelines/embeddings/embedding_pipeline.py
	sys.path.append(str(Path(__file__).resolve().parents[2]))
	from services.vector_store.milvus_client import MilvusVectorStore
	from services.database.models import Embedding
	from services.database.postgres_client import get_session


logger = logging.getLogger("embedding_pipeline")

DEFAULT_DIMENSION = 768
DEFAULT_COLLECTION_NAME = "molecule_embeddings"
DEFAULT_BATCH_SIZE = 5000
PROGRESS_LOG_INTERVAL_BATCHES = 10
DEFAULT_MILVUS_HOST = "localhost"
DEFAULT_MILVUS_PORT = "19530"
WATCHDOG_STALL_SECONDS = 60
DEFAULT_DB_TIMEOUT_SECONDS = 15

T = TypeVar("T")


def _normalize_columns(columns: Iterable[str]) -> dict[str, str]:
	return {column.strip().lower(): column for column in columns}


def _resolve_id_smiles_columns(columns: Iterable[str]) -> tuple[str, str]:
	normalized = _normalize_columns(columns)
	id_candidates = ["molecule_id", "id"]
	smiles_candidates = ["smiles"]

	id_column = next((normalized[c] for c in id_candidates if c in normalized), None)
	smiles_column = next((normalized[c] for c in smiles_candidates if c in normalized), None)

	if not id_column or not smiles_column:
		raise ValueError("Input data must contain molecule_id/ID and smiles/SMILES columns")
	return id_column, smiles_column


def _iter_dataset_files(processed_dir: Path) -> list[Path]:
    molecules_dir = processed_dir / "molecules"

    if not molecules_dir.exists():
        raise FileNotFoundError(f"Molecule dataset directory not found: {molecules_dir}")

    data_files = sorted(
        file
        for file in molecules_dir.glob("*")
        if file.is_file() and file.suffix.lower() in {".csv", ".parquet", ".jsonl"}
    )

    if not data_files:
        raise FileNotFoundError(f"No molecule dataset files found in: {molecules_dir}")

    return data_files

def _count_file_rows(file_path: Path) -> int:
	suffix = file_path.suffix.lower()
	if suffix == ".csv":
		with file_path.open("r", encoding="utf-8", errors="ignore") as handle:
			# Subtract header row
			return max(sum(1 for _ in handle) - 1, 0)
	if suffix == ".jsonl":
		with file_path.open("r", encoding="utf-8", errors="ignore") as handle:
			return sum(1 for _ in handle)
	if suffix == ".parquet":
		return pq.ParquetFile(file_path).metadata.num_rows
	return 0


def estimate_total_molecules(processed_dir: Path) -> int:
	"""Estimate total records for progress reporting."""
	total = 0
	for file_path in _iter_dataset_files(processed_dir):
		total += _count_file_rows(file_path)
	return total


def load_dataset(processed_dir: Path, batch_size: int) -> Generator[tuple[list[str], list[str]], None, None]:
	"""Stream molecule IDs and SMILES in memory-bounded batches."""
	for file_path in _iter_dataset_files(processed_dir):
		suffix = file_path.suffix.lower()
		logger.info("Streaming molecules from %s", file_path)

		if suffix == ".csv":
			header = pd.read_csv(file_path, nrows=0)
			id_col, smiles_col = _resolve_id_smiles_columns(header.columns)

			for chunk in pd.read_csv(
				file_path,
				usecols=[id_col, smiles_col],
				chunksize=batch_size,
				dtype={id_col: "string", smiles_col: "string"},
			):
				chunk = chunk.dropna(subset=[id_col, smiles_col])
				if chunk.empty:
					continue
				yield chunk[id_col].astype(str).tolist(), chunk[smiles_col].astype(str).tolist()

		elif suffix == ".jsonl":
			ids: list[str] = []
			smiles_batch: list[str] = []
			with file_path.open("r", encoding="utf-8") as handle:
				for line in handle:
					text = line.strip()
					if not text:
						continue
					record = json.loads(text)
					molecule_id = record.get("molecule_id") or record.get("ID") or record.get("id")
					smiles = record.get("smiles") or record.get("SMILES")
					if molecule_id is None or smiles is None:
						continue

					ids.append(str(molecule_id))
					smiles_batch.append(str(smiles))

					if len(ids) == batch_size:
						yield ids, smiles_batch
						ids, smiles_batch = [], []
			if ids:
				yield ids, smiles_batch

		elif suffix == ".parquet":
			parquet_file = pq.ParquetFile(file_path)
			id_col, smiles_col = _resolve_id_smiles_columns(parquet_file.schema.names)

			for record_batch in parquet_file.iter_batches(batch_size=batch_size, columns=[id_col, smiles_col]):
				id_values = record_batch.column(0).to_pylist()
				smiles_values = record_batch.column(1).to_pylist()

				filtered_ids: list[str] = []
				filtered_smiles: list[str] = []
				for molecule_id, smiles in zip(id_values, smiles_values):
					if molecule_id is None or smiles is None:
						continue
					filtered_ids.append(str(molecule_id))
					filtered_smiles.append(str(smiles))

				if filtered_ids:
					yield filtered_ids, filtered_smiles


def encode_smiles_batch(smiles_batch: Sequence[str], dimension: int = DEFAULT_DIMENSION) -> list[list[float]]:
	"""Placeholder vectorized encoder returning random embeddings for one batch."""
	if not smiles_batch:
		return []

	batch_size = len(smiles_batch)
	vectors = np.random.rand(batch_size, dimension).astype(np.float32)
	return vectors.tolist()


def normalize_and_hash_molecule_ids(molecule_ids: Sequence[str]) -> list[str]:
	"""Normalize molecule IDs and hash to a fixed 64-char hex value for Milvus."""
	return [
		hashlib.sha256(str(molecule_id).strip().lower().encode("utf-8")).hexdigest()
		for molecule_id in molecule_ids
	]


def store_embeddings_file(
	output_path: Path,
	molecule_ids: Sequence[str],
	vectors: Sequence[Sequence[float]],
	model_version: str,
	writer: pq.ParquetWriter | None = None,
) -> pq.ParquetWriter:
	"""Append one embedding batch to a parquet output file."""
	created_at = datetime.now(UTC).isoformat()
	table = pa.table(
		{
			"molecule_id": molecule_ids,
			"vector": vectors,
			"model_version": [model_version] * len(molecule_ids),
			"created_at": [created_at] * len(molecule_ids),
		}
	)

	if writer is None:
		output_path.parent.mkdir(parents=True, exist_ok=True)
		writer = pq.ParquetWriter(output_path, table.schema)
	writer.write_table(table)
	return writer


def insert_embeddings_milvus(
	vector_store: MilvusVectorStore,
	molecule_ids: Sequence[str],
	vectors: Sequence[Sequence[float]],
	collection: Collection,
) -> None:
	"""Insert one batch of embeddings into Milvus (no per-batch flush)."""
	# Keep compatibility checks against the existing client API surface.
	if not hasattr(vector_store, "insert_embeddings_batch"):
		raise AttributeError("MilvusVectorStore.insert_embeddings_batch is required")

	# Batch insert only; flush is deferred until pipeline end for performance.
	collection.insert([molecule_ids, vectors])


def insert_embedding_metadata_batch(
	molecule_ids: Sequence[str],
	model_name: str,
	dimension: int,
	milvus_collection: str,
) -> None:
	"""Insert one batch of embedding metadata rows into PostgreSQL."""
	if not molecule_ids:
		return

	created_at = datetime.now(UTC)
	rows = [
		Embedding(
			embedding_id=uuid4(),
			molecule_id=str(molecule_id),
			model_name=model_name,
			dimension=dimension,
			milvus_collection=milvus_collection,
			created_at=created_at,
		)
		for molecule_id in molecule_ids
	]

	session = get_session()
	try:
		# Use bulk_save_objects for lower ORM overhead on large batches.
		session.bulk_save_objects(rows)
		session.commit()
	except Exception:
		session.rollback()
		raise
	finally:
		session.close()


def _log_progress(
	current_batch: int,
	total_processed: int,
	estimated_total: int,
	started_at: float,
) -> None:
	elapsed = max(time.time() - started_at, 1e-6)
	rate = total_processed / elapsed
	if estimated_total > 0:
		percent = (total_processed / estimated_total) * 100
		remaining = max(estimated_total - total_processed, 0)
		eta_seconds = remaining / rate if rate > 0 else 0.0
		logger.info(
			"Progress | batch=%d | molecules=%d/%d (%.2f%%) | rate=%.1f mol/s | eta=%.1fs",
			current_batch,
			total_processed,
			estimated_total,
			percent,
			rate,
			eta_seconds,
		)
	else:
		logger.info(
			"Progress | batch=%d | molecules=%d | rate=%.1f mol/s",
			current_batch,
			total_processed,
			rate,
		)


def _start_watchdog(stall_seconds: int) -> tuple[threading.Event, threading.Thread, Callable[[], None]]:
	stop_event = threading.Event()
	state = {"last_progress": time.time(), "last_warning": 0.0}

	def heartbeat() -> None:
		state["last_progress"] = time.time()

	def watchdog_loop() -> None:
		while not stop_event.wait(5):
			now = time.time()
			idle_for = now - state["last_progress"]
			if idle_for >= stall_seconds and (now - state["last_warning"]) >= stall_seconds:
				logger.warning("Watchdog: no batch progress for %.1f seconds", idle_for)
				state["last_warning"] = now

	thread = threading.Thread(target=watchdog_loop, name="embedding-pipeline-watchdog", daemon=True)
	thread.start()
	return stop_event, thread, heartbeat


def _run_with_timeout(func: Callable[..., T], timeout_seconds: int, *args, **kwargs) -> tuple[bool, T | None, Exception | None]:
	result: dict[str, object] = {"value": None, "error": None}

	def worker() -> None:
		try:
			result["value"] = func(*args, **kwargs)
		except Exception as exc:  # pragma: no cover - passthrough for runtime ops
			result["error"] = exc

	thread = threading.Thread(target=worker, name=f"timeout-guard-{func.__name__}", daemon=True)
	thread.start()
	thread.join(timeout=timeout_seconds)

	if thread.is_alive():
		return False, None, TimeoutError(f"Timed out after {timeout_seconds}s")

	error = result["error"]
	if isinstance(error, Exception):
		return False, None, error

	return True, result["value"] if isinstance(result["value"], object) else None, None


def _get_memory_usage_mb() -> float | None:
	if psutil is None:
		return None
	return psutil.Process(os.getpid()).memory_info().rss / (1024 * 1024)


def _log_batch_metrics(batch_index: int, molecules_processed: int, batch_runtime_seconds: float) -> None:
	runtime = max(batch_runtime_seconds, 1e-6)
	molecules_per_second = molecules_processed / runtime
	memory_mb = _get_memory_usage_mb()
	if memory_mb is None:
		logger.info(
			"Batch metrics | batch=%d | molecules=%d | runtime=%.2fs | rate=%.1f mol/s | memory=n/a",
			batch_index,
			molecules_processed,
			runtime,
			molecules_per_second,
		)
		return

	logger.info(
		"Batch metrics | batch=%d | molecules=%d | runtime=%.2fs | rate=%.1f mol/s | memory=%.1f MB",
		batch_index,
		molecules_processed,
		runtime,
		molecules_per_second,
		memory_mb,
	)


def main() -> int:
	parser = argparse.ArgumentParser(description="Embedding ingestion pipeline")
	parser.add_argument("--processed-dir", default="data/processed", help="Directory with validated molecule datasets")
	parser.add_argument("--collection-name", default=DEFAULT_COLLECTION_NAME, help="Milvus collection name")
	parser.add_argument("--model-version", default="placeholder_encoder_v1", help="Embedding model version string")
	args = parser.parse_args()

	logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

	batch_size = int(os.getenv("P3_EMBEDDING_BATCH_SIZE", str(DEFAULT_BATCH_SIZE)))
	db_timeout_seconds = int(os.getenv("P3_DB_OPERATION_TIMEOUT_SECONDS", str(DEFAULT_DB_TIMEOUT_SECONDS)))
	metadata_upsert_enabled = os.getenv("P3_DISABLE_EMBEDDING_METADATA_UPSERT", "false").strip().lower() not in {
		"1",
		"true",
		"yes",
	}
	if batch_size <= 0:
		raise ValueError("P3_EMBEDDING_BATCH_SIZE must be a positive integer")
	if db_timeout_seconds <= 0:
		raise ValueError("P3_DB_OPERATION_TIMEOUT_SECONDS must be a positive integer")

	processed_dir = Path(args.processed_dir)
	if not processed_dir.exists():
		logger.error("Processed dataset directory does not exist: %s", processed_dir)
		return 1

	output_path = Path("data/processed/embeddings") / (
		f"molecule_embeddings_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}.parquet"
	)

	logger.info("Starting embedding ingestion with batch_size=%d", batch_size)
	estimated_total = estimate_total_molecules(processed_dir)
	logger.info("Estimated total molecules to process: %d", estimated_total)

	milvus_host = os.getenv("P3_MILVUS_HOST", DEFAULT_MILVUS_HOST)
	milvus_port = os.getenv("P3_MILVUS_PORT", DEFAULT_MILVUS_PORT)
	skip_milvus_on_error = os.getenv("P3_SKIP_MILVUS_ON_ERROR", "true").strip().lower() in {
		"1",
		"true",
		"yes",
	}
	logger.info("Milvus target resolved to host=%s port=%s", milvus_host, milvus_port)

	vector_store = MilvusVectorStore(host=milvus_host, port=milvus_port)
	milvus_enabled = True
	milvus_collection: Collection | None = None
	try:
		vector_store.connect()
		vector_store.create_collection(args.collection_name, DEFAULT_DIMENSION)
		if not hasattr(vector_store, "insert_embeddings_batch"):
			raise AttributeError("MilvusVectorStore.insert_embeddings_batch is required")
		logger.info("Verified MilvusVectorStore.insert_embeddings_batch availability")
		milvus_collection = Collection(name=args.collection_name, using=vector_store.alias)
		milvus_collection.load()
	except Exception as exc:
		if not skip_milvus_on_error:
			raise
		milvus_enabled = False
		logger.error(
			"Milvus unavailable (%s). Continuing without Milvus inserts because P3_SKIP_MILVUS_ON_ERROR=true.",
			exc,
		)

	total_processed = 0
	batches_completed = 0
	last_logged_batch = 0
	writer: pq.ParquetWriter | None = None
	started_at = time.time()
	stop_watchdog, watchdog_thread, watchdog_heartbeat = _start_watchdog(WATCHDOG_STALL_SECONDS)

	try:
		for molecule_ids, smiles_batch in load_dataset(processed_dir=processed_dir, batch_size=batch_size):
			watchdog_heartbeat()
			batch_started_at = time.time()
			logger.info("Processing batch %d (%d molecules)", batches_completed + 1, len(smiles_batch))
			print("Processing embedding batch", batches_completed + 1, flush=True)

			hashed_molecule_ids = normalize_and_hash_molecule_ids(molecule_ids)
			vectors = encode_smiles_batch(smiles_batch, dimension=DEFAULT_DIMENSION)

			writer = store_embeddings_file(
				output_path=output_path,
				molecule_ids=hashed_molecule_ids,
				vectors=vectors,
				model_version=args.model_version,
				writer=writer,
			)
			if milvus_enabled and milvus_collection is not None:
				insert_embeddings_milvus(
					vector_store=vector_store,
					molecule_ids=hashed_molecule_ids,
					vectors=vectors,
					collection=milvus_collection,
				)
			if metadata_upsert_enabled:
				ok, _, upsert_error = _run_with_timeout(
					insert_embedding_metadata_batch,
					db_timeout_seconds,
					molecule_ids=molecule_ids,
					model_name=args.model_version,
					dimension=DEFAULT_DIMENSION,
					milvus_collection=args.collection_name,
				)
				if not ok:
					logger.error(
						"Embedding metadata upsert failed or timed out on batch %d (%s). "
						"Disabling metadata upserts for remaining batches.",
						batches_completed + 1,
						upsert_error,
					)
					metadata_upsert_enabled = False

			total_processed += len(molecule_ids)
			batches_completed += 1
			watchdog_heartbeat()
			_log_batch_metrics(
				batch_index=batches_completed,
				molecules_processed=len(molecule_ids),
				batch_runtime_seconds=time.time() - batch_started_at,
			)

			if batches_completed % PROGRESS_LOG_INTERVAL_BATCHES == 0:
				_log_progress(
					current_batch=batches_completed,
					total_processed=total_processed,
					estimated_total=estimated_total,
					started_at=started_at,
				)
				last_logged_batch = batches_completed

		if batches_completed > 0 and last_logged_batch != batches_completed:
			_log_progress(
				current_batch=batches_completed,
				total_processed=total_processed,
				estimated_total=estimated_total,
				started_at=started_at,
			)
			last_logged_batch = batches_completed

		if milvus_enabled and milvus_collection is not None:
			milvus_collection.flush()
	finally:
		stop_watchdog.set()
		watchdog_thread.join(timeout=1)
		if writer is not None:
			writer.close()

	logger.info("Embedding ingestion complete. Total molecules processed: %d", total_processed)
	logger.info("Embeddings parquet saved to: %s", output_path)
	return 0


if __name__ == "__main__":
	raise SystemExit(main())
