import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASE = ROOT / "data" / "briefing_cases" / "2026-09-02_external_agent.json"
REGISTRY = ROOT / "data" / "thesis_registry.json"


def load_module(name, path):
    spec = importlib.util.spec_from_file_location(name, path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


validator = load_module("briefing_validator_case", ROOT / "scripts" / "validate_morning_briefing_candidate.py")
matcher = load_module("briefing_matcher_case", ROOT / "scripts" / "match_morning_briefing_evidence.py")
reviewer = load_module("briefing_reviewer_case", ROOT / "scripts" / "review_morning_briefing_evidence.py")


def data():
    payload = json.loads(CASE.read_text(encoding="utf-8"))
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    return payload, registry


def test_real_case_contract_is_valid_but_stays_unverified():
    payload, _ = data()
    assert validator.validate(payload) == []
    assert all(c["verificationStatus"] == "UNVERIFIED" for c in payload["candidates"])


def test_real_case_provider_aliases_do_not_create_false_asset_mismatch():
    payload, _ = data()
    matches = matcher.assess_payload(payload)
    by_asset = {c["assetKey"]: c for c in matches["candidates"]}
    assert by_asset["NOVO_NORDISK"]["matchStatus"] != "BLOCKED_ASSET_MISMATCH"
    assert by_asset["CRANEWARE"]["matchStatus"] != "BLOCKED_ASSET_MISMATCH"
    assert by_asset["NOVO_NORDISK"]["appliedAssetAliases"].get("NOVO_NORDISK_B") == "NOVO_NORDISK"
    assert by_asset["CRANEWARE"]["appliedAssetAliases"].get("CRANEWARE_PLC") == "CRANEWARE"


def test_real_case_review_never_auto_promotes_or_changes_ths_action():
    payload, registry = data()
    matches = matcher.assess_payload(payload)
    review = reviewer.review_payload(payload, matches, registry=registry)
    assert review["automaticPromotionPerformed"] is False
    for item in review["candidates"]:
        assert item["automaticVerificationPerformed"] is False
        assert item["automaticThsChangePerformed"] is False
        assert item["automaticActionPromotionPerformed"] is False


def test_medtronic_and_gsk_primary_claims_are_now_review_ready_not_auto_verified():
    payload, registry = data()
    matches = matcher.assess_payload(payload)
    review = reviewer.review_payload(payload, matches, registry=registry)
    by_asset = {c["assetKey"]: c for c in review["candidates"]}
    assert by_asset["MEDTRONIC"]["reviewStatus"] == "REVIEW_READY"
    assert by_asset["GSK"]["reviewStatus"] == "REVIEW_READY"
    assert by_asset["MEDTRONIC"]["automaticVerificationPerformed"] is False
    assert by_asset["GSK"]["automaticVerificationPerformed"] is False


def test_4imprint_rotation_source_is_registered_and_explicitly_carry_forward():
    payload, registry = data()
    assert "4IMPRINT_GROUP" in registry["assets"]
    by_asset = {c["assetKey"]: c for c in payload["candidates"]}
    item = by_asset["4IMPRINT_GROUP"]
    assert item["actionCandidate"] == "ROTATE"
    assert item["actionBasis"] == "PRIOR_VALIDATED_STATE"
    assert item["rotationCandidate"]["targetAssetKey"] == "IVU_TRAFFIC"


def test_prior_state_directional_actions_are_explicitly_distinguished_from_new_delta():
    payload, _ = data()
    by_asset = {c["assetKey"]: c for c in payload["candidates"]}
    assert by_asset["IVU_TRAFFIC"]["coverageStatus"] == "NO_RELEVANT_DELTA"
    assert by_asset["IVU_TRAFFIC"]["actionCandidate"] == "BUY"
    assert by_asset["IVU_TRAFFIC"]["actionBasis"] == "PRIOR_VALIDATED_STATE"
    assert by_asset["FREQUENTIS"]["actionBasis"] == "PRIOR_VALIDATED_STATE"
