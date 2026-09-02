import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_morning_briefing_promotion.py"
spec = importlib.util.spec_from_file_location("promotion", SCRIPT)
promotion = importlib.util.module_from_spec(spec)
spec.loader.exec_module(promotion)


def registry():
    return {"assets": {"MEDTRONIC": {}}}


def decision():
    return {
        "schemaVersion": 1,
        "decisionId": "prom_20260902_medtronic_001",
        "assetKey": "MEDTRONIC",
        "sourceAsOf": "2026-09-02T07:00:00+02:00",
        "decidedAt": "2026-09-02T21:00:00+02:00",
        "decisionKind": "HPOS_REVIEW",
        "reviewStatus": "REVIEW_READY",
        "targetVerificationStatus": "VERIFIED",
        "evidenceIds": ["ev1"],
        "unresolvedIssues": [],
        "rationale": "Primary evidence is timely and directly supports the registered thesis driver.",
        "supersedesDecisionId": None,
    }


def test_verified_review_ready_is_valid():
    assert promotion.validate(decision(), registry()) == []


def test_verified_rejects_date_gap():
    d = decision()
    d["reviewStatus"] = "REVIEW_READY_WITH_DATE_GAP"
    d["unresolvedIssues"] = ["publishedAt missing"]
    errors = promotion.validate(d, registry())
    assert any("VERIFIED requires reviewStatus REVIEW_READY" in e for e in errors)


def test_verified_rejects_unresolved_issue():
    d = decision()
    d["unresolvedIssues"] = ["semantic conflict"]
    errors = promotion.validate(d, registry())
    assert any("VERIFIED cannot contain unresolvedIssues" in e for e in errors)


def test_partial_requires_explicit_gap():
    d = decision()
    d["targetVerificationStatus"] = "PARTIALLY_VERIFIED"
    d["reviewStatus"] = "MANUAL_SEMANTIC_REVIEW_REQUIRED"
    d["unresolvedIssues"] = []
    errors = promotion.validate(d, registry())
    assert any("requires unresolvedIssues" in e for e in errors)


def test_decision_cannot_predate_briefing():
    d = decision()
    d["decidedAt"] = "2026-09-02T06:00:00+02:00"
    errors = promotion.validate(d, registry())
    assert any("cannot be before sourceAsOf" in e for e in errors)


def test_ths_or_action_mutation_is_forbidden():
    d = decision()
    d["thsAfter"] = 8.5
    d["actionCandidate"] = "BUY"
    errors = promotion.validate(d, registry())
    assert any("forbidden state/action fields" in e for e in errors)


def test_decision_cannot_supersede_itself():
    d = decision()
    d["supersedesDecisionId"] = d["decisionId"]
    errors = promotion.validate(d, registry())
    assert any("cannot supersede itself" in e for e in errors)


def test_unknown_asset_is_rejected():
    d = decision()
    d["assetKey"] = "UNKNOWN"
    errors = promotion.validate(d, registry())
    assert any("assetKey must exist" in e for e in errors)
