from __future__ import annotations

from pathlib import Path

import numpy as np
import pyarrow.parquet as pq

from pipelines.features.feature_pipeline import store_features_file


REQUIRED_COLUMNS = {
    "molecule_id",
    "smiles",
    "molecular_weight",
    "num_atoms",
    "num_bonds",
    "logp",
    "tpsa",
    "fingerprint",
}


def test_feature_output_parquet_schema(tmp_path: Path) -> None:
    output_path = tmp_path / "features.parquet"

    writer = store_features_file(
        output_path=output_path,
        molecule_ids=["mol1", "mol2"],
        smiles_batch=["CCO", "CCN"],
        molecular_weight=np.array([46.07, 45.08], dtype=np.float32),
        num_atoms=np.array([3, 3], dtype=np.int32),
        num_bonds=np.array([2, 2], dtype=np.int32),
        logp=np.array([-0.001, -0.035], dtype=np.float32),
        tpsa=np.array([20.23, 26.02], dtype=np.float32),
        fingerprint_vectors=[[0, 1, 0], [1, 0, 1]],
        writer=None,
    )
    writer.close()

    table = pq.read_table(output_path)

    assert REQUIRED_COLUMNS.issubset(set(table.column_names))
    assert table.num_rows == 2
