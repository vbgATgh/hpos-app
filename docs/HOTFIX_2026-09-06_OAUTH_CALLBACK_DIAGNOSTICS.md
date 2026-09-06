# Hotfix — Observable and redirect-only Parqet callback

Date: 2026-09-06  
Build: v8.7.34  
Status: implemented

## Confirmed failure

An iOS retry at 18:40 returned a downloaded `callback.txt` with `Internal Server Error`. No new Parqet session was stored. The previous callback deleted its one-time state before token exchange and session persistence completed, removing the only safe diagnostic anchor.

## Decision

- Keep the pending OAuth state until the Parqet token and HPOS session are stored successfully.
- Record only sanitized stage and error codes; never record authorization codes, access tokens, refresh tokens, or secrets.
- Bound the Parqet token request to 15 seconds.
- Return every callback outcome with HTTP 303 to the existing HPOS origin.
- Put a safe error code in the URL fragment so it is not sent as an HTTP referrer or server query.
- Let the frontend consume and remove the fragment, clear stale local auth state, and preserve the validated portfolio.

## Verification

- Supabase `hpos-api` v23 is active.
- Health endpoint reports service version 0.5.2.
- An invalid callback returns HTTP 303 with a location under the existing HPOS GitHub Pages origin.
- The response has no body and no content-disposition, so Safari has no callback document to download.
- Existing Parqet backend path was separately verified with HTTP 200, 19 active positions, and EUR 690.13 cash.

## Boundaries

No holdings, cash, portfolio validation, rollback, quarantine, Halal evidence, market data, or execution logic changed.
