create policy hpos_oauth_pending_deny_all
on public.hpos_oauth_pending
for all
to public
using (false)
with check (false);

create policy hpos_parqet_sessions_deny_all
on public.hpos_parqet_sessions
for all
to public
using (false)
with check (false);
