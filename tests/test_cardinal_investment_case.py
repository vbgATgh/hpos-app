import json
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
CASE = json.loads((ROOT / "data/investment_cases/CARDINAL_ENERGY.json").read_text())
INDEX = json.loads((ROOT / "data/investment_cases/index.json").read_text())
HTML = (ROOT / "app/index.html").read_text()
JS = (ROOT / "app/investment-case.js").read_text()
POLICY = json.loads((ROOT / "data/portfolio_fit_policy.json").read_text())
THESES = json.loads((ROOT / "data/thesis_registry.json").read_text())
CURATED = json.loads((ROOT / "data/fundamental/evidence_curated.json").read_text())
SIGNAL_BUILDER = (ROOT / "scripts/build_thesis_signals.py").read_text()


def test_cardinal_case_is_isin_centered_and_loaded():
    assert CASE["isin"] == "CA14150G4007"
    assert INDEX["casesByIsin"][CASE["isin"]] == "CARDINAL_ENERGY.json"
    assert 'investment-case.js?v=20260912-cardinalcase1' in HTML
    assert 'investment-case.css?v=20260912-cardinalcase1' in HTML


def test_all_eight_gates_have_explicit_non_open_states():
    for number in range(1, 9):
        gate = CASE[f"gate{number}"]
        assert gate["state"] not in {"OPEN_REVIEW", "UNKNOWN", "NOT_EVALUATED"}
        assert gate["label"]
    assert CASE["gate2"]["state"] == "REVIEW"
    assert CASE["gate6"]["state"] == "WAIT"
    assert CASE["gate8"]["state"] == "EXTERNAL_ONLY"


def test_cardinal_portfolio_fit_is_explicit_review_not_open():
    cardinal = POLICY["assetClassifications"][CASE["isin"]]
    assert cardinal["reviewState"] == "REVIEW"
    assert "keine Aufstockungsfreigabe" in cardinal["reviewReason"]
    module = (ROOT / "app/portfolio-fit.js").read_text()
    assert "c.reviewState==='REVIEW'" in module
    assert "Review · keine Aufstockung" in module


def test_case_keeps_decision_and_evidence_separate():
    assert CASE["gate3"]["signal"] == "STRENGTHENING"
    assert CASE["decision"]["state"] == "HOLD_REVIEW"
    assert "Keine automatische Aufstockung" in CASE["decision"]["summary"]
    assert "setGate(7,c.gate8)" in JS


def test_cardinal_has_bucket_thesis_and_primary_sources():
    assert POLICY["assetClassifications"][CASE["isin"]]["bucket"] == "Turbo"
    assert THESES["assets"]["CARDINAL_ENERGY"]["role"] == "ENERGY_INCOME_SATELLITE"
    assert len(CASE["sources"]) >= 4
    assert all(source["tier"] == "PRIMARY" for source in CASE["sources"])


def test_cardinal_metrics_match_documented_calculations():
    labels = {item["label"]: item["value"] for item in CASE["gate5"]["metrics"]}
    assert labels["EV / 2P-NPV10 vor Steuern"] == "1,17×"
    assert labels["Kurs / annualisierter H1-FCF"] == "12,1×"
    assert labels["Indikative Dividendenrendite"] == "5,9 %"


def test_cardinal_fundamentals_feed_the_shared_thesis_engine():
    rows = [item for item in CURATED["items"] if item["assetKey"] == "CARDINAL_ENERGY"]
    assert {item["metric"] for item in rows} == {"revenue", "operating_cash_flow"}
    assert all(item["sourceTier"] == "PRIMARY" for item in rows)
    assert "CURATED" in SIGNAL_BUILDER
    assert "*curated.get('items',[])" in SIGNAL_BUILDER
