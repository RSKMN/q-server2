"""
Prefect workflows for P3 research lab ingestion pipelines.

This package contains orchestration workflows that coordinate
data ingestion, validation, and storage operations.
"""

from .p1_ingestion_flow import p1_dataset_flow

__all__ = [
    "p1_dataset_flow",
]
