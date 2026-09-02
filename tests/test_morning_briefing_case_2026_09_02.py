import importlib.util
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
CASE = ROOT / "data" / "briefing_cases" / "2026-09-02_external_agent.json"
EVIDENCE = ROOT / "data" / "fundamental" / "evidence.json"
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
    evidence = json.loads(EVIDENCE.read_text(encoding="utf-8"))
    registry = json.loads(REGISTRY.read_text(encoding="utf-8"))
    return payload, evidence, registry


def test_real_case_contract_is_valid_but_stays_unverified():
    payload, _, _ = data()
    assert validator.validate(payload) == []
    assert all(c["verificationStatus"] == "UNVERIFIED" for c in payload["candidates"])


def test_real_case_provider_aliases_do_not_create_false_asset_mismatch():
    payload, evidence, _ = data()
    matches = matcher.assess_payload(payload, evidence)
    by_asset = {c["assetKey"]: c for c in matches["candidates"]}
    assert by_asset["NOVO_NORDISK"]["matchStatus"] != "BLOCKED_ASSET_MISMATCH"
    assert by_asset["CRANEWARE"]["matchStatus"] != "BLOCKED_ASSET_MISMATCH"
    assert by_asset["NOVO_NORDISK"]["appliedAssetAliases"].get("NOVO_NORDISK_B") == "NOVO_NORDISK"
    assert by_asset["CRANEWARE"]["appliedAssetAliases"].get("CRANEWARE_PLC") == "CRANEWARE"


def test_real_case_review_never_auto_promotes_or_changes_ths_action():
    payload, evidence, registry = data()
    matches = matcher.assess_payload(payload, evidence)
    review = reviewer.review_payload(payload, matches, evidence, registry)
    assert review["automaticPromotionPerformed"] is False
    for item in review["candidates"]:
        assert item["automaticVerificationPerformed"] is False
        assert item["automaticThsChangePerformed"] is False
        assert item["automaticActionPromotionPerformed"] is False


def test_new_medtronic_and_gsk_claims_are_not_silently_verified_by_generic_pages():
    payload, evidence, registry = data()
    matches = matcher.assess_payload(payload, evidence)
    review = reviewer.review_payload(payload, matches, evidence, registry)
    by_asset = {c["assetKey"]: c for c in review["candidates"]}
    assert by_asset["MEDTRONIC"]["reviewStatus"] != "REVIEW_READY"
    assert by_asset["GSK"]["reviewStatus"] != "REVIEW_READY"


def test_prior_state_directional_actions_are_explicitly_distinguished_from_new_delta():
    payload, _, _ = data()
    by_asset = {c["assetKey"]: c for c in payload["candidates"]}
    assert by_asset["IVU_TRAFFIC"]["coverageStatus"] == "NO_RELEVANT_DELTA"
    assert by_asset["IVU_TRAFFIC"]["actionCandidate"] == "BUY"
    assert by_asset["IVU_TRAFFIC"]["actionBasis"] == "PRIOR_VALIDATED_STATE"
    assert by_asset["FREQUENTIS"]["actionBasis"] == "PRIOR_VALIDATED_STATE"
