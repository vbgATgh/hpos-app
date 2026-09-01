create table if not exists public.hpos_oauth_pending (
  state text primary key,
  code_verifier text not null,
  session_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.hpos_parqet_sessions (
  session_id text primary key,
  access_token text not null,
  refresh_token text,
  token_type text not null default 'Bearer',
  scope text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.hpos_oauth_pending enable row level security;
alter table public.hpos_parqet_sessions enable row level security;

revoke all on table public.hpos_oauth_pending from anon, authenticated;
revoke all on table public.hpos_parqet_sessions from anon, authenticated;
grant all on table public.hpos_oauth_pending to service_role;
grant all on table public.hpos_parqet_sessions to service_role;

create index if not exists hpos_oauth_pending_expires_at_idx on public.hpos_oauth_pending (expires_at);
create index if not exists hpos_parqet_sessions_expires_at_idx on public.hpos_parqet_sessions (expires_at);
