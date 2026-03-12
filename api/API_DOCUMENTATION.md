# P3 Research Lab — API Documentation

**API Version**: 1.0.0  
**Base URL**: `http://localhost:8000`  
**Content-Type**: `application/json`

---

## 📖 Overview

The P3 Research Lab API provides RESTful endpoints for:
- **Health monitoring** – Service health checks and status
- **Molecule similarity search** – Find structurally similar molecules using embeddings
- **Embedding management** – Insert and manage vector embeddings in Milvus
- **Experiment tracking** – Track ML training experiments, runs, and metrics

All endpoints return JSON responses. Errors follow HTTP status codes and return error detail messages.

---

## 🚀 Quick Start

### Running the API

**Local Development:**
```bash
# Activate environment
conda activate rl-cpc

# Install dependencies
pip install -r requirements.txt

# Start API (with hot-reload)
python -m uvicorn api.main:app --reload --port 8000
```

**Docker Deployment:**
```bash
docker compose up -d api
```

**Interactive Documentation:**
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

---

## 📚 Endpoint Reference

### 1. Health Checks

#### `GET /health`
Service health check endpoint. Used by monitoring systems, load balancers, and Docker health checks.

**Parameters:**  
None

**Response (200 OK):**
```json
{
  "status": "ok",
  "service": "research-lab-api",
  "timestamp": "2026-03-12T10:30:45.123456"
}
```

**Error Responses:**
- `503 Service Unavailable` – If database or vector store is unavailable

**Example:**
```bash
curl http://localhost:8000/health
```

---

#### `GET /`
Root endpoint. Returns API status message.

**Parameters:**  
None

**Response (200 OK):**
```json
{
  "message": "P3 Research Lab API running"
}
```

**Example:**
```bash
curl http://localhost:8000/
```

---

### 2. Molecules

#### `POST /molecules/similar`
Find molecules similar to a query molecule using structural embeddings and vector similarity search.

**Purpose:**
- Identify structurally similar compounds for drug discovery
- Find analogs with potential bioactivity
- Support hit-to-lead optimization workflows

**Parameters:**

*Option A: Query Parameters*
```
POST /molecules/similar?smiles=CCO&top_k=10
```

| Parameter | Type | Required | Default | Constraints |
|-----------|------|----------|---------|-------------|
| `smiles` | string | Yes | — | Valid SMILES notation (e.g., `CCO`, `CC(=O)Nc1ccccc1`) |
| `top_k` | integer | No | 5 | 1–100, must be positive |

*Option B: JSON Body*
```json
{
  "smiles": "CCO",
  "top_k": 10
}
```

**Request Schema:**
```typescript
{
  "smiles": string,           // SMILES string of query molecule
  "top_k": integer            // Number of results to return (1-100)
}
```

**Response (200 OK):**
```json
{
  "query_smiles": "CCO",
  "results": [
    {
      "molecule_id": "abc123def456...",
      "score": 0.95
    },
    {
      "molecule_id": "xyz789uvw012...",
      "score": 0.91
    }
  ]
}
```

**Response Schema:**
```typescript
{
  "query_smiles": string,     // Input SMILES echoed back
  "results": [                // Sorted by score (highest first)
    {
      "molecule_id": string,  // Unique molecule identifier (SHA-256 hash)
      "score": float          // Similarity score (0.0–1.0, higher = more similar)
    }
  ]
}
```

**Status Codes:**
- `200 OK` – Search successful
- `400 Bad Request` – Missing or invalid SMILES or top_k
- `503 Service Unavailable` – Milvus or embedding service unavailable

**Error Responses:**

1. **Missing SMILES:**
```json
{
  "detail": "'smiles' is required in query params or JSON body"
}
```

2. **Invalid top_k:**
```json
{
  "detail": "ensure this value is less than or equal to 100"
}
```

3. **Vector store unavailable:**
```json
{
  "detail": "Vector store service unavailable"
}
```

**Examples:**

Query via URL parameters:
```bash
curl -X POST "http://localhost:8000/molecules/similar?smiles=CCO&top_k=5"
```

Query via JSON body:
```bash
curl -X POST "http://localhost:8000/molecules/similar" \
  -H "Content-Type: application/json" \
  -d '{
    "smiles": "CC(=O)Nc1ccccc1",
    "top_k": 10
  }'
```

Python client:
```python
import requests

response = requests.post(
    "http://localhost:8000/molecules/similar",
    json={
        "smiles": "CCO",
        "top_k": 5
    }
)
results = response.json()
print(f"Found {len(results['results'])} similar molecules")
for mol in results['results']:
    print(f"  {mol['molecule_id']}: score={mol['score']:.3f}")
```

**Performance:**
- Typical query time: **50–200 ms** (depending on Milvus index and top_k)
- Throughput: **100–500 queries/sec** for a single API instance

**Notes:**
- SMILES strings must be valid chemical notation; invalid inputs return error
- Similarity scores are based on embedding distance (COSINE metric)
- Results are sorted by descending similarity score
- Molecule IDs are SHA-256 hashes of molecule data

---

### 3. Embeddings

#### `POST /embeddings`
Insert molecule embeddings into the vector store (Milvus).

**Purpose:**
- Batch insert pre-computed embeddings from pipelines
- Populate vector search index
- Enable similarity search functionality

**Parameters:**

**Request Body (JSON):**
```json
{
  "ids": ["mol_001", "mol_002", "mol_003"],
  "vectors": [
    [0.01, 0.02, 0.03, ..., 0.98],
    [0.05, 0.06, 0.07, ..., 0.92],
    [0.10, 0.11, 0.12, ..., 0.88]
  ]
}
```

**Request Schema:**
```typescript
{
  "ids": string[],              // Unique molecule identifiers (1–64 chars each)
  "vectors": float[][]          // Embedding vectors (each 768 dimensions)
}
```

**Validation Rules:**
| Field | Rule |
|-------|------|
| `ids` | Non-empty, unique, 1–64 chars each |
| `vectors` | All vectors must be 768-dimensional floats |
| Length match | `len(ids)` must equal `len(vectors)` |

**Response (201 Created):**
```json
{
  "status": "success",
  "inserted": 3
}
```

**Status Codes:**
- `201 Created` – Embeddings successfully inserted
- `400 Bad Request` – Validation error (mismatched lengths, invalid dimensions)
- `503 Service Unavailable` – Milvus unavailable

**Error Responses:**

1. **Mismatched ID/vector count:**
```json
{
  "detail": "Number of IDs (3) must match number of vectors (2)"
}
```

2. **Invalid vector dimension:**
```json
{
  "detail": "Expected embedding dimension 768, got 512"
}
```

3. **Duplicate IDs:**
```json
{
  "detail": "All IDs must be unique"
}
```

4. **Milvus unavailable:**
```json
{
  "detail": "Vector store service unavailable"
}
```

**Examples:**

Batch insert via cURL:
```bash
curl -X POST "http://localhost:8000/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["molecule_1", "molecule_2"],
    "vectors": [
      [0.1, 0.2, 0.3, ..., 0.9],
      [0.2, 0.3, 0.4, ..., 0.8]
    ]
  }'
```

Python client:
```python
import requests
import numpy as np

# Generate 2 random embeddings for demo
embeddings = np.random.randn(2, 768).tolist()

response = requests.post(
    "http://localhost:8000/embeddings",
    json={
        "ids": ["mol_001", "mol_002"],
        "vectors": embeddings
    }
)

if response.status_code == 201:
    data = response.json()
    print(f"Inserted {data['inserted']} embeddings")
else:
    print(f"Error: {response.json()['detail']}")
```

Python with batch processing:
```python
import requests
from pathlib import Path

def batch_insert_embeddings(embeddings_file, batch_size=1000):
    """Insert embeddings from parquet file in batches."""
    import pandas as pd
    
    df = pd.read_parquet(embeddings_file)
    
    for i in range(0, len(df), batch_size):
        batch = df.iloc[i:i+batch_size]
        
        response = requests.post(
            "http://localhost:8000/embeddings",
            json={
                "ids": batch['molecule_id'].tolist(),
                "vectors": batch['embedding'].tolist()
            }
        )
        
        if response.status_code != 201:
            print(f"Batch {i//batch_size} failed: {response.json()}")
        else:
            print(f"Batch {i//batch_size}: {response.json()['inserted']} inserted")
```

**Performance:**
- Insertion speed: **1000–5000 embeddings/sec** (depending on batch size)
- Optimal batch size: **500–2000** embeddings per request
- Typical response time: **500 ms–2 sec** for 1000 embeddings

**Notes:**
- Embeddings must be **exactly 768 dimensions** (float32 or float64)
- IDs should be unique across all insertions (duplicates are overwritten)
- Batch insertions are more efficient than single-item inserts
- Use the `/molecules/similar` endpoint after insertion to verify data

---

### 4. Experiments

#### `POST /experiments`
Create a new experiment for tracking ML training runs.

**Purpose:**
- Define experiment configurations
- Track model performance over multiple runs
- Organize hyperparameter trials

**Parameters:**

**Request Body (JSON):**
```json
{
  "name": "model_v1_tuning",
  "description": "Hyperparameter tuning for embedding model v1",
  "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
  "model_name": "embedding_model_v1"
}
```

**Request Schema:**
```typescript
{
  "name": string,           // Experiment name (1+ chars)
  "description": string,    // Optional description
  "dataset_id": UUID,       // Dataset identifier
  "model_name": string      // Model identifier (1+ chars)
}
```

**Response (201 Created):**
```json
{
  "experiment_id": "a1b2c3d4-e5f6-4789-a012-b3c4d5e6f7g8"
}
```

**Status Codes:**
- `201 Created` – Experiment created successfully
- `400 Bad Request` – Invalid input
- `404 Not Found` – Dataset not found

**Example:**
```bash
curl -X POST "http://localhost:8000/experiments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "embedding_v2_tuning",
    "description": "Fine-tune embedding model on curated dataset",
    "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
    "model_name": "embedding_v2"
  }'
```

---

#### `POST /experiments/{id}/run`
Start a training run within an experiment.

**Parameters:**

**Path Parameter:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Experiment ID |

**Request Body (JSON):**
```json
{
  "hyperparameters": {
    "learning_rate": 0.001,
    "batch_size": 32,
    "epochs": 100
  }
}
```

**Response (201 Created):**
```json
{
  "run_id": "x1y2z3a4-b5c6-4def-a012-c3d4e5f6g789"
}
```

**Status Codes:**
- `201 Created` – Run started successfully
- `404 Not Found` – Experiment not found

**Example:**
```bash
curl -X POST "http://localhost:8000/experiments/a1b2c3d4-e5f6-4789-a012-b3c4d5e6f7g8/run" \
  -H "Content-Type: application/json" \
  -d '{
    "hyperparameters": {
      "learning_rate": 0.001,
      "batch_size": 64
    }
  }'
```

---

#### `POST /runs/{id}/metrics`
Log metrics for the current run.

**Parameters:**

**Path Parameter:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Run ID |

**Request Body (JSON):**
```json
{
  "metrics": {
    "loss": 0.123,
    "accuracy": 0.92,
    "val_loss": 0.145,
    "epoch": 10
  }
}
```

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` – Metrics logged successfully
- `404 Not Found` – Run not found

**Example:**
```bash
curl -X POST "http://localhost:8000/runs/x1y2z3a4-b5c6-4def-a012-c3d4e5f6g789/metrics" \
  -H "Content-Type: application/json" \
  -d '{
    "metrics": {
      "loss": 0.085,
      "accuracy": 0.945,
      "val_loss": 0.110
    }
  }'
```

---

#### `POST /runs/{id}/finish`
Mark a run as complete.

**Parameters:**

**Path Parameter:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Run ID |

**Request Body (JSON):**
```json
{
  "status": "success"
}
```

**Valid Status Values:**
- `success` – Training completed successfully
- `failed` – Training failed
- `aborted` – Training was manually stopped

**Response (200 OK):**
```json
{
  "status": "ok"
}
```

**Status Codes:**
- `200 OK` – Run marked as finished
- `404 Not Found` – Run not found

**Example:**
```bash
curl -X POST "http://localhost:8000/runs/x1y2z3a4-b5c6-4def-a012-c3d4e5f6g789/finish" \
  -H "Content-Type: application/json" \
  -d '{"status": "success"}'
```

---

## 🔌 HTTP Status Codes

| Code | Meaning | Typical Use |
|------|---------|-------------|
| 200 | OK | Successful GET or POST request |
| 201 | Created | Successful resource creation (POST) |
| 400 | Bad Request | Invalid input, missing required fields |
| 401 | Unauthorized | Authentication failed (future) |
| 403 | Forbidden | Insufficient permissions (future) |
| 404 | Not Found | Resource not found |
| 422 | Unprocessable Entity | Validation error in request body |
| 500 | Internal Server Error | Unexpected server error |
| 503 | Service Unavailable | Database, Milvus, or dependency unavailable |

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description | Example |
|----------|---------|-------------|---------|
| `P3_ENVIRONMENT` | `development` | Deployment environment | `production` |
| `P3_LOG_LEVEL` | `INFO` | Logging verbosity | `DEBUG`, `INFO`, `WARNING` |
| `P3_MILVUS_HOST` | `127.0.0.1` | Milvus server hostname | `milvus` (Docker) |
| `P3_MILVUS_PORT` | `19530` | Milvus gRPC port | `19530` |
| `P3_POSTGRES_HOST` | `localhost` | PostgreSQL hostname | `postgres` (Docker) |
| `P3_POSTGRES_PORT` | `5432` | PostgreSQL port | `5432` |
| `P3_POSTGRES_DB` | `research_lab` | Database name | `research_lab` |
| `P3_POSTGRES_USER` | `postgres` | PostgreSQL user | `postgres` |
| `P3_POSTGRES_PASSWORD` | — | PostgreSQL password | *(env-specific)* |

**Docker Compose Setup:**
Services automatically resolve DNS names:
- Milvus: `http://milvus:19530`
- Postgres: `postgres:5432`
- Redis: `redis:6379`

---

## 📊 Performance & Limits

### Rate Limiting
*(Future: To be implemented)*

### Pagination
*(Experiment endpoints will support pagination in v2)*

### Throughput

| Endpoint | Throughput | Response Time |
|----------|-----------|---------------|
| `GET /health` | 10,000+ req/sec | <5 ms |
| `POST /molecules/similar` | 100–500 req/sec | 50–200 ms |
| `POST /embeddings` (1000 items) | — | 500 ms–2 sec |
| `POST /experiments` | 1,000 req/sec | <50 ms |

### Connection Limits
- Max request body: **10 MB**
- Request timeout: **30 seconds**
- Streaming timeout: **60 seconds**

---

## 🔒 Security

### Authentication
*(Planned for v2)*
- API key-based authentication
- JWT tokens for service-to-service calls

### CORS
*(Configurable per environment)*

### Data Validation
All inputs are validated using Pydantic models:
- Type checking
- Range validation
- Format validation (e.g., SMILES, UUIDs)
- SQL injection prevention via parameterized queries

### Error Handling
- No sensitive information in error messages
- Detailed logging for debugging
- Graceful failures with meaningful HTTP status codes

---

## 💾 Persistence & Reliability

### Database Backup
PostgreSQL is configured with:
- Daily automated backups
- WAL archiving
- Point-in-time recovery

### Vector Store
Milvus collection `molecule_embeddings`:
- Embedded etcd for metadata (local development)
- Embedded minio for storage (local development)
- Snapshots supported for disaster recovery

### API Resilience
- Health checks for dependency availability
- Graceful degradation on service failure
- Connection retry logic

---

## 📈 Monitoring & Logging

### Health Check Endpoint
Use `GET /health` for:
- Load balancer health probes
- Docker health checks
- Monitoring system pings

**Recommended interval**: Every 10–30 seconds

### Logging
All requests are logged with:
- Timestamp
- HTTP method and path
- Response status code
- Response time
- Error details (if applicable)

**Log files**: Configured via `P3_LOG_LEVEL` environment variable

### Metrics
*(Prometheus integration planned)*

---

## 🧪 Testing & Examples

### Using curl

**Health check:**
```bash
curl http://localhost:8000/health
```

**Molecule similarity search:**
```bash
curl -X POST "http://localhost:8000/molecules/similar?smiles=CCO&top_k=5"
```

**Insert embeddings:**
```bash
curl -X POST "http://localhost:8000/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["mol_1", "mol_2"],
    "vectors": [[0.1, 0.2, ...], [0.3, 0.4, ...]]
  }'
```

### Using Python

**With requests library:**
```python
import requests

# Health check
response = requests.get("http://localhost:8000/health")
print(response.json())

# Molecule similarity
response = requests.post(
    "http://localhost:8000/molecules/similar",
    json={"smiles": "CCO", "top_k": 5}
)
print(response.json())

# Insert embeddings
response = requests.post(
    "http://localhost:8000/embeddings",
    json={
        "ids": ["mol_1", "mol_2"],
        "vectors": [[0.1] * 768, [0.2] * 768]
    }
)
print(response.status_code, response.json())
```

**With httpx (async):**
```python
import httpx
import asyncio

async def test_api():
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "http://localhost:8000/molecules/similar",
            json={"smiles": "CCO", "top_k": 5}
        )
        print(response.json())

asyncio.run(test_api())
```

---

## 📚 API Clients

### Swagger UI
Interactive API explorer with test tools:
```
http://localhost:8000/docs
```

### ReDoc
Alternative documentation viewer:
```
http://localhost:8000/redoc
```

### OpenAPI Schema
Machine-readable schema for code generation:
```
http://localhost:8000/openapi.json
```

Generate clients using:
```bash
# OpenAPI Generator
openapi-generator-cli generate -i http://localhost:8000/openapi.json -g python -o ./client

# Swagger Codegen
swagger-codegen generate -i http://localhost:8000/openapi.json -l python -o ./client
```

---

## 🐛 Troubleshooting

### Milvus Connection Error
```
"Vector store service unavailable"
```

**Solution:**
```bash
# Check if Milvus is running
docker compose ps milvus

# View Milvus logs
docker logs p3-milvus

# Restart Milvus
docker compose restart milvus
```

### PostgreSQL Connection Error
```
"Database service unavailable"
```

**Solution:**
```bash
# Check if PostgreSQL is running
docker compose ps postgres

# View PostgreSQL logs
docker logs p3-postgres

# Restart PostgreSQL
docker compose restart postgres
```

### Embedding Dimension Mismatch
```
"Expected embedding dimension 768, got 512"
```

**Solution:**
Ensure all embedding vectors are exactly 768-dimensional. Check your embedding model output or use a dimension-conversion pipeline.

### Invalid SMILES String
```
"Error during similarity search"
```

**Solution:**
Verify SMILES string is valid chemical notation. Test with common examples:
- `C` (methane)
- `CCO` (ethanol)
- `CC(=O)Nc1ccccc1` (acetaminophen)

---

## 📞 Support & Contributing

For issues or feature requests:
1. Check [DEVELOPMENT.md](../DEVELOPMENT.md)
2. Review logs: `docker compose logs -f api`
3. Test endpoints with Swagger UI: `http://localhost:8000/docs`

---

## 📄 Changelog

### v1.0.0 (2026-03-12)
- ✅ Health check endpoint
- ✅ Molecule similarity search with Milvus backend
- ✅ Embedding insertion with validation
- ✅ Experiment tracking endpoints
- ✅ OpenAPI/Swagger documentation
- 🔄 Authentication (planned for v1.1)
- 🔄 Rate limiting (planned for v1.1)
- 🔄 Query result pagination (planned for v2.0)

---

**Last Updated**: March 12, 2026  
**Maintained by**: P3 Backend Team
