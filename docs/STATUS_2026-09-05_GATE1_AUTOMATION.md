# Gate 1 automation — zero-cost pre-screen

Date: 2026-09-05
Build: v8.7.18

Implemented:
- automatic background pre-screen for portfolio and Watchlist values
- free company profile/fundamental source only
- business activity exclusion screen
- available debt/market-cap proxy is recorded, but never treated as full AAOIFI proof
- explicit registry evidence remains authoritative
- automatic FAIL is allowed only for high-confidence prohibited primary-business categories
- automatic PASS for ordinary equities is NOT allowed from incomplete free fundamentals
- missing impermissible-income or interest-bearing-asset data remains PRÜFUNG OFFEN
- results cached locally for 7 days to keep HPOS light and avoid unnecessary requests

Current methodology reference:
AAOIFI-style two-stage screening: business activity plus financial ratios. HPOS free pre-screen is a triage aid, not a scholarly certification.

Next:
- inspect the first portfolio batch results
- tighten false-positive protection if needed
- add transparent per-criterion display in the Halal Register
