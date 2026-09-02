#!/usr/bin/env python3
"""Conservative HPOS evidence-review layer for morning-briefing candidates.

This layer sits after candidate validation and evidence matching. It checks whether
matched canonical evidence is timely, primary-source backed and plausibly connected
to the registered thesis/risk/falsification vocabulary. It never changes THS,
verification status, portfolio state or execution state automatically.
"""
from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_PATH = ROOT / "data" / "fundamental" / "evidence.json"
THESIS_REGISTRY = ROOT / "data" / "thesis_registry.json"


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
        try:
            parsed = datetime.fromisoformat(value + "T00:00:00+00:00")
            return parsed
        except ValueError:
            return None


def _tokens(value: Any) -> set[str]:
    if not isinstance(value, str):
        return set()
    return {t for t in re.findall(r"[a-z0-9]+", value.lower()) if len(t) >= 3}


def _registry_terms(asset: dict[str, Any]) -> set[str]:
    terms: set[str] = set()
    for field in ("thesis", "risks", "falsification"):
        for value in asset.get(field, []):
            terms |= _tokens(value)
    return terms


def review_candidate(candidate: dict[str, Any], matched_ids: list[str], evidence: dict[str, Any], registry: dict[str, Any], as_of: Any) -> dict[str, Any]:
    asset_key = candidate.get("assetKey")
    asset = registry.get("assets", {}).get(asset_key, {})
    by_id = {item.get("evidenceId"): item for item in evidence.get("items", []) if isinstance(item, dict)}
    items = [by_id[eid] for eid in matched_ids if eid in by_id]
    as_of_dt = _dt(as_of)

    issues: list[str] = []
    primary = [item for item in items if item.get("sourceTier") == "PRIMARY"]
    if not items:
        issues.append("NO_MATCHED_EVIDENCE")
    if items and not primary:
        issues.append("NO_PRIMARY_EVIDENCE")

    future_items: list[str] = []
    undated_items: list[str] = []
    for item in items:
        published = _dt(item.get("publishedAt"))
        if published is None:
            undated_items.append(str(item.get("evidenceId")))
        elif as_of_dt is not None and published > as_of_dt:
            future_items.append(str(item.get("evidenceId")))
    if future_items:
        issues.append("EVIDENCE_AFTER_BRIEFING_ASOF")

    vocabulary = _registry_terms(asset)
    candidate_terms: set[str] = set()
    for proofpoint in candidate.get("proofpoints", []):
        candidate_terms |= _tokens(proofpoint)

    driver_terms: set[str] = set()
    supporting_terms: set[str] = set()
    for item in items:
        driver_terms |= _tokens(item.get("thesisDriver"))
        supporting_terms |= _tokens(item.get("notes"))
        supporting_terms |= _tokens(item.get("category"))
        supporting_terms |= _tokens(item.get("metric"))

    # Prefer explicit thesisDriver linkage. Generic words in notes such as growth or margin
    # must not by themselves make unrelated evidence REVIEW_READY. If a source has no
    # thesisDriver at all, require at least two supporting vocabulary overlaps as a cautious
    # fallback and still expose the matched tokens for audit.
    registry_driver_overlap = sorted(vocabulary & driver_terms)
    proofpoint_driver_overlap = sorted(candidate_terms & driver_terms)
    supporting_registry_overlap = sorted(vocabulary & supporting_terms)
    supporting_proofpoint_overlap = sorted(candidate_terms & supporting_terms)
    has_explicit_driver = bool(driver_terms)
    strong_driver_anchor = bool(registry_driver_overlap or proofpoint_driver_overlap)
    fallback_anchor_count = len(set(supporting_registry_overlap) | set(supporting_proofpoint_overlap))
    semantic_anchor = strong_driver_anchor if has_explicit_driver else fallback_anchor_count >= 2

    if items and not semantic_anchor:
        issues.append("NO_THESIS_OR_PROOFPOINT_ANCHOR")

    if any(issue in issues for issue in ("NO_MATCHED_EVIDENCE", "NO_PRIMARY_EVIDENCE", "EVIDENCE_AFTER_BRIEFING_ASOF")):
        status = "BLOCKED"
    elif not semantic_anchor:
        status = "MANUAL_SEMANTIC_REVIEW_REQUIRED"
    elif undated_items:
        status = "REVIEW_READY_WITH_DATE_GAP"
    else:
        status = "REVIEW_READY"

    return {
        "assetKey": asset_key,
        "reviewStatus": status,
        "matchedEvidenceIds": matched_ids,
        "primaryEvidenceCount": len(primary),
        "futureEvidenceIds": future_items,
        "undatedEvidenceIds": undated_items,
        "registryAnchorTokens": registry_driver_overlap,
        "proofpointAnchorTokens": proofpoint_driver_overlap,
        "supportingRegistryTokens": supporting_registry_overlap,
        "supportingProofpointTokens": supporting_proofpoint_overlap,
        "explicitThesisDriverPresent": has_explicit_driver,
        "issues": issues,
        "automaticVerificationPerformed": False,
        "automaticThsChangePerformed": False,
        "automaticActionPromotionPerformed": False,
        "requiredNextStep": "HUMAN_OR_SEPARATE_HPOS_REVIEW_DECISION" if status != "BLOCKED" else "RESOLVE_EVIDENCE_BLOCKERS",
    }


def review_payload(payload: dict[str, Any], match_result: dict[str, Any], evidence: dict[str, Any] | None = None, registry: dict[str, Any] | None = None) -> dict[str, Any]:
    evidence = evidence or _load(EVIDENCE_PATH)
    registry = registry or _load(THESIS_REGISTRY)
    match_by_asset = {x.get("assetKey"): x for x in match_result.get("candidates", []) if isinstance(x, dict)}
    results: list[dict[str, Any]] = []
    for candidate in payload.get("candidates", []):
        if not isinstance(candidate, dict):
            continue
        match = match_by_asset.get(candidate.get("assetKey"), {})
        match_status = match.get("matchStatus")
        if match_status not in {"MATCHED_READY_FOR_REVIEW", "PARTIAL_MATCH_REVIEW_REQUIRED", "MATCHED_NONPRIMARY_REVIEW_REQUIRED"}:
            results.append({
                "assetKey": candidate.get("assetKey"),
                "reviewStatus": "BLOCKED_BY_MATCHER",
                "matchStatus": match_status,
                "automaticVerificationPerformed": False,
                "automaticThsChangePerformed": False,
                "automaticActionPromotionPerformed": False,
                "requiredNextStep": "RESOLVE_MATCHER_BLOCKER",
            })
            continue
        results.append(review_candidate(candidate, match.get("matchedEvidenceIds", []), evidence, registry, payload.get("asOf")))
    return {"schemaVersion": 1, "sourceAsOf": payload.get("asOf"), "automaticPromotionPerformed": False, "candidates": results}


def main() -> int:
    if len(sys.argv) != 3:
        print("usage: review_morning_briefing_evidence.py <candidate.json> <match-result.json>", file=sys.stderr)
        return 2
    try:
        payload = _load(Path(sys.argv[1]))
        matches = _load(Path(sys.argv[2]))
        result = review_payload(payload, matches)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
