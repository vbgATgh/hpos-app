from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
ADAPTER = (ROOT / "app" / "parqet-supabase-adapter.js").read_text()


def test_normalized_portfolio_requests_dividends_read_only():
    assert "/activities?limit=500&activityType=dividend" in API
    assert 'String(x?.type||"").toLowerCase()!=="dividend"' in API
    assert 'source:"PARQET"' in API


def test_dividends_are_normalized_by_isin_and_deduplicated():
    assert "normalizeDividends(activities,raw)" in API
    assert "seen.has(id)" in API
    assert "/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/" in API
    for field in ['type:"DIVIDEND"', "paymentDate:date", "gross,net,tax", "currency:String"]:
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
    assert "seen.has(id)" in ADAPTER


def test_release_exposes_income_capability_without_new_provider():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.44" in html
    assert "parqet-supabase-adapter.js?v=20260911-income1" in html
    assert "version:'8.7.44'" in runtime
    assert 'parqetIncome:true' in API
    assert 'version:"0.5.5"' in API
