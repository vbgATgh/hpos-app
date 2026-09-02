import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "review_morning_briefing_evidence.py"
spec = importlib.util.spec_from_file_location("reviewer", SCRIPT)
reviewer = importlib.util.module_from_spec(spec)
spec.loader.exec_module(reviewer)


def payload():
    return {
        "asOf": "2026-09-02T07:00:00+02:00",
        "candidates": [{
            "assetKey": "MEDTRONIC",
            "proofpoints": ["margin recovery persists"],
            "verificationStatus": "UNVERIFIED"
        }]
    }


def registry():
    return {"assets": {"MEDTRONIC": {
        "thesis": ["organic growth", "margin recovery", "FCF conversion"],
        "risks": ["margin compression"],
        "falsification": ["margin compression persists for two quarters"]
    }}}


def evidence(published="2026-09-01", tier="PRIMARY", driver="margin recovery"):
    return {"items": [{
        "evidenceId": "ev1", "assetKey": "MEDTRONIC", "sourceTier": tier,
        "publishedAt": published, "thesisDriver": driver,
        "notes": "operating margin improved", "category": "MARGIN", "metric": "operating_margin"
    }]}


def match(status="MATCHED_READY_FOR_REVIEW", ids=None):
    return {"candidates": [{"assetKey": "MEDTRONIC", "matchStatus": status, "matchedEvidenceIds": ids if ids is not None else ["ev1"]}]}


def test_primary_timely_thesis_anchored_is_review_ready():
    result = reviewer.review_payload(payload(), match(), evidence(), registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "REVIEW_READY"
    assert c["automaticVerificationPerformed"] is False
    assert c["automaticThsChangePerformed"] is False


def test_future_evidence_is_blocked():
    result = reviewer.review_payload(payload(), match(), evidence(published="2026-09-03"), registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "BLOCKED"
    assert "EVIDENCE_AFTER_BRIEFING_ASOF" in c["issues"]


def test_nonprimary_evidence_is_blocked():
    result = reviewer.review_payload(payload(), match("MATCHED_NONPRIMARY_REVIEW_REQUIRED"), evidence(tier="SECONDARY"), registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "BLOCKED"
    assert "NO_PRIMARY_EVIDENCE" in c["issues"]


def test_no_semantic_anchor_requires_manual_review():
    result = reviewer.review_payload(payload(), match(), evidence(driver="unrelated topic"), registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "MANUAL_SEMANTIC_REVIEW_REQUIRED"


def test_undated_primary_evidence_keeps_date_gap_visible():
    ev = evidence()
    ev["items"][0]["publishedAt"] = None
    result = reviewer.review_payload(payload(), match(), ev, registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "REVIEW_READY_WITH_DATE_GAP"
    assert c["undatedEvidenceIds"] == ["ev1"]


def test_matcher_block_prevents_review():
    result = reviewer.review_payload(payload(), match("BLOCKED_ASSET_MISMATCH"), evidence(), registry())
    c = result["candidates"][0]
    assert c["reviewStatus"] == "BLOCKED_BY_MATCHER"


def test_no_automatic_action_promotion_even_when_review_ready():
    result = reviewer.review_payload(payload(), match(), evidence(), registry())
    c = result["candidates"][0]
    assert c["automaticActionPromotionPerformed"] is False
