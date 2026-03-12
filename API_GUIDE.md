# P3 Research Lab — API Quick Reference Guide

Welcome! This guide helps you navigate the P3 Research Lab REST API documentation.

---

## 📖 Documentation Files

### 1. **[api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)** ⭐ START HERE
**Comprehensive API Reference** (726 lines)

Complete professional API documentation with:
- ✅ Overview and quick start
- ✅ All 8 endpoints fully documented
- ✅ Request/response schemas with examples
- ✅ Error handling and status codes
- ✅ Configuration and environment variables
- ✅ Performance benchmarks
- ✅ Security best practices
- ✅ Testing strategies
- ✅ Troubleshooting guide
- ✅ Python/curl examples for all endpoints
- ✅ Changelog and version info

### 2. **[api/README.md](api/README.md)** — Quick Reference
**Short cheat sheet for developers**

Quick reference with:
- ✅ Project structure
- ✅ Quick start commands
- ✅ Endpoint table
- ✅ Configuration overview
- ✅ Testing commands
- ✅ Common troubleshooting

---

## 🚀 Getting Started (3 Steps)

### Step 1: Start the API
```bash
# Option A: Local development (hot-reload)
python -m uvicorn api.main:app --reload --port 8000

# Option B: Docker
docker compose up api
```

### Step 2: Access Interactive Docs
Open in browser:
- **Swagger UI**: http://localhost:8000/docs (recommended)
- **ReDoc**: http://localhost:8000/redoc
- **OpenAPI JSON**: http://localhost:8000/openapi.json

### Step 3: Try an Endpoint
```bash
curl http://localhost:8000/health
```

---

## 📋 All Endpoints at a Glance

| Method | Path | Purpose | Docs |
|--------|------|---------|------|
| GET | `/health` | Service health | [Link](#health-checks) |
| GET | `/` | Root status | [Link](#root-endpoint) |
| POST | `/molecules/similar` | Find similar molecules | [Link](#molecule-similarity-search) |
| POST | `/embeddings` | Insert embeddings | [Link](#embedding-insertion) |
| POST | `/experiments` | Create experiment | [Link](#experiment-management) |
| POST | `/experiments/{id}/run` | Start run | [Link](#experiment-management) |
| POST | `/runs/{id}/metrics` | Log metrics | [Link](#experiment-management) |
| POST | `/runs/{id}/finish` | Finish run | [Link](#experiment-management) |

---

## 🏃 Common Tasks

### Search for Similar Molecules
**Documentation**: [api/API_DOCUMENTATION.md#post-moleculessimilar](api/API_DOCUMENTATION.md#3-molecules)

```bash
curl -X POST "http://localhost:8000/molecules/similar?smiles=CCO&top_k=10"
```

### Insert Embeddings
**Documentation**: [api/API_DOCUMENTATION.md#post-embeddings](api/API_DOCUMENTATION.md#3-embeddings)

```bash
curl -X POST "http://localhost:8000/embeddings" \
  -H "Content-Type: application/json" \
  -d '{
    "ids": ["mol_001", "mol_002"],
    "vectors": [[0.1, 0.2, ...], [0.3, 0.4, ...]]
  }'
```

### Track ML Experiment
**Documentation**: [api/API_DOCUMENTATION.md#4-experiments](api/API_DOCUMENTATION.md#4-experiments)

```bash
# Create experiment
curl -X POST "http://localhost:8000/experiments" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "experiment_1",
    "dataset_id": "550e8400-e29b-41d4-a716-446655440000",
    "model_name": "v1"
  }'

# Start run
curl -X POST "http://localhost:8000/experiments/{id}/run" \
  -H "Content-Type: application/json" \
  -d '{"hyperparameters": {"lr": 0.001}}'
```

---

## 🔧 Configuration

**Key Environment Variables**:
```bash
P3_ENVIRONMENT=development
P3_MILVUS_HOST=milvus           # Docker: use service name
P3_POSTGRES_HOST=postgres       # Docker: use service name
P3_LOG_LEVEL=INFO
```

**Docker Compose**:
```bash
docker compose up -d            # Start all services
docker compose ps               # Check status
curl http://localhost:8000/health  # Verify API
```

---

## 📚 Detailed Sections

### Quick Reference
- [api/README.md](api/README.md) — 1-2 minute read

### Complete Documentation
- [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) — 15 minute read
  - Overview & quick start
  - Endpoint reference (8 endpoints)
  - HTTP status codes
  - Configuration
  - Performance & limits
  - Security best practices
  - Monitoring & logging
  - Testing strategies
  - Examples (curl, Python)
  - Troubleshooting guide

### Interactive Testing
- http://localhost:8000/docs (Swagger UI)
- http://localhost:8000/redoc (ReDoc)

---

## 🧪 Examples

### Python Client (requests)
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
results = response.json()
print(f"Found {len(results['results'])} similar molecules")

# Insert embeddings
response = requests.post(
    "http://localhost:8000/embeddings",
    json={
        "ids": ["mol_001", "mol_002"],
        "vectors": [[0.1] * 768, [0.2] * 768]
    }
)
print(f"Status: {response.status_code}, Inserted: {response.json()['inserted']}")
```

### Python Client (async with httpx)
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

## 🐛 Quick Troubleshooting

**"Vector store unavailable"**
```bash
docker compose restart milvus
sleep 5
curl http://localhost:8000/health
```

**"Port 8000 already in use"**
```powershell
netstat -ano | findstr :8000
Stop-Process -Id <PID> -Force
```

**"Module not found"**
```bash
pip install -r requirements.txt
python -m uvicorn api.main:app --reload
```

---

## 📊 Performance Expectations

| Endpoint | Throughput | Response Time |
|----------|-----------|---------------|
| `/health` | 10,000+ req/sec | <5 ms |
| `/molecules/similar` | 100–500 req/sec | 50–200 ms |
| `/embeddings` (1000 items) | — | 500 ms–2 sec |

---

## 🔐 Security

✅ Input validation (Pydantic)  
✅ SQL injection prevention (parameterized queries)  
✅ Connection pooling & timeouts  
✅ Error handling (no info leaks)  
🔄 Authentication (planned v1.1)  

---

## 📞 Support

1. **Check Documentation**: [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md)
2. **Test in Swagger**: http://localhost:8000/docs
3. **Review Logs**: `docker compose logs -f api`
4. **Check Status**: `curl http://localhost:8000/health`

---

## 📄 Document Index

| Document | Purpose | Read Time |
|----------|---------|-----------|
| **This Guide** | Navigation & quick reference | 2 min |
| [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) | Complete API reference | 15 min |
| [api/README.md](api/README.md) | Quick cheat sheet | 2 min |
| [README.md](README.md) | P3 project overview | 10 min |
| [DEVELOPMENT.md](DEVELOPMENT.md) | Dev setup guide | 5 min |
| [QUICKSTART.md](QUICKSTART.md) | 5-minute setup | 5 min |

---

**Last Updated**: March 12, 2026  
**Next Steps**: Open [api/API_DOCUMENTATION.md](api/API_DOCUMENTATION.md) for complete endpoint details!
