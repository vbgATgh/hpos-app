from pathlib import Path
import math
import re

ROOT = Path(__file__).resolve().parents[1]
PROFILE = ROOT / "supabase" / "functions" / "hpos-profile" / "index.ts"


def source():
    return PROFILE.read_text()


def test_profile_function_is_source_controlled_and_account_free():
    code = source()
    assert "YAHOO_QUOTE_SUMMARY_UNOFFICIAL" in code
    assert "origin_not_allowed" in code
    for forbidden in ["FMP", "FINNHUB", "SIMFIN", "API_KEY", "apikey="]:
        assert forbidden not in code


def test_public_profile_function_contains_no_private_portfolio_state():
    code = source()
    for forbidden in ["portfolioValue", "purchasePrice", "avgEntryPrice", "cashEur", "broker"]:
        assert forbidden not in code


def test_curated_official_report_store_is_fail_closed():
    import json
    data = json.loads((ROOT / "data" / "halal_financial_evidence.json").read_text())
    autoscreen = (ROOT / "app" / "halal-autoscreen.js").read_text()
    assert data["policy"]["accountsRequired"] is False
    assert data["policy"]["officialSourcesOnly"] is True
    assert data["policy"]["missingDataState"] == "OPEN_REVIEW"
    assert "OFFICIAL_REPORT_CURATED" in autoscreen
    assert "!e.sourceUrl" in autoscreen
    assert "!period" in autoscreen
    assert "Number(e.months)<30" in autoscreen
    assert "mergeCurated(await profile(symbol),await curatedFor(a))" in autoscreen


def test_first_curated_report_batch_has_only_traceable_partial_metrics():
    import json
    data = json.loads((ROOT / "data" / "halal_financial_evidence.json").read_text())
    assets = data["assets"]
    expected_coverage = {
        "US0028241000": 4,
        "US5797802064": 4,
        "IE00BTN1Y115": 3,
        "US58933Y1055": 4,
        "US94106L1098": 2,
    }
    assert set(assets) == set(expected_coverage)
    for isin, expected in expected_coverage.items():
        assert re.fullmatch(r"[A-Z]{2}[A-Z0-9]{9}\d", isin)
        metrics = assets[isin]["metrics"]
        assert len(metrics) == expected
        assert "marketValue36mAvg" not in metrics
        for metric in metrics.values():
            assert isinstance(metric["value"], (int, float))
            assert math.isfinite(metric["value"])
            assert metric["value"] > 0
            assert metric["unit"] == "USD"
            assert metric["period"]
            assert metric["sourceName"]
            assert metric["sourceUrl"].startswith("https://")
            assert metric["label"]


def test_curated_sources_are_propagated_to_criteria_and_ui():
    autoscreen = (ROOT / "app" / "halal-autoscreen.js").read_text()
    register = (ROOT / "app" / "halal-register.js").read_text()
    evidence = (ROOT / "app" / "halal-evidence.js").read_text()
    assert "sourceFor(f,'interestIncome','revenue')" in autoscreen
    assert "sourceFor(f,'interestBearingAssetsUpperBound','marketValue36mAvg')" in autoscreen
    assert "sourceFor(f,'totalDebt','marketValue36mAvg')" in autoscreen
    assert "YAHOO_STATEMENT" not in autoscreen
    assert "OFFICIAL_REPORT_CURATED" in autoscreen
    assert "Finanzwerte belegt" in register
    assert "Offizielle Finanzkennzahlen" in evidence
    assert "target=\"_blank\"" in evidence


def test_current_release_loads_fresh_profile_logic():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.39" in html
    assert "halal-autoscreen.js?v=20260909-report1" in html
    assert "halal-register.js?v=20260909-report1" in html
    assert "halal-evidence.js?v=20260909-report1" in html
    assert "version:'8.7.39'" in runtime
