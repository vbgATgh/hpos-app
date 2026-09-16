create table if not exists public.hpos_regulatory_documents (
  id uuid primary key default gen_random_uuid(),
  isin text not null references public.hpos_security_identities(isin) on update cascade,
  symbol text,
  lei text check (lei is null or lei ~ '^[A-Z0-9]{20}$'),
  legal_name text,
  source_type text not null check (source_type in ('SEC_XBRL', 'ESEF_XBRL')),
  source_name text not null,
  source_url text not null,
  filing_id text not null,
  document_type text not null,
  period_start date,
  period_end date,
  filing_date date,
  report_url text,
  package_url text,
  json_url text,
  viewer_url text,
  sha256 text check (sha256 is null or sha256 ~ '^[a-f0-9]{64}$'),
  currency text,
  status text not null check (status in ('DISCOVERED', 'EXTRACTED', 'FAILED')),
  quality text not null check (quality in ('OFFICIAL_PRIMARY', 'OFFICIAL_FILED_PACKAGE_COPY')),
  raw_metadata jsonb not null default '{}'::jsonb check (jsonb_typeof(raw_metadata) = 'object'),
  last_error text,
  discovered_at timestamptz not null default now(),
  fetched_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (source_type, filing_id)
);

comment on table public.hpos_regulatory_documents is
  'Private immutable-source registry for regulatory filings. Stores provenance and retrieval metadata, never portfolio data.';

create index if not exists hpos_regulatory_documents_isin_period_idx
  on public.hpos_regulatory_documents (isin, period_end desc);

create table if not exists public.hpos_regulatory_facts (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.hpos_regulatory_documents(id) on delete cascade,
  isin text not null references public.hpos_security_identities(isin) on update cascade,
  metric text not null,
  value_numeric numeric,
  value_text text,
  unit text,
  period_start date,
  period_end date,
  concept text,
  location text,
  source_name text not null,
  source_url text not null,
  quality text not null check (quality in ('OFFICIAL', 'MARKET', 'DISCOVERY')),
  method text not null,
  created_at timestamptz not null default now(),
  check (value_numeric is not null or value_text is not null)
);

comment on table public.hpos_regulatory_facts is
  'Extracted filing facts with period, unit, concept, source URL and exact XBRL fact location.';

create index if not exists hpos_regulatory_facts_document_idx
  on public.hpos_regulatory_facts (document_id, metric);

create index if not exists hpos_regulatory_facts_isin_period_idx
  on public.hpos_regulatory_facts (isin, period_end desc, metric);

alter table public.hpos_regulatory_documents enable row level security;
alter table public.hpos_regulatory_facts enable row level security;

revoke all on table public.hpos_regulatory_documents from anon, authenticated;
revoke all on table public.hpos_regulatory_facts from anon, authenticated;
grant all on table public.hpos_regulatory_documents to service_role;
grant all on table public.hpos_regulatory_facts to service_role;
