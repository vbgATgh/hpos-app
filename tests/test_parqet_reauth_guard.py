from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_reauth_guard_expires_instead_of_blocking_forever():
    adapter = (ROOT / "app" / "parqet-supabase-adapter.js").read_text()
    assert "const REAUTH_GUARD_MS=60*1000" in adapter
    assert "Date.now()-started<REAUTH_GUARD_MS" in adapter
    assert "sessionStorage.setItem(REAUTH_GUARD,String(Date.now()))" in adapter
    assert "==='redirecting'" not in adapter


def test_current_release_keeps_reauth_guard_and_cache_bust():
    html = (ROOT / "app" / "index.html").read_text()
    runtime = (ROOT / "app" / "runtime-config.js").read_text()
    assert "Portfolio Intelligence · v8.7.35" in html
    assert "parqet-supabase-adapter.js?v=20260906-callbackdiag1" in html
    assert "version:'8.7.35'" in runtime
