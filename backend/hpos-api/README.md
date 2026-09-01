# HPOS API

Private integration layer for HPOS. This backend is intentionally separate from the legacy `hpos-proxy` Worker.

## Scope v0.1

- Parqet OAuth 2.0 Authorization Code + PKCE
- `portfolio:read` only
- read portfolios
- read holdings
- read activities
- no order execution
- no DivvyDiary integration yet

## Required Cloudflare resources

1. New Worker named `hpos-api`
2. KV namespace bound as `HPOS_KV`
3. Variables:
   - `APP_ORIGIN=https://vbgatgh.github.io`
   - `PARQET_CLIENT_ID=<client id from Parqet Developer Hub>`
   - `PARQET_REDIRECT_URI=https://<new-worker-host>/auth/parqet/callback`

No Parqet access token or refresh token is committed to GitHub. OAuth tokens are stored in the private KV namespace.

## Required Parqet setup

Create a private integration in the Parqet Developer Hub.

- scope: `portfolio:read`
- redirect URI: exact value of `PARQET_REDIRECT_URI`
- private integration is sufficient for personal HPOS use

## Endpoints

- `GET /health`
- `GET /auth/parqet/start`
- `GET /auth/parqet/callback`
- `GET /api/parqet/portfolios`
- `GET /api/parqet/holdings?portfolioId=...`
- `GET /api/parqet/activities?portfolioId=...&limit=...&cursor=...`

The API uses an opaque HttpOnly session cookie. The browser never receives Parqet OAuth tokens.

## Rollout rule

Do not point the HPOS frontend at this backend until:

1. Worker deployed separately from the legacy Worker
2. OAuth flow succeeds
3. `/api/parqet/portfolios` succeeds
4. holdings for the intended portfolio match Parqet
5. regression check confirms existing local state is not overwritten on API failure

Only then switch `runtime-config.js` from `LEGACY_TRANSITION` to the new backend.
