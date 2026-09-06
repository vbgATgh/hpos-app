-- v8.7.35: migrate only evidence states already confirmed before this change.
-- No new Halal classification is inferred here.
insert into public.hpos_halal_evidence
  (isin, state, source_type, source_name, methodology, symbol, raw_status, reason, evidence, checked_at, expires_at, updated_at)
values
  (
    'IE00B27YCN58',
    'PASS',
    'CURATED_ISIN',
    'iShares / BlackRock',
    'Exact-ISIN Shariah mandate',
    'ISWD',
    'EXACT_ISIN_SHARIAH_MANDATE_VERIFIED',
    'Die exakte Anteilsklasse IE00B27YCN58 wird vom Emittenten als Shariah-Fonds mit einem Scharia-konformen Anlageziel ausgewiesen; der bestehende, geprüfte Registry-Stand wird in die kanonische Backend-Evidenz übernommen.',
    jsonb_build_array(
      jsonb_build_object(
        'provider', 'iShares / BlackRock',
        'role', 'ISSUER_PRIMARY',
        'status', 'EXACT_ISIN_SHARIAH_MANDATE_VERIFIED',
        'url', 'https://www.ishares.com/de/privatanleger/de/produkte/251394/ishares-msci-world-islamic-ucits-etf?siteEntryPassthrough=true&switchLocale=y',
        'note', 'Exact ISIN IE00B27YCN58; issuer describes Shariah-fund restrictions.'
      ),
      jsonb_build_object(
        'provider', 'iShares / BlackRock Factsheet',
        'role', 'ISSUER_PRIMARY',
        'status', 'SHARIAH_OBJECTIVE_VERIFIED',
        'url', 'https://www.ishares.com/de/privatanleger/de/literature/fact-sheet/iswd-ishares-msci-world-islamic-ucits-etf-fund-fact-sheet-en-de.pdf',
        'note', 'Fund objective tracks companies complying with Shariah investment principles.'
      ),
      jsonb_build_object(
        'provider', 'Musaffa',
        'role', 'SCREENER_CORROBORATION',
        'status', 'CORROBORATED',
        'url', 'https://academy.musaffa.com/list-of-halal-stocks-in-the-msci-world-index/',
        'note', 'Existing registry corroboration; not the primary identity evidence.'
      )
    ),
    '2026-09-04T21:35:00Z'::timestamptz,
    null,
    now()
  ),
  (
    'DK0062498333',
    'PASS',
    'HPOS_AAOIFI',
    'HPOS AAOIFI Rule Engine',
    'AAOIFI SS21',
    'NOVO-B.CO',
    'AUTO_PASS',
    'Der bereits in v8.7.28 bestätigte Gate-1-Stand wurde ohne neue Klassifizierung in die kanonische Backend-Evidenz migriert.',
    jsonb_build_array(
      jsonb_build_object(
        'provider', 'HPOS AAOIFI Rule Engine',
        'role', 'INTERNAL_RULE_ENGINE',
        'status', 'AUTO_PASS',
        'note', 'Migration des bereits bestätigten Gate-1-Stands aus v8.7.28; keine neue Einstufung.'
      )
    ),
    now(),
    now() + interval '7 days',
    now()
  )
on conflict (isin) do update
set state = excluded.state,
    source_type = excluded.source_type,
    source_name = excluded.source_name,
    methodology = excluded.methodology,
    symbol = excluded.symbol,
    raw_status = excluded.raw_status,
    reason = excluded.reason,
    evidence = excluded.evidence,
    checked_at = excluded.checked_at,
    expires_at = excluded.expires_at,
    updated_at = now()
where public.hpos_halal_evidence.source_type = 'HPOS_AAOIFI'
  and public.hpos_halal_evidence.state = 'OPEN_REVIEW';
