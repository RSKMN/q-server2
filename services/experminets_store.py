"""Simple in-memory experiment store."""

from __future__ import annotations

from typing import Any, Dict, List


EXPERIMENTS: List[Dict[str, Any]] = []
PIPELINE_CALLBACKS: Dict[str, Dict[str, Any]] = {}


def add_experiment(exp: dict) -> None:
	"""Add an experiment to the in-memory store."""
	EXPERIMENTS.append(exp)


def get_all_experiments() -> List[Dict[str, Any]]:
	"""Return all stored experiments."""
	return list(EXPERIMENTS)


def upsert_pipeline_callback(experiment_id: str, payload: Dict[str, Any]) -> Dict[str, Any]:
	"""Store the latest callback payload for an experiment id."""
	PIPELINE_CALLBACKS[experiment_id] = dict(payload)
	return dict(PIPELINE_CALLBACKS[experiment_id])


def get_pipeline_callback(experiment_id: str) -> Dict[str, Any] | None:
	"""Return the latest callback payload for an experiment id."""
	payload = PIPELINE_CALLBACKS.get(experiment_id)
	return dict(payload) if payload is not None else None
