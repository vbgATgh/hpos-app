# Gate 1 provider integration — Halal Terminal Free

Date: 2026-09-05
Build: v8.7.19

Implemented:
- server-side Halal Terminal proxy in Supabase hpos-api
- API key is read only from server environment variable HALAL_TERMINAL_API_KEY
- frontend never receives the provider key
- provider mode is FREE_ONLY
- if provider reports a non-free plan, HPOS blocks the provider call
- quota exhaustion produces PRÜFUNG OFFEN; no paid fallback or checkout path exists
- exact-ISIN registry evidence remains highest priority
- provider COMPLIANT -> Gate 1 PASS / HALALKONFORM
- provider NON_COMPLIANT -> Gate 1 FAIL / NICHT HALALKONFORM
- provider unavailable/unrated -> HPOS free pre-screen remains fallback
- Halal Register shows provider readiness and offers a manual refresh

External prerequisite still required:
- a free Halal Terminal API key must be created by the user and stored as Supabase secret HALAL_TERMINAL_API_KEY.
- until that secret exists, provider status is "noch nicht verbunden" and HPOS continues with the zero-cost internal pre-screen.

No paid service has been enabled.
