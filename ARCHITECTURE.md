# P3 Infrastructure - Complete Setup Guide

This document provides a comprehensive guide to the P3 (Systems & Backend) infrastructure for the AI-driven Drug Discovery research lab.

---

## 📋 Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Directory Structure](#directory-structure)
4. [Quick Start](#quick-start)
5. [Data Schemas](#data-schemas)
6. [Data Flow](#data-flow)
7. [Development](#development)
8. [Deployment](#deployment)
9. [Testing](#testing)
10. [Troubleshooting](#troubleshooting)

---

## 🎯 Project Overview

The P3 infrastructure provides the backend foundation for molecular ML workflows supporting:

- **P1 (Data & Chemistry)**: Molecular data ingestion and preparation
- **P2 (ML Models)**: Model training and feature engineering
- **P4 (Simulation)**: Molecular simulation outputs
- **P5 (Interface)**: User-facing applications

### Core Principles

✅ **Raw data immutability** - Never modify ingested data  
✅ **API-first access** - No direct filesystem access from other teams  
✅ **Reproducible pipelines** - Version control for all transformations  
✅ **Scalable infrastructure** - Kubernetes-ready architecture  
✅ **Schema-driven** - Type-safe data contracts

---

## 🏗️ Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│                    API Gateway (FastAPI)            │
│  ┌───────────────────────────────────────────────┐  │
│  │ Authentication │ Rate Limiting │ CORS Support │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
                           ↓
    ┌──────────────────────────────────────────────────┐
    │            Services Layer                         │
    ├──────────────────────────────────────────────────┤
    │ • Data Access Service                            │
    │ • Feature Computation Service                    │
    │ • Embedding Service                              │
    │ • Validation Service                             │
    └──────────────────────────────────────────────────┘
                           ↓
    ┌──────────────────────────────────────────────────┐
    │            Data Layer                            │
    ├──────────────────────────────────────────────────┤
    │ • PostgreSQL (Metadata)                          │
    │ • Cloud Storage (Raw/Processed Data)             │
    │ • Redis (Caching)                                │
    └──────────────────────────────────────────────────┘
```

### Data Layering

```
Raw Data (Immutable)
    ↓
[Validation Pipeline]
    ↓
Processed Data (Versioned)
    ↓
[Feature Engineering]
    ↓
Features & Embeddings
    ↓
[ML Models]
    ↓
Predictions / Insights
```

---

## 📁 Directory Structure

### Complete Hierarchy

```
research-lab/
├── data/                          # Data repository
│   ├── raw/                       # Original, untransformed data
│   │   ├── zinc/                  # ZINC database
│   │   ├── chembl/                # ChEMBL data
│   │   ├── pdbbind/               # PDBbind structures
│   │   └── drugbank/              # DrugBank data
│   │
│   ├── processed/                 # Transformed datasets
│   │   ├── graphs/                # Molecular graphs
│   │   ├── features/              # Molecular features
│   │   └── embeddings/            # ML embeddings
│   │
│   ├── generated/                 # Synthetically generated data
│   ├── simulations/               # Simulation outputs
│   └── metadata/                  # Lineage, versioning
│
├── schemas/                       # Data contracts (JSON & Pydantic)
│   ├── molecule_schema.json       # Molecule data structure
│   ├── protein_schema.json        # Protein data structure
│   ├── embedding_schema.json      # Embedding data structure
│   ├── models.py                  # Pydantic models for validation
│   ├── __init__.py
│   └── README.md
│
├── pipelines/                     # ETL/ELT pipelines
│   ├── validators.py              # Data validation utilities
│   ├── example_validation.py      # Example usage
│   ├── __init__.py
│   ├── ingestors/                 # Data ingestion
│   ├── transformers/              # Data transformation
│   └── exporters/                 # Data export
│
├── services/                      # Business logic services
│   ├── molecule_service.py        # Molecule operations
│   ├── protein_service.py         # Protein operations
│   ├── embedding_service.py       # Embedding operations
│   └── __init__.py
│
├── api/                           # REST/GraphQL APIs
│   ├── main.py                    # App entry point
│   ├── routes/
│   │   ├── molecules.py           # Molecule endpoints
│   │   ├── proteins.py            # Protein endpoints
│   │   └── embeddings.py          # Embedding endpoints
│   └── __init__.py
│
├── infrastructure/                # InfrastructureAsCode
│   ├── config.py                  # Configuration management
│   ├── prometheus.yml             # Monitoring config
│   ├── k8s/                       # Kubernetes manifests
│   │   ├── deployment.yaml
│   │   ├── service.yaml
│   │   └── configmap.yaml
│   └── __init__.py
│
├── tests/                         # Test suite
│   ├── conftest.py
│   ├── unit/
│   ├── integration/
│   └── e2e/
│
├── notebooks/                     # Jupyter notebooks
│   ├── exploration/
│   ├── analysis/
│   └── documentation/
│
├── Dockerfile                     # Container image
├── docker-compose.yml             # Local dev environment
├── requirements.txt               # Python dependencies
├── .env.example                   # Example environment config
├── .gitignore                     # Git ignore rules
├── README.md                      # Main documentation
└── ARCHITECTURE.md                # This file
```

---

## 🚀 Quick Start

### Prerequisites

- Python 3.10+
- Docker & Docker Compose (optional, for containerized setup)
- PostgreSQL (optional, for local dev)
- Git

### Installation

1. **Clone and setup**
   ```bash
   cd research-lab
   cp .env.example .env
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment**
   ```bash
   # Edit .env with your settings
   nano .env
   ```

4. **Verify schemas**
   ```bash
   python -c "from schemas import Molecule, Protein, Embedding; print('✓ Schemas loaded')"
   ```

### Quick Test

```python
from schemas import Molecule
from pipelines import MoleculeValidator

# Validate a molecule
data = {
    "molecule_id": "MOL-TEST00001",
    "smiles": "CCO",
    "source_dataset": "chembl",
    "created_at": "2026-03-02T10:30:00Z"
}

validator = MoleculeValidator()
result = validator.validate(data)
print(f"Valid: {result.is_valid}")
```

---

## 📐 Data Schemas

### Molecule Schema

**Fields**:
- `molecule_id`: Unique identifier
- `smiles`: SMILES representation
- `atom_features`: Optional atom-level features
- `bond_features`: Optional bond-level features
- `source_dataset`: Origin (zinc, chembl, pdbbind, drugbank)
- `created_at`: Creation timestamp
- `metadata`: Additional properties

**Example**:
```json
{
  "molecule_id": "MOL-ABC12345",
  "smiles": "CC(=O)OC1=CC=CC=C1C(=O)O",
  "source_dataset": "chembl",
  "created_at": "2026-03-02T10:30:00Z",
  "metadata": {
    "molecular_weight": 180.16,
    "drug_like": true
  }
}
```

### Protein Schema

**Fields**:
- `protein_id`: Unique identifier
- `sequence`: Amino acid sequence
- `structure_source`: experimental, predicted, etc.
- `pdb_reference`: Optional PDB code
- `created_at`: Creation timestamp
- `metadata`: Rich metadata

**Example**:
```json
{
  "protein_id": "PROT-XYZ98765",
  "sequence": "MKTAYIAKQRQ...",
  "structure_source": "experimental",
  "pdb_reference": "1ABC",
  "created_at": "2026-03-02T10:30:00Z"
}
```

### Embedding Schema

**Fields**:
- `embedding_id`: Unique identifier
- `source_id`: Source molecule/protein ID
- `model_version`: Version of embedding model
- `vector_dimension`: Dimension of embedding
- `storage_location`: Path/URI to vector file
- `created_at`: Creation timestamp
- `metadata`: Model and computation details

---

## 🔄 Data Flow

### Ingestion Pipeline

```
External Data Source (P1)
           ↓
    [Read & Parse]
           ↓
    [Validate Schema]
           ↓
    [Check Quality]
           ↓
    [Store Raw Data]
           ↓
    [Record Metadata]
           ↓
  Raw Data Repository
```

### Processing Pipeline

```
Raw Data
     ↓
[Transform]
     ↓
[Feature Engineer]
     ↓
[Validate Output]
     ↓
Processed Data
```

### Model Pipeline (P2 Integration)

```
Processed Data
     ↓
[Load Features]
     ↓
[Preprocess]
     ↓
[Generate Embeddings]
     ↓
[Store with Metadata]
     ↓
Embedding Repository
```

---

## 🛠️ Development

### Running Locally

**Option 1: Native Python**
```bash
# Set up environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run API
python -m uvicorn api.main:app --reload --port 8000
```

**Option 2: Docker Compose**
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down
```

### Testing Validation

```python
from pipelines.validators import MoleculeValidator, validate_batch
import json

# Load test data
with open('test_molecules.jsonl') as f:
    molecules = [json.loads(line) for line in f]

# Validate
validator = MoleculeValidator()
batch_result = validate_batch(molecules, MoleculeValidator)

print(f"Success rate: {batch_result.success_rate:.2%}")
print(f"Errors: {batch_result.invalid_count}")
```

### Code Style

```bash
# Format with Black
black schemas/ pipelines/ services/ api/

# Lint with Ruff
ruff check schemas/ pipelines/ services/ api/

# Type check with MyPy
mypy schemas/ pipelines/
```

---

## 🚢 Deployment

### Docker Build

```bash
# Build image
docker build -t research-lab:latest .

# Run container
docker run -p 8000:8000 \
  -e P3_POSTGRES_HOST=postgres \
  -e P3_LOG_LEVEL=INFO \
  research-lab:latest
```

### Kubernetes Deployment

```bash
# Create namespace
kubectl create namespace research-lab

# Apply manifests
kubectl apply -f infrastructure/k8s/ -n research-lab

# Check status
kubectl get pods -n research-lab
kubectl logs -f deployment/p3-api -n research-lab
```

### Configuration

Set environment variables in `.env`:
```bash
P3_ENVIRONMENT=production
P3_POSTGRES_HOST=prod-db.example.com
P3_STORAGE_BACKEND=s3
P3_S3_BUCKET=research-lab-prod
P3_LOG_LEVEL=INFO
```

---

## ✅ Testing

### Run Tests

```bash
# All tests
pytest

# Specific test file
pytest tests/unit/test_validators.py

# With coverage
pytest --cov=schemas --cov=pipelines

# Verbose output
pytest -vv
```

### Test Data

Example test molecules in `tests/fixtures/molecules.jsonl`:
```json
{"molecule_id": "MOL-TEST00001", "smiles": "CCO", "source_dataset": "zinc", "created_at": "2026-03-02T10:00:00Z"}
{"molecule_id": "MOL-TEST00002", "smiles": "CC(=O)O", "source_dataset": "chembl", "created_at": "2026-03-02T10:00:00Z"}
```

---

## 🔧 Troubleshooting

### Common Issues

#### Issue: Import errors for schemas
```python
ModuleNotFoundError: No module named 'schemas'
```
**Solution**: Add research-lab directory to PYTHONPATH:
```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/research-lab"
```

#### Issue: Validation fails with "Invalid date format"
**Solution**: Ensure timestamps are ISO 8601 format:
```python
"created_at": "2026-03-02T10:30:00Z"  # ✓ Correct
"created_at": "2026-03-02 10:30:00"   # ✗ Wrong
```

#### Issue: Docker compose won't start postgres
**Solution**: Check port availability and logs:
```bash
docker-compose logs postgres
# If port 5432 is in use, change port in docker-compose.yml
```

#### Issue: Permission denied on data directories
**Solution**: Set correct permissions:
```bash
chmod -R 755 research-lab/data
```

---

## 📚 Additional Resources

- [Schema Documentation](schemas/README.md)
- [API Documentation](api/README.md)
- [Pipeline Documentation](pipelines/README.md)
- [Configuration Guide](infrastructure/config.py)
- [Example Validation Script](pipelines/example_validation.py)

---

## 📞 Support

For questions or issues:
1. Check the documentation
2. Review example scripts
3. Contact P3 Systems Team
4. Check GitHub Issues

---

**Last Updated**: 2026-03-02  
**Version**: 1.0.0  
**Status**: Production Ready
