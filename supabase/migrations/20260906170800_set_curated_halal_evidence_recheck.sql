-- v8.7.35: enforce the existing quarterly recheck policy for curated ETF evidence.
update public.hpos_halal_evidence
set expires_at = checked_at + interval '3 months',
    updated_at = now()
where isin = 'IE00B27YCN58'
  and source_type = 'CURATED_ISIN'
  and expires_at is null;
