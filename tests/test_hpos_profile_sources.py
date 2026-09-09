from pathlib import Path

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


def test_current_release_loads_fresh_profile_logic():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.38" in html
    assert "halal-autoscreen.js?v=20260909-sec1" in html
    assert "version:'8.7.38'" in runtime
