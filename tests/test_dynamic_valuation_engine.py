import json
import subprocess
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
ENGINE = ROOT / "app" / "valuation-engine.js"
PROFILE = ROOT / "supabase" / "functions" / "hpos-profile" / "index.ts"


def run_engine(evidence):
    script = (
        "global.window={};require(" + json.dumps(str(ENGINE)) + ");"
        "const input=" + json.dumps({"valuationEvidence": evidence}) + ";"
        "process.stdout.write(JSON.stringify(window.HPOS_VALUATION_ENGINE.evaluate(input)));"
    )
    return json.loads(subprocess.check_output(["node", "-e", script], text=True))


def fixture(price=80, revenue_scale=1):
    return {
        "schemaVersion": 1,
        "sourceTier": "MARKET_AGGREGATOR",
        "sourceName": "Traceable annual statements",
        "sourceUrl": "https://example.test/statements",
        "currency": "EUR",
        "observedAt": "2026-10-03T00:00:00Z",
        "currentPrice": price,
        "sharesOutstanding": 100,
        "totalDebt": 80,
        "totalCash": 20,
        "revenueGrowth": 0.08,
        "operatingMargin": 0.18,
        "periods": [
            {"periodEnd": "2025-12-31", "revenue": 1300 * revenue_scale, "netIncome": 150, "operatingIncome": 234, "freeCashFlow": 140, "dilutedAverageShares": 100},
            {"periodEnd": "2024-12-31", "revenue": 1200, "netIncome": 135, "operatingIncome": 210, "freeCashFlow": 125, "dilutedAverageShares": 100},
            {"periodEnd": "2023-12-31", "revenue": 1100, "netIncome": 120, "operatingIncome": 185, "freeCashFlow": 110, "dilutedAverageShares": 100},
        ],
    }


def test_complete_model_uses_earnings_cashflow_growth_margin_debt_and_safety_margin():
    result = run_engine(fixture())
    assert result["status"] == "COMPLETE"
    assert result["reviewRequired"] is True
    assert result["bands"]["fairValue"] > 0
    assert result["bands"]["buyZone2Upper"] < result["bands"]["buyZone1Upper"] < result["bands"]["fairLow"]
    assert result["bands"]["safetyMargin"] >= 0.20
    assert result["inputs"]["normalizedEps"] > 0
    assert result["inputs"]["normalizedFcfPerShare"] > 0


def test_price_changes_zone_but_never_fair_value_zones_or_evidence_fingerprint():
    low = run_engine(fixture(price=1))
    high = run_engine(fixture(price=500))
    assert low["zone"] == "BUY_ZONE_2"
    assert high["zone"] == "DEMANDING"
    assert low["bands"] == high["bands"]
    assert low["evidenceFingerprint"] == high["evidenceFingerprint"]


def test_new_fundamental_evidence_changes_fingerprint_and_valuation():
    original = run_engine(fixture())
    changed = run_engine(fixture(revenue_scale=1.25))
    assert original["evidenceFingerprint"] != changed["evidenceFingerprint"]
    assert original["bands"]["fairValue"] != changed["bands"]["fairValue"]


def test_missing_cashflow_fails_closed_without_buy_zones():
    evidence = fixture()
    for period in evidence["periods"]:
        period["freeCashFlow"] = None
    result = run_engine(evidence)
    assert result["status"] == "INSUFFICIENT"
    assert result["bands"] is None
    assert "Free Cashflow" in result["reason"]


def test_engine_is_instrument_independent_and_profile_supplies_annual_evidence():
    engine = ENGINE.read_text()
    profile = PROFILE.read_text()
    for hardcoded in ["Cardinal", "McCormick", "Abbott", "CA14150G4007"]:
        assert hardcoded not in engine
    assert "cashflowStatementHistory" in profile
    assert "valuationEvidence" in profile
    assert 'sourceTier:"MARKET_AGGREGATOR"' in profile
