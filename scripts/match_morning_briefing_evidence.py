#!/usr/bin/env python3
"""Match morning-briefing candidates to canonical HPOS evidence.

This module is intentionally conservative: matching references never auto-promote a
candidate to VERIFIED and never mutate thesis state, THS, portfolio state or orders.
It only produces a review decision that tells a later HPOS/manual review step whether
canonical evidence references exist and belong to the same asset.
"""

from __future__ import annotations

import json
import sys
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
EVIDENCE_PATH = ROOT / "data" / "fundamental" / "evidence.json"
THESIS_REGISTRY = ROOT / "data" / "thesis_registry.json"
ASSET_ALIASES_PATH = ROOT / "data" / "asset_identity_aliases.json"


def _load_json(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} root must be an object")
    return data


def _load_aliases() -> dict[str, str]:
    if not ASSET_ALIASES_PATH.exists():
        return {}
    data = _load_json(ASSET_ALIASES_PATH)
    aliases = data.get("aliases", {})
    if not isinstance(aliases, dict):
        raise ValueError("asset_identity_aliases.json aliases must be an object")
    return {str(k): str(v) for k, v in aliases.items()}


def _canonical_asset_key(asset_key: Any, aliases: dict[str, str]) -> Any:
    if not isinstance(asset_key, str):
        return asset_key
    return aliases.get(asset_key, asset_key)


def _indexes(evidence: dict[str, Any]) -> tuple[dict[str, dict[str, Any]], dict[str, list[dict[str, Any]]]]:
    by_id: dict[str, dict[str, Any]] = {}
    by_url: dict[str, list[dict[str, Any]]] = {}
    for item in evidence.get("items", []):
        if not isinstance(item, dict):
            continue
        evidence_id = item.get("evidenceId")
        source_url = item.get("sourceUrl")
        if isinstance(evidence_id, str) and evidence_id:
            by_id[evidence_id] = item
        if isinstance(source_url, str) and source_url:
            by_url.setdefault(source_url, []).append(item)
    return by_id, by_url


def match_candidate(candidate: dict[str, Any], evidence: dict[str, Any], aliases: dict[str, str] | None = None) -> dict[str, Any]:
    """Return a non-mutating evidence-match assessment for one candidate."""
    aliases = aliases or _load_aliases()
    asset_key = candidate.get("assetKey")
    requested_ids = [x for x in candidate.get("evidenceIds", []) if isinstance(x, str) and x]
    requested_urls = [x for x in candidate.get("evidenceUrls", []) if isinstance(x, str) and x]
    by_id, by_url = _indexes(evidence)

    matched: dict[str, dict[str, Any]] = {}
    missing_ids: list[str] = []
    missing_urls: list[str] = []
    cross_asset_refs: list[str] = []
    alias_matches: dict[str, str] = {}

    def same_asset(item: dict[str, Any]) -> bool:
        raw = item.get("assetKey")
        canonical = _canonical_asset_key(raw, aliases)
        if isinstance(raw, str) and raw != canonical:
            alias_matches[raw] = canonical
        return canonical == asset_key

    for evidence_id in requested_ids:
        item = by_id.get(evidence_id)
        if not item:
            missing_ids.append(evidence_id)
            continue
        if not same_asset(item):
            cross_asset_refs.append(evidence_id)
            continue
        matched[evidence_id] = item

    for url in requested_urls:
        items = by_url.get(url, [])
        same_asset_items = [item for item in items if same_asset(item)]
        if not items:
            missing_urls.append(url)
            continue
        if not same_asset_items:
            cross_asset_refs.append(url)
            continue
        for item in same_asset_items:
            evidence_id = item.get("evidenceId")
            if isinstance(evidence_id, str) and evidence_id:
                matched[evidence_id] = item

    matched_items = list(matched.values())
    primary_count = sum(1 for item in matched_items if item.get("sourceTier") == "PRIMARY")
    has_refs = bool(requested_ids or requested_urls)

    if cross_asset_refs:
        status = "BLOCKED_ASSET_MISMATCH"
    elif not has_refs:
        status = "BLOCKED_NO_EVIDENCE_REFERENCE"
    elif not matched_items:
        status = "BLOCKED_NO_CANONICAL_MATCH"
    elif missing_ids or missing_urls:
        status = "PARTIAL_MATCH_REVIEW_REQUIRED"
    elif primary_count == 0:
        status = "MATCHED_NONPRIMARY_REVIEW_REQUIRED"
    else:
        status = "MATCHED_READY_FOR_REVIEW"

    return {
        "assetKey": asset_key,
        "matchStatus": status,
        "matchedEvidenceIds": sorted(matched.keys()),
        "matchedCount": len(matched_items),
        "primaryMatchedCount": primary_count,
        "missingEvidenceIds": missing_ids,
        "missingEvidenceUrls": missing_urls,
        "crossAssetReferences": cross_asset_refs,
        "appliedAssetAliases": alias_matches,
        "promotionAllowedAutomatically": False,
        "requiredNextStep": "HPOS_MANUAL_OR_SEPARATE_EVIDENCE_REVIEW",
    }


def assess_payload(payload: dict[str, Any], evidence: dict[str, Any] | None = None) -> dict[str, Any]:
    evidence = evidence or _load_json(EVIDENCE_PATH)
    registry = _load_json(THESIS_REGISTRY)
    registry_keys = set(registry.get("assets", {}).keys())
    aliases = _load_aliases()

    invalid_alias_targets = sorted({target for target in aliases.values() if target not in registry_keys})
    if invalid_alias_targets:
        raise ValueError("asset alias target(s) missing from thesis_registry.json: " + ", ".join(invalid_alias_targets))

    results: list[dict[str, Any]] = []
    for candidate in payload.get("candidates", []):
        if not isinstance(candidate, dict):
            continue
        asset_key = candidate.get("assetKey")
        if asset_key not in registry_keys:
            results.append({
                "assetKey": asset_key,
                "matchStatus": "BLOCKED_UNKNOWN_ASSET",
                "matchedEvidenceIds": [],
                "matchedCount": 0,
                "primaryMatchedCount": 0,
                "missingEvidenceIds": [],
                "missingEvidenceUrls": [],
                "crossAssetReferences": [],
                "appliedAssetAliases": {},
                "promotionAllowedAutomatically": False,
                "requiredNextStep": "FIX_ASSET_IDENTITY",
            })
            continue
        results.append(match_candidate(candidate, evidence, aliases))

    return {
        "schemaVersion": 1,
        "sourceAsOf": payload.get("asOf"),
        "automaticPromotionPerformed": False,
        "candidates": results,
    }


def main() -> int:
    if len(sys.argv) != 2:
        print("usage: match_morning_briefing_evidence.py <candidate-payload.json>", file=sys.stderr)
        return 2
    try:
        payload = _load_json(Path(sys.argv[1]))
        result = assess_payload(payload)
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1
    print(json.dumps(result, ensure_ascii=False, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
