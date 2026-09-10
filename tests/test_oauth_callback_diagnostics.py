from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_callback_keeps_pending_state_until_session_is_stored():
    api = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
    callback = api[api.index("async function callback"):api.index("function session(req:Request)")]
    store = callback.index('from("hpos_parqet_sessions").upsert')
    delete = callback.index('from("hpos_oauth_pending").delete().eq("state",state)', store)
    assert delete > store
    assert "TOKEN_EXCHANGE_STARTED" in callback
    assert "SESSION_STORE_FAILED" in callback


def test_callback_always_redirects_to_app():
    api = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()
    assert "status:303" in api
    assert "parqet=error&code=" in api
    assert "text/html; charset=utf-8" not in api[api.index("function oauthSuccess"):api.index("function session(req:Request)")]


def test_frontend_consumes_callback_error_and_clears_guard():
    adapter = (ROOT / "app" / "parqet-supabase-adapter.js").read_text()
    assert "result==='error'" in adapter
    assert "localStorage.setItem('hpos_parqet_last_error',code)" in adapter
    assert "sessionStorage.removeItem(REAUTH_GUARD)" in adapter


def test_current_release_cache_busts_callback_adapter():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.42" in html
    assert "parqet-supabase-adapter.js?v=20260906-callbackdiag1" in html
    assert "runtime-config.js?v=20260910-debtevidence1" in html
    assert "version:'8.7.42'" in runtime
