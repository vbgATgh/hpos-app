#!/usr/bin/env python3
"""Project the current HPOS evidence-verification state from promotion decisions.

Read-only by design. This module does not write canonical state and never projects
THS, actions, orders, positions or broker data. It first requires a valid monotonic
promotion sequence, then exposes only the latest evidence-verification decision per
asset together with its audit lineage.
"""
from __future__ import annotations

import importlib.util
import json
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_DECISIONS = ROOT / "data" / "promotion_decisions"
THESIS_REGISTRY = ROOT / "data" / "thesis_registry.json"
SEQUENCE_SCRIPT = ROOT / "scripts" / "validate_promotion_sequence.py"
ALLOWED_STATUSES = {"PARTIALLY_VERIFIED", "VERIFIED", "REJECTED"}
FORBIDDEN_FIELDS = {"ths", "thsBefore", "thsAfter", "action", "actionCandidate", "order", "brokerOrder", "portfolioMutation"}


def _load(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} root must be an object")
    return data


def _load_sequence_module():
    spec = importlib.util.spec_from_file_location("promotion_sequence", SEQUENCE_SCRIPT)
    if spec is None or spec.loader is None:
        raise ValueError("cannot load promotion sequence validator")
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def _dt(value: Any) -> datetime:
    if not isinstance(value, str) or not value:
        raise ValueError("invalid ISO-8601 date-time")
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=timezone.utc)
    return parsed


def load_decisions(path: Path) -> list[dict[str, Any]]:
    if not path.is_dir():
        raise ValueError(f"{path} must be a directory")
    return [_load(item) for item in sorted(path.glob("*.json"))]


def project(decisions: list[dict[str, Any]], registry: dict[str, Any]) -> dict[str, Any]:
    sequence = _load_sequence_module()
    errors = sequence.validate_sequence(decisions)
    if errors:
        raise ValueError("invalid promotion sequence: " + " | ".join(errors))

    registry_keys = set(registry.get("assets", {}).keys())
    latest: dict[str, dict[str, Any]] = {}

    # Sequence validity guarantees that decidedAt order cannot regress sourceAsOf.
    ordered = sorted(decisions, key=lambda d: _dt(d.get("decidedAt")))
    for decision in ordered:
        asset = decision.get("assetKey")
        if asset not in registry_keys:
            raise ValueError(f"promotion asset missing from thesis registry: {asset}")
        status = decision.get("targetVerificationStatus")
        if status not in ALLOWED_STATUSES:
            raise ValueError(f"invalid targetVerificationStatus for {asset}: {status}")
        forbidden = sorted(FORBIDDEN_FIELDS & set(decision.keys()))
        if forbidden:
            raise ValueError(f"promotion decision contains forbidden state/action fields for {asset}: {', '.join(forbidden)}")

        evidence_ids = decision.get("evidenceIds", [])
        if not isinstance(evidence_ids, list) or any(not isinstance(x, str) or not x for x in evidence_ids):
            raise ValueError(f"invalid evidenceIds for {asset}")

        latest[asset] = {
            "assetKey": asset,
            "verificationStatus": status,
            "decisionId": decision.get("decisionId"),
            "sourceAsOf": decision.get("sourceAsOf"),
            "decidedAt": decision.get("decidedAt"),
            "reviewStatus": decision.get("reviewStatus"),
            "evidenceIds": list(evidence_ids),
            "unresolvedIssues": list(decision.get("unresolvedIssues", [])),
            "supersedesDecisionId": decision.get("supersedesDecisionId"),
        }

    return {
        "schemaVersion": 1,
        "projectionType": "READ_ONLY_EVIDENCE_VERIFICATION",
        "stateMutationPerformed": False,
        "thsMutationPerformed": False,
        "actionMutationPerformed": False,
        "assetCount": len(latest),
        "assets": {key: latest[key] for key in sorted(latest)},
    }


def main() -> int:
    directory = Path(sys.argv[1]) if len(sys.argv) == 2 else DEFAULT_DECISIONS
    if len(sys.argv) > 2:
        print("usage: project_verification_state.py [promotion-decisions-directory]", file=sys.stderr)
        return 2
    try:
        decisions = load_decisions(directory)
        registry = _load(THESIS_REGISTRY)
        result = project(decisions, registry)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
