import importlib.util
import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCRIPT = ROOT / "scripts" / "build_thesis_news_agent.py"
spec = importlib.util.spec_from_file_location("thesis_news_agent", SCRIPT)
agent = importlib.util.module_from_spec(spec)
spec.loader.exec_module(agent)


def test_duplicate_event_is_counted_once_and_primary_source_wins():
    items = [
        {"assetKey": "A", "title": "Margin recovery - Publisher", "url": "https://news.test/x?utm_source=a", "primarySource": False, "publishedAt": "2026-10-05"},
        {"assetKey": "A", "title": "Margin recovery", "url": "https://issuer.test/release", "sourceTier": "PRIMARY", "publishedAt": "2026-10-04"},
    ]
    rows, duplicates = agent.dedupe_events(items)
    assert duplicates == 1
    assert len(rows) == 1
    assert rows[0]["sourceTier"] == "PRIMARY"


def test_proofpoint_match_does_not_become_falsification_without_negative_context():
    definition = {"thesis": ["margin recovery"], "risks": ["margin pressure"], "falsification": ["structural margin erosion"]}
    item = {"eventKey": "evt_1", "title": "Margin recovery continues", "sourceTier": "PRIMARY"}
    result = agent.assess(item, definition)
    assert result["classification"] == "PROOFPOINT_MATCH"
    assert result["reviewStatus"] == "MANUAL_REVIEW_REQUIRED"


def test_negative_primary_event_is_only_a_falsification_candidate_for_review():
    definition = {"thesis": ["margin recovery"], "risks": [], "falsification": ["structural margin erosion"]}
    item = {"eventKey": "evt_2", "title": "Structural margin erosion and decline", "sourceTier": "PRIMARY"}
    result = agent.assess(item, definition)
    assert result["classification"] == "FALSIFICATION_CANDIDATE"
    assert result["reviewStatus"] == "MANUAL_REVIEW_REQUIRED"


def test_static_undated_ir_page_is_not_treated_as_an_event():
    assert agent.is_event_evidence({"title": "Investor relations", "observedAt": "2026-10-05"}) is False
    assert agent.is_event_evidence({"title": "Half-year results", "publishedAt": "2026-08-05"}) is True
    assert agent.is_event_evidence({"metric": "revenue", "value": 42}) is True


def test_ths_version_changes_once_for_new_primary_evidence_only():
    version, reason, seen, new = agent.version_state({}, ["evt_a"])
    assert (version, reason, new) == (1, "INITIALIZED", ["evt_a"])
    version2, reason2, seen2, new2 = agent.version_state({"thsVersion": version, "seenEvidenceIds": seen}, ["evt_a"])
    assert (version2, reason2, new2) == (1, "UNCHANGED", [])
    version3, reason3, _, new3 = agent.version_state({"thsVersion": version2, "seenEvidenceIds": seen2}, ["evt_a", "evt_b"])
    assert (version3, reason3, new3) == (2, "NEW_PRIMARY_EVIDENCE", ["evt_b"])


def test_generated_agent_never_changes_ths_or_decision_automatically():
    result = agent.build({"assets": []})
    assert result["policy"]["duplicateEventsCountOnce"] is True
    assert all(x["automaticThsChangePerformed"] is False for x in result["assets"])
    assert all(x["automaticDecisionChangePerformed"] is False for x in result["assets"])
    assert all(x["evidenceFingerprint"].startswith("THS-") for x in result["assets"])


def test_ui_loads_versioned_agent_and_explains_no_automatic_change():
    html = (ROOT / "app/index.html").read_text()
    js = (ROOT / "app/thesis-agent.js").read_text()
    assert 'thesis-agent.js?v=20261005-ap5thesis1' in html
    assert 'thesis-agent.css?v=20261005-ap5thesis1' in html
    assert "THS v" in js
    assert "Keine automatische THS- oder Kaufstatus-Änderung" in (ROOT / "app/investment-case.js").read_text()
    assert "News und IR-Evidenz ändern weder THS noch Kaufstatus automatisch" in js


if __name__ == "__main__":
    for name, fn in sorted(globals().copy().items()):
        if name.startswith("test_") and callable(fn):
            fn()
    print("thesis/news agent tests: OK")
