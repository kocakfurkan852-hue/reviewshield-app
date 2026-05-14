from __future__ import annotations

import argparse
import os
import random
import time
import uuid
import logging
import json
from dataclasses import dataclass
from typing import Any
from pathlib import Path

import httpx


LOG = logging.getLogger("sync_tool")


def find_repo_root(start_path: Path) -> Path:
    """Traverse upwards to find the repository root (containing .agent/)."""
    curr = start_path.resolve()
    for _ in range(10):  # limit search depth
        if (curr / ".agent").exists():
            return curr
        if curr.parent == curr:
            break
        curr = curr.parent
    # Fallback to current working directory if not found
    return Path.cwd()


@dataclass
class RetryPolicy:
    max_attempts: int = 6
    base_delay_s: float = 0.4
    max_delay_s: float = 5.0


def backoff(attempt: int, base: float, cap: float) -> float:
    # exponential backoff with jitter
    delay = min(cap, base * (2 ** (attempt - 1)))
    return delay * (0.5 + random.random())  # jitter in [0.5, 1.5)


def should_retry(status_code: int) -> bool:
    if status_code == 429:
        return True
    if 500 <= status_code <= 599:
        return True
    if status_code in (408,):
        return True
    return False


def request_with_retries(
    client: httpx.Client,
    method: str,
    url: str,
    *,
    headers: dict[str, str] | None = None,
    json: Any | None = None,
    retry: RetryPolicy,
    run_id: str,
) -> httpx.Response:
    last_exc: Exception | None = None

    for attempt in range(1, retry.max_attempts + 1):
        try:
            t0 = time.time()
            resp = client.request(method, url, headers=headers, json=json)
            elapsed_ms = int((time.time() - t0) * 1000)

            LOG.info(
                "http_request",
                extra={
                    "run_id": run_id,
                    "method": method,
                    "url": url,
                    "status": resp.status_code,
                    "elapsed_ms": elapsed_ms,
                    "attempt": attempt,
                },
            )

            if resp.status_code < 400:
                return resp

            if should_retry(resp.status_code) and attempt < retry.max_attempts:
                # Respect Retry-After for 429 if present
                retry_after = resp.headers.get("Retry-After")
                if retry_after:
                    try:
                        sleep_s = float(retry_after)
                    except ValueError:
                        sleep_s = backoff(attempt, retry.base_delay_s, retry.max_delay_s)
                else:
                    sleep_s = backoff(attempt, retry.base_delay_s, retry.max_delay_s)

                time.sleep(sleep_s)
                continue

            resp.raise_for_status()
            return resp  # unreachable normally

        except (httpx.TimeoutException, httpx.NetworkError) as e:
            last_exc = e
            LOG.warning("transient_network_error", extra={"run_id": run_id, "attempt": attempt, "error": str(e)})
            if attempt >= retry.max_attempts:
                raise
            time.sleep(backoff(attempt, retry.base_delay_s, retry.max_delay_s))

    if last_exc:
        raise last_exc
    raise RuntimeError("request_with_retries failed unexpectedly")


def fetch_all_source_items(
    client: httpx.Client, base_url: str, *, run_id: str, limit: int | None = None
) -> list[dict[str, Any]]:
    items: list[dict[str, Any]] = []
    page = 1
    page_size = 10
    max_pages = 100

    while page and page <= max_pages:
        url = f"{base_url}/source/items?page={page}&limit={page_size}"
        resp = request_with_retries(client, "GET", url, retry=RetryPolicy(), run_id=run_id)
        data = resp.json()
        batch = data["items"]
        items.extend(batch)

        if limit is not None and len(items) >= limit:
            break

        page = data.get("next_page")

    if limit is not None:
        items = items[:limit]

    return items


def upsert_sink_items(client: httpx.Client, base_url: str, source_items: list[dict[str, Any]], *, run_id: str) -> dict[str, int]:
    created = 0
    updated = 0
    failed = 0

    for it in source_items:
        # Minimal mapping layer (could be expanded)
        payload = {
            "external_id": it["external_id"],
            "name": it["name"],
            "value": int(it["value"]),
        }

        # idempotency hint: deterministic key per external_id for safe repeats
        headers = {"Idempotency-Key": f"sync:{payload['external_id']}"}

        try:
            resp = request_with_retries(
                client,
                "POST",
                f"{base_url}/sink/items",
                headers=headers,
                json=payload,
                retry=RetryPolicy(),
                run_id=run_id,
            )
            status = resp.json()["status"]
            if status == "created":
                created += 1
            else:
                updated += 1
        except Exception as e:
            failed += 1
            LOG.error("upsert_failed", extra={"run_id": run_id, "external_id": payload["external_id"], "error": str(e)})

    return {"created_count": created, "updated_count": updated, "failed_count": failed}


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default=os.environ.get("DEMO_BASE_URL", "http://127.0.0.1:8000"))
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--limit", type=int, default=None, help="Maximum number of items to process")
    args = parser.parse_args()

    run_id = uuid.uuid4().hex[:10]
    logging.basicConfig(level=logging.INFO, format="%(levelname)s %(name)s %(message)s")

    LOG.info("run_start", extra={"run_id": run_id, "base_url": args.base_url})

    timeout = httpx.Timeout(connect=2.0, read=10.0, write=10.0, pool=10.0)
    with httpx.Client(timeout=timeout) as client:
        items = fetch_all_source_items(client, args.base_url, run_id=run_id, limit=args.limit)
        LOG.info("fetched_source", extra={"run_id": run_id, "count": len(items)})

        if args.dry_run:
            root = find_repo_root(Path(__file__))
            report_dir = root / "artifacts" / "superpowers"
            report_dir.mkdir(parents=True, exist_ok=True)
            report_path = report_dir / "report.json"

            report = {
                "run_id": run_id,
                "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
                "count": len(items),
                "external_ids": [it["external_id"] for it in items[:20]],
            }

            with open(report_path, "w") as f:
                json.dump(report, f, indent=2)

            LOG.info("dry_run_report_generated", extra={"run_id": run_id, "path": str(report_path)})
            LOG.info("dry_run_no_writes", extra={"run_id": run_id})
            return 0

        stats = upsert_sink_items(client, args.base_url, items, run_id=run_id)
        LOG.info("run_summary", extra={"run_id": run_id, **stats, "fetched_count": len(items)})

    # Non-zero exit if systemic failure
    return 0 if stats["failed_count"] == 0 else 2


if __name__ == "__main__":
    raise SystemExit(main())
