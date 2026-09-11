from pathlib import Path
import json
import re
import subprocess


ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
ADAPTER = (ROOT / "app" / "parqet-supabase-adapter.js").read_text()


def test_normalized_portfolio_requests_dividends_read_only():
    assert "/activities?limit=500&activityType=dividend" in API
    assert 'String(x?.type||"").toLowerCase()!=="dividend"' in API
    assert 'source:"PARQET"' in API


def test_dividends_are_normalized_by_isin_and_deduplicated():
    assert "normalizeDividends(activities,raw)" in API
    assert "seen.has(key)" in API
    assert "dividendKey(isin,date,gross,net,tax,fee,shares,currency)" in API
    assert ".toISOString().slice(0,10)" in API
    assert "/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/" in API
    for field in ['type:"DIVIDEND"', "paymentDate:normalizedDate", "gross,net,tax", "currency,broker"]:
        assert field in API


def test_income_failure_never_blocks_holdings_sync():
    normalized = API[API.index("async function normalized"):API.index("function findPortfolioId")]
    assert 'incomeStatus="AVAILABLE"' in normalized
    assert 'incomeStatus="UNAVAILABLE"' in normalized
    assert 'console.warn("parqet-income"' in normalized
    assert 'return{source:"PARQET_SUPABASE"' in normalized


def test_frontend_preserves_validated_dividends_locally():
    assert "function appDividends(data)" in ADAPTER
    assert "dividends:appDividends(data)" in ADAPTER
    assert "holdings:data.holdings.map(appHolding),dividends:[]" not in ADAPTER
    assert "rows.length>500" in ADAPTER
    assert "seen.has(key)" in ADAPTER


def test_frontend_semantically_deduplicates_parqet_timestamp_variants():
    key_fn = re.search(r"function dividendKey\([^}]+\}", ADAPTER)
    assert key_fn
    app_fn = next(line for line in ADAPTER.splitlines() if line.startswith("function appDividends"))
    rows = [
        {"id": "parqet-a", "isin": "GB00B2B0DG97", "date": "2026-09-10T00:00:00Z", "gross": 1.94, "net": 1.94, "tax": 0, "fee": 0, "shares": 8, "currency": "EUR"},
        {"id": "parqet-b", "isin": "GB00B2B0DG97", "date": "2026-09-10T00:00:00.000Z", "gross": 1.94, "net": 1.94, "tax": 0, "fee": 0, "shares": 8, "currency": "EUR"},
    ]
    script = f"{key_fn.group(0)};{app_fn};console.log(JSON.stringify(appDividends({{dividends:{json.dumps(rows)}}})))"
    result = json.loads(subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout)
    assert len(result) == 1
    assert result[0]["date"] == "2026-09-10T00:00:00.000Z"


def test_release_exposes_income_capability_without_new_provider():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.45" in html
    assert "parqet-supabase-adapter.js?v=20260911-income2" in html
    assert "version:'8.7.45'" in runtime
    assert 'parqetIncome:true' in API
    assert 'version:"0.5.6"' in API
