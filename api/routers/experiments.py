from __future__ import annotations

import os
from datetime import datetime, timezone
from typing import Any
from uuid import UUID

import httpx
from fastapi import APIRouter, HTTPException, Query, Response, status
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

from services.experiments.experiment_service import ExperimentService
from services.experminets_store import add_experiment, get_all_experiments


router = APIRouter()
service = ExperimentService()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:9000")


class CreateExperimentRequest(BaseModel):
	experiment_id: str = Field(..., min_length=1)
	protein: str = Field(..., min_length=1)


class CreateExperimentResponse(BaseModel):
	experiment_id: str
	protein: str
	status: str
	created_at: str


class ExperimentsListResponse(BaseModel):
	experiments: list[CreateExperimentResponse]


class StartRunRequest(BaseModel):
	hyperparameters: dict[str, Any] | None = None


class StartRunResponse(BaseModel):
	run_id: UUID


class LogMetricsRequest(BaseModel):
	metrics: dict[str, Any]


class FinishRunRequest(BaseModel):
	status: str = Field(..., min_length=1)


class StatusResponse(BaseModel):
	status: str


class ExperimentSummaryResponse(BaseModel):
	experiment_count: int


class RecentRunItem(BaseModel):
	run_id: UUID
	experiment_name: str
	dataset_name: str
	status: str
	created_at: str


class RecentRunsResponse(BaseModel):
	items: list[RecentRunItem]


class PipelineRunRequest(BaseModel):
	protein: str = Field(..., min_length=1)
	constraints: dict[str, Any] = Field(default_factory=dict)


class PipelineRunResponse(BaseModel):
	experiment_id: str


class PipelineStatusResponse(BaseModel):
	status: str
	stage: str
	progress: int
	logs: list[Any] = Field(default_factory=list)


def _compute_progress(stage: str) -> int:
	stage_progress_map = {
		"phase0": 25,
		"phase1": 50,
		"phase2": 75,
		"completed": 100,
	}
	return stage_progress_map.get(stage.lower(), 0)


@router.get("/experiments/summary", response_model=ExperimentSummaryResponse)
def get_experiment_summary() -> ExperimentSummaryResponse:
	return ExperimentSummaryResponse(experiment_count=service.get_experiment_count())


@router.get("/runs/recent", response_model=RecentRunsResponse)
def get_recent_runs(limit: int = Query(default=8, ge=1, le=50)) -> RecentRunsResponse:
	items = service.list_recent_runs(limit=limit)
	return RecentRunsResponse(items=[RecentRunItem(**item) for item in items])


@router.post("/experiments", response_model=CreateExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(request: CreateExperimentRequest) -> CreateExperimentResponse:
	stored = {
		"experiment_id": request.experiment_id,
		"protein": request.protein,
		"status": "created",
		"created_at": datetime.now(timezone.utc).isoformat(),
	}
	add_experiment(stored)
	return CreateExperimentResponse(**stored)


@router.get("/experiments", response_model=ExperimentsListResponse)
def list_experiments() -> ExperimentsListResponse:
	experiments = [CreateExperimentResponse(**item) for item in get_all_experiments()]
	return ExperimentsListResponse(experiments=experiments)


@router.post("/experiments/{id}/run", response_model=StartRunResponse, status_code=status.HTTP_201_CREATED)
def start_run(id: UUID, request: StartRunRequest) -> StartRunResponse:
	try:
		run_id = service.start_run(experiment_id=id, hyperparameters=request.hyperparameters)
		return StartRunResponse(run_id=run_id)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/runs/{id}/metrics", response_model=StatusResponse)
def log_metrics(id: UUID, request: LogMetricsRequest) -> StatusResponse:
	try:
		service.log_metrics(run_id=id, metrics=request.metrics)
		return StatusResponse(status="ok")
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/runs/{id}/finish", response_model=StatusResponse)
def finish_run(id: UUID, request: FinishRunRequest) -> StatusResponse:
	try:
		service.finish_run(run_id=id, status=request.status)
		return StatusResponse(status="ok")
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


@router.post("/run", response_model=PipelineRunResponse)
async def run_pipeline(request: PipelineRunRequest) -> PipelineRunResponse:
	payload = request.model_dump()

	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.post(f"{AI_SERVICE_URL.rstrip('/')}/run-pipeline", json=payload)
			response.raise_for_status()
	except httpx.HTTPStatusError as exc:
		detail = f"AI service returned {exc.response.status_code}"
		raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
	except httpx.RequestError as exc:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="Failed to connect to AI service",
		) from exc

	data = response.json()
	experiment_id = data.get("experiment_id")
	if not isinstance(experiment_id, str) or not experiment_id:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="AI service response missing experiment_id",
		)

	add_experiment(
		{
			"experiment_id": experiment_id,
			"protein": request.protein,
			"status": "running",
			"created_at": datetime.now(timezone.utc).isoformat(),
		}
	)

	return PipelineRunResponse(experiment_id=experiment_id)


@router.get("/status/{experiment_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(experiment_id: str) -> PipelineStatusResponse:
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.get(f"{AI_SERVICE_URL.rstrip('/')}/status/{experiment_id}")
			response.raise_for_status()
	except httpx.HTTPStatusError as exc:
		detail = f"AI service returned {exc.response.status_code}"
		raise HTTPException(status_code=status.HTTP_502_BAD_GATEWAY, detail=detail) from exc
	except httpx.RequestError as exc:
		raise HTTPException(
			status_code=status.HTTP_502_BAD_GATEWAY,
			detail="Failed to connect to AI service",
		) from exc

	data = response.json()
	status_value = data.get("status")
	stage = data.get("stage")
	logs = data.get("logs", [])

	if not isinstance(status_value, str) or not status_value:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="AI service response missing status",
		)
	if not isinstance(stage, str) or not stage:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="AI service response missing stage",
		)
	if not isinstance(logs, list):
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="AI service response missing logs",
		)

	return PipelineStatusResponse(
		status=status_value,
		stage=stage,
		progress=_compute_progress(stage),
		logs=logs,
	)


@router.get("/results/{experiment_id}")
async def get_pipeline_results(experiment_id: str) -> Response:
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.get(f"{AI_SERVICE_URL.rstrip('/')}/results/{experiment_id}")
	except httpx.RequestError as exc:
		raise HTTPException(
			status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
			detail="Failed to connect to AI service",
		) from exc

	if response.is_error:
		content_type = response.headers.get("content-type", "application/json")
		if "application/json" in content_type:
			try:
				return JSONResponse(status_code=response.status_code, content=response.json())
			except ValueError:
				pass
		return Response(
			status_code=response.status_code,
			content=response.text,
			media_type=content_type,
		)

	content_type = response.headers.get("content-type", "application/json")
	if "application/json" in content_type:
		try:
			return JSONResponse(content=response.json())
		except ValueError:
			pass

	return Response(content=response.text, media_type=content_type)
