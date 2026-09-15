create table if not exists public.hpos_security_identities (
  isin text primary key check (isin ~ '^[A-Z]{2}[A-Z0-9]{9}[0-9]$'),
  symbol text,
  exchange text,
  name text not null,
  quote_type text,
  resolution_status text not null check (resolution_status in ('VERIFIED', 'AMBIGUOUS', 'UNRESOLVED')),
  confidence numeric not null check (confidence >= 0 and confidence <= 1),
  source_name text not null,
  source_url text,
  candidates jsonb not null default '[]'::jsonb check (jsonb_typeof(candidates) = 'array'),
  verified_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.hpos_security_identities is
  'Server-side canonical identity cache. No portfolio ownership or broker data.';

create table if not exists public.hpos_halal_runs (
  id uuid primary key,
  isin text not null references public.hpos_security_identities(isin) on update cascade,
  symbol text,
  state text not null check (state in ('PASS', 'FAIL', 'OPEN_REVIEW')),
  methodology text not null,
  reason text not null,
  missing_criteria text[] not null default '{}',
  criteria jsonb not null default '{}'::jsonb check (jsonb_typeof(criteria) = 'object'),
  evidence jsonb not null default '[]'::jsonb check (jsonb_typeof(evidence) = 'array'),
  started_at timestamptz not null,
  completed_at timestamptz not null,
  created_at timestamptz not null default now()
);

comment on table public.hpos_halal_runs is
  'Immutable audit log for generic AAOIFI evidence runs. OPEN_REVIEW is a valid fail-closed outcome.';

create index if not exists hpos_halal_runs_isin_completed_idx
  on public.hpos_halal_runs (isin, completed_at desc);

alter table public.hpos_security_identities enable row level security;
alter table public.hpos_halal_runs enable row level security;

revoke all on table public.hpos_security_identities from anon, authenticated;
revoke all on table public.hpos_halal_runs from anon, authenticated;
grant all on table public.hpos_security_identities to service_role;
grant all on table public.hpos_halal_runs to service_role;
