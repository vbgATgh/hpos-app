# HPOS – QA & Test Baseline

Stand: 2026-09-01
Status: KANONISCHER BASIS-SMOKE + ISIN/WATCHLIST BESTANDEN / WEITERE MVP-REGRESSION OFFEN

## Befund
Das Repository enthält zahlreiche historische Alpha-/Hotfix-/Privacy-/UX-CI-Workflows und Test-/Audit-Dokumente. Diese belegen frühere Prüfaktivitäten, sind aber kein automatischer Nachweis für den aktuellen kanonischen `app/`-Produktpfad oder den künftigen v9 RC.

Seit 2026-09-01 wurden reale Browser-/Backendtests gegen die Supabase-Migration durchgeführt. Der kanonische `app/`-Pfad wurde inzwischen mit Boot, Parqet-Live-Sync, Reconciliation, Quotes, exakter ISIN-Verifikation und Watchlist-Persistenz im Browser erfolgreich geprüft. Der Repository-Root leitet auf den kanonischen Produktpfad um. Weitere MVP-Testfälle bleiben offen.

## QA-Regel
Ein Test gilt nur dann als bestanden, wenn er gegen den tatsächlich relevanten Build/Commit durchgeführt und das Ergebnis belegt wurde. Historische Alpha-Ergebnisse werden nicht auf v9 übertragen.

**Verbindliche Scope-Entscheidung:** `v9 RC = MVP`.

Traceability-Ziel:
`REQ -> AC -> Testfall -> Testergebnis -> Commit/Build`

## Verifizierte Nachweise 2026-09-01

Tatsächlich durchgeführt und belegt:
- Parqet OAuth Authorization Code + PKCE erfolgreich
- serverseitiger Access-/Refresh-Token-Store erfolgreich
- realer Refresh eines abgelaufenen Access Tokens erfolgreich
- Parqet Portfolio-/Performance-Abruf erfolgreich
- serverseitige Normalisierung erfolgreich
- kanonischer Browserlauf mit `PARQET LIVE SYNC` erfolgreich
- canonical4 Reconciliation: `Parqet validiert · keine Positionsänderung`
- Bestand und Kurse im selben manuellen Refresh aktualisiert
- Search nach `Abbott` real über Supabase, UI-Treffer `US0028241000` / `ABT`
- Abbott korrekt als Depotwert erkannt und nicht als Watchlist-Kandidat angeboten
- Investment-Akte für Abbott geöffnet und Datenrollen teilweise geprüft
- gültige exakte ISIN `US4781601046` -> Johnson & Johnson / JNJ verifiziert
- absichtlich ungültige Prüfziffer `US4781601047` sicher abgelehnt
- Watchlist add/remove und Reload-Persistenz im selben Browser erfolgreich
- dieselbe Watchlist-Persistenz nach Korrektur des kanonischen Root-Entrypoints erneut auf `/app/` bestätigt
- mehrere Yahoo-Quote-Aufrufe real über Supabase mit HTTP 200
- OAuth-Session-Bereinigung und anschließende Neuautorisierung erfolgreich
- unabhängiger Parqet-Connector-Crosscheck: 19 aktive Positionen, 62 Sub-1-EUR-Watchlist-Kandidaten, 690,13 EUR Cash im aktuellen Zustand
- Root URL `https://vbgatgh.github.io/hpos-app/` leitet auf den kanonischen `/app/`-Pfad statt auf die historische lokale PWA

## v9-RC-MVP Testmatrix

### T-001 – App Boot / valider State
Bezug: REQ-001, REQ-002, REQ-016, REQ-020
Prüfung: App starten und Home mit letztem validem Portfolio-State laden.
Erwartung: kein Absturz, kein Demo-/erfundener Real-State, verständlicher Datenstatus.
RC-Status: PASS auf kanonischem `app/` und nach Root-Entrypoint-Korrektur erneut beobachtet.

### T-002 – Parqet Refresh erfolgreich
Bezug: REQ-001, REQ-003, REQ-008
Prüfung: kontrollierte Portfolioaktualisierung gegen den freigegebenen Parqet-Pfad.
Erwartung: neuer State nur bei erfolgreicher valider Antwort; Erfolg sichtbar.
RC-Status: PASS auf canonical4 für den unveränderten realen Portfoliofall. False-Quarantine aus canonical3 behoben.

### T-003 – Parqet/Provider Refresh fehlerhaft
Bezug: REQ-003, REQ-020
Prüfung: Netzwerk-/Providerfehler simulieren bzw. reproduzierbar auslösen.
Erwartung: letzter valider State bleibt erhalten; Fehler wird nicht als Erfolg dargestellt.
Vorabnachweis: PASS aus realen Fehlerläufen vor canonical4.
RC-Status: OFFEN für gezielten aktuellen canonical Fehlerfall.

### T-004 – Portfolio / Instrument öffnen
Bezug: REQ-009, REQ-015
Prüfung: Portfolio öffnen, Position wählen, Investment-Akte öffnen.
Erwartung: korrekte Instrumentidentität und verfügbare Positionsdaten; Navigation stabil.
RC-Status: TEIL-PASS für Abbott; representative weitere Zeilen offen.

### T-005 – Suche per Name/Ticker
Bezug: REQ-004, REQ-005
Prüfung: Instrument über Name/Ticker suchen.
Erwartung: verifizierbares Ergebnis; kein freier Fantasie-Datensatz.
RC-Status: PASS für Abbott auf kanonischem `app/`.

### T-006 – gültige ISIN
Bezug: REQ-004, REQ-005
Prüfung: bekannte gültige 12-stellige ISIN eingeben.
Erwartung: exakte Verifikation und kanonische Instrumentidentität.
RC-Status: PASS. `US4781601046` wurde als Johnson & Johnson / JNJ exakt verifiziert; auf canonical7 erneut bestätigt.

### T-007 – ungültige ISIN
Bezug: REQ-005, REQ-020
Prüfung: syntaktisch/inhaltlich ungültige oder nicht auflösbare ISIN eingeben.
Erwartung: sicherer Fehler-/Nicht-verifiziert-Zustand; kein Watchlist-/Instrument-Autocreate.
RC-Status: PASS. `US4781601047` wurde wegen ungültiger Prüfziffer abgelehnt; kein Watchlist-Autocreate.

### T-008 – Watchlist hinzufügen/entfernen und Persistenz
Bezug: REQ-006
Prüfung: verifiziertes Nicht-Depot-Instrument hinzufügen, Seite neu laden, Persistenz im selben Browser prüfen und wieder entfernen.
Erwartung: Watchlist ändert sich und bleibt im selben Browser erhalten; Depotwert, Stückzahlen und Allokation bleiben unverändert.
RC-Status: PASS im definierten Single-Browser-Modell. Add-Persistenz und Remove-Persistenz wurden real geprüft; Add-Persistenz auf canonical7 nach Root-Routing-Fix nochmals bestätigt.

### T-009 – Investment-Akte Datenrollen
Bezug: REQ-009
Prüfung: Depotwert und Watchlistwert öffnen.
Erwartung: Position nur bei echtem Depotbestand; Markt-/Dividenden-/Evidenzdaten klar getrennt und nur bei Verfügbarkeit dargestellt.
Status: TEIL-PASS. Abbott deckt HOLDING-Seite ab; Johnson & Johnson deckt WATCHLIST-/Missing-Position-Daten ab. Weitere repräsentative Missing-Data-Fälle offen.

### T-010 – Broker-Workflow ohne Orderausführung
Bezug: REQ-019
Prüfung: BUY/SELL-Workflow aus Investment-Akte öffnen.
Erwartung: externe Ausführung in Scalable/Trade Republic; HPOS sendet keine Order.
Status: OFFEN. canonical6/7 enthält einen zusätzlichen expliziten Broker-Guard, Browsernachweis noch offen.

### T-011 – Broker → Parqet → HPOS Reconciliation
Bezug: REQ-001, REQ-003, REQ-019
Prüfung: nach einer extern bereits real ausgeführten bzw. kontrolliert nachstellbaren Änderung Parqet aktualisieren und HPOS refreshen.
Erwartung: Bestandsänderung wird erst nach Parqet-Reconciliation zum neuen HPOS-State.
Status: OFFEN für echte Bestandsänderung.

### T-012 – Decision Layer
Bezug: REQ-010
Prüfung: Analyse/Investment-Akte mit vorhandener und fehlender Evidenz.
Erwartung: Reihenfolge der Gates bleibt erhalten; fehlende Evidenz wird nicht erfunden; keine autonome Order.
Status: IMPLEMENTIERT / BROWSERTEST OFFEN auf canonical7. Hard-Gate-Reihenfolge wurde als `HALAL -> PORTFOLIO FIT -> THESIS -> FUNDAMENTALS -> VALUATION -> TIMING -> NEWS EVIDENCE -> EXECUTION` kodiert.

### T-013 – Halal-Evidenz
Bezug: REQ-011
Prüfung: Asset mit belegtem Status sowie unbekanntem/konfligierendem Status.
Erwartung: Quelle und Aktualitätsstand nachvollziehbar; Konflikt/UNKNOWN nicht als gesicherte Freigabe dargestellt.
Status: IMPLEMENTIERT / BROWSERTEST OFFEN für UNKNOWN-/Missing-Evidence-Fall. Belegter Status bleibt zusätzlich offen, solange keine reale Halal-Evidenzquelle integriert ist.

### T-014 – Income Monatsziel
Bezug: REQ-013, REQ-014
Prüfung: Income öffnen, Monatsziel ändern.
Erwartung: Ziel und Fortschritt sichtbar; Depot-/Ausschüttungsdaten bleiben unverändert.
Status: IMPLEMENTIERT / BROWSERTEST OFFEN. canonical6 verwendet aktuellen Monat aus validierten Ausschüttungen statt pauschaler Jahres-/12-Schätzung.

### T-015 – Dividenden ohne Scheindaten
Bezug: REQ-014
Prüfung: Instrument/Zeitraum mit fehlenden erwarteten/Forward-Daten.
Erwartung: nicht verfügbar statt erfundener Schätzung.
Status: IMPLEMENTIERT / BROWSERTEST OFFEN für aktuellen fehlenden-Daten-Fall.

### T-016 – Hauptnavigation + H-Home
Bezug: REQ-015, REQ-022
Prüfung: Home, Portfolio, Analyse, Income, Mehr durchlaufen; aus mehreren Views `H` drücken.
Erwartung: alle Bereiche erreichbar; `H` führt zuverlässig zu Home; State bleibt erhalten.
Status: TEIL-PASS. H-Home wurde real bestätigt; vollständiger Hauptbereich-Durchlauf offen.

### T-017 – Mehr / MVP-relevante Systempfade
Bezug: REQ-017
Prüfung: Mehr öffnen, MVP-relevanten Halal-/Daten-/Systempfad öffnen und zurückkehren.
Erwartung: Navigation funktioniert; optionale unfertige Module erzeugen keine falsche Vollständigkeitsbehauptung.
Status: OFFEN.

### T-018 – Kernvisualisierungen
Bezug: REQ-016, REQ-018
Prüfung: Home/Portfolio/Income mit verfügbaren und fehlenden Daten.
Erwartung: Charts/Progress basieren auf validen Daten; fehlende Daten werden nicht durch Demo-Werte ersetzt.
Status: TEIL-PASS für Home-Allokation und Watchlist-Trennung; Income-/Missing-Data-Fälle offen.

### T-019 – iPhone Browser / PWA
Bezug: REQ-022
Prüfung: definierte MVP-Kernflows auf iPhone im kanonischen Browser-/PWA-Kontext.
Erwartung: primäre Aktionen erreichbar, keine verdeckten Kernfunktionen, keine State-Verluste durch Navigation/Refresh.
Vorabbeobachtung: Safari-Start kann nach OAuth in Edge zurückkehren, wenn Edge der Standardbrowser ist; LocalStorage ist browserlokal. Der aktuelle MVP-Testkontext ist deshalb bewusst Edge auf iPhone.
RC-Status: TEIL-PASS für mehrere Kernflows in Edge; finaler definierter PWA-/Browser-Smoke offen.

### T-020 – Secret-/Privacy-Smoke
Bezug: REQ-002, REQ-021
Prüfung: aktueller produktiver Frontend-/Repository-Stand auf offen sichtbare Secrets/Tokens und reale Portfolio-Snapshots prüfen.
Erwartung: keine Secrets/Tokens oder realen Current-State-Daten öffentlich vorhanden.
Teilnachweis: Parqet Tokens werden ausschließlich serverseitig gespeichert; öffentliches Repo enthält nach bisheriger Prüfung keine eingecheckten OAuth-Tokens/privaten Current-State-Snapshots.
RC-Status: VOLLSTÄNDIGER FINALER SMOKE OFFEN.

## Release-Pass-Regel
Ein v9 RC darf erst als solcher markiert werden, wenn:
- alle MVP-MUST-Requirements auf Testfälle abgebildet sind,
- kritische Testfälle tatsächlich gegen den vorgesehenen Release-Build ausgeführt wurden,
- kein offener kritischer Fehler Datenintegrität, Privacy, Navigation oder Kernnutzung verletzt,
- Testergebnisse mit Build/Commit nachvollziehbar dokumentiert sind,
- das Final-Legacy-Cleanup nach erfolgreicher Regression durchgeführt und danach erneut gesmoked wurde.

## Bekannte historische QA-Assets
- zahlreiche `.github/workflows/hpos-alpha*.yml`
- Privacy-CI
- UX-CI
- Architecture-Workflow
- historische Alpha-Audits, Scopes und Testnotizen unter `docs/`

Diese Assets werden im Final-Cleanup in AKTUELL / WIEDERVERWENDBAR / HISTORISCH klassifiziert. Sie werden nicht automatisch als v9-Testnachweis übernommen.

## Nächster Testblock
1. canonical7 im kanonischen `/app/`-Pfad verwenden.
2. T-010 Broker-Dialog ohne Ausführung prüfen.
3. T-012 Decision Gates in Analyse und repräsentativer Investment-Akte prüfen.
4. T-013 Halal Register für UNKNOWN-/fehlende Evidenz prüfen.
5. T-014/T-015 Income, Monatsziel und fehlende Ausschüttungsdaten prüfen.
6. T-016/T-017 Hauptnavigation und Mehr-Systempfade in demselben Browserdurchlauf prüfen.
7. danach gezielter Providerfehler-/Rollback-Block T-003 und finaler Security-/Privacy-Block.

## Quellenbasis
- `docs/app-factory/02-anforderungen-akzeptanzkriterien/REQUIREMENTS_BASELINE.md`
- `docs/app-factory/03-ux-user-flows/UX_USER_FLOWS_BASELINE.md`
- `docs/app-factory/07-security-datenschutz/SECURITY_PRIVACY_BASELINE.md`
- `docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md`
- `docs/app-factory/09-deployment-betrieb/CANONICAL_ENTRYPOINT.md`
- Supabase Edge Function Logs vom 2026-09-01
- Browser-Screenshots/Tests vom 2026-09-01
- Parqet Connector Crosscheck vom 2026-09-01
- historische QA-/CI-Assets des Repositorys

## Gate-Hinweis
Es wird ausdrücklich **noch kein v9-RC-QA-PASS behauptet**. Der kanonische Basis-Sync sowie ISIN-/Watchlist-Kernfälle sind bestanden, weitere MVP-Testfälle und das Final-Cleanup bleiben offen.