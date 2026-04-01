from __future__ import annotations

from typing import Any
from uuid import UUID

from fastapi import APIRouter, HTTPException, Query, status
from pydantic import BaseModel, Field

from services.experiments.experiment_service import ExperimentService


router = APIRouter()
service = ExperimentService()


class CreateExperimentRequest(BaseModel):
	name: str = Field(..., min_length=1)
	description: str | None = None
	dataset_id: UUID
	model_name: str = Field(..., min_length=1)


class CreateExperimentResponse(BaseModel):
	experiment_id: UUID


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


@router.get("/experiments/summary", response_model=ExperimentSummaryResponse)
def get_experiment_summary() -> ExperimentSummaryResponse:
	return ExperimentSummaryResponse(experiment_count=service.get_experiment_count())


@router.get("/runs/recent", response_model=RecentRunsResponse)
def get_recent_runs(limit: int = Query(default=8, ge=1, le=50)) -> RecentRunsResponse:
	items = service.list_recent_runs(limit=limit)
	return RecentRunsResponse(items=[RecentRunItem(**item) for item in items])


@router.post("/experiments", response_model=CreateExperimentResponse, status_code=status.HTTP_201_CREATED)
def create_experiment(request: CreateExperimentRequest) -> CreateExperimentResponse:
	try:
		experiment_id = service.create_experiment(
			name=request.name,
			description=request.description,
			dataset_id=request.dataset_id,
			model_name=request.model_name,
		)
		return CreateExperimentResponse(experiment_id=experiment_id)
	except ValueError as exc:
		raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=str(exc)) from exc


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
