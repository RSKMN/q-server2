from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path


_VERSION_DIR_PATTERN = re.compile(
    r"^(?P<dataset>[a-z0-9_]+)_v(?P<version>\d+)_(?P<date>\d{4}_\d{2}_\d{2})$"
)


def _normalize_dataset_name(dataset_name: str) -> str:
    normalized = dataset_name.strip().lower()
    normalized = re.sub(r"\s+", "_", normalized)
    normalized = re.sub(r"[^a-z0-9_]", "", normalized)
    if not normalized:
        raise ValueError("dataset_name must contain at least one alphanumeric character")
    return normalized


def _raw_p1_root() -> Path:
    return Path(__file__).resolve().parents[1] / "data" / "raw" / "p1"


def generate_dataset_version(dataset_name: str) -> str:
    """Generate the next immutable dataset version for P1 raw storage.

    Format follows docs/data_versioning.md:
      <dataset>_v<increment>_<YYYY_MM_DD>

    Behavior:
    - Scans data/raw/p1 for existing versions
    - Increments version if prior versions exist
    - Never returns an already-existing version directory name
    """
    dataset = _normalize_dataset_name(dataset_name)
    p1_root = _raw_p1_root()
    p1_root.mkdir(parents=True, exist_ok=True)

    max_version = 0
    for entry in p1_root.iterdir():
        if not entry.is_dir():
            continue
        match = _VERSION_DIR_PATTERN.match(entry.name)
        if not match:
            continue
        if match.group("dataset") != dataset:
            continue
        version_number = int(match.group("version"))
        if version_number > max_version:
            max_version = version_number

    next_version = max_version + 1
    date_part = datetime.now().strftime("%Y_%m_%d")

    candidate = f"{dataset}_v{next_version}_{date_part}"
    while (p1_root / candidate).exists():
        next_version += 1
        candidate = f"{dataset}_v{next_version}_{date_part}"

    return candidate
