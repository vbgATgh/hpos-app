# HPOS Data Source Strategy

## Decision
Parqet remains the primary normalization and portfolio-accounting interface between brokers and HPOS. It is not treated as unquestioned broker truth.

HPOS uses a hybrid model:
1. Broker-confirmed data for execution-critical fields and explicit overrides.
2. Parqet for normalized holdings, transactions, dividends, portfolio KPIs and performance.
3. HPOS local Current State for private broker provenance, open orders, saving plans, cash commitments and overrides.
4. Public HPOS market/fundamental/news sources for prices, company evidence and thesis testing.

## Why Parqet stays
Parqet already normalizes heterogeneous broker transactions into a common model and exposes holdings, cash, XIRR/TTWROR, dividends, fees/taxes and transaction history. Rebuilding broker parsers for Scalable Capital and Trade Republic inside HPOS would duplicate work, increase maintenance risk and make the portfolio layer more fragile.

## Known limitations
- Broker attribution can be incomplete after aggregation/import and must not be inferred from portfolio name alone.
- A quote can be stale or fall back to an activity price; HPOS must inspect quote timestamp/source and allow a recent broker-confirmed override.
- Open orders, broker-specific tax pots/FSA and execution availability are not portfolio-accounting facts and stay in local Current State.
- Parqet is not a fundamental-data provider. Thesis evidence, filings, guidance, regulatory events, dividends and Halal evidence require separate source layers.

## Reconciliation rule
Parqet is canonical for normalized history unless a newer broker-confirmed fact proves a field stale or wrong. Overrides are field-specific, timestamped and expire automatically when a newer plausible source replaces them.

## Manual broker imports
Direct SC/TR uploads are a reconciliation/fallback path, not the daily primary pipeline. Use them when Autosync/import is delayed, broker provenance is missing, or execution-critical data differs. This keeps HPOS independent without forcing permanent manual maintenance.

## Privacy
No real portfolio snapshot, broker statement, tax status or user-specific Current State is committed to the public repository. Private state stays local and can be encrypted for backup.
