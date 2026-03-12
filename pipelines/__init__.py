"""
P3 Research Lab - Pipelines Package

This package contains data ingestion, transformation, and validation pipelines.
"""

from .validators import (
    ValidationResult,
    BatchValidationResult,
    MoleculeValidator,
    ProteinValidator,
    EmbeddingValidator,
    validate_batch,
    validate_json_file,
    validate_jsonl_file,
)
from .ingestion import (
    IngestionResult,
    P1DatasetIngestor,
    ingest_p1_ada_dataset,
)

__version__ = "1.0.0"

__all__ = [
    'ValidationResult',
    'BatchValidationResult',
    'MoleculeValidator',
    'ProteinValidator',
    'EmbeddingValidator',
    'validate_batch',
    'validate_json_file',
    'validate_jsonl_file',
    'IngestionResult',
    'P1DatasetIngestor',
    'ingest_p1_ada_dataset',
]
