import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "match_morning_briefing_evidence.py"
spec = importlib.util.spec_from_file_location("evidence_matcher", SCRIPT)
matcher = importlib.util.module_from_spec(spec)
spec.loader.exec_module(matcher)


def evidence_fixture():
    return {
        "schemaVersion": 1,
        "items": [
            {
                "evidenceId": "ev_med_primary",
                "assetKey": "MEDTRONIC",
                "sourceTier": "PRIMARY",
                "sourceUrl": "https://example.com/medtronic-primary"
            },
            {
                "evidenceId": "ev_gsk_primary",
                "assetKey": "GSK",
                "sourceTier": "PRIMARY",
                "sourceUrl": "https://example.com/gsk-primary"
            },
            {
                "evidenceId": "ev_med_secondary",
                "assetKey": "MEDTRONIC",
                "sourceTier": "SECONDARY",
                "sourceUrl": "https://example.com/medtronic-secondary"
            },
            {
                "evidenceId": "ev_novo_provider_key",
                "assetKey": "NOVO_NORDISK_B",
                "sourceTier": "PRIMARY",
                "sourceUrl": "https://example.com/novo-primary"
            }
        ]
    }


def candidate(**overrides):
    value = {
        "assetKey": "MEDTRONIC",
        "evidenceIds": ["ev_med_primary"],
        "evidenceUrls": [],
    }
    value.update(overrides)
    return value


def test_exact_primary_match_is_ready_for_review_not_auto_verified():
    result = matcher.match_candidate(candidate(), evidence_fixture())
    assert result["matchStatus"] == "MATCHED_READY_FOR_REVIEW"
    assert result["matchedEvidenceIds"] == ["ev_med_primary"]
    assert result["promotionAllowedAutomatically"] is False


def test_cross_asset_evidence_is_blocked():
    result = matcher.match_candidate(candidate(evidenceIds=["ev_gsk_primary"]), evidence_fixture())
    assert result["matchStatus"] == "BLOCKED_ASSET_MISMATCH"
    assert result["promotionAllowedAutomatically"] is False


def test_missing_reference_is_blocked():
    result = matcher.match_candidate(candidate(evidenceIds=["ev_missing"]), evidence_fixture())
    assert result["matchStatus"] == "BLOCKED_NO_CANONICAL_MATCH"
    assert result["missingEvidenceIds"] == ["ev_missing"]


def test_no_reference_is_blocked():
    result = matcher.match_candidate(candidate(evidenceIds=[], evidenceUrls=[]), evidence_fixture())
    assert result["matchStatus"] == "BLOCKED_NO_EVIDENCE_REFERENCE"


def test_partial_match_requires_review():
    result = matcher.match_candidate(candidate(evidenceIds=["ev_med_primary", "ev_missing"]), evidence_fixture())
    assert result["matchStatus"] == "PARTIAL_MATCH_REVIEW_REQUIRED"
    assert result["matchedEvidenceIds"] == ["ev_med_primary"]


def test_non_primary_match_cannot_be_treated_as_primary_ready():
    result = matcher.match_candidate(candidate(evidenceIds=["ev_med_secondary"]), evidence_fixture())
    assert result["matchStatus"] == "MATCHED_NONPRIMARY_REVIEW_REQUIRED"
    assert result["primaryMatchedCount"] == 0


def test_url_match_is_asset_scoped():
    result = matcher.match_candidate(candidate(evidenceIds=[], evidenceUrls=["https://example.com/medtronic-primary"]), evidence_fixture())
    assert result["matchStatus"] == "MATCHED_READY_FOR_REVIEW"
    assert result["matchedEvidenceIds"] == ["ev_med_primary"]


def test_provider_alias_matches_canonical_registry_asset():
    result = matcher.match_candidate(
        candidate(assetKey="NOVO_NORDISK", evidenceIds=["ev_novo_provider_key"]),
        evidence_fixture(),
        aliases={"NOVO_NORDISK_B": "NOVO_NORDISK"},
    )
    assert result["matchStatus"] == "MATCHED_READY_FOR_REVIEW"
    assert result["matchedEvidenceIds"] == ["ev_novo_provider_key"]
    assert result["appliedAssetAliases"] == {"NOVO_NORDISK_B": "NOVO_NORDISK"}


def test_alias_does_not_hide_real_cross_asset_mismatch():
    result = matcher.match_candidate(
        candidate(assetKey="MEDTRONIC", evidenceIds=["ev_novo_provider_key"]),
        evidence_fixture(),
        aliases={"NOVO_NORDISK_B": "NOVO_NORDISK"},
    )
    assert result["matchStatus"] == "BLOCKED_ASSET_MISMATCH"


def test_payload_assessment_never_auto_promotes():
    payload = {
        "asOf": "2026-09-02T12:00:00+02:00",
        "candidates": [candidate()]
    }
    result = matcher.assess_payload(payload, evidence_fixture())
    assert result["automaticPromotionPerformed"] is False
    assert result["candidates"][0]["promotionAllowedAutomatically"] is False
