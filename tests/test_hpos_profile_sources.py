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
        "US0028241000": 5,
        "US5797802064": 5,
        "IE00BTN1Y115": 5,
        "US58933Y1055": 5,
        "US94106L1098": 4,
        "US4781601046": 4,
    }
    assert set(assets) == set(expected_coverage)
    for isin, expected in expected_coverage.items():
        assert re.fullmatch(r"[A-Z]{2}[A-Z0-9]{9}\d", isin)
        metrics = assets[isin]["metrics"]
        assert len(metrics) == expected
        assert metrics["marketValue36mAvg"]["months"] == 36
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


def test_36_month_market_values_are_complete_and_reproducible():
    import json
    market = json.loads((ROOT / "data" / "halal_market_value_36m.json").read_text())
    financial = json.loads((ROOT / "data" / "halal_financial_evidence.json").read_text())
    assert market["period"] == {"start": "2023-09-01", "end": "2026-08-31", "months": 36}
    assert market["policy"]["accountsRequired"] is False
    assert market["policy"]["priceSource"] == "NASDAQ_OFFICIAL_HISTORICAL"
    assert market["policy"]["sharesSource"] == "SEC_EDGAR_FILINGS"
    assert set(market["assets"]) == set(financial["assets"])
    for isin, asset in market["assets"].items():
        observations = asset["observations"]
        assert len(observations) == 36
        assert len({item["month"] for item in observations}) == 36
        assert observations[0]["month"] == "2023-09"
        assert observations[-1]["month"] == "2026-08"
        for item in observations:
            assert item["date"].startswith(item["month"])
            assert item["sharesDate"] <= item["date"]
            assert item["closeUsd"] > 0
            assert item["sharesOutstanding"] > 0
            assert math.isclose(
                item["marketValueUsd"],
                item["closeUsd"] * item["sharesOutstanding"],
                rel_tol=0,
                abs_tol=0.01,
            )
            assert item["sharesSourceUrl"].startswith("https://www.sec.gov/") or item[
                "sharesSourceUrl"
            ].startswith("https://data.sec.gov/")
        calculated = sum(item["marketValueUsd"] for item in observations) / 36
        assert math.isclose(asset["averageMarketValueUsd"], calculated, rel_tol=0, abs_tol=0.01)
        assert asset["priceSourceUrl"].startswith("https://api.nasdaq.com/")
        metric = financial["assets"][isin]["metrics"]["marketValue36mAvg"]
        assert metric["value"] == asset["averageMarketValueUsd"]
        assert metric["months"] == 36
        assert metric["supportingSources"]
    assert min(item["sharesOutstanding"] for item in market["assets"]["US5797802064"]["observations"]) > 250_000_000


def test_curated_business_profiles_are_official_and_fail_closed():
    import json
    data = json.loads((ROOT / "data" / "halal_financial_evidence.json").read_text())
    autoscreen = (ROOT / "app" / "halal-autoscreen.js").read_text()
    for asset in data["assets"].values():
        profile = asset["businessProfile"]
        assert profile["description"]
        assert profile["period"]
        assert profile["sourceName"]
        assert profile["sourceUrl"].startswith("https://")
    assert "business?.description&&business?.sourceUrl&&business?.period" in autoscreen
    assert "p?.businessSource?.sourceType" in autoscreen


def test_market_value_builder_requires_no_account_or_api_key():
    builder = (ROOT / "scripts" / "build_halal_market_value_evidence.py").read_text()
    assert "api.nasdaq.com" in builder
    assert "data.sec.gov" in builder
    assert "accountsRequired\": False" in builder
    for forbidden in ["API_KEY", "apikey=", "FINNHUB", "FMP", "yfinance", "requests"]:
        assert forbidden not in builder


def test_current_release_loads_fresh_profile_logic():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.49" in html
    assert "app.js?v=20260911-income3" in html
    assert "halal-autoscreen.js?v=20260910-debtevidence1" in html
    assert "halal-register.js?v=20260910-runstate1" in html
    assert "halal-evidence.js?v=20260910-debtevidence1" in html
    assert "version:'8.7.49'" in runtime


def test_debt_evidence_is_lease_adjusted_and_unquantified_debt_stays_open():
    import json
    data = json.loads((ROOT / "data" / "halal_financial_evidence.json").read_text())
    assert data["assets"]["IE00BTN1Y115"]["metrics"]["totalDebt"]["value"] == 27_901_000_000
    assert data["assets"]["US94106L1098"]["metrics"]["totalDebt"]["value"] == 22_344_000_000
    assert "totalDebt" not in data["assets"]["US4781601046"]["metrics"]


def test_legacy_watchlist_identity_is_promoted_only_by_unique_verified_market_mapping():
    import json
    app = (ROOT / "app" / "app.js").read_text()
    market = json.loads((ROOT / "config" / "market_sources.json").read_text())["assets"]
    matches = [item for item in market if item.get("enabled") is not False and item.get("symbol") == "JNJ"]
    assert len(matches) == 1
    assert matches[0]["isin"] == "US4781601046"
    assert "function promoteWatchlistIdentities()" in app
    assert "matches.length===1" in app
    assert "source:'MARKET_CONFIG_MATCH',verified:true" in app
    assert "promoteWatchlistIdentities();render()" in app
