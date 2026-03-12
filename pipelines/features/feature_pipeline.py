from __future__ import annotations

import argparse
import csv
import json
import logging
import os
import sys
import threading
import time
from concurrent.futures import ProcessPoolExecutor
from datetime import UTC, datetime
from pathlib import Path
from typing import Callable, Generator, Iterable, Sequence, TypeVar
from uuid import UUID

import numpy as np
import pandas as pd
import pyarrow as pa
import pyarrow.parquet as pq
from rdkit import Chem, DataStructs
from rdkit.Chem import Crippen, Descriptors, rdFingerprintGenerator, rdMolDescriptors
from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert

try:
    import psutil
except ModuleNotFoundError:  # pragma: no cover - optional dependency
    psutil = None

try:
    from services.database.models import Dataset, Molecule
    from services.database.dataset_service import DatasetService
    from services.database.postgres_client import get_session
except ModuleNotFoundError:
    # Allow running with: python pipelines/features/feature_pipeline.py
    sys.path.append(str(Path(__file__).resolve().parents[2]))
    from services.database.models import Dataset, Molecule
    from services.database.dataset_service import DatasetService
    from services.database.postgres_client import get_session


logger = logging.getLogger("feature_pipeline")

DEFAULT_BATCH_SIZE = 2000
DEFAULT_FINGERPRINT_SIZE = 256
DEFAULT_FEATURE_WORKERS = min(8, os.cpu_count() or 1)
PROGRESS_LOG_INTERVAL_MOLECULES = 1000
WATCHDOG_STALL_SECONDS = 60
ROW_ESTIMATE_SAMPLE_LINES = 5000
INVALID_SMILES_WARNING_LIMIT = 50
DEFAULT_DB_TIMEOUT_SECONDS = 15
DEFAULT_CHECKPOINT_PATH = Path("data/checkpoints/feature_pipeline_checkpoint.json")

MORGAN_GENERATOR_CACHE: dict[int, rdFingerprintGenerator.FingerprintGenerator64] = {}
_invalid_smiles_warnings = 0
T = TypeVar("T")


def _get_morgan_generator(fingerprint_size: int) -> rdFingerprintGenerator.FingerprintGenerator64:
    generator = MORGAN_GENERATOR_CACHE.get(fingerprint_size)
    if generator is None:
        generator = rdFingerprintGenerator.GetMorganGenerator(radius=2, fpSize=fingerprint_size)
        MORGAN_GENERATOR_CACHE[fingerprint_size] = generator
    return generator


def _normalize_columns(columns: Iterable[str]) -> dict[str, str]:
    return {column.strip().lower(): column for column in columns}


def _resolve_required_columns(columns: Iterable[str]) -> tuple[str, str]:
    """
    Resolve molecule ID and SMILES column names from dataset.

    Accepts common variations such as:
    - molecule_id / id / ID
    - smiles / SMILES
    """

    normalized = _normalize_columns(columns)

    id_candidates = ("molecule_id", "id")
    smiles_candidates = ("smiles",)

    id_column = next((normalized[candidate] for candidate in id_candidates if candidate in normalized), None)
    smiles_column = next((normalized[candidate] for candidate in smiles_candidates if candidate in normalized), None)

    if not id_column or not smiles_column:
        available = ", ".join(sorted(columns))
        raise ValueError(
            "Missing required columns. Expected molecule ID column (molecule_id/ID) "
            "and SMILES column (smiles/SMILES). "
            f"Available columns: {available}"
        )

    return id_column, smiles_column


def _read_csv_columns(file_path: Path) -> list[str]:
    with file_path.open("r", encoding="utf-8", errors="ignore", newline="") as handle:
        reader = csv.reader(handle)
        header = next(reader, None)

    if not header:
        raise ValueError(f"CSV file is empty or missing header: {file_path}")

    if header:
        header[0] = header[0].lstrip("\ufeff")
    return header


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


def _estimate_text_file_rows(file_path: Path, has_header: bool) -> int:
    file_size = file_path.stat().st_size
    if file_size <= 0:
        return 0

    with file_path.open("rb") as handle:
        header_bytes = len(handle.readline()) if has_header else 0
        sampled_rows = 0
        sampled_bytes = 0

        for _ in range(ROW_ESTIMATE_SAMPLE_LINES):
            line = handle.readline()
            if not line:
                break
            sampled_rows += 1
            sampled_bytes += len(line)

    if sampled_rows == 0 or sampled_bytes == 0:
        return 0

    avg_row_bytes = sampled_bytes / sampled_rows
    remaining_bytes = max(file_size - header_bytes, 0)
    return int(remaining_bytes / max(avg_row_bytes, 1.0))


def _estimate_file_rows(file_path: Path) -> int:
    suffix = file_path.suffix.lower()
    if suffix == ".csv":
        return _estimate_text_file_rows(file_path, has_header=True)
    if suffix == ".jsonl":
        return _estimate_text_file_rows(file_path, has_header=False)
    if suffix == ".parquet":
        return pq.ParquetFile(file_path).metadata.num_rows
    return 0


def estimate_total_molecules(processed_dir: Path) -> int:
    total = 0
    for file_path in _iter_dataset_files(processed_dir):
        estimated_rows = _estimate_file_rows(file_path)
        logger.info("Estimated rows for %s: %d", file_path, estimated_rows)
        total += estimated_rows
    return total


def load_dataset(processed_dir: Path, batch_size: int) -> Generator[tuple[list[str], list[str]], None, None]:
    """Stream molecule IDs and SMILES from processed datasets in chunks."""
    for file_path in _iter_dataset_files(processed_dir):
        suffix = file_path.suffix.lower()
        logger.info("Loading dataset from %s", file_path)

        if suffix == ".csv":
            csv_columns = _read_csv_columns(file_path)
            id_col, smiles_col = _resolve_required_columns(csv_columns)

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
                    smiles = record.get("SMILES") or record.get("smiles")
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
            id_col, smiles_col = _resolve_required_columns(parquet_file.schema.names)

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


def compute_rdkit_features(
    smiles: str,
    fingerprint_size: int,
    log_invalid: bool = True,
) -> tuple[float, int, int, float, float, list[int]] | None:
    """Compute descriptors and Morgan fingerprint for one SMILES string."""
    global _invalid_smiles_warnings

    molecule = Chem.MolFromSmiles(smiles)
    if molecule is None:
        if log_invalid and _invalid_smiles_warnings < INVALID_SMILES_WARNING_LIMIT:
            logger.warning("Invalid SMILES skipped: %s", smiles)
        elif log_invalid and _invalid_smiles_warnings == INVALID_SMILES_WARNING_LIMIT:
            logger.warning("Too many invalid SMILES; suppressing further invalid-SMILES warnings")
        if log_invalid:
            _invalid_smiles_warnings += 1
        return None

    fingerprint = _get_morgan_generator(fingerprint_size).GetFingerprint(molecule)
    fingerprint_bits = np.zeros((fingerprint_size,), dtype=np.int8)
    DataStructs.ConvertToNumpyArray(fingerprint, fingerprint_bits)

    return (
        float(Descriptors.MolWt(molecule)),
        int(molecule.GetNumAtoms()),
        int(molecule.GetNumBonds()),
        float(Crippen.MolLogP(molecule)),
        float(rdMolDescriptors.CalcTPSA(molecule)),
        fingerprint_bits.astype(int).tolist(),
    )


def _compute_rdkit_features_worker(args: tuple[str, int]) -> tuple[bool, str, tuple[float, int, int, float, float, list[int]] | None]:
    smiles, fingerprint_size = args
    result = compute_rdkit_features(smiles=smiles, fingerprint_size=fingerprint_size, log_invalid=False)
    return result is not None, smiles, result


def extract_features_batch(
    smiles_batch: Sequence[str],
    fingerprint_size: int,
    executor: ProcessPoolExecutor | None = None,
) -> tuple[list[int], np.ndarray, np.ndarray, np.ndarray, np.ndarray, np.ndarray, list[list[int]]]:
    """Extract descriptors/fingerprints for valid molecules in a batch.

    Returns source indices for valid molecules so molecule IDs remain aligned when
    invalid SMILES are skipped.
    """
    global _invalid_smiles_warnings

    if not smiles_batch:
        empty_float = np.array([], dtype=np.float32)
        empty_int = np.array([], dtype=np.int32)
        return [], empty_float, empty_int, empty_int, empty_float, empty_float, []

    valid_indices: list[int] = []
    molecular_weight: list[float] = []
    num_atoms: list[int] = []
    num_bonds: list[int] = []
    logp_values: list[float] = []
    tpsa_values: list[float] = []
    fingerprints: list[list[int]] = []

    if executor is None:
        results = (
            _compute_rdkit_features_worker((smiles, fingerprint_size))
            for smiles in smiles_batch
        )
    else:
        results = executor.map(
            _compute_rdkit_features_worker,
            ((smiles, fingerprint_size) for smiles in smiles_batch),
        )

    for index, (_, smiles, result) in enumerate(results):
        if result is None:
            if _invalid_smiles_warnings < INVALID_SMILES_WARNING_LIMIT:
                logger.warning("Invalid SMILES skipped: %s", smiles)
            elif _invalid_smiles_warnings == INVALID_SMILES_WARNING_LIMIT:
                logger.warning("Too many invalid SMILES; suppressing further invalid-SMILES warnings")
            _invalid_smiles_warnings += 1
            continue

        mw, atoms, bonds, logp, tpsa, fp = result
        valid_indices.append(index)
        molecular_weight.append(mw)
        num_atoms.append(atoms)
        num_bonds.append(bonds)
        logp_values.append(logp)
        tpsa_values.append(tpsa)
        fingerprints.append(fp)

    return (
        valid_indices,
        np.asarray(molecular_weight, dtype=np.float32),
        np.asarray(num_atoms, dtype=np.int32),
        np.asarray(num_bonds, dtype=np.int32),
        np.asarray(logp_values, dtype=np.float32),
        np.asarray(tpsa_values, dtype=np.float32),
        fingerprints,
    )


def store_features_file(
    molecule_ids: Sequence[str],
    smiles_batch: Sequence[str],
    molecular_weight: np.ndarray,
    num_atoms: np.ndarray,
    num_bonds: np.ndarray,
    logp: np.ndarray,
    tpsa: np.ndarray,
    fingerprint_vectors: Sequence[Sequence[int]],
    output_dir: Path | None = None,
    batch_index: int | None = None,
    output_path: Path | None = None,
    writer: pq.ParquetWriter | None = None,
) -> Path | pq.ParquetWriter:
    """
    Store features in parquet.

    Supports two modes:
    - Batch-file mode (current pipeline): pass output_dir + batch_index, returns Path.
    - Append-writer mode (legacy tests/callers): pass output_path (+ optional writer), returns ParquetWriter.
    """
    table = pa.table(
        {
            "molecule_id": molecule_ids,
            "smiles": smiles_batch,
            "molecular_weight": molecular_weight,
            "num_atoms": num_atoms,
            "num_bonds": num_bonds,
            "logp": logp,
            "tpsa": tpsa,
            "fingerprint": fingerprint_vectors,
        }
    )

    if output_path is not None:
        output_path.parent.mkdir(parents=True, exist_ok=True)
        parquet_writer = writer or pq.ParquetWriter(output_path, table.schema)
        parquet_writer.write_table(table)
        return parquet_writer

    if output_dir is None or batch_index is None:
        raise ValueError("Either output_path or both output_dir and batch_index must be provided")

    output_dir.mkdir(parents=True, exist_ok=True)
    batch_path = output_dir / f"features_batch_{batch_index:06d}.parquet"
    pq.write_table(table, batch_path, compression="snappy")
    return batch_path


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
                logger.warning("Watchdog: no batch processed for %.1f seconds", idle_for)
                state["last_warning"] = now

    thread = threading.Thread(target=watchdog_loop, name="feature-pipeline-watchdog", daemon=True)
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


def _resolve_or_register_dataset_id(
    cli_dataset_id: str | None,
    cli_dataset_name: str | None,
    cli_dataset_source: str | None,
    cli_dataset_version: str | None,
) -> UUID:
    raw_dataset_id = cli_dataset_id or os.getenv("P3_DATASET_ID")
    if raw_dataset_id:
        logger.info("Resolving provided dataset_id: %s", raw_dataset_id)
        try:
            dataset_id = UUID(raw_dataset_id)
        except ValueError as exc:
            raise ValueError(f"Invalid dataset UUID: {raw_dataset_id}") from exc

        _ensure_dataset_exists(dataset_id)
        return dataset_id

    dataset_name = cli_dataset_name or os.getenv("P3_DATASET_NAME") or "processed_molecules"
    dataset_source = cli_dataset_source or os.getenv("P3_DATASET_SOURCE") or "feature_pipeline"
    dataset_version = (
        cli_dataset_version
        or os.getenv("P3_DATASET_VERSION")
        or datetime.now(UTC).strftime("auto_%Y%m%d_%H%M%S")
    )

    logger.info(
        "Registering dataset metadata | name=%s | source=%s | version=%s",
        dataset_name,
        dataset_source,
        dataset_version,
    )
    dataset_id = DatasetService().register_dataset(
        name=dataset_name,
        source=dataset_source,
        version=dataset_version,
    )
    logger.info(
        "Using dataset metadata | id=%s | name=%s | source=%s | version=%s",
        dataset_id,
        dataset_name,
        dataset_source,
        dataset_version,
    )
    return dataset_id


def _ensure_dataset_exists(dataset_id: UUID) -> None:
    logger.info("Checking dataset existence in PostgreSQL for dataset_id=%s", dataset_id)
    session = get_session()
    try:
        exists = session.execute(select(Dataset.dataset_id).where(Dataset.dataset_id == dataset_id)).scalar_one_or_none()
        if exists is None:
            raise ValueError(f"Dataset not found in PostgreSQL: {dataset_id}")
    finally:
        session.close()


def upsert_molecule_metadata_batch(
    dataset_id: UUID,
    molecule_ids: Sequence[str],
    smiles_batch: Sequence[str],
    molecular_weight: np.ndarray,
    logp: np.ndarray,
) -> None:
    if not molecule_ids:
        return

    now = datetime.now(UTC)
    rows = [
        {
            "molecule_id": molecule_id,
            "smiles": smiles,
            "dataset_id": dataset_id,
            "molecular_weight": float(weight),
            "logp": float(logp_value),
            "created_at": now,
        }
        for molecule_id, smiles, weight, logp_value in zip(
            molecule_ids,
            smiles_batch,
            molecular_weight.tolist(),
            logp.tolist(),
        )
    ]

    statement = insert(Molecule).values(rows)
    statement = statement.on_conflict_do_update(
        index_elements=[Molecule.molecule_id],
        set_={
            "smiles": statement.excluded.smiles,
            "dataset_id": statement.excluded.dataset_id,
            "molecular_weight": statement.excluded.molecular_weight,
            "logp": statement.excluded.logp,
            "created_at": statement.excluded.created_at,
        },
    )

    session = get_session()
    try:
        session.execute(statement)
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


def _load_checkpoint(checkpoint_path: Path) -> int:
    if not checkpoint_path.exists():
        logger.info("Checkpoint not found at %s. Starting from batch 0.", checkpoint_path)
        return 0

    with checkpoint_path.open("r", encoding="utf-8") as handle:
        payload = json.load(handle)

    last_batch = int(payload.get("last_batch", 0))
    if last_batch < 0:
        raise ValueError(f"Checkpoint last_batch must be non-negative: {checkpoint_path}")

    logger.info("Loaded checkpoint from %s with last_batch=%d", checkpoint_path, last_batch)
    return last_batch


def _write_checkpoint(checkpoint_path: Path, last_batch: int) -> None:
    checkpoint_path.parent.mkdir(parents=True, exist_ok=True)
    payload = {"last_batch": last_batch}
    with checkpoint_path.open("w", encoding="utf-8") as handle:
        json.dump(payload, handle)
    logger.info("Updated checkpoint %s with last_batch=%d", checkpoint_path, last_batch)


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
    parser = argparse.ArgumentParser(description="Molecule feature extraction pipeline")
    parser.add_argument("--processed-dir", default="data/processed", help="Processed dataset root directory")
    parser.add_argument("--output-dir", default="data/processed/features", help="Output directory for features")
    parser.add_argument("--dataset-id", default=None, help="Dataset UUID for PostgreSQL molecule metadata upserts")
    parser.add_argument("--dataset-name", default=None, help="Dataset name for auto-registration when dataset-id is not set")
    parser.add_argument("--dataset-source", default=None, help="Dataset source for auto-registration when dataset-id is not set")
    parser.add_argument("--dataset-version", default=None, help="Dataset version for auto-registration when dataset-id is not set")
    args = parser.parse_args()

    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
        force=True,
    )

    batch_size = int(os.getenv("P3_FEATURE_BATCH_SIZE", str(DEFAULT_BATCH_SIZE)))
    fingerprint_size = int(os.getenv("P3_FINGERPRINT_SIZE", str(DEFAULT_FINGERPRINT_SIZE)))
    feature_workers = int(os.getenv("P3_FEATURE_WORKERS", str(DEFAULT_FEATURE_WORKERS)))
    metadata_upsert_enabled = os.getenv("P3_DISABLE_METADATA_UPSERT", "false").strip().lower() not in {
        "1",
        "true",
        "yes",
    }
    db_timeout_seconds = int(os.getenv("P3_DB_OPERATION_TIMEOUT_SECONDS", str(DEFAULT_DB_TIMEOUT_SECONDS)))
    if db_timeout_seconds <= 0:
        raise ValueError("P3_DB_OPERATION_TIMEOUT_SECONDS must be a positive integer")
    dataset_id: UUID | None = None
    if batch_size <= 0:
        raise ValueError("P3_FEATURE_BATCH_SIZE must be a positive integer")
    if fingerprint_size <= 0:
        raise ValueError("P3_FINGERPRINT_SIZE must be a positive integer")
    if feature_workers <= 0:
        raise ValueError("P3_FEATURE_WORKERS must be a positive integer")

    processed_dir = Path(args.processed_dir)
    if not processed_dir.exists():
        logger.error("Processed dataset directory does not exist: %s", processed_dir)
        return 1

    checkpoint_path = DEFAULT_CHECKPOINT_PATH
    last_completed_batch = _load_checkpoint(checkpoint_path)

    output_root = Path(args.output_dir)
    run_output_dir = output_root / f"molecule_features_{datetime.now(UTC).strftime('%Y%m%d_%H%M%S')}"

    logger.info("Starting feature extraction")
    logger.info(
        "Starting feature extraction with batch_size=%d, fingerprint_size=%d, workers=%d",
        batch_size,
        fingerprint_size,
        feature_workers,
    )
    estimated_total = estimate_total_molecules(processed_dir)
    logger.info("Estimated total molecules to process: %d", estimated_total)

    total_processed = 0
    batches_completed = 0
    next_progress_log = PROGRESS_LOG_INTERVAL_MOLECULES
    started_at = time.time()
    stop_watchdog, watchdog_thread, watchdog_heartbeat = _start_watchdog(WATCHDOG_STALL_SECONDS)
    batch_index = 0
    executor = ProcessPoolExecutor(max_workers=feature_workers)

    try:
        for molecule_ids, smiles_batch in load_dataset(processed_dir=processed_dir, batch_size=batch_size):
            batch_index += 1

            if batch_index <= last_completed_batch:
                continue

            watchdog_heartbeat()
            batch_started_at = time.time()
            logger.info("Processing batch %d (%d molecules)", batch_index, len(smiles_batch))
            print("Processing batch", batch_index, flush=True)

            (
                valid_indices,
                molecular_weight,
                num_atoms,
                num_bonds,
                logp,
                tpsa,
                fingerprint_vectors,
            ) = extract_features_batch(
                smiles_batch=smiles_batch,
                fingerprint_size=fingerprint_size,
                executor=executor,
            )

            batches_completed = batch_index

            if not valid_indices:
                logger.warning("Skipping batch %d: no valid SMILES found", batches_completed)
                _write_checkpoint(checkpoint_path, batches_completed)
                _log_batch_metrics(
                    batch_index=batches_completed,
                    molecules_processed=0,
                    batch_runtime_seconds=time.time() - batch_started_at,
                )
                continue

            valid_molecule_ids = [molecule_ids[index] for index in valid_indices]
            valid_smiles = [smiles_batch[index] for index in valid_indices]

            skipped_count = len(smiles_batch) - len(valid_indices)
            if skipped_count > 0:
                logger.warning("Skipped %d invalid SMILES in batch %d", skipped_count, batches_completed)

            logger.info("Writing parquet batch %d", batches_completed)
            batch_output_path = store_features_file(
                output_dir=run_output_dir,
                batch_index=batches_completed,
                molecule_ids=valid_molecule_ids,
                smiles_batch=valid_smiles,
                molecular_weight=molecular_weight,
                num_atoms=num_atoms,
                num_bonds=num_bonds,
                logp=logp,
                tpsa=tpsa,
                fingerprint_vectors=fingerprint_vectors,
            )
            logger.info("Wrote parquet batch file: %s", batch_output_path)

            if metadata_upsert_enabled:
                if dataset_id is None:
                    logger.info("Resolving dataset metadata before first PostgreSQL upsert")
                    ok, resolved_dataset_id, resolve_error = _run_with_timeout(
                        _resolve_or_register_dataset_id,
                        db_timeout_seconds,
                        cli_dataset_id=args.dataset_id,
                        cli_dataset_name=args.dataset_name,
                        cli_dataset_source=args.dataset_source,
                        cli_dataset_version=args.dataset_version,
                    )
                    if not ok or resolved_dataset_id is None:
                        logger.error(
                            "Dataset metadata resolution failed or timed out (%s). "
                            "Disabling metadata upserts and continuing feature extraction.",
                            resolve_error,
                        )
                        metadata_upsert_enabled = False
                    else:
                        dataset_id = resolved_dataset_id

                if metadata_upsert_enabled and dataset_id is not None:
                    logger.info("Upserting metadata for batch %d", batches_completed)
                    ok, _, upsert_error = _run_with_timeout(
                        upsert_molecule_metadata_batch,
                        db_timeout_seconds,
                        dataset_id=dataset_id,
                        molecule_ids=valid_molecule_ids,
                        smiles_batch=valid_smiles,
                        molecular_weight=molecular_weight,
                        logp=logp,
                    )
                    if not ok:
                        logger.error(
                            "Metadata upsert failed or timed out on batch %d (%s). "
                            "Disabling metadata upserts for remaining batches.",
                            batches_completed,
                            upsert_error,
                        )
                        metadata_upsert_enabled = False

            total_processed += len(valid_molecule_ids)
            watchdog_heartbeat()
            _write_checkpoint(checkpoint_path, batches_completed)
            _log_batch_metrics(
                batch_index=batches_completed,
                molecules_processed=len(valid_molecule_ids),
                batch_runtime_seconds=time.time() - batch_started_at,
            )

            if total_processed >= next_progress_log:
                _log_progress(
                    current_batch=batches_completed,
                    total_processed=total_processed,
                    estimated_total=estimated_total,
                    started_at=started_at,
                )
                next_progress_log += PROGRESS_LOG_INTERVAL_MOLECULES

            # Release batch-local memory before loading the next chunk.
            fingerprint_vectors.clear()
            valid_molecule_ids.clear()
            valid_smiles.clear()
            molecule_ids.clear()
            smiles_batch.clear()
            del molecular_weight, num_atoms, num_bonds, logp, tpsa, valid_indices

        if batches_completed > 0:
            _log_progress(
                current_batch=batches_completed,
                total_processed=total_processed,
                estimated_total=estimated_total,
                started_at=started_at,
            )
    finally:
        stop_watchdog.set()
        watchdog_thread.join(timeout=1)
        executor.shutdown(wait=True, cancel_futures=False)

    logger.info("Feature extraction complete. Total molecules processed: %d", total_processed)
    logger.info("Feature parquet batch files saved under: %s", run_output_dir)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
