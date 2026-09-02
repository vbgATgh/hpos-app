#!/usr/bin/env python3
"""Validate HPOS morning-briefing candidate payloads without external dependencies.

The validator deliberately treats external agent output as candidate data only.
It does not promote evidence, thesis status, THS or portfolio actions to canonical
HPOS state.
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
THESIS_REGISTRY = ROOT / "data" / "thesis_registry.json"

ACTIONS = {
    "BUY", "ADD", "HOLD", "DO_NOT_ADD", "REDUCE", "SELL", "ROTATE",
    "WAIT_FOR_TRIGGER", "NONE",
}
THESIS_DELTAS = {"STRENGTHENING", "WEAKENING", "NEUTRAL", "INSUFFICIENT", "BROKEN"}
RISK_DELTAS = {"LOWER", "UNCHANGED", "HIGHER", "UNKNOWN"}
COVERAGE = {"DELTA_FOUND", "NO_RELEVANT_DELTA", "NOT_COVERED"}
VERIFICATION = {"UNVERIFIED", "PARTIALLY_VERIFIED", "VERIFIED", "REJECTED"}
SOURCE_KINDS = {"EXTERNAL_AGENT", "MANUAL_REVIEW"}
ASSET_KEY = re.compile(r"^[A-Z0-9_]+$")


def _is_uri(value: str) -> bool:
    parsed = urlparse(value)
    return parsed.scheme in {"http", "https"} and bool(parsed.netloc)


def _is_datetime(value: str) -> bool:
    try:
        datetime.fromisoformat(value.replace("Z", "+00:00"))
        return True
    except (TypeError, ValueError):
        return False


def _load_registry_keys() -> set[str]:
    data = json.loads(THESIS_REGISTRY.read_text(encoding="utf-8"))
    return set(data.get("assets", {}).keys())


def validate(payload: dict[str, Any]) -> list[str]:
    errors: list[str] = []
    registry_keys = _load_registry_keys()

    if payload.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")

    as_of = payload.get("asOf")
    if not isinstance(as_of, str) or not _is_datetime(as_of):
        errors.append("asOf must be an ISO-8601 date-time string")

    source = payload.get("source")
    if not isinstance(source, dict) or source.get("kind") not in SOURCE_KINDS:
        errors.append("source.kind must be EXTERNAL_AGENT or MANUAL_REVIEW")

    candidates = payload.get("candidates")
    if not isinstance(candidates, list):
        return errors + ["candidates must be an array"]

    for idx, candidate in enumerate(candidates):
        prefix = f"candidates[{idx}]"
        if not isinstance(candidate, dict):
            errors.append(f"{prefix} must be an object")
            continue

        asset_key = candidate.get("assetKey")
        if not isinstance(asset_key, str) or not ASSET_KEY.fullmatch(asset_key):
            errors.append(f"{prefix}.assetKey has invalid format")
        elif asset_key not in registry_keys:
            errors.append(f"{prefix}.assetKey is not present in thesis_registry.json")

        for field in ("externalThsBefore", "externalThsAfter"):
            value = candidate.get(field)
            if value is not None and (not isinstance(value, (int, float)) or isinstance(value, bool) or not 0 <= value <= 10):
                errors.append(f"{prefix}.{field} must be null or a number from 0 to 10")

        if candidate.get("actionCandidate") not in ACTIONS:
            errors.append(f"{prefix}.actionCandidate is invalid")
        if candidate.get("thesisDelta") not in THESIS_DELTAS:
            errors.append(f"{prefix}.thesisDelta is invalid")
        if candidate.get("riskDelta") not in RISK_DELTAS:
            errors.append(f"{prefix}.riskDelta is invalid")
        if candidate.get("coverageStatus") not in COVERAGE:
            errors.append(f"{prefix}.coverageStatus is invalid")
        if candidate.get("verificationStatus") not in VERIFICATION:
            errors.append(f"{prefix}.verificationStatus is invalid")

        evidence_urls = candidate.get("evidenceUrls", [])
        if not isinstance(evidence_urls, list) or any(not isinstance(url, str) or not _is_uri(url) for url in evidence_urls):
            errors.append(f"{prefix}.evidenceUrls must contain http(s) URLs only")

        evidence_ids = candidate.get("evidenceIds", [])
        if not isinstance(evidence_ids, list) or any(not isinstance(item, str) or not item.strip() for item in evidence_ids):
            errors.append(f"{prefix}.evidenceIds must contain non-empty strings")

        proofpoints = candidate.get("proofpoints", [])
        if not isinstance(proofpoints, list) or any(not isinstance(item, str) or not item.strip() for item in proofpoints):
            errors.append(f"{prefix}.proofpoints must contain non-empty strings")

        rotation = candidate.get("rotationCandidate")
        if rotation is not None:
            if not isinstance(rotation, dict):
                errors.append(f"{prefix}.rotationCandidate must be null or an object")
            else:
                target = rotation.get("targetAssetKey")
                if target not in registry_keys:
                    errors.append(f"{prefix}.rotationCandidate.targetAssetKey is not present in thesis_registry.json")
                if rotation.get("scope", "UNSPECIFIED") not in {"PARTIAL", "FULL", "UNSPECIFIED"}:
                    errors.append(f"{prefix}.rotationCandidate.scope is invalid")

        # Guardrail: an external candidate cannot arrive pre-verified without evidence refs.
        if candidate.get("verificationStatus") in {"PARTIALLY_VERIFIED", "VERIFIED"} and not (evidence_urls or evidence_ids):
            errors.append(f"{prefix} cannot be {candidate.get('verificationStatus')} without evidence references")

        # Guardrail: coverage without a relevant delta must not propose a trade.
        if candidate.get("coverageStatus") == "NO_RELEVANT_DELTA" and candidate.get("actionCandidate") not in {"HOLD", "NONE", "WAIT_FOR_TRIGGER"}:
            errors.append(f"{prefix} proposes an action despite NO_RELEVANT_DELTA")

        # Guardrail: this layer never turns a briefing action into canonical execution.
        if candidate.get("verificationStatus") == "UNVERIFIED" and candidate.get("actionCandidate") in {"BUY", "ADD", "REDUCE", "SELL", "ROTATE"}:
            # Candidate is allowed, but must remain visibly unverified. No error is raised.
            pass

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_morning_briefing_candidate.py <payload.json>", file=sys.stderr)
        return 2

    path = Path(sys.argv[1])
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except (OSError, json.JSONDecodeError) as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1

    if not isinstance(payload, dict):
        print("INVALID: root must be an object", file=sys.stderr)
        return 1

    errors = validate(payload)
    if errors:
        for error in errors:
            print(f"INVALID: {error}", file=sys.stderr)
        return 1

    print("VALID: morning briefing candidate payload")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
