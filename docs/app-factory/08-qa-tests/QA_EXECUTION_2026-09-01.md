# HPOS – QA Execution Evidence 2026-09-01

Status: PARTIAL PASS / CANONICAL7 MVP BROWSER EVIDENCE EXPANDED / SECURITY SUPPORT OPEN

## Scope

This file records only tests actually observed against the current Supabase/GitHub-Pages migration path. Historical alpha test results are not reused as current proof.

Canonical product path: `app/`
Release line: `v8.7.5` toward `v9 RC = MVP`
Backend: Supabase Edge Function `hpos-api`

## Verified evidence

### T-001 – App Boot / validated state
Result: PASS.
Evidence: Browser screenshots on 2026-09-01 showed canonical HPOS `v8.7.5`, validated state, 19 positions, `PARQET LIVE SYNC`, non-empty valuation and current portfolio timestamps.

Canonical-entrypoint follow-up on canonical7 also passed: opening repository root redirected into `/hpos-app/app/` and rendered `HPOS Portfolio Intelligence · v8.7.5`, 19 positions and the current validated portfolio state. The former green root application was not shown.

### T-002 – Parqet refresh + reconciliation
Result: PASS on canonical4 for the observed unchanged-portfolio case.
Evidence: Browser retest showed `PARQET LIVE SYNC`, current portfolio timestamp and the explicit message `Parqet validiert · keine Positionsänderung`. The earlier false quarantine did not recur. Independent Parqet cross-check matched 19 active security positions under the approved classification rule. Historical cash figures are not fixed invariants.

### Market transport – Quotes
Result: PASS for the tested transport path.
Evidence: browser smoke changed `Kurse` from `Snapshot` to a current clock time and Supabase returned successful quote responses. Market data remained separate from portfolio holdings.

### T-005 – Search by name/ticker
Result: PASS.
Evidence: Browser search for Abbott returned Abbott Laboratories with canonical ISIN `US0028241000` and ticker `ABT`. The verified result was labelled `Im Depot`.

### T-006 – Exact valid ISIN verification
Result: PASS on canonical5/canonical7.
Evidence: exact ISIN `US4781601046` returned Johnson & Johnson, ticker `JNJ`, explicitly ISIN-verified.

### T-007 – Invalid ISIN rejection
Result: PASS on canonical5.
Evidence: deliberately invalid checksum variant `US4781601047` returned no verified instrument and displayed an invalid-ISIN error. No watchlist action was offered.

### T-008 – Watchlist add/remove + persistence
Result: PASS.
Evidence: Johnson & Johnson was added only after verification, survived full reload in the same browser, did not mutate the 19-position depot state, and was subsequently removed with removal also surviving reload.

### T-009 – Investment record data-role separation
Result: PASS for the representative HOLDING + WATCHLIST roles observed.
Evidence: Johnson & Johnson opened as `WATCHLIST` with no invented position value/shares/acquisition price. Abbott opened as `HOLDING`, broker `SCALABLE`, ISIN `US0028241000`, ticker `ABT`, real position metrics and separately presented market/evidence fields. Abbott screenshot on 2026-09-01 additionally showed position value `656,67 €`, 7 shares, average acquisition `81,80 €`, current market price `93,81 €`, unrealized `84,10 €`, and Halal `UNKNOWN`. Missing position-specific dividend data was explicitly shown as unavailable until present in validated state.

### T-010 – Broker workflow without HPOS order execution
Result: PASS for the UI/architecture guard.
Evidence: Abbott `Broker-Order` dialog was opened in the canonical browser build. It showed Wertpapier Abbott Laboratories, action Kaufen and broker Scalable Capital. The dialog explicitly states that the order is executed only in the broker app, HPOS sends no order, HPOS does not manually mutate the depot, HPOS has no broker-order interface, BUY/SELL occurs only in Scalable Capital or Trade Republic, and HPOS accepts the change only after validated Parqet reconciliation. No order was executed during the test.

This PASS verifies the MVP no-order guard and workflow semantics. It does not substitute for T-011, which requires a real external broker-side change followed by Parqet reconciliation.

### T-012 – Decision Layer
Result: PASS for current missing-Halal-evidence case.
Evidence: Analyse/Entscheidungsraum screenshot showed 19 assets, `Portfolio-Halal-Evidenz 0/19 belegt`, gate 1 `HALAL – EVIDENZ FEHLT`, and gates 2 through 8 explicitly `BLOCKIERT DURCH HALAL-GATE`. The UI states that gate order is binding, later signals do not override an earlier hard gate, missing evidence remains missing, and HPOS executes no order. This verifies that the decision layer does not invent downstream recommendations when the first hard gate lacks evidence.

### T-013 – Halal evidence behavior
Result: PASS for UNKNOWN/no-evidence case.
Evidence: Halal Register screenshot showed 19 depot positions, `Status mit belegter Einstufung 0/19`, `Quelle nicht hinterlegt`, `Prüf-/Aktualitätsstand nicht verfügbar`, and the explicit guard that UNKNOWN is not a Halal approval and missing/conflicting evidence is not silently presented as confirmed.

A future evidence-provider integration will require new positive/negative/conflict cases; this PASS applies to the current MVP behavior when evidence is absent.

### T-014 – Income monthly target
Result: PASS for current validated-income state and target display.
Evidence: Income screenshot showed `Validierte Ausschüttungen 0`, `Monats-Ist (validiert) 0,00 €`, `Netto-Monatsziel 100 €` and the target control. Current-month actual and target are visibly separated.

### T-015 – Dividends without fabricated forward values
Result: PASS for missing-data case.
Evidence: Income explicitly displayed `Keine validierten Ausschüttungen im aktuellen Monat. Es werden keine Forward-Werte geschätzt.` The payout list separately displayed `Noch keine validierten Dividendendaten im aktuellen State.` Abbott investment record likewise stated that position-specific payouts are taken from validated portfolio state once available. No synthetic dividend estimate was shown.

### T-016 – Main navigation / H-home
Result: PASS for main-view reachability observed across the current QA sequence.
Evidence: user has opened Home, Portfolio, Analyse, Income and Mehr-derived Halal Register in the canonical browser flow; the top-left H button was separately verified to return reliably to Home. State remained intact across the observed navigation.

### T-017 – More / MVP-relevant system path
Result: PARTIAL PASS.
Evidence: `Mehr -> Halal Register` was successfully opened and rendered the intended compliance missing-evidence state. Additional data/system/diagnostic return paths remain to be checked before full T-017 PASS.

### Canonical deployment entrypoint
Result: PASS on canonical7.
Evidence: root URL was corrected from obsolete local-PWA implementation to the approved `/app/` product path and browser retest opened Portfolio Intelligence.

## Canonical hardening browser proof

The previously pending canonical6/7 hardening behaviors are now browser-proven for the tested states:
- binding Decision Gate order and hard-gate blocking: PASS
- UNKNOWN Halal evidence is not converted into approval: PASS
- investment record inherits the gate semantics: PASS on Abbott
- current-month validated income is separated from target: PASS
- missing dividend data produces no forward estimate: PASS
- Halal Register exposes missing source/update evidence: PASS
- broker dialog explicitly prevents any implication of HPOS-side order execution: PASS

Implementation commits retained as provenance:
- `b20bb032c30e5a7891ea7a2656664465ba02cde9` – MVP hardening script
- `c5c777d8b9dc2a973886a5cc5478f096d313d8c5` – canonical6 promotion
- `48d5ff827870649af95744547121521802e963aa` – canonical7 app cache-bust / manifest

## Security follow-up 2026-09-02

### T-020 – final secret/privacy smoke
Result: BLOCKED / EXTERNAL CLEANUP OPEN.

The current `main` branch no longer contains the real portfolio snapshot in its reachable branch history. A previously exposed orphaned commit remains directly retrievable by its old SHA, so final privacy PASS is not claimed. GitHub Support ticket `#4720320` was opened on 2026-09-02 requesting server-side dereferencing / garbage collection and cached-view removal. T-020 can move to PASS only after GitHub confirms cleanup and the old SHA is independently rechecked.

### T-003 – controlled provider-failure protocol
Result: PENDING EXECUTION.

The next deterministic browser test will use the already validated local portfolio state and then temporarily disable network connectivity without reloading the page. A manual HPOS refresh must fail provider access while leaving position count, cash, validated-state timestamp and previously validated holdings unchanged. Network is then restored and a second manual refresh must recover normal Parqet/market connectivity. No PASS is claimed until this exact sequence is observed.

## Still required

The following are NOT claimed as passed yet:
- T-003 controlled offline provider failure / preserved validated state on current canonical build (protocol prepared, execution pending)
- T-004 representative portfolio-row navigation beyond already observed Abbott/JNJ paths if broader coverage is required
- T-011 real broker -> Parqet -> HPOS reconciliation after an actual broker-side change
- T-017 remaining More/data/system/diagnostic navigation
- T-018 core visualizations beyond currently observed cards/gates/income states
- T-019 iPhone Safari/PWA primary flow
- T-020 final secret/privacy smoke (blocked on GitHub Support #4720320)
- final legacy cleanup regression

## QA rule

No pending item above may be reported as successful until it is actually executed against the relevant current build. The final v9 RC regression will supersede this partial execution record but this file remains as migration evidence.
