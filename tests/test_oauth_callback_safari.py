from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / "supabase" / "functions" / "hpos-api" / "index.ts").read_text()


def test_oauth_callback_uses_safari_safe_html_navigation():
    assert "return oauthSuccess(d)" in API
    assert 'Content-Type":"text/html; charset=utf-8' in API
    assert '"Cache-Control":"no-store, max-age=0"' in API
    assert "location.replace" in API
    assert "Response.redirect(d.toString(),302)" not in API


def test_oauth_security_and_portfolio_boundaries_remain():
    assert "oauth_state_invalid" in API
    assert "oauth_state_expired" in API
    assert "code_verifier" in API
    assert "parqet_performance_holdings_unplausible" in API
    assert "parqet_active_count_unplausible" in API
