# Dataset Versioning Policy

Datasets are immutable.

Rules:

1. Raw datasets are never overwritten.
2. Each ingestion creates a new version.
3. Version format:

<dataset>_v<increment>_<date>

Example:
ada_v1_2026_03_02

4. Processed datasets reference raw version.
5. Models must record dataset version used.