from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_canonical_halal_store_is_loaded_before_app():
    html = (ROOT / "app" / "index.html").read_text()
    assert "Portfolio Intelligence · v8.7.47" in html
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



def test_backend_preserves_decisive_evidence_and_source_priority():
    api = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
    assert 'if(state==="OPEN_REVIEW"&&oldDecisive&&oldFresh)return halalEvidence(isin)' in api
    assert 'if(old?.source_type==="CURATED_ISIN")return halalEvidence(isin)' in api


def test_halal_runtime_is_account_free():
    api = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
    html = (ROOT / "app" / "index.html").read_text()
    register = (ROOT / "app" / "halal-register.js").read_text()
    evidence = (ROOT / "app" / "halal-evidence.js").read_text()
    for forbidden in ["HALAL_TERMINAL", "HALAL_TERMINAL_API_KEY", "/api/halal/provider/status", "/api/halal/screen"]:
        assert forbidden not in api
    assert "halal-provider.js" not in html
    assert "HPOS_HALAL_PROVIDER" not in register
    assert "HPOS_HALAL_PROVIDER" not in evidence
    assert "Keine externe Konto- oder API-Verbindung erforderlich." in register
    assert 'halalMode:"ACCOUNT_FREE"' in api


def test_halal_refresh_reports_a_real_outcome():
    register = (ROOT / "app" / "halal-register.js").read_text()
    autoscreen = (ROOT / "app" / "halal-autoscreen.js").read_text()
    assert "Prüfung erneut ausführen" in register
    assert 'id=\"halalRunReport\"' in register
    assert "Keine Statusänderung" in register
    assert "Offizielle Berichtsdaten erkannt" in register
    assert "Finanzwerte belegt" in register
    assert "if(running)return" in register
    assert "Prüfung läuft · " in register
    assert "runProgress.processed++" in register
    assert "refresh&&!running" in register
    assert "finally{running=false;runProgress=null}" in register
    assert "hpos_halal_prescreen_v6" in autoscreen
    assert "AAOIFI-Pflichtdaten" in register
    assert "missingCriteria" in autoscreen
    assert "Fehlende Daten bleiben PRÜFUNG OFFEN" in autoscreen
    assert "Externe Evidenz ist nur für diesen Restfall vorgesehen" not in autoscreen
