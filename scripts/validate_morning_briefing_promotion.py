#!/usr/bin/env python3
"""Validate explicit HPOS promotion decisions for morning-briefing candidates.

This contract deliberately separates evidence review from canonical state mutation.
It validates whether a proposed verification-state change is admissible, auditable
and temporally sane. It never changes THS, actions, portfolio state or broker state.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
THESIS_REGISTRY = ROOT / "data" / "thesis_registry.json"
ASSET_KEY = re.compile(r"^[A-Z0-9_]+$")
TARGETS = {"PARTIALLY_VERIFIED", "VERIFIED", "REJECTED"}
REVIEW_STATUSES = {"REVIEW_READY", "REVIEW_READY_WITH_DATE_GAP", "MANUAL_SEMANTIC_REVIEW_REQUIRED", "BLOCKED", "BLOCKED_BY_MATCHER"}
DECISION_KINDS = {"HPOS_REVIEW", "MANUAL_REVIEW"}


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


def validate(decision: dict[str, Any], registry: dict[str, Any] | None = None) -> list[str]:
    registry = registry or _load(THESIS_REGISTRY)
    registry_keys = set(registry.get("assets", {}).keys())
    errors: list[str] = []

    if decision.get("schemaVersion") != 1:
        errors.append("schemaVersion must be 1")

    decision_id = decision.get("decisionId")
    if not isinstance(decision_id, str) or len(decision_id.strip()) < 8:
        errors.append("decisionId must be a stable non-empty audit id")

    asset_key = decision.get("assetKey")
    if not isinstance(asset_key, str) or not ASSET_KEY.fullmatch(asset_key) or asset_key not in registry_keys:
        errors.append("assetKey must exist in thesis_registry.json")

    source_as_of = _dt(decision.get("sourceAsOf"))
    decided_at = _dt(decision.get("decidedAt"))
    if source_as_of is None:
        errors.append("sourceAsOf must be ISO-8601 date-time")
    if decided_at is None:
        errors.append("decidedAt must be ISO-8601 date-time")
    if source_as_of is not None and decided_at is not None and decided_at < source_as_of:
        errors.append("decidedAt cannot be before sourceAsOf")

    if decision.get("decisionKind") not in DECISION_KINDS:
        errors.append("decisionKind must be HPOS_REVIEW or MANUAL_REVIEW")

    target = decision.get("targetVerificationStatus")
    review_status = decision.get("reviewStatus")
    if target not in TARGETS:
        errors.append("targetVerificationStatus is invalid")
    if review_status not in REVIEW_STATUSES:
        errors.append("reviewStatus is invalid")

    rationale = decision.get("rationale")
    if not isinstance(rationale, str) or len(rationale.strip()) < 20:
        errors.append("rationale must contain a meaningful audit explanation")

    evidence_ids = decision.get("evidenceIds")
    if not isinstance(evidence_ids, list) or any(not isinstance(x, str) or not x.strip() for x in evidence_ids):
        errors.append("evidenceIds must be an array of non-empty strings")
        evidence_ids = []

    unresolved = decision.get("unresolvedIssues", [])
    if not isinstance(unresolved, list) or any(not isinstance(x, str) or not x.strip() for x in unresolved):
        errors.append("unresolvedIssues must be an array of non-empty strings")
        unresolved = []

    # A fully verified state requires the strongest review outcome, primary evidence references,
    # and no unresolved gaps. Date gaps or semantic gaps cannot be silently promoted away.
    if target == "VERIFIED":
        if review_status != "REVIEW_READY":
            errors.append("VERIFIED requires reviewStatus REVIEW_READY")
        if not evidence_ids:
            errors.append("VERIFIED requires evidenceIds")
        if unresolved:
            errors.append("VERIFIED cannot contain unresolvedIssues")

    # Partial verification is specifically for remaining review gaps that are made explicit.
    if target == "PARTIALLY_VERIFIED":
        if review_status not in {"REVIEW_READY_WITH_DATE_GAP", "MANUAL_SEMANTIC_REVIEW_REQUIRED", "REVIEW_READY"}:
            errors.append("PARTIALLY_VERIFIED requires a non-blocked review status")
        if not evidence_ids:
            errors.append("PARTIALLY_VERIFIED requires evidenceIds")
        if review_status != "REVIEW_READY" and not unresolved:
            errors.append("PARTIALLY_VERIFIED with a review gap requires unresolvedIssues")

    # Rejection may originate from any review state, but must say why. Evidence is optional.
    if target == "REJECTED" and not rationale:
        errors.append("REJECTED requires rationale")

    # Promotion decisions are evidence-state decisions only. Any attempt to smuggle THS/action/order
    # mutation into the same payload is rejected to keep responsibilities separate and auditable.
    forbidden = {"ths", "thsBefore", "thsAfter", "action", "actionCandidate", "order", "brokerOrder", "portfolioMutation"}
    present_forbidden = sorted(forbidden & set(decision.keys()))
    if present_forbidden:
        errors.append("promotion payload contains forbidden state/action fields: " + ", ".join(present_forbidden))

    supersedes = decision.get("supersedesDecisionId")
    if supersedes is not None and (not isinstance(supersedes, str) or len(supersedes.strip()) < 8):
        errors.append("supersedesDecisionId must be null or a stable audit id")
    if supersedes == decision_id and supersedes is not None:
        errors.append("a decision cannot supersede itself")

    return errors


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: validate_morning_briefing_promotion.py <decision.json>", file=sys.stderr)
        return 2
    try:
        decision = _load(Path(sys.argv[1]))
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"INVALID: {exc}", file=sys.stderr)
        return 1
    errors = validate(decision)
    if errors:
        for error in errors:
            print(f"INVALID: {error}", file=sys.stderr)
        return 1
    print("VALID: morning briefing promotion decision")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
