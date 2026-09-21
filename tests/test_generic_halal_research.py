from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCREEN = (ROOT / "supabase/functions/hpos-screen/index.ts").read_text(encoding="utf-8")
BUSINESS_CLASSIFIER = (ROOT / "supabase/functions/hpos-screen/business-classifier.ts").read_text(encoding="utf-8")
SEC_TICKERS = (ROOT / "supabase/functions/hpos-screen/sec-tickers.ts").read_text(encoding="utf-8")
MIGRATION = (ROOT / "supabase/migrations/20260915073547_create_generic_identity_evidence_service.sql").read_text(encoding="utf-8")
APP = (ROOT / "app/app.js").read_text(encoding="utf-8")
RESEARCH = (ROOT / "app/halal-research.js").read_text(encoding="utf-8")
HTML = (ROOT / "app/index.html").read_text(encoding="utf-8")
RUNTIME = (ROOT / "app/runtime-config.js").read_text(encoding="utf-8")


def test_generic_identity_and_immutable_run_schema_is_private():
    assert "create table if not exists public.hpos_security_identities" in MIGRATION
    assert "create table if not exists public.hpos_halal_runs" in MIGRATION
    assert "hpos_halal_runs_isin_completed_idx" in MIGRATION
    assert "alter table public.hpos_security_identities enable row level security" in MIGRATION
    assert "alter table public.hpos_halal_runs enable row level security" in MIGRATION
    assert "revoke all on table public.hpos_security_identities from anon, authenticated" in MIGRATION
    assert "revoke all on table public.hpos_halal_runs from anon, authenticated" in MIGRATION


def test_screen_service_is_session_guarded_and_fail_closed():
    identity_route = SCREEN.index('path === "/identity"')
    check_route = SCREEN.index('path === "/check"')
    latest_route = SCREEN.index('path === "/runs/latest"')
    assert SCREEN.index("await requireSession(req);", identity_route) < check_route
    assert SCREEN.index("await requireSession(req);", check_route) < latest_route
    assert SCREEN.index("await requireSession(req);", latest_route) < SCREEN.index("return json(await latestRun", latest_route)
    assert 'state: "OPEN_REVIEW"' in SCREEN
    assert 'reason: "valid_isin_not_source_verified"' in SCREEN
    assert "PARQET_CANONICAL_ISIN" not in SCREEN
    assert 'source: "VALID_ISIN_INPUT"' not in SCREEN
    assert "const match = ticker ? exact.find(x => tickerEqual(x.ticker, ticker)) : exact[0]" in SCREEN
    assert "await readIdentity(isin)" in SCREEN
    assert "VERIFIED_IDENTITY_CACHE" in SCREEN
    assert "stored.source_name" in SCREEN
    assert "cachedIdentity: true" in SCREEN
    assert "tickerEqual(v?.ticker, ticker)" in SCREEN
    assert "ticker || upper(x.ticker)" in SCREEN


def test_open_research_cannot_degrade_a_fresh_decisive_canonical_result():
    prior_read = SCREEN.index("const prior = validIsin(inputIsin) ? await readCanonical(inputIsin) : null")
    identity_open = SCREEN.index("if (!resolved.identity?.isin)")
    persist = SCREEN.index("await persistRun(result, startedAt, completedAt)")
    post_run_guard = SCREEN.index('if (result.state === "OPEN_REVIEW" && isFreshDecisive(existing))')
    assert prior_read < identity_open
    assert "if (isFreshDecisive(prior)) return preservedCanonical" in SCREEN
    assert persist < post_run_guard
    assert "researchRunId" in SCREEN
    assert "degraded: true" in SCREEN


def test_screen_uses_traceable_account_free_sources_and_currency_guard():
    for marker in ["data.sec.gov", "include/ticker.txt", "company_tickers.json", "companyfacts", "submissions", "api.openfigi.com", "query1.finance.yahoo.com"]:
        assert marker in SCREEN
    for forbidden in ["API_KEY", "apikey=", "HALAL_TERMINAL", "portfolioValue", "cashEur"]:
        assert forbidden not in SCREEN
    assert "marketCurrencyCompatible" in SCREEN
    assert '"CURRENCY_MISMATCH"' in SCREEN
    assert "OFFICIAL_BUSINESS_DESCRIPTION_UNCLASSIFIED" in BUSINESS_CLASSIFIER
    assert "OFFICIAL_INTEREST_INCOME_LOWER_BOUND" in SCREEN
    assert 'direct: !String(direct.tag).includes("FinanceLease")' in SCREEN
    assert "optionalJson(companyFactsUrl" in SCREEN
    assert "optionalJson(submissionsUrl" in SCREEN
    assert "if (submissionsResponse && (sic || sicDescription))" in SCREEN
    assert "hpos_halal_runs" in SCREEN
    assert "hpos_halal_evidence" in SCREEN


def test_official_sec_ticker_snapshot_is_bundled_as_upstream_fallback():
    assert 'import { SEC_TICKERS } from "./sec-tickers.ts"' in SCREEN
    assert "Object.entries(SEC_TICKERS)" in SCREEN
    assert "function parseSecTickerText" in SCREEN
    assert 'throw new Error("sec_ticker_index_incomplete")' in SCREEN
    assert 'throw new Error("sec_company_index_incomplete")' in SCREEN
    assert 'throw new Error("sec_ticker_snapshot_incomplete")' in SCREEN
    assert SEC_TICKERS.count('\n  "') > 10_000
    assert '// Generated 2026-09-15 from https://www.sec.gov/include/ticker.txt' in SEC_TICKERS
    assert '"AAPL": 320193' in SEC_TICKERS
    assert '"MSFT": 789019' in SEC_TICKERS


def test_current_app_uses_generic_backend_before_local_prescreen():
    assert HTML.index("halal-research.js") < HTML.index("app.js")
    assert "screenUrl:" in RUNTIME
    backend = APP.index("HPOS_HALAL_RESEARCH?.check")
    fallback = APP.index("HPOS_HALAL_AUTOSCREEN?.screen", backend)
    assert backend < fallback
    assert "applyResearchIdentity" in APP
    assert "Persistentes Prüfprotokoll" in APP
    assert "screen?.criteria||{}" in APP
    assert "screen?.evidence" in APP
    assert "source:'PARQET'" in APP


def test_research_client_never_exposes_service_role_or_mutates_portfolio_state():
    assert "/identity" in RESEARCH
    assert "/check" in RESEARCH
    assert "/runs/latest" in RESEARCH
    assert "async function batch" in RESEARCH
    assert "HPOS_HALAL_RESEARCH=Object.freeze({resolve,check,batch" in RESEARCH
    assert "hpos_parqet_session" in RESEARCH
    for forbidden in ["SERVICE_ROLE", "hpos_parqet_validated", "hpos_parqet_previous", "hpos_parqet_quarantine"]:
        assert forbidden not in RESEARCH


def test_release_version_is_consistent():
    assert "Portfolio Intelligence · v8.7.71" in HTML
    assert "version:'8.7.71'" in RUNTIME
    assert "app.js?v=20260915-unifiedhalal1" in HTML
    assert "search-guard.js?v=20260915-genericresearch1" in HTML


def test_depot_and_watchlist_use_backend_as_single_status_authority():
    status = (ROOT / "app/halal-status.js").read_text(encoding="utf-8")
    register = (ROOT / "app/halal-register.js").read_text(encoding="utf-8")
    evidence = (ROOT / "app/halal-evidence.js").read_text(encoding="utf-8")
    autoscreen = (ROOT / "app/halal-autoscreen.js").read_text(encoding="utf-8")
    assert HTML.index("halal-status.js") < HTML.index("app.js")
    assert "['CANONICAL_BACKEND',canonical]" in status
    assert "HPOS_HALAL_RESEARCH?.batch" in register
    assert "HPOS_HALAL_AUTOSCREEN?.batch(candidates" not in register
    assert "hasCanonical" in evidence
    assert "setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch" not in autoscreen
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCREEN = (ROOT / "supabase/functions/hpos-screen/index.ts").read_text(encoding="utf-8")
SEC_TICKERS = (ROOT / "supabase/functions/hpos-screen/sec-tickers.ts").read_text(encoding="utf-8")
MIGRATION = (ROOT / "supabase/migrations/20260915073547_create_generic_identity_evidence_service.sql").read_text(encoding="utf-8")
APP = (ROOT / "app/app.js").read_text(encoding="utf-8")
RESEARCH = (ROOT / "app/halal-research.js").read_text(encoding="utf-8")
HTML = (ROOT / "app/index.html").read_text(encoding="utf-8")
RUNTIME = (ROOT / "app/runtime-config.js").read_text(encoding="utf-8")


def test_generic_identity_and_immutable_run_schema_is_private():
    assert "create table if not exists public.hpos_security_identities" in MIGRATION
    assert "create table if not exists public.hpos_halal_runs" in MIGRATION
    assert "hpos_halal_runs_isin_completed_idx" in MIGRATION
    assert "alter table public.hpos_security_identities enable row level security" in MIGRATION
    assert "alter table public.hpos_halal_runs enable row level security" in MIGRATION
    assert "revoke all on table public.hpos_security_identities from anon, authenticated" in MIGRATION
    assert "revoke all on table public.hpos_halal_runs from anon, authenticated" in MIGRATION


def test_screen_service_is_session_guarded_and_fail_closed():
    identity_route = SCREEN.index('path === "/identity"')
    check_route = SCREEN.index('path === "/check"')
    latest_route = SCREEN.index('path === "/runs/latest"')
    assert SCREEN.index("await requireSession(req);", identity_route) < check_route
    assert SCREEN.index("await requireSession(req);", check_route) < latest_route
    assert SCREEN.index("await requireSession(req);", latest_route) < SCREEN.index("return json(await latestRun", latest_route)
    assert 'state: "OPEN_REVIEW"' in SCREEN
    assert 'reason: "valid_isin_not_source_verified"' in SCREEN
    assert "PARQET_CANONICAL_ISIN" not in SCREEN
    assert 'source: "VALID_ISIN_INPUT"' not in SCREEN
    assert "const match = ticker ? exact.find(x => tickerEqual(x.ticker, ticker)) : exact[0]" in SCREEN
    assert "await readIdentity(isin)" in SCREEN
    assert "VERIFIED_IDENTITY_CACHE" in SCREEN
    assert "stored.source_name" in SCREEN
    assert "cachedIdentity: true" in SCREEN
    assert "tickerEqual(v?.ticker, ticker)" in SCREEN
    assert "ticker || upper(x.ticker)" in SCREEN


def test_open_research_cannot_degrade_a_fresh_decisive_canonical_result():
    prior_read = SCREEN.index("const prior = validIsin(inputIsin) ? await readCanonical(inputIsin) : null")
    identity_open = SCREEN.index("if (!resolved.identity?.isin)")
    persist = SCREEN.index("await persistRun(result, startedAt, completedAt)")
    post_run_guard = SCREEN.index('if (result.state === "OPEN_REVIEW" && isFreshDecisive(existing))')
    assert prior_read < identity_open
    assert "if (isFreshDecisive(prior)) return preservedCanonical" in SCREEN
    assert persist < post_run_guard
    assert "researchRunId" in SCREEN
    assert "degraded: true" in SCREEN


def test_screen_uses_traceable_account_free_sources_and_currency_guard():
    for marker in ["data.sec.gov", "include/ticker.txt", "company_tickers.json", "companyfacts", "submissions", "api.openfigi.com", "query1.finance.yahoo.com"]:
        assert marker in SCREEN
    for forbidden in ["API_KEY", "apikey=", "HALAL_TERMINAL", "portfolioValue", "cashEur"]:
        assert forbidden not in SCREEN
    assert "marketCurrencyCompatible" in SCREEN
    assert '"CURRENCY_MISMATCH"' in SCREEN
    assert "OFFICIAL_BUSINESS_DESCRIPTION_UNCLASSIFIED" in SCREEN
    assert "OFFICIAL_INTEREST_INCOME_LOWER_BOUND" in SCREEN
    assert 'direct: !String(direct.tag).includes("FinanceLease")' in SCREEN
    assert "optionalJson(companyFactsUrl" in SCREEN
    assert "optionalJson(submissionsUrl" in SCREEN
    assert "if (submissionsResponse && (sic || sicDescription))" in SCREEN
    assert "hpos_halal_runs" in SCREEN
    assert "hpos_halal_evidence" in SCREEN


def test_official_sec_ticker_snapshot_is_bundled_as_upstream_fallback():
    assert 'import { SEC_TICKERS } from "./sec-tickers.ts"' in SCREEN
    assert "Object.entries(SEC_TICKERS)" in SCREEN
    assert "function parseSecTickerText" in SCREEN
    assert 'throw new Error("sec_ticker_index_incomplete")' in SCREEN
    assert 'throw new Error("sec_company_index_incomplete")' in SCREEN
    assert 'throw new Error("sec_ticker_snapshot_incomplete")' in SCREEN
    assert SEC_TICKERS.count('\n  "') > 10_000
    assert '// Generated 2026-09-15 from https://www.sec.gov/include/ticker.txt' in SEC_TICKERS
    assert '"AAPL": 320193' in SEC_TICKERS
    assert '"MSFT": 789019' in SEC_TICKERS


def test_current_app_uses_generic_backend_before_local_prescreen():
    assert HTML.index("halal-research.js") < HTML.index("app.js")
    assert "screenUrl:" in RUNTIME
    backend = APP.index("HPOS_HALAL_RESEARCH?.check")
    fallback = APP.index("HPOS_HALAL_AUTOSCREEN?.screen", backend)
    assert backend < fallback
    assert "applyResearchIdentity" in APP
    assert "Persistentes Prüfprotokoll" in APP
    assert "screen?.criteria||{}" in APP
    assert "screen?.evidence" in APP
    assert "source:'PARQET'" in APP


def test_research_client_never_exposes_service_role_or_mutates_portfolio_state():
    assert "/identity" in RESEARCH
    assert "/check" in RESEARCH
    assert "/runs/latest" in RESEARCH
    assert "async function batch" in RESEARCH
    assert "HPOS_HALAL_RESEARCH=Object.freeze({resolve,check,batch" in RESEARCH
    assert "hpos_parqet_session" in RESEARCH
    for forbidden in ["SERVICE_ROLE", "hpos_parqet_validated", "hpos_parqet_previous", "hpos_parqet_quarantine"]:
        assert forbidden not in RESEARCH


def test_release_version_is_consistent():
    assert "Portfolio Intelligence · v8.7.71" in HTML
    assert "version:'8.7.71'" in RUNTIME
    assert "app.js?v=20260915-unifiedhalal1" in HTML
    assert "search-guard.js?v=20260915-genericresearch1" in HTML


def test_depot_and_watchlist_use_backend_as_single_status_authority():
    status = (ROOT / "app/halal-status.js").read_text(encoding="utf-8")
    register = (ROOT / "app/halal-register.js").read_text(encoding="utf-8")
    evidence = (ROOT / "app/halal-evidence.js").read_text(encoding="utf-8")
    autoscreen = (ROOT / "app/halal-autoscreen.js").read_text(encoding="utf-8")
    assert HTML.index("halal-status.js") < HTML.index("app.js")
    assert "['CANONICAL_BACKEND',canonical]" in status
    assert "HPOS_HALAL_RESEARCH?.batch" in register
    assert "HPOS_HALAL_AUTOSCREEN?.batch(candidates" not in register
    assert "hasCanonical" in evidence
    assert "setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch" not in autoscreen
