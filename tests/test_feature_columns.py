from __future__ import annotations

from pathlib import Path

import pandas as pd

from pipelines.features.feature_pipeline import _resolve_required_columns, load_dataset


def test_resolve_required_columns_supports_id_and_smiles_variants() -> None:
    id_col, smiles_col = _resolve_required_columns(["ID", "SMILES", "extra"])
    assert id_col == "ID"
    assert smiles_col == "SMILES"



def test_load_dataset_streams_batches_from_processed_molecules(tmp_path: Path) -> None:
    molecules_dir = tmp_path / "processed" / "molecules"
    molecules_dir.mkdir(parents=True, exist_ok=True)

    df = pd.DataFrame(
        {
            "ID": ["mol1", "mol2", "mol3"],
            "SMILES": ["CCO", "CCN", "CCC"],
        }
    )
    df.to_csv(molecules_dir / "sample.csv", index=False)

    batches = list(load_dataset(processed_dir=tmp_path / "processed", batch_size=2))

    assert len(batches) == 2
    assert batches[0] == (["mol1", "mol2"], ["CCO", "CCN"])
    assert batches[1] == (["mol3"], ["CCC"])
