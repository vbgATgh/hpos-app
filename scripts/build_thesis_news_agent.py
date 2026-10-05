#!/usr/bin/env python3
"""Build the deterministic HPOS thesis/news review artifact.

The agent deduplicates events, compares them with registered thesis proofpoints,
risks and falsifications, and versions the evidence state. It never edits the
registered thesis and never promotes a buy/sell/order state.
"""
from __future__ import annotations

import datetime as dt
import hashlib
import json
import re
from pathlib import Path
from typing import Any
from urllib.parse import parse_qsl, urlencode, urlsplit, urlunsplit

ROOT = Path(__file__).resolve().parents[1]
NEWS = ROOT / "data/news/news_feed.json"
EVIDENCE = ROOT / "data/fundamental/evidence.json"
CURATED = ROOT / "data/fundamental/evidence_curated.json"
SIGNALS = ROOT / "data/fundamental/thesis_signals.json"
REGISTRY = ROOT / "data/thesis_registry.json"
CATALOG = ROOT / "data/asset_catalog.json"
OUT = ROOT / "data/fundamental/thesis_agent.json"

STOP = {"the","and","for","with","from","that","this","into","its","und","der","die","das","mit","von","für","auf","ist","are","was","will","has","have","company","group","plc","ltd","inc","corporation","energy","reports","report","results","update","news"}
NEGATIVE = {"decline","declines","declined","cut","cuts","miss","misses","weak","weaker","loss","losses","erosion","falling","lower","reduced","reduces","suspend","suspended","cancel","cancelled","downgrade","deterioration","pressure","below"}


def now() -> str:
    return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def tokens(value: Any) -> set[str]:
    if not isinstance(value, str):
        return set()
    return {x for x in re.findall(r"[a-z0-9]+", value.lower()) if len(x) >= 3 and x not in STOP}


def canonical_url(value: Any) -> str:
    if not isinstance(value, str) or not value.startswith(("http://", "https://")):
        return ""
    p = urlsplit(value)
    query = [(k, v) for k, v in parse_qsl(p.query, keep_blank_values=True) if not k.lower().startswith("utm_") and k.lower() not in {"gclid", "fbclid"}]
    return urlunsplit((p.scheme.lower(), p.netloc.lower().removeprefix("www."), re.sub(r"/+$", "", p.path) or "/", urlencode(query), ""))


def canonical_title(value: Any) -> str:
    text = str(value or "").lower().split(" - ", 1)[0]
    return re.sub(r"[^a-z0-9]+", "", text)


def event_key(asset_key: str, item: dict[str, Any]) -> str:
    title = canonical_title(item.get("title") or item.get("notes"))
    url = canonical_url(item.get("url") or item.get("sourceUrl"))
    raw = f"{asset_key}|{title or url}".encode()
    return "evt_" + hashlib.sha256(raw).hexdigest()[:20]


def source_rank(item: dict[str, Any]) -> int:
    tier = str(item.get("sourceTier") or "").upper()
    return 3 if tier == "REGULATOR" else 2 if tier == "PRIMARY" or item.get("primarySource") is True else 1


def is_event_evidence(item: dict[str, Any]) -> bool:
    """Exclude undated navigation/static IR pages from the event ledger."""
    return bool(
        item.get("publishedAt")
        or item.get("metric") is not None
        or item.get("falsificationCandidate") is True
    )


def dedupe_events(items: list[dict[str, Any]]) -> tuple[list[dict[str, Any]], int]:
    winners: dict[str, dict[str, Any]] = {}
    duplicate_count = 0
    for item in items:
        asset = str(item.get("assetKey") or "")
        if not asset:
            continue
        key = event_key(asset, item)
        candidate = {**item, "eventKey": key}
        current = winners.get(key)
        if current is None:
            winners[key] = candidate
            continue
        duplicate_count += 1
        score = (source_rank(candidate), bool(canonical_url(candidate.get("url"))), str(candidate.get("publishedAt") or ""))
        old_score = (source_rank(current), bool(canonical_url(current.get("url"))), str(current.get("publishedAt") or ""))
        if score > old_score:
            winners[key] = candidate
    return sorted(winners.values(), key=lambda x: str(x.get("publishedAt") or x.get("observedAt") or ""), reverse=True), duplicate_count


def assess(item: dict[str, Any], definition: dict[str, Any]) -> dict[str, Any]:
    text = " ".join(str(item.get(k) or "") for k in ("title", "notes", "thesisDriver", "category", "metric"))
    event_tokens = tokens(text)
    proof_tokens = set().union(*(tokens(x) for x in definition.get("thesis", [])))
    risk_tokens = set().union(*(tokens(x) for x in definition.get("risks", [])))
    false_tokens = set().union(*(tokens(x) for x in definition.get("falsification", [])))
    proof = sorted(event_tokens & proof_tokens)
    risks = sorted(event_tokens & risk_tokens)
    falsification = sorted(event_tokens & false_tokens)
    explicit_false = item.get("falsificationCandidate") is True
    primary = source_rank(item) >= 2
    negative_context = bool(event_tokens & NEGATIVE) or str(item.get("direction") or "").upper() == "NEGATIVE"
    if explicit_false or (len(falsification) >= 2 and negative_context):
        classification = "FALSIFICATION_CANDIDATE"
    elif proof:
        classification = "PROOFPOINT_MATCH"
    elif risks:
        classification = "RISK_MATCH"
    else:
        classification = "UNRELATED"
    material = classification != "UNRELATED"
    review = "MANUAL_REVIEW_REQUIRED" if material and primary else "DISCOVERY_ONLY" if material else "NO_ACTION"
    return {
        "eventKey": item["eventKey"],
        "classification": classification,
        "reviewStatus": review,
        "primaryEvidence": primary,
        "proofpointMatches": proof,
        "riskMatches": risks,
        "falsificationMatches": falsification,
        "title": item.get("title") or item.get("notes") or item.get("metric") or "Evidenz",
        "publishedAt": item.get("publishedAt") or item.get("observedAt"),
        "sourceName": item.get("source") or item.get("sourceName") or "Quelle offen",
        "sourceUrl": canonical_url(item.get("url") or item.get("sourceUrl")),
        "sourceTier": "PRIMARY" if primary else str(item.get("sourceTier") or "DISCOVERY"),
        "evidenceId": item.get("evidenceId"),
    }


def version_state(old: dict[str, Any], version_evidence: list[str]) -> tuple[int, str, list[str], list[str]]:
    previous_seen = set(old.get("seenEvidenceIds", []))
    new_ids = sorted(set(version_evidence) - previous_seen)
    seen = sorted(previous_seen | set(version_evidence))[-200:]
    old_version = int(old.get("thsVersion") or 0)
    version = max(1, old_version + (1 if old_version and new_ids else 0))
    reason = "INITIALIZED" if not old_version else "NEW_PRIMARY_EVIDENCE" if new_ids else "UNCHANGED"
    return version, reason, seen, new_ids


def build(previous: dict[str, Any] | None = None) -> dict[str, Any]:
    previous = previous or load(OUT, {"assets": []})
    registry = load(REGISTRY, {"assets": {}}).get("assets", {})
    catalog = load(CATALOG, {"assets": {}}).get("assets", {})
    signals = {x.get("assetKey"): x for x in load(SIGNALS, {"assets": []}).get("assets", []) if isinstance(x, dict)}
    news = load(NEWS, {"items": []}).get("items", [])
    evidence = [
        x
        for x in [*load(EVIDENCE, {"items": []}).get("items", []), *load(CURATED, {"items": []}).get("items", [])]
        if isinstance(x, dict) and is_event_evidence(x)
    ]
    events, duplicates = dedupe_events([x for x in [*news, *evidence] if isinstance(x, dict)])
    by_asset: dict[str, list[dict[str, Any]]] = {}
    for event in events:
        by_asset.setdefault(str(event.get("assetKey")), []).append(event)
    previous_by_asset = {x.get("assetKey"): x for x in previous.get("assets", []) if isinstance(x, dict)}
    assets = []
    for asset_key, definition in registry.items():
        assessments = [assess(x, definition) for x in by_asset.get(asset_key, [])]
        relevant = [x for x in assessments if x["classification"] != "UNRELATED"]
        version_evidence = sorted({x["eventKey"] for x in relevant if x["primaryEvidence"]})
        old = previous_by_asset.get(asset_key, {})
        version, reason, seen, new_ids = version_state(old, version_evidence)
        signal = signals.get(asset_key, {})
        proposed = "FALSIFICATION_REVIEW" if any(x["classification"] == "FALSIFICATION_CANDIDATE" and x["primaryEvidence"] for x in relevant) else "EVIDENCE_REVIEW" if version_evidence else "NO_CHANGE"
        identity = catalog.get(asset_key, {})
        digest = hashlib.sha256("|".join(seen).encode()).hexdigest()[:16].upper()
        assets.append({
            "assetKey": asset_key,
            "name": identity.get("name") or asset_key.replace("_", " ").title(),
            "isin": identity.get("isin"),
            "role": definition.get("role"),
            "registeredThesis": definition.get("thesis", []),
            "registeredFalsification": definition.get("falsification", []),
            "thsVersion": version,
            "versionReason": reason,
            "newEvidenceIds": new_ids,
            "seenEvidenceIds": seen,
            "evidenceFingerprint": "THS-" + digest,
            "currentSignalState": signal.get("state", "INSUFFICIENT"),
            "proposedDelta": proposed,
            "automaticThsChangePerformed": False,
            "automaticDecisionChangePerformed": False,
            "reviewRequired": proposed != "NO_CHANGE",
            "assessmentCount": len(relevant),
            "assessments": relevant[:8],
        })
    return {
        "schemaVersion": 1,
        "generatedAt": now(),
        "policy": {
            "primaryEvidenceRequiredForVersion": True,
            "newsNeverChangesThsAutomatically": True,
            "newsNeverChangesDecisionAutomatically": True,
            "duplicateEventsCountOnce": True,
        },
        "summary": {
            "assets": len(assets),
            "reviewRequired": sum(1 for x in assets if x["reviewRequired"]),
            "falsificationReviews": sum(1 for x in assets if x["proposedDelta"] == "FALSIFICATION_REVIEW"),
            "duplicatesSuppressed": duplicates,
        },
        "assets": assets,
    }


def main() -> None:
    result = build()
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(",", ":")) + "\n", encoding="utf-8")
    print("Thesis/news agent:", result["summary"])


if __name__ == "__main__":
    main()
