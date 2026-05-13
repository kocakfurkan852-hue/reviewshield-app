from __future__ import annotations

import os
import json
import socket
import subprocess
import sys
import time
from pathlib import Path

import httpx


def free_port() -> int:
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def wait_until_up(base_url: str, timeout_s: float = 10.0) -> None:
    t0 = time.time()
    while time.time() - t0 < timeout_s:
        try:
            r = httpx.get(f"{base_url}/sink/items", timeout=1.0)
            if r.status_code == 200:
                return
        except Exception:
            pass
        time.sleep(0.2)
    raise RuntimeError("API did not become ready")


def start_api(port: int) -> subprocess.Popen:
    env = os.environ.copy()
    # Start uvicorn as a subprocess
    return subprocess.Popen(
        [
            sys.executable,
            "-m",
            "uvicorn",
            "e2e_demo.api.app:app",
            "--host",
            "127.0.0.1",
            "--port",
            str(port),
            "--log-level",
            "warning",
        ],
        env=env,
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
        text=True,
    )


def run_sync(base_url: str, *extra_args: str) -> subprocess.CompletedProcess:
    env = os.environ.copy()
    env["DEMO_BASE_URL"] = base_url
    return subprocess.run(
        [sys.executable, "-m", "e2e_demo.sync_tool.sync", *extra_args],
        env=env,
        capture_output=True,
        text=True,
    )


def reset_api(base_url: str) -> None:
    r = httpx.post(f"{base_url}/admin/reset", timeout=5.0)
    r.raise_for_status()


def sink_state(base_url: str) -> dict:
    r = httpx.get(f"{base_url}/sink/items", timeout=5.0)
    r.raise_for_status()
    return r.json()


def test_e2e_sync_is_idempotent_and_handles_retries() -> None:
    port = free_port()
    base_url = f"http://127.0.0.1:{port}"

    proc = start_api(port)
    try:
        wait_until_up(base_url)
        reset_api(base_url)

        # First run should create everything (with retries handling 500-once and 429 sometimes)
        r1 = run_sync(base_url)
        assert r1.returncode == 0, f"stdout={r1.stdout}\nstderr={r1.stderr}"

        s1 = sink_state(base_url)
        assert s1["count"] == 25

        # Second run should NOT create duplicates; count should remain 25
        r2 = run_sync(base_url)
        assert r2.returncode in (0, 2), f"stdout={r2.stdout}\nstderr={r2.stderr}"
        # Even if some writes failed transiently, we should not ever exceed 25.
        s2 = sink_state(base_url)
        assert s2["count"] == 25

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

def test_e2e_sync_limit() -> None:
    port = free_port()
    base_url = f"http://127.0.0.1:{port}"

    proc = start_api(port)
    try:
        wait_until_up(base_url)
        reset_api(base_url)

        # Sync with limit of 5
        r = run_sync(base_url, "--limit", "5")
        assert r.returncode == 0, f"stdout={r.stdout}\nstderr={r.stderr}"

        s = sink_state(base_url)
        assert s["count"] == 5

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()

def test_e2e_dry_run_report() -> None:
    port = free_port()
    base_url = f"http://127.0.0.1:{port}"

    proc = start_api(port)
    try:
        wait_until_up(base_url)
        reset_api(base_url)

        # Run dry-run
        r = run_sync(base_url, "--dry-run")
        assert r.returncode == 0

        # Check report
        root = Path(__file__).parent.parent.parent
        report_path = root / "artifacts" / "superpowers" / "report.json"
        assert report_path.exists()

        with open(report_path, "r") as f:
            data = json.load(f)
            assert data["count"] == 25
            assert len(data["external_ids"]) <= 20
            assert "run_id" in data
            assert "timestamp" in data

    finally:
        proc.terminate()
        try:
            proc.wait(timeout=5)
        except subprocess.TimeoutExpired:
            proc.kill()
