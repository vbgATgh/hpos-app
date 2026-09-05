# Decision — Canonical Halal evidence backend

Date: 2026-09-05  
Build: v8.7.30  
Status: implemented

## Decision

HPOS stores the current automatic Halal decision projection server-side by verified ISIN in `public.hpos_halal_evidence`.

Priority remains:

1. approved curated evidence for the exact ISIN
2. persisted HPOS AAOIFI result
3. free external provider evidence
4. confirmed manual external evidence

Missing, stale, ambiguous, or conflicting evidence remains `OPEN_REVIEW`. No missing result may become `FAIL`.

## Security and boundaries

- Browser roles have no table privileges.
- RLS is enabled and no browser policy exists.
- Read and write operations pass through `hpos-api`.
- Halal evidence routes require the existing opaque HPOS session.
- Provider secrets remain server-side.
- Paid provider plans remain blocked.
- The Halal layer cannot update Parqet holdings, cash, validated state, rollback, or quarantine data.

## Implementation

- Supabase table `hpos_halal_evidence`
- `hpos-api` v19 / service version 0.5.0
- frontend module `app/halal-store.js`
- canonical resolver used by Home, Portfolio, Investment-Akte, Analyse, and Halal Register
- AAOIFI results expire after seven days
- free-provider results expire after thirty days

## Verified

- Edge Function health successful
- provider status reports not configured because no API key exists
- unauthenticated evidence read rejected with HTTP 401
- schema, RLS, grants, and empty initial table verified
- all modified browser modules pass JavaScript syntax parsing
- authenticated POST/GET roundtrip returned HTTP 200 and preserved OPEN_REVIEW
- temporary integration-test evidence and session were deleted and verified absent

Halal Terminal Free is still not connected. No external screening run has been claimed.
