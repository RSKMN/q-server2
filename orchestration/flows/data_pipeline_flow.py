from __future__ import annotations

import argparse
import logging
import subprocess
import sys
from pathlib import Path

from prefect import flow, get_run_logger, task


logger = logging.getLogger("data_pipeline_flow")
DAILY_DEPLOYMENT_NAME = "molecule-data-pipeline-daily"
DAILY_CRON = "0 2 * * *"


def _repo_root() -> Path:
	return Path(__file__).resolve().parents[2]


def _run_script(script_path: Path, stage_name: str) -> None:
	run_logger = get_run_logger()
	root = _repo_root()
	run_logger.info("[%s] starting: %s", stage_name, script_path)

	try:
		completed = subprocess.run(
			[sys.executable, str(script_path)],
			cwd=str(root),
			capture_output=True,
			text=True,
			check=True,
		)
	except subprocess.CalledProcessError as exc:
		if exc.stdout:
			run_logger.error("[%s] stdout:\n%s", stage_name, exc.stdout.strip())
		if exc.stderr:
			run_logger.error("[%s] stderr:\n%s", stage_name, exc.stderr.strip())
		run_logger.error("[%s] failed with exit code %s", stage_name, exc.returncode)
		raise

	if completed.stdout:
		run_logger.info("[%s] stdout:\n%s", stage_name, completed.stdout.strip())
	if completed.stderr:
		run_logger.info("[%s] stderr:\n%s", stage_name, completed.stderr.strip())

	run_logger.info("[%s] finished successfully", stage_name)


@task(name="run_feature_pipeline", retries=3, retry_delay_seconds=60)
def run_feature_pipeline() -> None:
	script = _repo_root() / "pipelines" / "features" / "feature_pipeline.py"
	_run_script(script_path=script, stage_name="feature_pipeline")


@task(name="run_embedding_pipeline", retries=3, retry_delay_seconds=60)
def run_embedding_pipeline() -> None:
	script = _repo_root() / "pipelines" / "embeddings" / "embedding_pipeline.py"
	_run_script(script_path=script, stage_name="embedding_pipeline")


@flow(name="molecule_data_pipeline")
def molecule_data_pipeline() -> None:
	run_logger = get_run_logger()
	run_logger.info("Molecule data pipeline started")
	run_logger.info("Scheduled flow: %s | cron=%s", DAILY_DEPLOYMENT_NAME, DAILY_CRON)

	# Sequential dependency: features must complete before embeddings.
	run_feature_pipeline()
	run_embedding_pipeline()

	run_logger.info("Molecule data pipeline finished")


def serve_daily_deployment() -> None:
	logger.info(
		"Starting Prefect deployment serve for %s with cron '%s'",
		DAILY_DEPLOYMENT_NAME,
		DAILY_CRON,
	)
	molecule_data_pipeline.serve(
		name=DAILY_DEPLOYMENT_NAME,
		cron=DAILY_CRON,
		tags=["pipeline", "daily"],
	)


if __name__ == "__main__":
	parser = argparse.ArgumentParser(description="Molecule data pipeline flow runner")
	parser.add_argument(
		"--serve",
		action="store_true",
		help="Create and serve the daily Prefect deployment (cron: 0 2 * * *)",
	)
	args = parser.parse_args()

	logging.basicConfig(level=logging.INFO, format="%(asctime)s | %(levelname)s | %(name)s | %(message)s")

	if args.serve:
		serve_daily_deployment()
	else:
		molecule_data_pipeline()
