# Quick Reference Guide

## 📌 Essential Commands

### Setup & Installation
```bash
# Clone and navigate
cd research-lab

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
nano .env  # Edit as needed
```

### Development
```bash
# Run API locally
python -m uvicorn api.main:app --reload --port 8000

# Run tests
pytest
pytest --cov=schemas --cov=pipelines

# Format code
black schemas/ pipelines/ services/ api/

# Lint code
ruff check schemas/

# Type checking
mypy schemas/ pipelines/
```

### Docker
```bash
# Start all services
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop services
docker-compose down

# Build image
docker build -t research-lab:latest .
```

### Validation Examples
```python
from schemas import Molecule
from pipelines import MoleculeValidator

# Create validator
validator = MoleculeValidator()

# Validate data
result = validator.validate({
    "molecule_id": "MOL-ABC12345",
    "smiles": "CCO",
    "source_dataset": "chembl",
    "created_at": "2026-03-02T10:30:00Z"
})

print(f"Valid: {result.is_valid}")
print(f"Errors: {result.errors}")
```

---

## 📂 Key Files & Directories

| Path | Purpose |
|------|---------|
| `schemas/` | Data contracts (JSON + Pydantic) |
| `pipelines/` | Data validation & ETL |
| `services/` | Business logic |
| `api/` | REST endpoints |
| `infrastructure/` | Configuration & deployment |
| `data/` | Data repository |
| `.env.example` | Configuration template |
| `requirements.txt` | Python dependencies |
| `docker-compose.yml` | Local development environment |

---

## 🔑 Key Configuration Variables

```bash
# Data Paths
P3_DATA_ROOT=/path/to/data
P3_RAW_DATA=${P3_DATA_ROOT}/raw
P3_PROCESSED_DATA=${P3_DATA_ROOT}/processed

# Database
P3_POSTGRES_HOST=localhost
P3_POSTGRES_DB=research_lab

# API
P3_API_PORT=8000
P3_API_RELOAD=true

# Storage
P3_STORAGE_BACKEND=local  # or s3, gcs, azure

# Logging
P3_LOG_LEVEL=INFO
```

---

## 🧪 Quick Test

```python
# Test that everything is set up correctly
python -c "
from schemas import Molecule, Protein, Embedding
from pipelines import MoleculeValidator, ProteinValidator, EmbeddingValidator
from infrastructure import get_settings

print('✓ Schemas loaded')
print('✓ Validators loaded')
print('✓ Settings loaded')
print('✓ Setup complete!')
"
```

---

## 📊 Architecture at a Glance

```
API Gateway (FastAPI)
    ↓
Services Layer
    ↓
Data Layer
    ├── PostgreSQL (Metadata)
    ├── Cloud Storage (Raw/Processed Data)
    └── Redis (Caching)
```

---

## 🎯 For Each Team

### P1 (Data & Chemistry)
- Upload to: `data/raw/{zinc,chembl,pdbbind,drugbank}/`
- Use schema: `molecule_schema.json`
- Validate with: `MoleculeValidator`

### P2 (ML Models)
- Read from: `data/processed/features/`
- Write to: `data/processed/embeddings/`
- Use schema: `embedding_schema.json`
- Track via: `EmbeddingMetadata`

### P4 (Simulation)
- Store in: `data/simulations/`
- Use schema: `protein_schema.json`
- Track metadata in: `data/metadata/`

### P5 (Interface)
- Query via: `/api/v1/molecules`, `/api/v1/proteins`, `/api/v1/embeddings`
- Use: REST or GraphQL endpoints
- Requires: API key authentication

---

## 📝 Documentation Map

| Document | Purpose |
|----------|---------|
| `README.md` | Project overview |
| `ARCHITECTURE.md` | System design |
| `DEVELOPMENT.md` | Development guide |
| `PROJECT_SUMMARY.md` | Completion summary |
| `schemas/README.md` | Schema documentation |
| `api/README.md` | API reference |
| `services/README.md` | Service patterns |
| `QUICKSTART.md` | This file |

---

## 🐛 Troubleshooting

**Import Error?**
```bash
export PYTHONPATH="${PYTHONPATH}:/path/to/research-lab"
```

**Database Connection Failed?**
```bash
docker-compose up -d postgres
psql -h localhost -U postgres -d research_lab
```

**Validation Failed?**
- Check timestamp format: Must be ISO 8601 (with Z for UTC)
- Check required fields: All marked as required must be present
- Check ID format: molecule_id must match `MOL-[A-Z0-9]{8,16}`

**Port Already In Use?**
```bash
# Change port in docker-compose.yml or API start command
docker-compose down
# Edit ports in docker-compose.yml
docker-compose up -d
```

---

## 🔗 External Resources

- [Pydantic Docs](https://docs.pydantic.dev/)
- [FastAPI Docs](https://fastapi.tiangolo.com/)
- [JSON Schema](https://json-schema.org/)
- [pytest Docs](https://docs.pytest.org/)
- [Docker Docs](https://docs.docker.com/)

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-02  
**For Support**: See documentation files or contact P3 Systems Team
