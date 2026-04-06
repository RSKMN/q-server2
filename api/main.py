from contextlib import asynccontextmanager
import logging
import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import health, molecules, embeddings, experiments, results, datasets
from services.database.dataset_catalog import seed_datasets_from_csv_directory
from services.database.postgres_client import get_engine
from services.database import models as db_models
from fastapi.responses import Response


logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(_: FastAPI):
    # Initialize DB schema on startup.
    if os.getenv("P3_SKIP_DB_INIT", "false").strip().lower() not in {"1", "true", "yes", "on"}:
        engine = get_engine()
        db_models.Base.metadata.create_all(bind=engine)
        try:
            seed_datasets_from_csv_directory()
        except Exception as exc:
            logger.warning("Dataset seeding skipped or failed: %s", exc)
    yield


app = FastAPI(title="Research Lab API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://q-server2.vercel.app",
    ],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.options("/{full_path:path}")
async def options_handler(full_path: str):
    return Response(
        status_code=200,
        headers={
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "*",
            "Access-Control-Allow-Headers": "*",
        },
    )


# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(molecules.router, tags=["molecules"])
app.include_router(embeddings.router, tags=["embeddings"])
app.include_router(experiments.router, prefix="/pipeline", tags=["experiments"])
app.include_router(results.router, prefix="/results", tags=["results"])
app.include_router(datasets.router, tags=["datasets"])

@app.get("/")
def root():
    return {"message": "P3 Research Lab API running"}
