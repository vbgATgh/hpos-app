#!/usr/bin/env python3
"""Build a read-only verification projection from promotion decisions.

The projection is derived data for UI/read use only. Promotion decisions remain the
source of truth. This script never mutates THS, action, portfolio or broker state.
"""
from __future__ import annotations

import argparse
import json
from datetime import datetime
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[1]
DECISIONS_DIR = ROOT / "data" / "promotion_decisions"
REGISTRY = ROOT / "data" / "thesis_registry.json"


def _load(path: Path) -> dict[str, Any]:
    data = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(data, dict):
        raise ValueError(f"{path} root must be an object")
    return data


def _dt(value: Any) -> datetime:
    if not isinstance(value, str) or not value:
        raise ValueError("missing ISO date-time")
    return datetime.fromisoformat(value.replace("Z", "+00:00"))


def build(decisions_dir: Path = DECISIONS_DIR, registry_path: Path = REGISTRY) -> dict[str, Any]:
    registry = _load(registry_path)
    registry_keys = set(registry.get("assets", {}).keys())
    decisions = [_load(p) for p in sorted(decisions_dir.glob("*.json"))]
    latest: dict[str, dict[str, Any]] = {}
    seen_ids: set[str] = set()

    for d in sorted(decisions, key=lambda x: (_dt(x.get("decidedAt")), _dt(x.get("sourceAsOf")))):
        did = d.get("decisionId")
        asset = d.get("assetKey")
        status = d.get("targetVerificationStatus")
        if not isinstance(did, str) or not did or did in seen_ids:
            raise ValueError(f"invalid or duplicate decisionId: {did}")
        seen_ids.add(did)
        if asset not in registry_keys:
            raise ValueError(f"unknown assetKey: {asset}")
        if status not in {"PARTIALLY_VERIFIED", "VERIFIED", "REJECTED"}:
            raise ValueError(f"invalid verification status for {did}")
        forbidden = {"ths", "thsBefore", "thsAfter", "action", "actionCandidate", "order", "brokerOrder", "portfolioMutation"}
        if forbidden & set(d.keys()):
            raise ValueError(f"forbidden state/action fields in {did}")
        prev = latest.get(asset)
        if prev:
            prev_source = _dt(prev["sourceAsOf"])
            current_source = _dt(d["sourceAsOf"])
            if current_source < prev_source:
                raise ValueError(f"stale decision for {asset}: {did}")
            if current_source == prev_source and d.get("supersedesDecisionId") != prev.get("decisionId"):
                raise ValueError(f"same-source conflict for {asset}: {did}")
        latest[asset] = d

    assets: dict[str, Any] = {}
    for asset, d in sorted(latest.items()):
        assets[asset] = {
            "verificationStatus": d["targetVerificationStatus"],
            "sourceAsOf": d["sourceAsOf"],
            "decidedAt": d["decidedAt"],
            "decisionId": d["decisionId"],
            "evidenceIds": list(d.get("evidenceIds", [])),
            "unresolvedIssues": list(d.get("unresolvedIssues", [])),
            "rationale": d.get("rationale", ""),
        }
    return {
        "schemaVersion": 1,
        "derived": True,
        "sourceOfTruth": "data/promotion_decisions/*.json",
        "mutatesCanonicalState": False,
        "assets": assets,
    }


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", type=Path, help="compare generated projection with committed file")
    args = parser.parse_args()
    generated = build()
    text = json.dumps(generated, ensure_ascii=False, indent=2, sort_keys=True) + "\n"
    if args.check:
        current = args.check.read_text(encoding="utf-8")
        if current != text:
            print("INVALID: committed verification projection is stale")
            return 1
        print("VALID: committed verification projection matches promotion decisions")
        return 0
    print(text, end="")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
