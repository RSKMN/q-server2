# API

REST API for the P3 Research Lab backend, built with **FastAPI**.

📖 **[→ Full API Documentation](API_DOCUMENTATION.md)**  
🎨 **[Interactive Docs](http://localhost:8000/docs)** (Swagger UI)  
📋 **[Alternative Docs](http://localhost:8000/redoc)** (ReDoc)

---

## 🚀 Quick Start

```bash
# Local development (with hot-reload)
python -m uvicorn api.main:app --reload --port 8000

# Production (with Gunicorn)
gunicorn -w 4 -k uvicorn.workers.UvicornWorker api.main:app --bind 0.0.0.0:8000

# Docker
docker compose up api
```

**Base URL**: `http://localhost:8000`

---

## 📋 Endpoints (Quick Reference)

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/health` | Service health check |
| `GET` | `/` | Root/status message |
| `POST` | `/molecules/similar` | Find similar molecules via embeddings |
| `POST` | `/embeddings` | Insert molecule embeddings into Milvus |
| `POST` | `/experiments` | Create experiment |
| `POST` | `/experiments/{id}/run` | Start experiment run |
| `POST` | `/runs/{id}/metrics` | Log run metrics |
| `POST` | `/runs/{id}/finish` | Finish run |

---

## 🧪 Quick Examples

### Health Check
```bash
curl http://localhost:8000/health
```

### Molecule Similarity Search
```bash
# Query parameter style
curl -X POST "http://localhost:8000/molecules/similar?smiles=CCO&top_k=5"

# JSON body style
curl -X POST "http://localhost:8000/molecules/similar" \
  -H "Content-Type: application/json" \
  -d '{"smiles": "CCO", "top_k": 5}'
```

### Insert Embeddings
```bash
curl -X POST "http://localhost:8000/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["mol_001", "mol_002"],
    "vectors": [[0.1, 0.2, ..., 0.9], [0.2, 0.3, ..., 0.8]]
  }'
```

---

## 🏗️ Project Structure

```
api/
├── main.py              # FastAPI app, routers, lifespan
├── routers/
│   ├── __init__.py
│   ├── health.py        # GET /health
│   ├── molecules.py     # POST /molecules/similar
│   ├── embeddings.py    # POST /embeddings
│   └── experiments.py   # Experiment endpoints
└── schemas/
    ├── __init__.py
    ├── embedding.py     # EmbeddingInsertRequest/Response
    └── molecule.py      # MoleculeSimilarityRequest/Response
```

---

## ⚙️ Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `P3_ENVIRONMENT` | `development` | `development`, `staging`, `production` |
| `P3_LOG_LEVEL` | `INFO` | `DEBUG`, `INFO`, `WARNING`, `ERROR` |
| `P3_MILVUS_HOST` | `127.0.0.1` | Milvus hostname (`milvus` in Docker) |
| `P3_MILVUS_PORT` | `19530` | Milvus gRPC port |
| `P3_POSTGRES_HOST` | `localhost` | PostgreSQL hostname |
| `P3_POSTGRES_PORT` | `5432` | PostgreSQL port |

### Docker Compose Services

```bash
# Start all services
docker compose up -d

# Check health
docker compose ps
curl http://localhost:8000/health

# View logs
docker compose logs -f api
```

---

## 🧪 Testing

```bash
# Unit tests
pytest tests/test_api_*.py -v

# Interactive testing
# Open http://localhost:8000/docs in browser

# Load testing
pip install locust
locust -f tests/load_test.py --host=http://localhost:8000
```

---

## 📊 Performance

| Endpoint | Throughput | Response Time |
|----------|-----------|---------------|
| `/health` | 10,000+ req/sec | <5 ms |
| `/molecules/similar` | 100–500 req/sec | 50–200 ms |
| `/embeddings` (1000 items) | — | 500 ms–2 sec |

---

## 🔒 Security

- **Input Validation**: Pydantic models with type, range, and format checks
- **Error Handling**: No sensitive information leaked, meaningful HTTP status codes
- **Database**: Parameterized queries (SQL injection prevention), connection pooling
- **Timeouts**: Request limits (10 MB body, 30 sec timeout)

---

## 🛠️ Development

### Adding a New Endpoint

1. Create router in `routers/my_feature.py`:
```python
from fastapi import APIRouter

router = APIRouter()

@router.get("/my-endpoint")
async def my_endpoint():
    """Endpoint description."""
    return {"result": "data"}
```

2. Create schema in `schemas/my_feature.py` (if needed):
```python
from pydantic import BaseModel

class MyRequest(BaseModel):
    field: str
```

3. Include router in `main.py`:
```python
from api.routers import my_feature
app.include_router(my_feature.router)
```

4. Test:
```bash
curl http://localhost:8000/my-endpoint
```

---

## 🐛 Troubleshooting

**"Vector store service unavailable"**
```bash
docker compose ps milvus
docker logs p3-milvus
docker compose restart milvus
```

**"Database service unavailable"**
```bash
docker compose ps postgres
docker logs p3-postgres
docker compose restart postgres
```

**Port 8000 already in use**
```powershell
netstat -ano | findstr :8000
Stop-Process -Id <PID> -Force
```

---

## 📚 Links

- [Full API Documentation](API_DOCUMENTATION.md)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Pydantic Docs](https://docs.pydantic.dev)
- [OpenAPI Spec](https://spec.openapis.org/oas/v3.0.0)

---

**Last Updated**: March 12, 2026
