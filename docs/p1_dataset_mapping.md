# P1 Dataset Mapping (ADA Dataset)

Source: P1 Chemistry Team

This document defines how P1 output fields map to internal
Research Lab Molecule Schema.

---

## Column Mapping

| P1 Column | Internal Field | Meaning |
|------------|---------------|---------|
| ID | molecule_id | Unique molecule identifier |
| SMILES | smiles | Molecular structure |
| score | docking_score | Binding affinity score |
| target | target_protein | Target protein |
| MW | molecular_weight | Molecular mass |
| XLogP | logp | Lipophilicity |
| HBA | hbond_acceptors | Hydrogen bond acceptors |
| HBD | hbond_donors | Hydrogen bond donors |

---

## Notes
- Multiple IDs separated by commas represent aliases.
- score represents docking energy (lower is better).