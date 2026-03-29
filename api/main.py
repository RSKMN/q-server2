from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api.routers import health, molecules, embeddings, experiments
from services.database.postgres_client import get_engine
from services.database import models as db_models


@asynccontextmanager
async def lifespan(_: FastAPI):
    """Initialize PostgreSQL schema on API startup."""
    engine = get_engine()
    db_models.Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Research Lab API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://q-server2-cz4a77iuo-rskmn7734-gmailcoms-projects.vercel.app",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, tags=["health"])
app.include_router(molecules.router, tags=["molecules"])
app.include_router(embeddings.router, tags=["embeddings"])
app.include_router(experiments.router, tags=["experiments"])

@app.get("/")
def root():
    return {"message": "P3 Research Lab API running"}
