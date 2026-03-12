from __future__ import annotations

import json
from abc import ABC, abstractmethod
from dataclasses import asdict, dataclass
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Optional


@dataclass(frozen=True)
class DatasetMetadata:
    dataset_name: str
    version: str
    row_count: int
    storage_path: str
    registered_at: str


class MetadataRegistry(ABC):
    """Backend-agnostic metadata registry interface.

    Future PostgreSQL integration can implement this interface without requiring
    changes to pipeline callers.
    """

    @abstractmethod
    def register(
        self,
        dataset_name: str,
        version: str,
        row_count: int,
        storage_path: str,
    ) -> DatasetMetadata:
        raise NotImplementedError


class JsonFileMetadataRegistry(MetadataRegistry):
    """Temporary filesystem-backed registry.

    Writes metadata JSON files to data/metadata/<dataset_version>.json
    """

    def __init__(self, metadata_root: Optional[Path] = None) -> None:
        self.metadata_root = metadata_root or (Path(__file__).resolve().parents[1] / "data" / "metadata")

    def register(
        self,
        dataset_name: str,
        version: str,
        row_count: int,
        storage_path: str,
    ) -> DatasetMetadata:
        self.metadata_root.mkdir(parents=True, exist_ok=True)

        record = DatasetMetadata(
            dataset_name=dataset_name.strip(),
            version=version.strip(),
            row_count=int(row_count),
            storage_path=str(Path(storage_path)),
            registered_at=datetime.now(UTC).isoformat(),
        )

        output_file = self.metadata_root / f"{record.version}.json"
        output_file.write_text(json.dumps(asdict(record), indent=2), encoding="utf-8")

        return record


_registry: MetadataRegistry = JsonFileMetadataRegistry()


def set_metadata_registry(registry: MetadataRegistry) -> None:
    """Set active metadata registry backend (for future DB integration)."""
    global _registry
    _registry = registry


def get_metadata_registry() -> MetadataRegistry:
    """Get active metadata registry backend."""
    return _registry


def register_dataset_metadata(
    dataset_name: str,
    version: str,
    row_count: int,
    storage_path: str,
) -> dict[str, Any]:
    """Register dataset metadata using the active backend.

    Temporary behavior:
    - store metadata JSON in data/metadata/
    - filename: <dataset_version>.json
    """
    record = _registry.register(
        dataset_name=dataset_name,
        version=version,
        row_count=row_count,
        storage_path=storage_path,
    )
    return asdict(record)


__all__ = [
    "DatasetMetadata",
    "MetadataRegistry",
    "JsonFileMetadataRegistry",
    "set_metadata_registry",
    "get_metadata_registry",
    "register_dataset_metadata",
]
