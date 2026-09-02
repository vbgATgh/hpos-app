#!/usr/bin/env python3
"""Validate HPOS promotion-decision ordering before any canonical writer exists.

The sequence validator prevents older or conflicting evidence-state decisions from
silently replacing newer state. It does not write canonical state and does not touch
THS, actions, portfolio positions or broker data.
"""
from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any


def _load(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} root must be an object")
    return data


def _dt(value: Any) -> datetime | None:
    if not isinstance(value, str) or not value:
        return None
    try:
        parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=timezone.utc)
        return parsed
    except ValueError:
        return None


def validate_sequence(decisions: list[dict[str, Any]]) -> list[str]:
    errors: list[str] = []
    seen_ids: set[str] = set()
    latest_by_asset: dict[str, dict[str, Any]] = {}

    sortable: list[tuple[datetime, datetime, dict[str, Any]]] = []
    for idx, decision in enumerate(decisions):
        decision_id = decision.get("decisionId")
        if not isinstance(decision_id, str) or not decision_id:
            errors.append(f"decisions[{idx}] missing decisionId")
            continue
        if decision_id in seen_ids:
            errors.append(f"duplicate decisionId: {decision_id}")
        seen_ids.add(decision_id)

        source_as_of = _dt(decision.get("sourceAsOf"))
        decided_at = _dt(decision.get("decidedAt"))
        if source_as_of is None or decided_at is None:
            errors.append(f"{decision_id} has invalid sourceAsOf/decidedAt")
            continue
        sortable.append((decided_at, source_as_of, decision))

    sortable.sort(key=lambda item: item[0])

    for decided_at, source_as_of, decision in sortable:
        asset = decision.get("assetKey")
        decision_id = decision.get("decisionId")
        if not isinstance(asset, str) or not asset:
            errors.append(f"{decision_id} missing assetKey")
            continue

        previous = latest_by_asset.get(asset)
        if previous is not None:
            previous_source = _dt(previous.get("sourceAsOf"))
            previous_decided = _dt(previous.get("decidedAt"))
            previous_id = previous.get("decisionId")
            supersedes = decision.get("supersedesDecisionId")

            if previous_source is not None and source_as_of < previous_source:
                errors.append(
                    f"{decision_id} is stale for {asset}: sourceAsOf predates {previous_id}"
                )
                continue

            if previous_source is not None and source_as_of == previous_source:
                if supersedes != previous_id:
                    errors.append(
                        f"{decision_id} conflicts with same-source decision {previous_id}; explicit supersedesDecisionId required"
                    )
                    continue
                if previous_decided is not None and decided_at <= previous_decided:
                    errors.append(
                        f"{decision_id} supersedes {previous_id} but decidedAt is not later"
                    )
                    continue

        latest_by_asset[asset] = decision

    return errors


def load_directory(path: Path) -> list[dict[str, Any]]:
    if not path.is_dir():
        raise ValueError(f"{path} must be a directory")
    return [_load(item) for item in sorted(path.glob("*.json"))]


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_promotion_sequence.py <promotion-decisions-directory>", file=sys.stderr)
        return 2
    try:
        decisions = load_directory(Path(sys.argv[1]))
        errors = validate_sequence(decisions)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1
    if errors:
        for error in errors:
            print(f"INVALID: {error}", file=sys.stderr)
        return 1
    print(f"VALID: {len(decisions)} promotion decisions in monotonic sequence")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
