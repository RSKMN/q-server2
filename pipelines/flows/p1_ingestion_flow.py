"""
Prefect workflow for P1 ADA dataset ingestion.

Wraps the existing ingestion pipeline as a Prefect flow for orchestration
and monitoring. Suitable for Prefect 3.6.20+.

Usage:
    python -m pipelines.flows.p1_ingestion_flow
    
Or manually:
    from pipelines.flows.p1_ingestion_flow import p1_dataset_flow
    result = p1_dataset_flow("path/to/data.csv")
"""

from __future__ import annotations

import json
import logging
from typing import Any

from prefect import flow, task

from pipelines.ingest_p1_dataset import configure_logging, ingest_p1_dataset

logger = logging.getLogger("p1_ingestion_flow")


@task(name="run_p1_ingestion")
def run_ingestion_task(csv_path: str) -> dict[str, Any]:
    """Execute P1 dataset ingestion.
    
    Args:
        csv_path: Path to the P1 CSV file
    
    Returns:
        Ingestion summary with results and metadata
    """
    return ingest_p1_dataset(csv_path)


@flow(name="P1 Dataset Ingestion")
def p1_dataset_flow(csv_path: str) -> dict[str, Any]:
    """Orchestrate P1 dataset ingestion workflow.
    
    Flow:
    1. Log ingestion start
    2. Run ingestion task
    3. Log completion
    
    Args:
        csv_path: Path to source CSV file
    
    Returns:
        Ingestion summary with results and metadata
    """
    logger.info("Starting P1 dataset ingestion flow for: %s", csv_path)
    
    # Run ingestion task
    summary = run_ingestion_task(csv_path)
    
    # Log completion
    logger.info("P1 dataset ingestion flow completed successfully")
    logger.info("Summary: %s", json.dumps(summary, indent=2))
    
    return summary


if __name__ == "__main__":
    configure_logging()
    result = p1_dataset_flow("drug_filtered.csv")
    print(json.dumps(result, indent=2))

