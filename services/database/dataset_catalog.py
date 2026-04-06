from __future__ import annotations

import logging
import os
import re
from pathlib import Path
from typing import Any

import pandas as pd
from pandas.errors import EmptyDataError
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from services.database.dataset_service import DatasetService
from services.database.models import Dataset, Molecule
from services.database.postgres_client import get_session


logger = logging.getLogger(__name__)

PROJECT_ROOT = Path(__file__).resolve().parents[2]


def resolve_datasets_dir() -> Path:
    configured = os.getenv("P3_DATASETS_DIR", "").strip()
    if configured:
        candidate = Path(configured).expanduser()
        if candidate.exists() and candidate.is_dir():
            return candidate

    candidates = [
        PROJECT_ROOT / "data" / "datasets",
        PROJECT_ROOT.parent / "data" / "datasets",
        Path.cwd() / "data" / "datasets",
    ]

    for candidate in candidates:
        if candidate.exists() and candidate.is_dir():
            return candidate

    return candidates[0]


def _clean_value(value: Any) -> Any:
    if value is None or pd.isna(value):
        return None
    if hasattr(value, "item"):
        try:
            return value.item()
        except Exception:
            return value
    return value


def _normalize_text(value: Any) -> str | None:
    cleaned = _clean_value(value)
    if cleaned is None:
        return None
    text = str(cleaned).strip()
    return text or None


def _to_optional_float(value: Any) -> float | None:
    cleaned = _clean_value(value)
    if cleaned is None:
        return None
    number = pd.to_numeric(cleaned, errors="coerce")
    if pd.isna(number):
        return None
    return float(number)


def _fallback_molecule_id(dataset_name: str, row_index: int) -> str:
    prefix = re.sub(r"[^A-Z0-9]", "", dataset_name.upper())[:6]
    prefix = prefix.ljust(6, "X")
    return f"MOL-{prefix}{row_index + 1:04d}"


def _dataset_ranked_subquery():
    return (
        select(
            Dataset.dataset_id.label("dataset_id"),
            Dataset.name.label("name"),
            Dataset.source.label("source"),
            Dataset.version.label("version"),
            Dataset.created_at.label("created_at"),
            func.row_number()
            .over(partition_by=Dataset.name, order_by=Dataset.created_at.desc())
            .label("rank"),
        ).subquery()
    )


def list_dataset_catalog(session: Session) -> list[dict[str, Any]]:
    ranked = _dataset_ranked_subquery()
    molecule_count = func.count(Molecule.molecule_id).label("molecule_count")

    statement = (
        select(
            ranked.c.dataset_id,
            ranked.c.name,
            ranked.c.source,
            ranked.c.version,
            ranked.c.created_at,
            molecule_count,
        )
        .select_from(ranked.outerjoin(Molecule, Molecule.dataset_id == ranked.c.dataset_id))
        .where(ranked.c.rank == 1)
        .group_by(
            ranked.c.dataset_id,
            ranked.c.name,
            ranked.c.source,
            ranked.c.version,
            ranked.c.created_at,
        )
        .order_by(molecule_count.desc(), ranked.c.name.asc())
    )

    rows = session.execute(statement).all()
    return [
        {
            "dataset_id": str(row.dataset_id),
            "name": row.name,
            "source": row.source,
            "version": row.version,
            "created_at": row.created_at.isoformat() if row.created_at else None,
            "count": int(row.molecule_count or 0),
        }
        for row in rows
    ]


def get_dataset_catalog_entry(session: Session, name: str) -> dict[str, Any] | None:
    normalized = name.strip()
    if not normalized:
        return None

    ranked = _dataset_ranked_subquery()
    dataset_statement = (
        select(
            ranked.c.dataset_id,
            ranked.c.name,
            ranked.c.source,
            ranked.c.version,
            ranked.c.created_at,
        )
        .where(ranked.c.rank == 1, ranked.c.name == normalized)
        .limit(1)
    )
    dataset_row = session.execute(dataset_statement).one_or_none()
    if dataset_row is None:
        return None

    molecule_count = session.execute(
        select(func.count(Molecule.molecule_id)).where(Molecule.dataset_id == dataset_row.dataset_id)
    ).scalar_one()

    preview_statement = (
        select(Molecule)
        .where(Molecule.dataset_id == dataset_row.dataset_id)
        .order_by(Molecule.created_at.asc(), Molecule.molecule_id.asc())
        .limit(10)
    )
    preview_rows = session.execute(preview_statement).scalars().all()

    preview = [
        {
            "molecule_id": molecule.molecule_id,
            "smiles": molecule.smiles,
            "molecular_weight": molecule.molecular_weight,
            "logp": molecule.logp,
            "target": molecule.target,
            "created_at": molecule.created_at.isoformat() if molecule.created_at else None,
        }
        for molecule in preview_rows
    ]

    return {
        "dataset_id": str(dataset_row.dataset_id),
        "name": dataset_row.name,
        "source": dataset_row.source,
        "version": dataset_row.version,
        "created_at": dataset_row.created_at.isoformat() if dataset_row.created_at else None,
        "file": f"database://datasets/{dataset_row.name}/{dataset_row.version}",
        "count": int(molecule_count or 0),
        "preview": preview,
    }


def seed_datasets_from_csv_directory(datasets_dir: Path | None = None) -> int:
    """Seed the dataset registry from bundled CSV files when the database is empty.

    The CSV files act as development seed data. Once imported, the database becomes
    the source of truth for dataset discovery and previews.
    """

    source_dir = datasets_dir or resolve_datasets_dir()
    if not source_dir.exists() or not source_dir.is_dir():
        return 0

    csv_paths = sorted(path for path in source_dir.glob("*.csv") if path.is_file())
    if not csv_paths:
        return 0

    session = get_session()
    seeded_datasets = 0
    try:
        service = DatasetService()
        for csv_path in csv_paths:
            dataset_name = csv_path.stem
            dataset_id = service.register_dataset(dataset_name, source="csv-seed", version="seed")

            existing_count = session.execute(
                select(func.count(Molecule.molecule_id)).where(Molecule.dataset_id == dataset_id)
            ).scalar_one()
            if existing_count > 0:
                continue

            try:
                frame = pd.read_csv(csv_path)
            except EmptyDataError:
                frame = pd.DataFrame()

            molecules: list[Molecule] = []
            for row_index, row in frame.iterrows():
                smiles = _normalize_text(row.get("smiles"))
                if not smiles:
                    continue

                molecule_id = _normalize_text(row.get("molecule_id")) or _fallback_molecule_id(dataset_name, row_index)
                molecules.append(
                    Molecule(
                        molecule_id=molecule_id,
                        smiles=smiles,
                        dataset_id=dataset_id,
                        molecular_weight=_to_optional_float(row.get("mw") or row.get("molecular_weight")),
                        logp=_to_optional_float(row.get("logp")),
                        target=_normalize_text(row.get("target")),
                    )
                )

            if molecules:
                session.add_all(molecules)
                session.commit()
            seeded_datasets += 1

        return seeded_datasets
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()