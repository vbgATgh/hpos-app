import importlib.util
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "validate_promotion_sequence.py"
spec = importlib.util.spec_from_file_location("promotion_sequence", SCRIPT)
sequence = importlib.util.module_from_spec(spec)
spec.loader.exec_module(sequence)


def decision(decision_id="d_00000001", asset="MEDTRONIC", source="2026-09-02T07:00:00+02:00", decided="2026-09-02T21:00:00+02:00", supersedes=None):
    return {
        "decisionId": decision_id,
        "assetKey": asset,
        "sourceAsOf": source,
        "decidedAt": decided,
        "supersedesDecisionId": supersedes,
    }


def test_independent_assets_are_valid():
    items = [
        decision(),
        decision("d_00000002", asset="GSK", decided="2026-09-02T21:01:00+02:00"),
    ]
    assert sequence.validate_sequence(items) == []


def test_newer_source_for_same_asset_is_valid():
    items = [
        decision(),
        decision("d_00000002", source="2026-09-03T07:00:00+02:00", decided="2026-09-03T21:00:00+02:00"),
    ]
    assert sequence.validate_sequence(items) == []


def test_older_source_cannot_overwrite_newer_state_even_if_decided_later():
    items = [
        decision("d_newsource", source="2026-09-03T07:00:00+02:00", decided="2026-09-03T20:00:00+02:00"),
        decision("d_stalesrc1", source="2026-09-02T07:00:00+02:00", decided="2026-09-03T21:00:00+02:00"),
    ]
    errors = sequence.validate_sequence(items)
    assert any("is stale" in error for error in errors)


def test_same_source_correction_requires_explicit_supersedes_chain():
    items = [
        decision(),
        decision("d_00000002", decided="2026-09-02T21:10:00+02:00"),
    ]
    errors = sequence.validate_sequence(items)
    assert any("explicit supersedesDecisionId required" in error for error in errors)


def test_same_source_explicit_later_correction_is_valid():
    items = [
        decision(),
        decision("d_00000002", decided="2026-09-02T21:10:00+02:00", supersedes="d_00000001"),
    ]
    assert sequence.validate_sequence(items) == []


def test_duplicate_decision_id_is_rejected():
    items = [decision(), decision(decided="2026-09-02T21:10:00+02:00", supersedes="d_00000001")]
    errors = sequence.validate_sequence(items)
    assert any("duplicate decisionId" in error for error in errors)
