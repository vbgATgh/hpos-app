from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_canonical_halal_store_is_loaded_before_app():
    html = (ROOT / "app" / "index.html").read_text()
    assert "Portfolio Intelligence · v8.7.32" in html
    assert html.index("halal-store.js") < html.index("app.js")


def test_canonical_store_is_isin_only_and_does_not_touch_portfolio_state():
    js = (ROOT / "app" / "halal-store.js").read_text()
    assert "VALID_ISIN" in js
    assert "/api/halal/evidence" in js
    for forbidden in ["hpos_parqet_validated", "hpos_parqet_previous", "hpos_parqet_quarantine"]:
        assert forbidden not in js


def test_all_primary_views_use_canonical_resolver():
    app = (ROOT / "app" / "app.js").read_text()
    register = (ROOT / "app" / "halal-register.js").read_text()
    evidence = (ROOT / "app" / "halal-evidence.js").read_text()
    assert "HPOS_HALAL_STORE?.cached" in app
    assert "HPOS_HALAL_STORE?.cached" in register
    assert "HPOS_HALAL_STORE.get" in evidence


def test_backend_requires_session_for_canonical_evidence():
    api = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
    assert 'r==="/api/halal/evidence"&&req.method==="GET"' in api
    assert 'r==="/api/halal/evidence"&&req.method==="POST"' in api
    assert "await access(session(req))" in api
    assert '"Access-Control-Allow-Methods":"GET,POST,OPTIONS"' in api


def test_decisive_halal_evidence_beats_open_review_cache():
    app = (ROOT / "app" / "app.js").read_text()
    register = (ROOT / "app" / "halal-register.js").read_text()
    autoscreen = (ROOT / "app" / "halal-autoscreen.js").read_text()
    decisive = "e?.state||decisive(s)||decisive(a)||decisive(m)||s?.state||a?.state||m?.state"
    assert decisive in app
    register_priority = "e?.state||decisive(remote)||decisive(pre)||decisive(manual)||remote?.state||pre?.state||manual?.state"
    assert register_priority in register
    assert "saveAAOIFI?.(a,cached)" in autoscreen
