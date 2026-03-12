# P3 Research Lab
## Drug Discovery Backend Infrastructure & API

This repository contains the core backend infrastructure, data pipelines, vector database integration, and REST API for AI-driven molecular drug discovery research.

---

## 🏗️ Architecture Overview

P3 Research Lab provides:
- **Data Processing Pipelines**: Streaming molecular feature extraction and embedding generation
- **Vector Database**: Milvus integration for similarity search at scale
- **API Layer**: FastAPI endpoints for molecule queries, embeddings, and experiments
- **Orchestration**: Prefect-based scheduling for daily data pipeline execution
- **Database**: PostgreSQL for metadata, molecules, features, and embeddings

---

## 📁 Directory Structure

### `/data`
Central data repository following immutable raw data principles.

#### `/data/raw`
**Purpose**: Store original, untransformed datasets from external sources.

- **`/data/raw/zinc/`** - ZINC database molecular structures
- **`/data/raw/chembl/`** - ChEMBL bioactivity data
- **`/data/raw/pdbbind/`** - PDBbind protein-ligand binding data
- **`/data/raw/drugbank/`** - DrugBank pharmaceutical data

**Important**: Raw data must NEVER be modified. All transformations happen downstream.

#### `/data/processed`
**Purpose**: Store transformed, cleaned, and feature-engineered datasets.

- **`/data/processed/graphs/`** - Graph representations of molecules (nodes, edges)
- **`/data/processed/features/`** - Extracted molecular features (descriptors, fingerprints)
- **`/data/processed/embeddings/`** - Vector embeddings from trained models

#### `/data/generated`
**Purpose**: Store synthetically generated molecules or augmented datasets.

#### `/data/metadata`
**Purpose**: Store metadata, lineage tracking, and data versioning information.

---

### `/pipelines`
**Purpose**: ETL/ELT pipelines for data ingestion, transformation, and validation.

Contains:
- Data ingestion scripts
- Feature engineering pipelines
- Data validation workflows
- Prefect flow orchestration configurations

---

### `/services`
**Purpose**: Backend microservices providing core business logic.

Components:
- PostgreSQL client & ORM models
- Molecule processing services
- Vector store (Milvus) integration
- Experiment management

---

### `/schemas`
**Purpose**: Data contracts and schema definitions.

Contains:
- JSON schemas for data validation
- Pydantic models for type safety
- API contract definitions

---


### `/api`
**Purpose**: RESTful APIs for data access and service orchestration.

Provides:
- Molecule query endpoints
- Feature computation APIs
- Embedding search endpoints
- Health/status checks

---

---

## 🚀 Quick Start

### Local Development

```bash
# Prerequisites
# - Python 3.12+ (conda env: rl-cpc)
# - Docker & Docker Compose
# - Git

# 1. Activate environment
conda activate rl-cpc

# 2. Install dependencies
pip install -r requirements.txt

# 3. Start containerized services
docker compose up -d

# 4. Wait for services to be healthy (~30 seconds)
docker compose ps

# 5. Run tests
pytest tests/ -q

# 6. Start API server
python -m uvicorn api.main:app --reload
# API runs at http://localhost:8000
```

### Run Feature Extraction Pipeline

```bash
# Process one batch
python pipelines/features/feature_pipeline.py

# Customize batch size and workers
P3_FEATURE_BATCH_SIZE=5000 P3_FEATURE_WORKERS=4 \
python pipelines/features/feature_pipeline.py

# Check checkpoint status
cat data/checkpoints/feature_pipeline_checkpoint.json
```

### Run Embedding Pipeline

```bash
# Generate embeddings for features
python pipelines/embeddings/embedding_pipeline.py

# Customize batch size and collection name
P3_EMBEDDING_BATCH_SIZE=3000 \
P3_COLLECTION_NAME=molecule_embeddings \
python pipelines/embeddings/embedding_pipeline.py

# Skip Milvus if collection backend unavailable
P3_SKIP_MILVUS_ON_ERROR=true \
python pipelines/embeddings/embedding_pipeline.py
```

---

## ⚙️ Environment Configuration

Core environment variables for pipeline tuning:

```bash
# Feature Extraction
P3_FEATURE_BATCH_SIZE=2000              # Molecules per batch
P3_FEATURE_WORKERS=8                    # RDKit fingerprint workers (ProcessPoolExecutor)
P3_FINGERPRINT_SIZE=256                 # Morgan fingerprint dimensions
P3_DISABLE_METADATA_UPSERT=false        # Skip PostgreSQL molecule upsert

# Embedding Generation
P3_EMBEDDING_BATCH_SIZE=5000            # Molecules per batch
P3_COLLECTION_NAME=molecule_embeddings  # Milvus collection name
P3_SKIP_MILVUS_ON_ERROR=false           # Continue if Milvus unavailable

# Database & Timeout
P3_DB_OPERATION_TIMEOUT_SECONDS=15      # SQLAlchemy timeout (metadata operations)
P3_POSTGRES_HOST=postgres               # Docker Compose: postgres service
P3_MILVUS_HOST=milvus                   # Docker Compose: milvus service

# API
P3_ENVIRONMENT=development              # development, staging, production
P3_LOG_LEVEL=INFO                       # Logging verbosity
```

---

## 📋 Tests

Run the full test suite:

```bash
# All tests
pytest tests/ -q

# Specific test files
pytest tests/test_api_ins.py tests/test_postgres.py -v

# With coverage
pytest tests/ --cov=pipelines --cov=services --cov=api
```

**Key Test Files**:
- `test_api_ins.py`, `test_api_mol_sim.py` – API route validation
- `test_postgres.py` – Database connectivity and ORM models
- `test_milvus_connection.py`, `test_milvus_collection.py` – Vector store
- `test_vector_search.py` – Similarity search
- `test_feature_*.py` – Feature extraction pipelines

---

## 📐 Design Principles

### 1. Immutable Raw Data
Raw datasets are never modified after ingestion. All transformations create new processed datasets.

### 2. API-First Access
Teams access data through APIs, not direct file system access. This ensures:
- Access control and audit trails
- Version management
- Consistent data interfaces

### 3. Reproducible Pipelines
All data transformations are:
- Version controlled
- Parameterized
- Logged with lineage tracking

### 4. Scalable Infrastructure
Architecture supports:
- Horizontal scaling via Docker Compose
- Distributed processing (ProcessPoolExecutor)
- Multi-environment deployments

### 5. Schema-Driven Development
All data exchanges follow defined contracts in `/schemas`, ensuring:
- Type safety
- Validation at ingestion
- Clear interface contracts between teams

---

## � Core Services

### API (`/api/main.py`)
FastAPI application providing RESTful endpoints:
- **`GET /health`** - Service health status and timestamp
- **`GET /`** - Root endpoint
- **Routers**: molecules, embeddings, experiments, health

Run with:
```bash
docker compose up api
# or
uvicorn api.main:app --host 0.0.0.0 --port 8000 --reload
```

### PostgreSQL (`services/database/`)
Metadata persistence for:
- Datasets (versioning, lineage)
- Molecules (ID, SMILES, metadata)
- Molecular Features (molecular_weight, logp, tpsa, etc.)
- Embeddings (model_name, dimension, creation timestamp)

Connection via `services/database/postgres_client.py` SQLAlchemy ORM.

### Milvus Vector Store (`services/vector_store/`)
Vector similarity search for embeddings:
- Collection: `molecule_embeddings`
- Vector dimension: 768
- Metric: COSINE similarity
- Batch insert + flush for consistency

Interact via `services/vector_store/milvus_client.py`.

### Redis Cache (`services/cache/`)
Optional caching layer for query results and feature computation.

---

## 📦 Docker Deployment

All services run in Docker Compose:

```bash
# Start all services (postgres, redis, milvus, api, grafana, prometheus)
docker compose up -d

# Check service health
docker compose ps

# Rebuild API image after code changes
docker compose up --build api

# Restart services
docker compose restart

# Stop and clean
docker compose down -v
```

**Container Network**: `p3-network` (172.28.0.0/16)
- Services reference each other by DNS name (e.g., `postgres`, `milvus`, `redis`)

**Service Ports**:
- API: `8000`
- PostgreSQL: `5432`
- Redis: `6379`
- Milvus gRPC: `19530`
- Milvus HTTP: `9091`
- Prometheus: `9090`
- Grafana: `3000`

---

## 🤝 Operations & Deployment

### Daily Pipeline Execution

The system runs an automated daily pipeline at **02:00 UTC (07:30 IST)** via Prefect scheduler:

1. **Feature Extraction** (`pipelines/features/feature_pipeline.py`)
   - Streams molecule dataset from `/data/processed/molecules/`
   - Extracts RDKit-based molecular features (descriptors, fingerprints)
   - Writes parquet batches to `/data/processed/features/`
   - Upserts molecule metadata to PostgreSQL
   - **Performance**: ~1000-2000 molecules/sec with checkpointing support

2. **Embedding Generation** (`pipelines/embeddings/embedding_pipeline.py`)
   - Generates vector embeddings from SMILES strings
   - Stores embeddings in parquet format
   - Inserts vectors into Milvus collection
   - Upserts embedding metadata to PostgreSQL

3. **Orchestration** (`orchestration/flows/data_pipeline_flow.py`)
   - Prefect flow managing sequential execution
   - Task retries: 3 attempts with 60-second backoff
   - Daily cron trigger: `0 2 * * *` (configurable timezone)
   - Deployment: `molecule-data-pipeline-daily`

### Starting the Pipeline

```bash
# One-time flow execution
python orchestration/flows/data_pipeline_flow.py

# Deploy and serve daily schedule (requires Prefect server running)
PREFECT_API_URL=http://127.0.0.1:4200/api \
PREFECT_SERVER_ALLOW_EPHEMERAL_MODE=false \
python orchestration/flows/data_pipeline_flow.py --serve
```

---

## 🏁 Production Readiness Checklist

- ✅ Docker Compose all services validated
- ✅ PostgreSQL schema created on API startup
- ✅ Milvus collection auto-created on embedding pipeline start
- ✅ Feature pipeline: checkpointing + watchdog + metrics
- ✅ Embedding pipeline: watchdog + DB timeout guards + optional Milvus fallback
- ✅ Prefect deployment: daily cron `0 2 * * *` with 3-retry policy
- ✅ Test suite: API routes, Postgres, Milvus, vector search
- ⚠️ **TODO**: Start dedicated Prefect server (currently using ephemeral mode)
- ⚠️ **TODO**: Set up workers for Prefect job execution

### Known Limitations

- Prefect currently uses ephemeral server for CLI operations (temporary)
- Milvus local storage mode uses embedded etcd/minio (not for distributed deployments)
- Redis cache configured but not yet integrated into feature/embedding pipelines

---

## 📊 Performance Metrics

Typical pipeline performance on development hardware:

| Stage | Throughput | Batch Duration | Output Format |
|-------|-----------|-----------------|---------------|
| Feature Extraction | 1000–2000 mol/s | 1–10 min/2000 mol | Parquet (snappy) |
| Embedding Generation | 5000–10000 mol/s | 30–60 sec/5000 mol | Parquet + Milvus |
| Milvus Insert | 3000–5000 mol/s | 20–40 sec/5000 mol | Vector collection |
| Similarity Search | <100 ms | per query (top-k=10) | JSON results |

---

## 🐛 Troubleshooting

### Milvus Connection Refused
```bash
# Verify container is running
docker compose ps milvus

# Check logs for startup errors
docker logs p3-milvus | tail -50

# Restart and rebuild
docker compose down -v milvus
docker compose up -d milvus
sleep 30
python tests/test_milvus_connection.py
```

### Feature Pipeline Stalls
```bash
# Check checkpoint for last successfully processed batch
cat data/checkpoints/feature_pipeline_checkpoint.json

# Enable debug logging
P3_LOG_LEVEL=DEBUG python pipelines/features/feature_pipeline.py

# Check memory usage (psutil-based telemetry)
# Look for "Batch metrics | memory=XXX MB" in logs
```

### PostgreSQL Connection Issues
```bash
# Verify database is ready
docker compose ps postgres

# Check connectivity from host
psql -h 127.0.0.1 -U postgres -d research_lab -c "SELECT 1"

# Reset container
docker compose down -v postgres
docker compose up -d postgres
sleep 10
python tests/test_postgres.py
```

### API Health Check
```bash
# Local
curl http://localhost:8000/health
curl http://localhost:8000/

# In container
docker compose exec api curl http://localhost:8000/health
```

---

## 📚 Documentation

- [API README](api/README.md) - Endpoint reference
- [Schemas README](schemas/README.md) - Data contracts
- [Services README](services/README.md) - Backend components
- [ARCHITECTURE](ARCHITECTURE.md) - System design
- [DEVELOPMENT](DEVELOPMENT.md) - Dev guidelines
- [QUICKSTART](QUICKSTART.md) - 5-minute setup

---

## 🔒 Security & Data Governance

- Raw data immutability enforced by schema versioning
- All dataset versions tracked in PostgreSQL lineage tables
- API layer provides role-based access control foundation
- PostgreSQL password stored in environment (use Vault in production)
- Milvus runs embedded (local development only; use secured cluster for production)

---

## 📞 Support

For questions or issues:
1. Check [DEVELOPMENT.md](DEVELOPMENT.md) for setup issues
2. Review test failures: `pytest tests/ -vv`
3. Check Prefect UI logs at `http://localhost:4200` (when server running)
4. Review container logs: `docker compose logs -f <service_name>`

---

## 📄 License

[Add appropriate license]

---

**Last Updated**: March 12, 2026
