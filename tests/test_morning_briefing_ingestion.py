import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_morning_briefing_candidate.py"
spec = importlib.util.spec_from_file_location("briefing_validator", SCRIPT)
validator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(validator)


def valid_payload():
    return {
        "schemaVersion": 1,
        "asOf": "2026-09-02T07:00:00+02:00",
        "source": {"kind": "EXTERNAL_AGENT", "label": "synthetic-test-agent"},
        "candidates": [
            {
                "assetKey": "MEDTRONIC",
                "externalThsBefore": 7.8,
                "externalThsAfter": 8.2,
                "actionCandidate": "HOLD",
                "thesisDelta": "STRENGTHENING",
                "riskDelta": "UNCHANGED",
                "evidenceUrls": ["https://example.com/primary-source"],
                "evidenceIds": [],
                "coverageStatus": "DELTA_FOUND",
                "proofpoints": ["margin recovery persists"],
                "rotationCandidate": None,
                "verificationStatus": "UNVERIFIED",
                "notes": "Synthetic data only; no real portfolio quantities."
            }
        ]
    }


def test_valid_unverified_candidate_is_accepted():
    assert validator.validate(valid_payload()) == []


def test_unknown_asset_is_rejected():
    payload = valid_payload()
    payload["candidates"][0]["assetKey"] = "NOT_IN_REGISTRY"
    errors = validator.validate(payload)
    assert any("not present in thesis_registry" in error for error in errors)


def test_external_agent_cannot_arrive_preverified_even_with_evidence():
    payload = valid_payload()
    payload["candidates"][0]["verificationStatus"] = "VERIFIED"
    errors = validator.validate(payload)
    assert any("must be UNVERIFIED for EXTERNAL_AGENT input" in error for error in errors)


def test_manual_verified_requires_evidence_reference():
    payload = valid_payload()
    payload["source"]["kind"] = "MANUAL_REVIEW"
    candidate = payload["candidates"][0]
    candidate["verificationStatus"] = "VERIFIED"
    candidate["evidenceUrls"] = []
    candidate["evidenceIds"] = []
    errors = validator.validate(payload)
    assert any("cannot be VERIFIED without evidence references" in error for error in errors)


def test_manual_verified_with_evidence_is_accepted():
    payload = valid_payload()
    payload["source"]["kind"] = "MANUAL_REVIEW"
    payload["candidates"][0]["verificationStatus"] = "VERIFIED"
    assert validator.validate(payload) == []


def test_no_relevant_delta_cannot_propose_buy():
    payload = valid_payload()
    candidate = payload["candidates"][0]
    candidate["coverageStatus"] = "NO_RELEVANT_DELTA"
    candidate["actionCandidate"] = "BUY"
    errors = validator.validate(payload)
    assert any("proposes an action despite NO_RELEVANT_DELTA" in error for error in errors)


def test_external_ths_may_use_decimal_metadata_without_changing_canonical_policy():
    payload = valid_payload()
    candidate = payload["candidates"][0]
    candidate["externalThsBefore"] = 7.83
    candidate["externalThsAfter"] = 8.17
    assert validator.validate(payload) == []


def test_rotation_target_must_exist_in_registry():
    payload = valid_payload()
    candidate = payload["candidates"][0]
    candidate["actionCandidate"] = "ROTATE"
    candidate["rotationCandidate"] = {
        "targetAssetKey": "UNKNOWN_TARGET",
        "scope": "FULL",
        "reason": "synthetic"
    }
    errors = validator.validate(payload)
    assert any("rotationCandidate.targetAssetKey is not present" in error for error in errors)
