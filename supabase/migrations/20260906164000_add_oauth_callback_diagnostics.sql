alter table public.hpos_oauth_pending
  add column if not exists last_stage text,
  add column if not exists last_error text,
  add column if not exists updated_at timestamptz not null default now();
