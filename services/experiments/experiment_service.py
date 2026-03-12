from __future__ import annotations

from contextlib import contextmanager
from typing import Any, Iterator
from uuid import UUID

from sqlalchemy.orm import Session

from services.database.models import Dataset, Experiment, ExperimentRun
from services.database.postgres_client import get_session


class ExperimentService:
	"""Service layer for creating and updating ML experiments and runs."""

	@contextmanager
	def _session_scope(self) -> Iterator[Session]:
		session = get_session()
		try:
			yield session
			session.commit()
		except Exception:
			session.rollback()
			raise
		finally:
			session.close()

	def create_experiment(
		self,
		name: str,
		description: str | None,
		dataset_id: UUID,
		model_name: str,
	) -> UUID:
		"""Create an experiment and return its ID."""
		with self._session_scope() as session:
			dataset = session.get(Dataset, dataset_id)
			if dataset is None:
				raise ValueError(f"Dataset not found: {dataset_id}")

			experiment = Experiment(
				name=name,
				description=description,
				dataset_id=dataset_id,
				model_name=model_name,
			)
			session.add(experiment)
			session.flush()
			return experiment.experiment_id

	def start_run(
		self,
		experiment_id: UUID,
		hyperparameters: dict[str, Any] | None,
	) -> UUID:
		"""Create a run for an existing experiment and return run ID."""
		with self._session_scope() as session:
			experiment = session.get(Experiment, experiment_id)
			if experiment is None:
				raise ValueError(f"Experiment not found: {experiment_id}")

			run = ExperimentRun(
				experiment_id=experiment_id,
				hyperparameters=hyperparameters or {},
				metrics={},
				status="running",
			)
			session.add(run)
			session.flush()
			return run.run_id

	def log_metrics(self, run_id: UUID, metrics: dict[str, Any]) -> None:
		"""Merge and persist metrics for a run."""
		with self._session_scope() as session:
			run = session.get(ExperimentRun, run_id)
			if run is None:
				raise ValueError(f"Run not found: {run_id}")

			existing_metrics = run.metrics or {}
			existing_metrics.update(metrics)
			run.metrics = existing_metrics

	def finish_run(self, run_id: UUID, status: str) -> None:
		"""Update terminal status for a run."""
		with self._session_scope() as session:
			run = session.get(ExperimentRun, run_id)
			if run is None:
				raise ValueError(f"Run not found: {run_id}")
			run.status = status
