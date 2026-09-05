create table if not exists public.hpos_halal_evidence (
  isin text primary key,
  state text not null check (state in ('PASS','FAIL','OPEN_REVIEW')),
  source_type text not null check (source_type in ('CURATED_ISIN','HPOS_AAOIFI','FREE_PROVIDER','MANUAL_EXTERNAL')),
  source_name text not null,
  methodology text,
  symbol text,
  raw_status text,
  reason text not null,
  evidence jsonb not null default '[]'::jsonb,
  checked_at timestamptz not null,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint hpos_halal_evidence_isin_format check (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  constraint hpos_halal_evidence_json_array check (jsonb_typeof(evidence) = 'array')
);

alter table public.hpos_halal_evidence enable row level security;
revoke all on table public.hpos_halal_evidence from anon, authenticated;

comment on table public.hpos_halal_evidence is
'HPOS canonical per-ISIN Halal decision projection. Server-side only; absence is OPEN_REVIEW, never FAIL.';
comment on column public.hpos_halal_evidence.state is
'PASS, FAIL, or OPEN_REVIEW. Missing rows must be interpreted as OPEN_REVIEW.';
comment on column public.hpos_halal_evidence.evidence is
'Normalized evidence list; never contains provider API secrets.';
