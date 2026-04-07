# P3 Research Lab
## Drug Discovery Backend Infrastructure and API

This repository contains backend APIs, data pipelines, vector search infrastructure, and supporting services for molecular drug discovery workflows. It also includes a Next.js frontend under `frontend/`.

## Overview

P3 Research Lab includes:
- FastAPI backend with routers for health, molecules, embeddings, pipeline experiments, datasets, and results
- PostgreSQL metadata storage and SQLAlchemy models
- Milvus vector search integration
- Redis service in Docker Compose for runtime support
- Feature and embedding pipelines plus Prefect orchestration
- Frontend workspace for dashboard and pipeline interaction

## Current Repository Layout

- `api/`: FastAPI app, routers, and API schemas
- `pipelines/`: ingestion, feature, embedding, validation, versioning flows
- `orchestration/flows/`: Prefect orchestration entrypoints
- `services/database/`: PostgreSQL clients, models, dataset catalog
- `services/vector_store/`: Milvus client and embedding model utilities
- `services/experiments/`: experiment business logic
- `data/datasets/`: sample CSV datasets (`demo.csv`, `drugbank.csv`, `zinc.csv`)
- `schemas/`: JSON schema and shared model contracts
- `frontend/`: Next.js 14 frontend app
- `tests/`: API, database, Milvus, and pipeline tests

## API Surface (FastAPI)

Main app: `api/main.py`

Core routes currently mounted:
- `GET /`: root status message
- `GET /health`: health check
- `POST /molecules/similar`: similarity search by SMILES
- `POST /embeddings`: insert embeddings into Milvus
- `GET /datasets`: list dataset catalog entries
- `GET /datasets/{name}`: get dataset metadata

Pipeline and experiment routes (`/pipeline` prefix):
- `POST /pipeline/run`
- `GET /pipeline/status/{experiment_id}`
- `GET /pipeline/results/{experiment_id}`
- `POST /pipeline/experiments`
- `GET /pipeline/experiments`
- `GET /pipeline/experiments/summary`
- `GET /pipeline/runs/recent`
- `POST /pipeline/experiments/{id}/run`
- `POST /pipeline/runs/{id}/metrics`
- `POST /pipeline/runs/{id}/finish`

Result helper routes (`/results` prefix):
- `GET /results/overview`
- `GET /results/candidates`
- `GET /results/profiles`
- `GET /results/artifacts`
- `GET /results/{experiment_id}`

## Quick Start

For deployment-specific guidance, see [DEPLOYMENT.md](DEPLOYMENT.md).

### Local Development

```bash
# 1) Activate your Python environment
# Example (conda):
conda activate rl-cpc

# 2) Install dependencies
pip install -r requirements.txt

# 3) Start infrastructure services
docker compose up -d postgres redis milvus

# 4) Start API
python -m uvicorn api.main:app --reload --port 8000

# 5) Optional: run tests
pytest tests/ -q
```

API base URL: `http://localhost:8000`

### Run Pipelines

```bash
# Feature pipeline
python pipelines/features/feature_pipeline.py

# Embedding pipeline
python pipelines/embeddings/embedding_pipeline.py

# Prefect orchestration (one-shot)
python orchestration/flows/data_pipeline_flow.py

# Prefect deployment serve mode
python orchestration/flows/data_pipeline_flow.py --serve
```

## Environment Variables

Common variables used in this repository:

```bash
# API
P3_ENVIRONMENT=development
P3_LOG_LEVEL=INFO

# Database
P3_POSTGRES_HOST=postgres
P3_POSTGRES_PORT=5432
P3_POSTGRES_DB=research_lab
P3_POSTGRES_USER=postgres
P3_POSTGRES_PASSWORD=postgres

# Milvus
P3_MILVUS_HOST=milvus
P3_MILVUS_PORT=19530
P3_COLLECTION_NAME=molecule_embeddings

# Pipeline tuning
P3_FEATURE_BATCH_SIZE=2000
P3_FEATURE_WORKERS=8
P3_EMBEDDING_BATCH_SIZE=5000
P3_SKIP_MILVUS_ON_ERROR=false
P3_DB_OPERATION_TIMEOUT_SECONDS=15

# Upstream AI service used by /pipeline run/status/results proxy routes
AI_SERVICE_URL=http://localhost:9000
```

See `.env.example` for a template.

## Docker Compose Services

`docker-compose.yml` defines:
- `postgres` on `5432`
- `redis` on `6379`
- `milvus` on `19530` and `9091`
- `api` on `8000`
- `prometheus` on `9090`
- `grafana` on `3000`

Commands:

```bash
docker compose up -d
docker compose ps
docker compose logs -f api
docker compose down
```

## Testing

```bash
# Full suite
pytest tests/ -q

# Targeted examples
pytest tests/test_api_ins.py tests/test_api_mol_sim.py -v
pytest tests/test_postgres.py tests/test_milvus_connection.py -v
```

## Troubleshooting

### API not reachable

```bash
docker compose ps
docker compose logs api --tail 100
curl http://localhost:8000/health
```

### Milvus connection issues

```bash
docker compose ps milvus
docker compose logs milvus --tail 100
pytest tests/test_milvus_connection.py -q
```

### PostgreSQL connection issues

```bash
docker compose ps postgres
docker compose logs postgres --tail 100
pytest tests/test_postgres.py -q
```

## Documentation

- [API Guide](API_GUIDE.md)
- [API Module README](api/README.md)
- [Architecture](ARCHITECTURE.md)
- [Development](DEVELOPMENT.md)
- [Deployment](DEPLOYMENT.md)
- [Quickstart](QUICKSTART.md)
- [Project Summary](PROJECT_SUMMARY.md)

## Notes

- On Windows, if frontend build tooling fails under paths containing `!`, run frontend commands from a mirrored path without special characters.

**Last Updated**: April 7, 2026
