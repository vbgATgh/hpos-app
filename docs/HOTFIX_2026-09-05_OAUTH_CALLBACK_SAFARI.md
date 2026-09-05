# Hotfix — Safari-safe Parqet OAuth callback

Date: 2026-09-05  
Build: v8.7.31  
Status: implemented

## Observed failure

On iOS the Parqet authorization page reported that HPOS was already authorized. The following Supabase callback then returned an Internal Server Error and Safari offered `callback.txt` as a download.

## Change

Only the successful final callback response changed:

- previous: bare HTTP 302 response
- current: explicit no-store HTML response with `text/html; charset=utf-8`
- the HTML immediately opens the existing HPOS redirect URL using `location.replace`

OAuth state validation, PKCE, token exchange, server-side token storage, opaque browser session, Parqet normalization, portfolio validation, rollback and quarantine remain unchanged.

## Verification

- `hpos-api` deployed as Edge Function version 20 / service 0.5.1
- health endpoint successful
- callback helper emits HTML and uses no-store
- function source synchronized to the repository
- final OAuth end-to-end retry still requires the user's Parqet browser session
