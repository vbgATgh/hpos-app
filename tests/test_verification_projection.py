import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "project_verification_state.py"
spec = importlib.util.spec_from_file_location("verification_projection", SCRIPT)
projection = importlib.util.module_from_spec(spec)
spec.loader.exec_module(projection)


def registry():
    return {"assets": {"MEDTRONIC": {}, "GSK": {}}}


def decision(asset="MEDTRONIC", source="2026-09-02T07:00:00+02:00", decided="2026-09-02T21:00:00+02:00", status="VERIFIED", decision_id="prom_001", supersedes=None):
    return {
        "schemaVersion": 1,
        "decisionId": decision_id,
        "assetKey": asset,
        "sourceAsOf": source,
        "decidedAt": decided,
        "decisionKind": "HPOS_REVIEW",
        "reviewStatus": "REVIEW_READY",
        "targetVerificationStatus": status,
        "evidenceIds": ["ev1"],
        "unresolvedIssues": [],
        "rationale": "Synthetic rationale long enough for an audit decision.",
        "supersedesDecisionId": supersedes,
    }


def test_projection_selects_latest_valid_decision_per_asset():
    first = decision(decision_id="prom_old_001")
    newer = decision(source="2026-09-03T07:00:00+02:00", decided="2026-09-03T21:00:00+02:00", status="PARTIALLY_VERIFIED", decision_id="prom_new_002")
    newer["reviewStatus"] = "REVIEW_READY_WITH_DATE_GAP"
    newer["unresolvedIssues"] = ["publishedAt missing"]
    result = projection.project([first, newer], registry())
    assert result["assets"]["MEDTRONIC"]["decisionId"] == "prom_new_002"
    assert result["assets"]["MEDTRONIC"]["verificationStatus"] == "PARTIALLY_VERIFIED"
    assert result["stateMutationPerformed"] is False
    assert result["thsMutationPerformed"] is False
    assert result["actionMutationPerformed"] is False


def test_projection_keeps_assets_independent():
    med = decision(asset="MEDTRONIC", decision_id="prom_med_001")
    gsk = decision(asset="GSK", decision_id="prom_gsk_001")
    result = projection.project([med, gsk], registry())
    assert result["assetCount"] == 2
    assert set(result["assets"]) == {"MEDTRONIC", "GSK"}


def test_projection_rejects_stale_out_of_order_sequence():
    newer = decision(source="2026-09-03T07:00:00+02:00", decided="2026-09-03T10:00:00+02:00", decision_id="prom_new_001")
    stale = decision(source="2026-09-02T07:00:00+02:00", decided="2026-09-03T11:00:00+02:00", decision_id="prom_stale_002")
    try:
        projection.project([newer, stale], registry())
    except ValueError as exc:
        assert "invalid promotion sequence" in str(exc)
    else:
        raise AssertionError("stale decision should be rejected")


def test_projection_rejects_unknown_asset():
    bad = decision(asset="UNKNOWN", decision_id="prom_bad_001")
    try:
        projection.project([bad], registry())
    except ValueError as exc:
        assert "missing from thesis registry" in str(exc)
    else:
        raise AssertionError("unknown asset should be rejected")


def test_projection_rejects_action_or_ths_smuggling():
    bad = decision(decision_id="prom_bad_002")
    bad["actionCandidate"] = "BUY"
    try:
        projection.project([bad], registry())
    except ValueError as exc:
        assert "forbidden state/action fields" in str(exc)
    else:
        raise AssertionError("action mutation must not enter projection")


def test_same_source_correction_requires_explicit_supersedes():
    first = decision(decision_id="prom_old_001", decided="2026-09-02T21:00:00+02:00")
    correction = decision(decision_id="prom_fix_002", decided="2026-09-02T21:10:00+02:00", supersedes="prom_old_001")
    result = projection.project([first, correction], registry())
    assert result["assets"]["MEDTRONIC"]["decisionId"] == "prom_fix_002"
    assert result["assets"]["MEDTRONIC"]["supersedesDecisionId"] == "prom_old_001"
