from __future__ import annotations

import json
import logging
import sys
from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd

from .adapters.p1_csv_adapter import load_p1_csv
from .raw_storage import store_raw_dataset
from .versioning import generate_dataset_version


logger = logging.getLogger("p1_ingestion")
METADATA_DIR = Path("data/metadata")


def configure_logging() -> None:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    )


def count_total_rows(csv_path: str) -> int:
    dataframe = pd.read_csv(csv_path)
    return len(dataframe)


def write_failed_rows_csv(
    dataset_version: str,
    failed_rows: list[dict[str, Any]],
) -> str:
    """Write failed rows to a CSV file for analysis.
    
    Args:
        dataset_version: The dataset version identifier
        failed_rows: List of failed row records with error details
    
    Returns:
        Path to the failed rows CSV file
    """
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    csv_filename = f"failed_rows_{dataset_version}.csv"
    csv_path = METADATA_DIR / csv_filename
    
    # Write failed rows to CSV with headers
    if failed_rows:
        df = pd.DataFrame(failed_rows)
        df.to_csv(csv_path, index=False)
        logger.info("Wrote %d failed rows to CSV: %s", len(failed_rows), csv_path)
    else:
        # Write empty file with headers
        df = pd.DataFrame(columns=["row_number", "original_id", "error_message"])
        df.to_csv(csv_path, index=False)
        logger.info("Wrote empty failed rows CSV (no failures): %s", csv_path)
    
    return str(csv_path)


def write_failed_rows_log(
    dataset_version: str,
    failed_rows: list[dict[str, Any]],
) -> str:
    """Write failed rows information to a JSON log file.
    
    Args:
        dataset_version: The dataset version identifier
        failed_rows: List of failed row records with error details
    
    Returns:
        Path to the failed rows log file
    """
    METADATA_DIR.mkdir(parents=True, exist_ok=True)
    log_filename = f"{dataset_version}_failed_rows.json"
    log_path = METADATA_DIR / log_filename
    
    log_data = {
        "dataset_version": dataset_version,
        "timestamp": datetime.now(UTC).isoformat(),
        "total_failed_rows": len(failed_rows),
        "failed_rows": failed_rows,
    }
    
    with open(log_path, "w") as f:
        json.dump(log_data, f, indent=2)
    
    logger.info("Wrote failed rows log to: %s", log_path)
    return str(log_path)



def build_summary(
    total_rows: int,
    valid_molecules: int,
    dataset_version: str,
    storage_location: str,
    failed_rows_log_path: str | None = None,
    failed_rows_csv_path: str | None = None,
) -> dict[str, Any]:
    failed_rows = max(total_rows - valid_molecules, 0)
    summary = {
        "total_rows": total_rows,
        "valid_molecules": valid_molecules,
        "failed_rows": failed_rows,
        "dataset_version": dataset_version,
        "storage_location": storage_location,
    }
    
    if failed_rows_log_path:
        summary["failed_rows_log_path"] = failed_rows_log_path
    
    if failed_rows_csv_path:
        summary["failed_rows_csv_path"] = failed_rows_csv_path
    
    return summary


def ingest_p1_dataset(csv_path: str) -> dict[str, Any]:
    logger.info("Starting P1 ingestion for CSV: %s", csv_path)

    total_rows = count_total_rows(csv_path)
    logger.info("Detected %d rows in source CSV", total_rows)

    dataset_version = generate_dataset_version("ada")
    logger.info("Generated dataset version: %s", dataset_version)

    storage_location = store_raw_dataset(csv_path, dataset_version)
    logger.info("Stored raw dataset at: %s", storage_location)

    valid_molecules = 0
    failed_rows_list: list[dict[str, Any]] = []
    failed_rows_log_path = None
    failed_rows_csv_path = None

    try:
        molecules, adapter_failed_rows = load_p1_csv(csv_path)
        valid_molecules = len(molecules)
        failed_rows_list = adapter_failed_rows
        logger.info("Loaded and validated %d molecules with %d failures", valid_molecules, len(failed_rows_list))
    except Exception as exc:
        logger.exception("Failed while loading/validating molecules: %s", exc)
        valid_molecules = 0
        
        # Log the failure details
        failed_rows_list.append({
            "row_number": 0,
            "original_id": "N/A",
            "error_message": str(exc),
        })
        
        logger.error("Ingestion failed - recording error details")

    # Write failed rows CSV if there were any failures
    failed_count = len(failed_rows_list)
    if failed_count > 0:
        logger.info("Recording %d failed rows to CSV", failed_count)
        failed_rows_csv_path = write_failed_rows_csv(dataset_version, failed_rows_list)
    else:
        logger.info("All rows processed successfully")

    summary = build_summary(
        total_rows=total_rows,
        valid_molecules=valid_molecules,
        dataset_version=dataset_version,
        storage_location=storage_location,
        failed_rows_csv_path=failed_rows_csv_path,
    )

    print(json.dumps(summary, indent=2))
    return summary


def main(argv: list[str]) -> int:
    configure_logging()

    if len(argv) != 2:
        print("Usage: python pipelines/ingest_p1_dataset.py <csv_path>")
        return 1

    csv_path = argv[1]
    path_obj = Path(csv_path)
    if not path_obj.exists() or not path_obj.is_file():
        logger.error("Input CSV does not exist: %s", csv_path)
        return 1

    ingest_p1_dataset(csv_path)
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
