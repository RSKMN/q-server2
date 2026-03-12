from __future__ import annotations

import argparse
import json
from typing import Any
from uuid import UUID

import httpx


def _check_response(response: httpx.Response, expected_status: int, step: str) -> dict[str, Any]:
    if response.status_code != expected_status:
        raise RuntimeError(
            f"{step} failed: expected {expected_status}, got {response.status_code}\n"
            f"Response body: {response.text}"
        )

    try:
        return response.json()
    except json.JSONDecodeError as exc:
        raise RuntimeError(f"{step} returned non-JSON response: {response.text}") from exc


def run_test(base_url: str, dataset_id: UUID) -> None:
    with httpx.Client(base_url=base_url, timeout=30.0) as client:
        print("[1/4] Creating experiment...")
        create_payload = {
            "name": "smoke-test-experiment",
            "description": "Experiment endpoint smoke test",
            "dataset_id": str(dataset_id),
            "model_name": "chemberta-v1",
        }
        create_resp = client.post("/experiments", json=create_payload)
        create_data = _check_response(create_resp, 201, "create_experiment")
        experiment_id = create_data["experiment_id"]
        print(f"    experiment_id={experiment_id}")

        print("[2/4] Starting run...")
        run_payload = {
            "hyperparameters": {
                "learning_rate": 1e-3,
                "batch_size": 64,
                "epochs": 5,
            }
        }
        run_resp = client.post(f"/experiments/{experiment_id}/run", json=run_payload)
        run_data = _check_response(run_resp, 201, "start_run")
        run_id = run_data["run_id"]
        print(f"    run_id={run_id}")

        print("[3/4] Logging metrics...")
        metrics_payload = {
            "metrics": {
                "train_loss": 0.21,
                "val_loss": 0.31,
                "val_auc": 0.87,
            }
        }
        metrics_resp = client.post(f"/runs/{run_id}/metrics", json=metrics_payload)
        _check_response(metrics_resp, 200, "log_metrics")
        print("    metrics logged")

        print("[4/4] Finishing run...")
        finish_payload = {"status": "completed"}
        finish_resp = client.post(f"/runs/{run_id}/finish", json=finish_payload)
        _check_response(finish_resp, 200, "finish_run")
        print("    run marked completed")

    print("\nAll experiment endpoint tests passed.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Smoke test for experiment tracking API endpoints")
    parser.add_argument("--base-url", default="http://localhost:8000", help="API base URL")
    parser.add_argument(
        "--dataset-id",
        required=True,
        type=UUID,
        help="Existing dataset UUID required by POST /experiments",
    )
    args = parser.parse_args()

    run_test(base_url=args.base_url.rstrip("/"), dataset_id=args.dataset_id)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
