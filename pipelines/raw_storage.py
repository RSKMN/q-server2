from __future__ import annotations

import shutil
from pathlib import Path


def store_raw_dataset(csv_path: str, dataset_version: str) -> str:
    """Store raw dataset unchanged under data/raw/p1/<dataset_version>/.

    Preserves the original filename and raises if target file already exists.
    """
    source = Path(csv_path)
    if not source.exists() or not source.is_file():
        raise FileNotFoundError(f"CSV file not found: {csv_path}")

    raw_dir = Path(__file__).resolve().parents[1] / "data" / "raw" / "p1" / dataset_version
    raw_dir.mkdir(parents=True, exist_ok=False)

    target = raw_dir / source.name
    if target.exists():
        raise FileExistsError(f"Raw dataset already exists: {target}")

    shutil.copy2(source, target)
    return str(target.resolve())
