from __future__ import annotations

import os
import logging
from datetime import datetime, timezone
from typing import Any
from uuid import UUID, uuid4

import httpx
from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from services.experiments.experiment_service import ExperimentService
from services.experminets_store import add_experiment, get_all_experiments


router = APIRouter()
service = ExperimentService()
AI_SERVICE_URL = os.getenv("AI_SERVICE_URL", "http://localhost:9000")
logger = logging.getLogger(__name__)


class CreateExperimentRequest(BaseModel):
	experiment_id: str = Field(..., min_length=1)
	protein: str = Field(..., min_length=1)


class CreateExperimentResponse(BaseModel):
	experiment_id: str
	protein: str
	status: str
	created_at: str


class ExperimentsListResponse(BaseModel):
	count: int
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
	status: str
	stage: str
	progress: int
	logs: list[str] = Field(default_factory=list)
	results: dict[str, Any] = Field(default_factory=dict)
	is_mock: bool = False


class PipelineStatusResponse(BaseModel):
	status: str
	stage: str
	progress: int
	logs: list[str] = Field(default_factory=list)
	results: dict[str, Any] = Field(default_factory=dict)
	experiment_id: str
	is_mock: bool = False


def _compute_progress(stage: str) -> int:
	stage_progress_map = {
		"phase0": 25,
		"phase1": 50,
		"phase2": 75,
		"completed": 100,
	}
	return stage_progress_map.get(stage.lower(), 0)


def _normalize_logs(logs: Any, fallback_message: str) -> list[str]:
	if isinstance(logs, list):
		normalized = [str(line) for line in logs if str(line).strip()]
		if normalized:
			return normalized
	return [fallback_message]


def _normalize_results(results: Any, stage: str) -> dict[str, Any]:
	if isinstance(results, dict) and results:
		return results
	if isinstance(results, list):
		return {
			"items": results,
			"summary": f"Pipeline stage '{stage}' returned list results.",
		}
	return {
		"items": [],
		"summary": f"No structured results available for stage '{stage}'.",
	}


def _build_pipeline_response(
	*,
	experiment_id: str,
	status_value: Any,
	stage: Any,
	logs: Any,
	results: Any,
	is_mock: bool,
	progress: int | None = None,
) -> PipelineStatusResponse:
	normalized_status = str(status_value).strip() if isinstance(status_value, str) else "running"
	normalized_stage = str(stage).strip() if isinstance(stage, str) else "phase0"
	computed_progress = progress if progress is not None else _compute_progress(normalized_stage)

	return PipelineStatusResponse(
		experiment_id=experiment_id,
		status=normalized_status or "running",
		stage=normalized_stage or "phase0",
		progress=max(0, min(100, int(computed_progress))),
		logs=_normalize_logs(logs, f"Stage update: {normalized_stage or 'phase0'}"),
		results=_normalize_results(results, normalized_stage or "phase0"),
		is_mock=is_mock,
	)


@router.get("/experiments/summary", response_model=ExperimentSummaryResponse)
def get_experiment_summary() -> ExperimentSummaryResponse:
	return ExperimentSummaryResponse(experiment_count=service.get_experiment_count())


@router.get("/runs/recent", response_model=RecentRunsResponse)
def get_recent_runs(limit: int = Query(default=8, ge=1, le=50)) -> RecentRunsResponse:
	items = service.list_recent_runs(limit=limit)
	return RecentRunsResponse(items=[RecentRunItem(**item) for item in items])


@router.post("/experiments", response_model=CreateExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(request: CreateExperimentRequest) -> CreateExperimentResponse:
	logger.info("POST /pipeline/experiments experiment_id=%s protein=%s", request.experiment_id, request.protein)
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
	logger.info("GET /pipeline/experiments")
	experiments = [CreateExperimentResponse(**item) for item in get_all_experiments()]
	return ExperimentsListResponse(count=len(experiments), experiments=experiments)


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
	logger.info("POST /pipeline/run protein=%s", request.protein)
	payload = request.model_dump()
	fallback_experiment_id = f"mock-{uuid4().hex[:10]}"

	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.post(f"{AI_SERVICE_URL.rstrip('/')}/run-pipeline", json=payload)
			response.raise_for_status()
		raw = response.json()
	except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
		logger.exception("POST /pipeline/run failed, returning mock response: %s", exc)
		add_experiment(
			{
				"experiment_id": fallback_experiment_id,
				"protein": request.protein,
				"status": "mock_running",
				"created_at": datetime.now(timezone.utc).isoformat(),
			}
		)
		fallback = _build_pipeline_response(
			experiment_id=fallback_experiment_id,
			status_value="running",
			stage="phase0",
			logs=["AI service unavailable. Started mock pipeline run."],
			results={"items": [], "summary": "Mock run started."},
			is_mock=True,
			progress=0,
		)
		return PipelineRunResponse(**fallback.model_dump())

	data = raw if isinstance(raw, dict) else {}
	experiment_id_raw = data.get("experiment_id")
	experiment_id = experiment_id_raw if isinstance(experiment_id_raw, str) and experiment_id_raw else fallback_experiment_id

	add_experiment(
		{
			"experiment_id": experiment_id,
			"protein": request.protein,
			"status": "running",
			"created_at": datetime.now(timezone.utc).isoformat(),
		}
	)

	normalized = _build_pipeline_response(
		experiment_id=experiment_id,
		status_value=data.get("status", "running"),
		stage=data.get("stage", "phase0"),
		logs=data.get("logs", ["Pipeline run accepted by AI service."]),
		results=data.get("results", {"items": [], "summary": "Pipeline run started."}),
		is_mock=False,
		progress=data.get("progress", 0),
	)

	return PipelineRunResponse(**normalized.model_dump())


@router.get("/status/{experiment_id}", response_model=PipelineStatusResponse)
async def get_pipeline_status(experiment_id: str) -> PipelineStatusResponse:
	logger.info("GET /pipeline/status/%s", experiment_id)
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.get(f"{AI_SERVICE_URL.rstrip('/')}/status/{experiment_id}")
			response.raise_for_status()
		raw = response.json()
	except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
		logger.exception("GET /pipeline/status/%s failed, returning mock status: %s", experiment_id, exc)
		return _build_pipeline_response(
			experiment_id=experiment_id,
			status_value="running",
			stage="phase0",
			logs=["AI service unavailable. Returning mock pipeline status."],
			results={"items": [], "summary": "Live status unavailable."},
			is_mock=True,
			progress=0,
		)

	data = raw if isinstance(raw, dict) else {}
	return _build_pipeline_response(
		experiment_id=experiment_id,
		status_value=data.get("status", "running"),
		stage=data.get("stage", "phase0"),
		logs=data.get("logs", ["Status retrieved from AI service."]),
		results=data.get("results", {"items": [], "summary": "No stage results available yet."}),
		is_mock=False,
		progress=data.get("progress"),
	)


@router.get("/results/{experiment_id}", response_model=PipelineStatusResponse)
async def get_pipeline_results(experiment_id: str) -> PipelineStatusResponse:
	logger.info("GET /pipeline/results/%s", experiment_id)
	try:
		async with httpx.AsyncClient(timeout=30.0) as client:
			response = await client.get(f"{AI_SERVICE_URL.rstrip('/')}/results/{experiment_id}")
			response.raise_for_status()
			raw = response.json()
	except (httpx.HTTPStatusError, httpx.RequestError, ValueError) as exc:
		logger.exception("GET /pipeline/results/%s failed, returning mock results: %s", experiment_id, exc)
		return _build_pipeline_response(
			experiment_id=experiment_id,
			status_value="failed",
			stage="completed",
			logs=["AI service unavailable. Returning mock pipeline results."],
			results={"items": [], "summary": "Mock results placeholder."},
			is_mock=True,
			progress=100,
		)

	data = raw if isinstance(raw, dict) else {}
	results_payload = data.get("results", data if data else {"items": [], "summary": "No results payload."})
	return _build_pipeline_response(
		experiment_id=experiment_id,
		status_value=data.get("status", "completed"),
		stage=data.get("stage", "completed"),
		logs=data.get("logs", ["Results retrieved from AI service."]),
		results=results_payload,
		is_mock=False,
		progress=data.get("progress", 100),
	)
