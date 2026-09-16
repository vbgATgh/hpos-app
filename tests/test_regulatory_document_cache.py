from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
SCREEN = (ROOT / "supabase/functions/hpos-screen/index.ts").read_text(encoding="utf-8")
MIGRATION = (ROOT / "supabase/migrations/20260916054500_create_regulatory_document_cache.sql").read_text(encoding="utf-8")


def test_regulatory_document_and_fact_cache_is_private_and_traceable():
    assert "create table if not exists public.hpos_regulatory_documents" in MIGRATION
    assert "create table if not exists public.hpos_regulatory_facts" in MIGRATION
    assert "unique (source_type, filing_id)" in MIGRATION
    for field in ["period_start", "period_end", "unit", "concept", "location", "source_url", "quality"]:
        assert field in MIGRATION
    for table in ["hpos_regulatory_documents", "hpos_regulatory_facts"]:
        assert f"alter table public.{table} enable row level security" in MIGRATION
        assert f"revoke all on table public.{table} from anon, authenticated" in MIGRATION
        assert f"grant all on table public.{table} to service_role" in MIGRATION


def test_non_sec_path_uses_gleif_and_esef_before_discovery_fallback():
    cached = SCREEN.index("readCachedRegulatoryEvidence(identity)")
    esef = SCREEN.index("acquireEsefEvidence(identity)")
    yahoo = SCREEN.index("yahooProfile(ticker)", esef)
    assert cached < esef < yahoo
    assert "api.gleif.org/api/v1/lei-records" in SCREEN
    assert "filings.xbrl.org" in SCREEN
    assert "OFFICIAL_FILED_PACKAGE_COPY" in SCREEN
    assert "ESEF_XBRL_CACHE_STALE" in SCREEN
    assert "const queryName = companyKey(name)" in SCREEN
    assert "(?:[- ]+[A-Z])?" in SCREEN


def test_esef_facts_keep_exact_xbrl_fundstelle_and_attach_point_market_value_fail_closed():
    assert 'location: `fact:${x.factId}`' in SCREEN
    assert 'method: "SUM_OF_REPORTED_COMPONENTS"' in SCREEN
    assert "sumXbrlPointGroups" in SCREEN
    assert "selectXbrlPoint" in SCREEN
    assert 'marketValueMethod: "UNAVAILABLE"' in SCREEN
    assert "attachMarketValueAtCheck" in SCREEN
    assert 'metric: "marketValueAtCheck"' in SCREEN
    assert 'method: "YAHOO_REPORTED_MARKET_CAP_AT_CHECK"' in SCREEN
    assert "marketCurrencyCompatible === true" in SCREEN
    assert '"FINANCE_INCOME_UPPER_BOUND"' in SCREEN
    assert 'f.interestIncomeMethod === "LOWER_BOUND"' in SCREEN
    assert "DOCUMENT_DISCOVERY_TTL" in SCREEN


def test_service_release_exposes_regulatory_cache_capability():
    assert 'version: "1.6.0"' in SCREEN
    assert 'evidence: "SEC_AND_ESEF_XBRL_CACHE"' in SCREEN
    assert "regulatoryDocumentCache: true" in SCREEN
    assert 'marketValueBasis: "MARKET_CAP_AT_CHECK"' in SCREEN
