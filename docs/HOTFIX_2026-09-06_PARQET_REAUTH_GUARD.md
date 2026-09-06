# Hotfix — Parqet reauthorization guard

Date: 2026-09-06  
Build: v8.7.33  
Status: implemented

## Evidence

The device showed `Parqet HTTP 401` while the validated 19-position portfolio remained intact. Supabase held a successful OAuth session. A server-side refresh was verified against the official Parqet Connect API:

- `GET /user`: HTTP 200
- one portfolio read permission
- `GET /portfolios`: HTTP 200
- HPOS normalized endpoint: HTTP 200
- 19 active positions and EUR 690.13 cash

## Cause and decision

After an earlier failed OAuth callback, the frontend stored the literal session flag `redirecting` without an expiry. Returning manually to HPOS could therefore block every later reauthorization attempt for the lifetime of the browser tab.

The guard is now timestamp-based and expires after 60 seconds. It still prevents immediate redirect loops but can no longer strand the app after an interrupted callback.

## Boundaries

No portfolio, cash, validation, rollback, quarantine, Halal evidence, or order-execution logic changed.
