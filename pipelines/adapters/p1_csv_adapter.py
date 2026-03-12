from __future__ import annotations

from datetime import UTC, datetime
from pathlib import Path
from typing import Any

import pandas as pd

from schemas.models import Molecule, MoleculeMetadata


def _strip_or_none(value: Any) -> str | None:
    if value is None or pd.isna(value):
        return None
    text = str(value).strip()
    return text if text else None


def _to_optional_float(value: Any) -> float | None:
    if value is None or pd.isna(value):
        return None
    number = pd.to_numeric(value, errors="coerce")
    if pd.isna(number):
        return None
    return float(number)


def _to_optional_int(value: Any) -> int | None:
    """Safely parse optional integer values, handling NaN/None gracefully."""
    if value is None or pd.isna(value):
        return None
    try:
        number = pd.to_numeric(value, errors="coerce")
        if pd.isna(number):
            return None
        return int(number)
    except (ValueError, TypeError):
        return None


def _generate_molecule_id(row_index: int) -> str:
    """Generate deterministic molecule ID from row index.
    
    Format: MOL-00000001, MOL-00000002, etc.
    Deterministic numbering ensures reproducible IDs based on row order.
    """
    return f"MOL-{row_index+1:08d}"


def _split_ids(raw_id: Any) -> tuple[str, list[str]]:
    """Parse P1 IDs, handling comma-separated values.
    
    Returns:
        (primary_id, aliases) where primary_id is first value and aliases are remaining
    """
    id_text = _strip_or_none(raw_id)
    if not id_text:
        raise ValueError("Missing required ID value")

    parts = [part.strip() for part in id_text.split(",") if part and part.strip()]
    if not parts:
        raise ValueError("ID value is empty after normalization")

    primary_id = parts[0]
    aliases = parts[1:]
    return primary_id, aliases


def load_p1_csv(path: str, chunksize: int = 10000) -> tuple[list[Molecule], list[dict[str, Any]]]:
    """Load finalized P1 CSV and convert rows to validated Molecule objects.

    Mapping follows docs/p1_dataset_mapping.md exactly:
      Mapping:
        ID -> external_id (stored in metadata), molecule_id (auto-generated)
        SMILES -> smiles
        score -> metadata.docking_score
        target -> metadata.target_protein
        MW -> metadata.molecular_weight
        XLogP -> metadata.logp
        HBA -> metadata.hba
        HBD -> metadata.hbd

    Key behaviors:
    - molecule_id is auto-generated as MOL-00000001, MOL-00000002, etc. (deterministic, row-order based)
    - external_id stores the original P1 ID (e.g., "(DESMILES:6968009)")
    - dataset_name="p1_ada" identifies the specific dataset origin
    - source_dataset="other" is used per Molecule schema enum requirements
    - If ID contains comma-separated values, first ID is stored as external_id and remaining values are aliases
    - Numeric fields are parsed safely; invalid/missing values are set to None
    - Chunk processing ensures memory efficiency: only one chunk loaded at a time, suitable for large datasets (>600k rows)
    - Row-level failures do NOT stop processing; failed rows are captured and returned separately
    
    Args:
        path: Path to the P1 CSV file
        chunksize: Number of rows per chunk (default 10000, use smaller values for memory-constrained environments)
    
    Returns:
        Tuple of (molecules, failed_rows) where:
        - molecules: List of validated Molecule objects
        - failed_rows: List of dicts with row_number, original_id, and error_message for each failure
    """
    csv_path = Path(path)
    if not csv_path.exists() or not csv_path.is_file():
        raise FileNotFoundError(f"CSV file not found: {path}")

    # Validate columns exist before processing by reading first row
    first_chunk = pd.read_csv(csv_path, nrows=1)
    required_columns = ["ID", "SMILES", "score", "target", "MW", "XLogP", "HBA", "HBD"]
    missing_columns = [column for column in required_columns if column not in first_chunk.columns]
    if missing_columns:
        missing = ", ".join(missing_columns)
        raise ValueError(f"Missing required CSV columns: {missing}")

    molecules: list[Molecule] = []
    failed_rows: list[dict[str, Any]] = []
    row_index = 0

    # Process CSV in chunks for memory efficiency
    chunk_reader = pd.read_csv(csv_path, chunksize=chunksize)
    
    for chunk in chunk_reader:
        for _, row in chunk.iterrows():
            try:
                # Generate internal molecule ID deterministically from row index
                molecule_id = _generate_molecule_id(row_index)
                
                # Parse external P1 ID and aliases
                external_p1_id, aliases = _split_ids(row.get("ID"))
                
                # Extract SMILES (required field)
                smiles = _strip_or_none(row.get("SMILES"))
                if not smiles:
                    raise ValueError("Missing required SMILES value")

                # Build metadata with all docking/chemical properties
                metadata_dict = {
                    "docking_score": _to_optional_float(row.get("score")),
                    "target_protein": _strip_or_none(row.get("target")),
                    "molecular_weight": _to_optional_float(row.get("MW")),
                    "logp": _to_optional_float(row.get("XLogP")),
                    "hba": _to_optional_int(row.get("HBA")),
                    "hbd": _to_optional_int(row.get("HBD")),
                    "external_id": external_p1_id,
                    "dataset_name": "p1_ada",
                    "aliases": aliases if aliases else [],
                }

                # Create molecule with generated ID and external ID in metadata
                molecule = Molecule(
                    molecule_id=molecule_id,
                    smiles=smiles,
                    source_dataset="other",
                    created_at=datetime.now(UTC),
                    metadata=MoleculeMetadata(
                        **{key: value for key, value in metadata_dict.items() if value is not None or key in ("aliases", "external_id")}
                    ),
                )
                molecules.append(molecule)
            
            except Exception as exc:
                # Capture failed row details and continue processing
                failed_rows.append({
                    "row_number": row_index + 1,
                    "original_id": str(row.get("ID", "UNKNOWN")),
                    "error_message": str(exc),
                })
            
            row_index += 1

    return molecules, failed_rows
