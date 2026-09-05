# Gate 1 — AAOIFI-first workflow

Date: 2026-09-05
Build: v8.7.20
Status: approved

Priority:
1. Existing approved evidence for the exact ISIN.
2. HPOS AAOIFI Rule Engine v1.
3. Optional free external cross-check.
4. Manually pasted external evidence as the final fallback.

AAOIFI Rule Engine v1 evaluates:
- core business activity
- non-permissible income against the 5% threshold
- interest-bearing assets against the 30% threshold
- interest-bearing debt against the 30% threshold

Missing required values remain PRÜFUNG OFFEN. Snapshot proxies may inform the review but cannot create HALALKONFORM.

Manual external evidence:
- is tied to the currently verified ISIN
- requires explicit user confirmation that the pasted text belongs to that instrument
- can parse an explicit AAOIFI PASS or FAIL
- ambiguous text remains PRÜFUNG OFFEN

Zero-cost architecture remains binding. No paid provider is required for Gate 1.
