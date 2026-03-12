"""
Session 2 ingestion implementation for P1 datasets.

Scope:
- Immutable raw file storage under data/raw/p1/<dataset_version>/
- Dataset version generation using <dataset>_v<increment>_<date>
- P1 ADA CSV mapping into existing Molecule model
"""

from __future__ import annotations

import csv
import hashlib
import json
import os
import re
import shutil
from dataclasses import dataclass, field
from datetime import UTC, datetime
from pathlib import Path
from typing import Any, Dict, List, Optional

from pydantic import ValidationError

from schemas.models import Molecule


_VERSION_PATTERN = re.compile(r"^(?P<dataset>[a-z0-9_]+)_v(?P<version>\d+)_(?P<date>\d{4}_\d{2}_\d{2})$")


@dataclass
class IngestionResult:
    dataset: str
    dataset_version: str
    raw_source_file: str
    raw_stored_file: str
    total_rows: int = 0
    valid_rows: int = 0
    invalid_rows: int = 0
    errors: List[Dict[str, Any]] = field(default_factory=list)
    normalized_records_path: Optional[str] = None


class P1DatasetIngestor:
    def __init__(self, data_root: Optional[Path | str] = None) -> None:
        root_value = data_root or os.getenv("P3_DATA_ROOT", "data")
        self.data_root = Path(root_value)
        self.raw_p1_root = self.data_root / "raw" / "p1"
        self.metadata_root = self.data_root / "metadata" / "p1"

    def ingest_ada_csv(self, source_file: Path | str, fail_fast: bool = False) -> IngestionResult:
        source_path = Path(source_file)
        if not source_path.exists() or not source_path.is_file():
            raise FileNotFoundError(f"Input file does not exist: {source_path}")

        dataset = "ada"
        dataset_version = self._next_dataset_version(dataset)
        raw_version_dir = self.raw_p1_root / dataset_version
        raw_version_dir.mkdir(parents=True, exist_ok=False)

        raw_target_file = raw_version_dir / source_path.name
        shutil.copy2(source_path, raw_target_file)

        result = IngestionResult(
            dataset=dataset,
            dataset_version=dataset_version,
            raw_source_file=str(source_path.resolve()),
            raw_stored_file=str(raw_target_file.resolve()),
        )

        normalized_dir = self.metadata_root / dataset_version
        normalized_dir.mkdir(parents=True, exist_ok=True)
        normalized_path = normalized_dir / "molecules.normalized.jsonl"

        with source_path.open("r", encoding="utf-8", newline="") as file_handle, normalized_path.open(
            "w", encoding="utf-8"
        ) as out_handle:
            reader = csv.DictReader(file_handle)

            for row_index, row in enumerate(reader, start=1):
                result.total_rows += 1
                try:
                    molecule = self._map_ada_row_to_molecule(row=row, row_index=row_index)
                    out_handle.write(json.dumps(molecule.model_dump(mode="json"), ensure_ascii=False) + "\n")
                    result.valid_rows += 1
                except (ValidationError, ValueError, TypeError) as exc:
                    result.invalid_rows += 1
                    result.errors.append({"row": row_index, "error": str(exc)})
                    if fail_fast:
                        raise

        result.normalized_records_path = str(normalized_path.resolve())
        self._write_manifest(result)
        return result

    def _next_dataset_version(self, dataset: str) -> str:
        self.raw_p1_root.mkdir(parents=True, exist_ok=True)
        date_str = datetime.now(UTC).strftime("%Y_%m_%d")
        max_version = 0

        for entry in self.raw_p1_root.iterdir():
            if not entry.is_dir():
                continue
            match = _VERSION_PATTERN.match(entry.name)
            if not match:
                continue
            if match.group("dataset") != dataset:
                continue
            max_version = max(max_version, int(match.group("version")))

        return f"{dataset}_v{max_version + 1}_{date_str}"

    def _map_ada_row_to_molecule(self, row: Dict[str, Any], row_index: int) -> Molecule:
        source_id_raw = str(row.get("ID", "")).strip()
        smiles = str(row.get("SMILES", "")).strip()

        if not source_id_raw:
            raise ValueError("Missing required column: ID")
        if not smiles:
            raise ValueError("Missing required column: SMILES")

        aliases = [alias.strip() for alias in source_id_raw.split(",") if alias and alias.strip()]
        canonical_source_id = aliases[0]
        molecule_id = self._to_molecule_id(canonical_source_id, row_index=row_index)

        metadata: Dict[str, Any] = {
            "external_id": canonical_source_id,
            "aliases": aliases[1:],
            "source_columns": {
                "score": row.get("score"),
                "target": row.get("target"),
                "MW": row.get("MW"),
                "XLogP": row.get("XLogP"),
                "HBA": row.get("HBA"),
                "HBD": row.get("HBD"),
            },
        }

        mw = self._to_optional_float(row.get("MW"))
        logp = self._to_optional_float(row.get("XLogP"))
        hba = self._to_optional_int(row.get("HBA"))
        hbd = self._to_optional_int(row.get("HBD"))
        docking_score = self._to_optional_float(row.get("score"))

        if mw is not None:
            metadata["molecular_weight"] = mw
        if logp is not None:
            metadata["logp"] = logp
        if hba is not None:
            metadata["hba"] = hba
        if hbd is not None:
            metadata["hbd"] = hbd
        if docking_score is not None:
            metadata["docking_score"] = docking_score

        target = row.get("target")
        if target is not None and str(target).strip():
            metadata["target_protein"] = str(target).strip()

        return Molecule(
            molecule_id=molecule_id,
            smiles=smiles,
            source_dataset="other",
            created_at=datetime.now(UTC),
            metadata=metadata,
        )

    @staticmethod
    def _to_molecule_id(source_id: str, row_index: int) -> str:
        normalized = re.sub(r"[^A-Za-z0-9]", "", source_id).upper()
        if len(normalized) >= 8:
            token = normalized[:16]
            return f"MOL-{token}"

        digest = hashlib.sha1(f"{source_id}:{row_index}".encode("utf-8")).hexdigest().upper()[:12]
        return f"MOL-{digest}"

    @staticmethod
    def _to_optional_float(value: Any) -> Optional[float]:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        return float(text)

    @staticmethod
    def _to_optional_int(value: Any) -> Optional[int]:
        if value is None:
            return None
        text = str(value).strip()
        if not text:
            return None
        return int(float(text))

    def _write_manifest(self, result: IngestionResult) -> None:
        manifest_dir = self.metadata_root / result.dataset_version
        manifest_dir.mkdir(parents=True, exist_ok=True)
        manifest_file = manifest_dir / "ingestion_manifest.json"
        manifest_file.write_text(
            json.dumps(
                {
                    "dataset": result.dataset,
                    "dataset_version": result.dataset_version,
                    "raw_source_file": result.raw_source_file,
                    "raw_stored_file": result.raw_stored_file,
                    "total_rows": result.total_rows,
                    "valid_rows": result.valid_rows,
                    "invalid_rows": result.invalid_rows,
                    "errors": result.errors,
                    "normalized_records_path": result.normalized_records_path,
                    "ingested_at": datetime.now(UTC).isoformat(),
                },
                indent=2,
                ensure_ascii=False,
            ),
            encoding="utf-8",
        )


def ingest_p1_ada_dataset(source_file: Path | str, data_root: Optional[Path | str] = None) -> IngestionResult:
    ingestor = P1DatasetIngestor(data_root=data_root)
    return ingestor.ingest_ada_csv(source_file=source_file)
