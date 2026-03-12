from __future__ import annotations

import pytest
from rdkit import Chem
from rdkit.Chem import Crippen, Descriptors, rdMolDescriptors

from pipelines.features.feature_pipeline import compute_rdkit_features


def test_compute_rdkit_features_valid_smiles() -> None:
    smiles = "CCO"
    fingerprint_size = 256

    result = compute_rdkit_features(smiles=smiles, fingerprint_size=fingerprint_size)

    assert result is not None
    molecular_weight, num_atoms, num_bonds, logp, tpsa, fingerprint = result

    molecule = Chem.MolFromSmiles(smiles)
    assert molecule is not None

    assert molecular_weight == pytest.approx(Descriptors.MolWt(molecule), rel=1e-6)
    assert num_atoms == molecule.GetNumAtoms()
    assert num_bonds == molecule.GetNumBonds()
    assert logp == pytest.approx(Crippen.MolLogP(molecule), rel=1e-6)
    assert tpsa == pytest.approx(rdMolDescriptors.CalcTPSA(molecule), rel=1e-6)
    assert len(fingerprint) == fingerprint_size
    assert set(fingerprint).issubset({0, 1})


def test_compute_rdkit_features_invalid_smiles_returns_none() -> None:
    assert compute_rdkit_features(smiles="not-a-smiles", fingerprint_size=256) is None
