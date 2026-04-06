"""Simple in-memory experiment store."""

from __future__ import annotations

from typing import Any, Dict, List


EXPERIMENTS: List[Dict[str, Any]] = []


def add_experiment(exp: dict) -> None:
	"""Add an experiment to the in-memory store."""
	EXPERIMENTS.append(exp)


def get_all_experiments() -> List[Dict[str, Any]]:
	"""Return all stored experiments."""
	return list(EXPERIMENTS)
