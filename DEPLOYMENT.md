# Deployment Guide

This repository can be deployed as two services from one repo:
- Backend API service (FastAPI)
- Frontend web service (Next.js)

No repo split is required.

## 1. Backend Deployment

Minimum environment variables:
- P3_ENVIRONMENT=production
- P3_POSTGRES_HOST
- P3_POSTGRES_PORT
- P3_POSTGRES_DB
- P3_POSTGRES_USER
- P3_POSTGRES_PASSWORD
- P3_MILVUS_HOST
- P3_MILVUS_PORT

Build and run with Docker Compose:

```bash
docker compose up -d postgres redis milvus api
```

Health check:

```bash
curl http://localhost:8000/health
```

## 2. Frontend Deployment

Set `NEXT_PUBLIC_API_URL` to your deployed backend URL.

Example `.env.local`:

```bash
NEXT_PUBLIC_API_URL=https://your-api-domain
```

Build and run:

```bash
cd frontend
npm install
npm run build
npm run start
```

## 3. Bootstrap Milvus Collection

Similarity search requires a Milvus collection and vectors.

Create collection only:

```bash
python scripts/bootstrap_milvus.py --host localhost --port 19530
```

Create collection and seed synthetic vectors:

```bash
python scripts/bootstrap_milvus.py --host localhost --port 19530 --seed-count 100
```

## 4. Integration Smoke Test

Browser/API integration:
- OPTIONS http://localhost:8000/molecules/similar returns 200
- POST http://localhost:8000/molecules/similar returns JSON

If POST returns no neighbors, integration is still valid; add real embeddings for meaningful results.

## 5. Windows Path Note

For local frontend development on Windows, avoid workspace paths containing `!` because webpack path validation can fail.
