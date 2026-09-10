# HPOS App – Projektstatus & Decision Log

Stand: 2026-09-02

> Zentrale Steuerungsakte für HPOS nach der App Factory. Nur tatsächlich belegte Zustände werden als abgeschlossen dokumentiert. Nicht durchgeführte Tests oder Gates gelten nicht als bestanden.

## 1. Projekt

**Anwendung:** HPOS App – Halal Portfolio Optimization System / Portfolio Intelligence

**Aktiver Produktpfad:** `app/`

**Releaseziel:** `v9 RC = MVP`

**Repository:** `vbgATgh/hpos-app`

**Frontend:** `https://vbgatgh.github.io/hpos-app/app/`

**Private Integrationsschicht:** Supabase Edge Function `hpos-api`

**Supabase Project Ref:** `moxyhjfbrmsnphikxqje`

**Function Base:** `https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api`

**Parqet Callback:** `https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api/auth/parqet/callback`

## 2. Produkt- und Datenprinzipien

- Parqet ist der kanonische Depot-Master bzw. die Reconciliation-Quelle.
- Scalable Capital und Trade Republic sind ausschließlich Orte der tatsächlichen Orderausführung.
- HPOS führt keine Broker-Orders aus.
- Marktdaten dürfen Depotbestände nicht verändern.
- Eine verifizierte ISIN ist der kanonische Instrumentenschlüssel.
- Externe Providerfehler dürfen einen zuletzt validierten State nicht unkontrolliert überschreiben.
- Keine Secrets, OAuth-Tokens oder realen privaten Portfolio-Snapshots im öffentlichen Repository.
- GitHub Pages bleibt zunächst das statische Frontend.

## 3. Aktueller Projektstatus

**Status:** IN DEVELOPMENT

**Phase:** Kanonischer Produktpfad `app/` ist im realen Browser nachgewiesen. Parqet-Live-Sync, Search/ISIN, Quotes, Watchlist-Persistenz, Investment-Akte, Decision Layer, Income-Grundlogik, Halal-UNKNOWN-Verhalten, Broker-Guard und Hauptnavigation wurden real geprüft. Der serverseitige GitHub-Cleanup des früheren sensiblen Snapshot-Commits wurde von GitHub Support durchgeführt und die alte SHA liefert anschließend keinen Commit mehr. Offen sind gezielter Providerfehler/Fallback-Nachweis, verbleibende System-/Diagnosepfade, Safari/PWA-Primärfluss sowie anschließendes Legacy-Cleanup und v9-RC-Regression.

**Letztes formal abgeschlossenes App-Factory-Gate:** keines nachgewiesen

**Gate-Regel:** Entwicklungsfortschritt wird nicht rückwirkend als bestanden bezeichnet. Ein Gate gilt erst nach tatsächlicher Prüfung und dokumentierter Freigabe als bestanden.

## 4. Architekturstatus

### Aktiv / Zielarchitektur
- GitHub Pages: statisches Frontend
- Supabase: private Integrationsschicht und Market-Proxy
- Edge Function: `hpos-api`
- serverseitiger OAuth-State-/Session-Store in Supabase
- Browser erhält nur eine opake HPOS-Session-ID als Bearer-Wert
- Parqet Access-/Refresh-Tokens bleiben ausschließlich serverseitig
- `app/parqet-supabase-adapter.js` steuert den Parqet-Frontend-Pfad und schützt den letzten validierten State
- `app/quote-policy.js` routet historische Quote-/Search-Requestformen auf Supabase um
- `app/runtime-config.js` enthält im aktiven Zielrouting keinen Cloudflare-Host mehr
- OAuth-Callback der Edge Function führt ab Version 17 auf den kanonischen Pfad `https://vbgatgh.github.io/hpos-app/app/`

### Legacy
- bestehender Cloudflare Worker / alte Cloudflare-Architektur
- Repository-Pfad `backend/hpos-api/`
- historische UI-/Alpha-Pfade außerhalb `app/`
- temporärer `app/live.html`-Testpfad

Legacy darf nicht erweitert werden. Parqet, Search und Quotes sind funktional über Supabase nachgewiesen. Ausführbare Legacy-Artefakte werden erst im verbindlichen Final-Cleanup-Gate nach erfolgreicher Regression entfernt.

## 5. Supabase / Parqet – tatsächlich verifizierter Stand

Tatsächlich durchgeführt und nachgewiesen:

- Supabase-Projekt `moxyhjfbrmsnphikxqje`: aktiv und erreichbar.
- Edge Function `hpos-api`: `ACTIVE`, aktuell deployte Version `17`.
- `verify_jwt: false` bleibt bewusst aktiv, da OAuth-Start/-Callback öffentlich erreichbar sein müssen; geschützte Parqet-API-Pfade prüfen eigene HPOS-Session und Origin.
- `PARQET_CLIENT_ID` wurde in Supabase als Custom Secret angelegt.
- Private Parqet-Integration `HPOS` wurde mit Scope `portfolio:read` und der festgelegten Supabase-Callback-URL angelegt.
- OAuth Authorization Code Flow mit PKCE S256 wurde real autorisiert.
- Callback, Code-Austausch und serverseitige Speicherung von Access- und Refresh-Token wurden nachgewiesen.
- Ein bereits abgelaufener Access Token wurde im E2E-Test real über den Refresh Token erneuert.
- Parqet Portfolio-/Holdings-/Performance-Daten konnten erfolgreich abgefragt werden.
- Die serverseitige Normalisierung wurde real geprüft und lieferte 19 aktive Wertpapierpositionen, 246,73 EUR Cash, 17 Scalable und 2 Trade Republic.
- Der produktive Browserlauf am 2026-09-01 zeigte `PARQET LIVE SYNC`, 19 Positionen, Cash 246,73 EUR und einen aktuellen Bestandszeitpunkt.
- Der alte Fallback-Zeitpunkt 30.08., 00:34 wurde im erfolgreichen Live-Sync nicht mehr als aktueller Bestand angezeigt.
- Nach Session-Bereinigung wurde ein neuer OAuth-Lauf real durchgeführt; `/api/parqet/normalized` antwortete dabei serverseitig mit HTTP 200.
- Search nach Abbott wurde real über Supabase ausgeführt und lieferte den ISIN-verifizierten Treffer Abbott Laboratories `US0028241000` / `ABT`.
- Yahoo-Quote-Aufrufe wurden im selben Browserlauf real über Supabase mit HTTP 200 nachgewiesen.
- Der aktuell deployte `hpos-api`-Stand wurde ins öffentliche Repository synchronisiert; keine Tokens oder privaten Portfolio-Snapshots wurden eingecheckt.

### Reconciliation und fachliche Normalisierung
Verbindliche Regel:
- verkaufte Holdings zählen nicht zum aktuellen Depotbestand
- Cash wird separat geführt
- offene Wertpapier-Holdings mit aktuellem Positionswert >= 1,00 EUR zählen als aktive Depotposition
- offene Wertpapier-Holdings mit aktuellem Positionswert < 1,00 EUR sind Watchlist-Kandidaten und zählen nicht als aktive Depotposition
- Watchlist-Kandidaten werden nicht automatisch in die lokale Watchlist aufgenommen

Ergebnis des bislang verifizierten Bestands:
- 19 aktive Wertpapierpositionen plus Cash
- 17 aktive Positionen bei Scalable Capital
- 2 aktive Positionen bei Trade Republic
- Trade Republic: Cardinal Energy, ISIN `CA14150G4007`
- Trade Republic: Savaria, ISIN `CA8051121090`
- alle übrigen aktiven Wertpapierpositionen: Scalable Capital

Wichtig: Die Produktion darf nicht dauerhaft auf exakt 19 Positionen oder exakt 246,73 EUR Cash fest verdrahtet sein. Mit Edge Function Version 17 und dem aktualisierten Adapter wurden diese Testassertionen durch strukturelle Plausibilitätsprüfungen ersetzt, damit reale Käufe/Verkäufe und Cash-Änderungen künftig nicht fälschlich als Providerfehler blockiert werden. Dieser neue flexible Pfad ist implementiert und im kanonischen Browserpfad für den unveränderten Bestandsfall regressionsgeprüft.

Die Brokerzuordnung ist Workflow-/Darstellungsmetadatum und verändert den von Parqet gelieferten Bestand nicht.

## 6. Parqet-Zielkonfiguration

**OAuth Flow:** Authorization Code + PKCE S256

**Scope:** `portfolio:read`

**Redirect URI:**
`https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api/auth/parqet/callback`

**Supabase Variable:** `PARQET_CLIENT_ID`

Ein `PARQET_CLIENT_SECRET` wird nicht erfunden und ist für den implementierten PKCE-Entwurf nicht erforderlich.

## 7. Offene Punkte / Blocker

### OPEN-001 – Parqet OAuth / Refresh / Basis-E2E
**Status:** ERLEDIGT / PASS 2026-08-31

Nachgewiesen: OAuth, serverseitige Session, Token-Refresh und Parqet-Lesezugriff.

### OPEN-002 – Holdings-Normalisierung / Reconciliation
**Status:** ERLEDIGT / PASS 2026-09-01

Die Normalisierung ist über Positionswert, Cash/Sold-Status und die bestätigte Brokerzuordnung deterministisch festgelegt und serverseitig real geprüft. Starre Assertions auf den damaligen Ist-Bestand wurden am 2026-09-01 für den produktiven Pfad entfernt.

### OPEN-003 – Frontend-Umschaltung Parqet
**Status:** ERLEDIGT / PASS 2026-09-01

Produktiver Browserlauf nachgewiesen: `PARQET LIVE SYNC`, 19 aktive Positionen, plausibler aktueller Cashwert und aktueller Bestandszeitpunkt.

### OPEN-004 – Search/ISIN und Quotes migrieren
**Status:** ERLEDIGT / PASS 2026-09-01

Browser- und Serverlog-Nachweis liegen vor. Search und Yahoo-Quotes liefen über Supabase `hpos-api` mit HTTP 200; Abbott wurde auf `US0028241000` / `ABT` ISIN-verifiziert. `runtime-config.js` enthält keinen aktiven Cloudflare-Zielhost mehr.

### OPEN-005 – QA / Regression / Security / Rollback
**Kritikalität:** HOCH

Kanonischer Pfad und wesentliche MVP-Funktionen sind browserseitig nachgewiesen. Gezielt provozierter Providerfehler, verbleibende Diagnosepfade, Safari/PWA und Final-Cleanup-Regressionsnachweis bleiben offen.

**Status:** TEILWEISE OFFEN

### OPEN-006 – Kanonischen Produktpfad nach Promotion prüfen
**Kritikalität:** HOCH

Der kanonische Einstieg und die Kernflüsse wurden im Browser geprüft, einschließlich Root-Redirect auf `/app/`, Parqet-Sync, Search/ISIN und Watchlist-Persistenz.

**Status:** ERLEDIGT / PASS 2026-09-01

### OPEN-007 – GitHub serverseitiger Cleanup sensibler Alt-Historie
**Kritikalität:** KRITISCH VOR RC-FREIGABE

GitHub Support-Ticket `#4720320` wurde am 2026-09-02 bearbeitet. GitHub Support bestätigte, dass Garbage Collection durchgeführt und der Repository-Cache geleert wurde, da keine Referenzen auf die angegebene alte Commit-SHA mehr bestanden. Unmittelbare Nachprüfung über die GitHub-API ergab für `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af`: `No commit found for SHA` (HTTP 422).

**Status:** ERLEDIGT / PASS 2026-09-02

## 8. Decision Log

### DEC-001 – `app/` ist kanonischer Produktpfad
**Datum:** 2026-08-30
**Status:** AKTIV

Neue Produktivarbeit erfolgt im Pfad `app/`. Historische UI-/Alpha-Pfade sind Legacy.

### DEC-002 – Parqet ist kanonischer Depot-Master
**Datum:** bestätigt 2026-08-31
**Status:** AKTIV

Parqet ist die kanonische Quelle für Depotbestand und Reconciliation. Marktdaten verändern Bestände nicht.

### DEC-003 – Keine Broker-Orders aus HPOS
**Status:** AKTIV

Reale BUY/SELL-Ausführung erfolgt ausschließlich bei Scalable Capital bzw. Trade Republic.

### DEC-004 – Verifizierte ISIN ist kanonischer Instrumentenschlüssel
**Datum:** 2026-08-30
**Status:** AKTIV

Name/Ticker dienen der Suche; nach Verifikation ist die ISIN kanonisch.

### DEC-005 – Privater Current State
**Datum:** 2026-08-31
**Status:** AKTIV

Keine realen Portfolio-Snapshots im öffentlichen Repository.

### DEC-006 – Validierter State hat Vorrang vor fehlerhaften Providerantworten
**Status:** AKTIV

Providerfehler oder unplausible Antworten überschreiben den letzten validen State nicht unkontrolliert.

### DEC-007 – Keine erfundenen APIs oder Datenquellen
**Datum:** 2026-08-31
**Status:** AKTIV

Integration erst nach verifiziertem Vertrag, Authentifizierung, Datenfeldern und Fehlerverhalten.

### DEC-008 – Private Integrationsschicht getrennt vom Legacy-Worker
**Datum:** 2026-08-31
**Status:** AKTIV

GitHub Pages bleibt Frontend; private Providerzugriffe laufen über `hpos-api`. Legacy wird nicht erweitert.

### DEC-009 – App-Factory-Konsolidierung vor Feature-Ausbau
**Datum:** 2026-08-31
**Status:** WEITGEHEND ERFÜLLT

Single Source of Truth und Projektgrundlagen wurden vor weiterer MVP-Implementierung konsolidiert.

### DEC-010 – `v9 RC = MVP`
**Datum:** 2026-08-31
**Status:** AKTIV

MVP-Kern: Home, Portfolio/Parqet, Suche/ISIN, Watchlist, Investment-Akte, Income/Monatsziel, Analyse/Decision Layer, Halal-Evidenz, stabile Navigation sowie Daten-/Fehlerstatus.

### DEC-011 – Supabase ist Zielplattform für `hpos-api`
**Datum:** 2026-08-31
**Status:** AKTIV

Supabase Edge Functions sind die Zielplattform für die neue private Integrationsschicht.

`docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md` ersetzt `docs/ADR-001_PRIVATE_INTEGRATION_LAYER.md` hinsichtlich der Backendplattform.

Cloudflare bleibt Legacy und wird erst entfernt, wenn keine aktive HPOS-Funktion mehr davon abhängt.

### DEC-012 – Parqet Basis-E2E ist bestanden
**Datum:** 2026-08-31
**Status:** AKTIV

Der reale Parqet OAuth-, Refresh- und Lesezugriff über Supabase ist technisch funktionsfähig.

### DEC-013 – Aktive Positionen, Watchlist-Kandidaten und Brokerzuordnung
**Datum:** 2026-08-31
**Status:** AKTIV

Für den bislang verifizierten persönlichen HPOS-Bestand gilt:
- offene Wertpapierposition mit aktuellem Positionswert >= 1,00 EUR = aktive Depotposition
- offene Wertpapierposition mit aktuellem Positionswert < 1,00 EUR = Watchlist-Kandidat, nicht aktive Depotposition
- Cash separat
- Sold Holdings nur Historie
- Cardinal Energy (`CA14150G4007`) und Savaria (`CA8051121090`) = Trade Republic
- alle übrigen aktiven Depotpositionen = Scalable Capital

Diese Entscheidung klassifiziert die von Parqet gelieferten Holdings für HPOS, verändert aber niemals den Parqet-Bestand selbst.

### DEC-014 – Search und Quotes werden über Supabase konsolidiert
**Datum:** 2026-09-01
**Status:** AKTIV / PASS NACHGEWIESEN

Search und Yahoo-Quotes hängen funktional nicht mehr vom Cloudflare-Legacy-Worker ab. Supabase `hpos-api` stellt den Origin- und Input-validierten Market-Proxy bereit. Browserlauf und Supabase-Logs haben reale Search-/Quote-Requests mit HTTP 200 nachgewiesen.

### DEC-015 – Kanonischer OAuth-Rücksprung auf `app/`
**Datum:** 2026-09-01
**Status:** AKTIV / PASS NACHGEWIESEN

Temporäre `liveN`-Redirects dürfen nicht Teil des finalen Produkts bleiben. Edge Function Version 17 verwendet `https://vbgatgh.github.io/hpos-app/app/` als Frontend-Rücksprung nach erfolgreichem Parqet-OAuth. Der kanonische Produktpfad und Root-Redirect wurden im Browser erfolgreich nachgewiesen.

## 9. ADR-Status

### `docs/ADR-001_PRIVATE_INTEGRATION_LAYER.md`
**Status:** SUPERSEDED

Historische Cloudflare-Zielentscheidung. Nicht löschen. Nicht als aktuelle Zielarchitektur verwenden.

### `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
**Status:** ACCEPTED / AKTIV

Aktuelle Zielentscheidung für die private Integrationsschicht.

## 10. Risiken

### RISK-001 – Legacy-/Current-State-Vermischung
**Auswirkung:** HOCH
**Status:** STARK REDUZIERT. Parqet, Search und Quotes sind über Supabase nachgewiesen. Compatibility-Shims und ausführbare Legacy-Artefakte bleiben bis zum Final-Cleanup-Gate kontrolliert bestehen.

### RISK-002 – Rohe Parqet-Holdings als UI-Positionen interpretieren
**Auswirkung:** HOCH
**Status:** REDUZIERT / KONTROLLIERT durch DEC-013, serverseitige Normalisierung und erfolgreichen Browserlauf.

### RISK-003 – Externe Providerabhängigkeiten
**Auswirkung:** HOCH
**Status:** REDUZIERT durch validierten State, Fallback und Providertrennung, aber weiterhin aktiv.

### RISK-004 – Privacy/Secrets bei öffentlichem Frontend/Repo
**Auswirkung:** KRITISCH
**Status:** RESOLVED / PASS 2026-09-02

Parqet OAuth-Tokens bleiben serverseitig. Die opake HPOS-Session-ID ist der einzige Browser-Bearer. Der aktuelle `main`-Stand enthält keinen realen Portfolio-Snapshot. Die erreichbare Branch-Historie wurde bereinigt. GitHub Support bestätigte am 2026-09-02 für Ticket `#4720320`, dass Garbage Collection durchgeführt und der Repository-Cache geleert wurde. Die alte sensible Commit-SHA `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af` wurde anschließend unabhängig über GitHub geprüft und ist nicht mehr als Commit abrufbar (`No commit found for SHA`, HTTP 422).

### RISK-005 – Browser-lokaler Zustand
**Auswirkung:** MITTEL
**Status:** AKTIV

HPOS-Session, Watchlist und weitere lokale Einstellungen liegen im Browser-LocalStorage und sind daher zwischen Safari, Edge und PWA-Kontexten nicht automatisch identisch. Auf iOS kann ein OAuth-Rücksprung im eingestellten Standardbrowser landen. Für den MVP wird kein zusätzlicher Cross-Browser-Sync-Dienst eingeführt. Der kanonische Nutzungskontext muss im Regressionstest eindeutig geprüft und dokumentiert werden.

## 11. Technische Schulden

### DEBT-001 – Legacy-Worker-Kompatibilität im aktiven JS
**Priorität:** HOCH VOR GO-LIVE

`app.js`, `quote-policy.js` und `parqet-supabase-adapter.js` können noch historische Requestformen bzw. Legacy-Host-Matches enthalten. Aktive Zielrequests werden bereits auf Supabase geführt. Die Compatibility-Schicht wird erst nach bestandenem kanonischem Regressionstest im Final-Cleanup-Gate entfernt, damit kein notwendiger Rollback voreilig zerstört wird.

### DEBT-002 – Historische Repository-Struktur
**Priorität:** MITTEL

Historische UI-/Alpha-Pfade werden vor Go-live nach `FINAL_LEGACY_CLEANUP_GATE.md` geprüft und, soweit nicht mehr benötigt, entfernt oder technisch neutralisiert. ADR-/Audit-Historie bleibt erhalten.

### DEBT-003 – Alter Cloudflare-Backendentwurf
**Priorität:** HOCH VOR GO-LIVE

`backend/hpos-api/` ist keine Zielimplementierung. Entfernung/Archivierung erfolgt nach belegter Nichtnutzung gemäß Final-Cleanup-Gate.

### DEBT-004 – Temporärer `live.html`-Pfad
**Priorität:** MITTEL

`app/live.html` bleibt nur bis zum erfolgreichen kanonischen `app/`-Regressionstest als Vergleichs-/Rollback-Artefakt bestehen. Danach im Final-Cleanup-Gate entfernen oder archivieren.

## 12. Nächste Ausführungsreihenfolge

1. gezielten, reversiblen Providerfehler-Test gegen den aktuellen kanonischen Build durchführen und belegen, dass der letzte validierte Portfolio-State unverändert erhalten bleibt (T-003).
2. verbleibende `Mehr`-/Datenquellen-/Diagnosepfade prüfen und T-017 abschließen.
3. repräsentative Kernvisualisierungen und Portfolio-Navigation ergänzend regressionsprüfen (T-004/T-018).
4. iPhone Safari/PWA-Primärfluss prüfen und den kanonischen Browser-/PWA-Nutzungskontext dokumentieren (T-019).
5. verbindliches Final-Cleanup-Gate durchführen: historische `live.html`-/Alpha-/Cloudflare-Artefakte und nicht mehr benötigte Compatibility-Shims entfernen oder technisch neutralisieren.
6. vollständigen v9-RC-Regressionstest auf dem bereinigten Stand durchführen.
7. erst danach `v9 RC = MVP` freigeben.

## 13. Maßgebliche Projektquellen

- `docs/app-factory/01-produktdefinition/PRODUCT_DEFINITION.md`
- `docs/app-factory/02-anforderungen-akzeptanzkriterien/REQUIREMENTS_BASELINE.md`
- `docs/app-factory/03-ux-user-flows/UX_USER_FLOWS_BASELINE.md`
- `docs/app-factory/04-ui-design-system/UI_DESIGN_BASELINE.md`
- `docs/app-factory/05-architektur-datenmodell/ARCHITECTURE_DATA_BASELINE.md`
- `docs/app-factory/06-apis-integrationen/API_INTEGRATION_BASELINE.md`
- `docs/app-factory/07-security-datenschutz/SECURITY_PRIVACY_BASELINE.md`
- `docs/app-factory/08-qa-tests/QA_BASELINE.md`
- `docs/app-factory/09-deployment-betrieb/DEPLOYMENT_OPERATIONS_BASELINE.md`
- `docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md`
- `docs/app-factory/10-release-roadmap/RELEASE_ROADMAP_BASELINE.md`
- `docs/ADR-001_PRIVATE_INTEGRATION_LAYER.md`
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- `supabase/functions/hpos-api/index.ts`
- `supabase/migrations/`
- `app/parqet-supabase-adapter.js`
- `app/quote-policy.js`
- `app/runtime-config.js`
- `config/hpos_constitution.json`
- `config/current_state.schema.json`
- `data/thesis_registry.json`

## 14. Aktuelle QA-/Security-Evidenz 2026-09-02

Nach realen Browserprüfungen und serverseitiger Security-Nachprüfung dokumentiert:
- T-001 App Boot / validierter State: PASS
- T-002 Parqet Refresh/Reconciliation für unveränderten Bestand: PASS
- T-005 Search Name/Ticker: PASS
- T-006 exakte gültige ISIN: PASS
- T-007 ungültige ISIN: PASS
- T-008 Watchlist Add/Remove/Persistenz: PASS
- T-009 Datenrollentrennung HOLDING/WATCHLIST: PASS
- T-010 Broker-Workflow ohne HPOS-Orderausführung: PASS
- T-012 Decision Layer bei fehlender Halal-Evidenz: PASS
- T-013 Halal UNKNOWN/fehlende Evidenz: PASS
- T-014 Monats-Ist vs. Monatsziel: PASS
- T-015 keine erfundenen Dividendenschätzungen: PASS
- T-016 Hauptnavigation/H→Home: PASS
- T-017 `Mehr -> Halal Register`: PARTIAL PASS
- T-020 Privacy-Smoke: PASS. GitHub Support `#4720320` führte Garbage Collection/Cache-Cleanup durch; die alte sensible Commit-SHA ist anschließend nicht mehr abrufbar.

Die vollständigen Ausführungsdetails stehen in `docs/app-factory/08-qa-tests/QA_EXECUTION_2026-09-01.md`.

## 15. Aktualisierungsregel

Dieses Dokument wird bei Änderungen an Status, Gate, Architektur, Entscheidung, Blocker, Risiko, Scope, Release oder wesentlicher Implementierung aktualisiert. Wesentliche Projektinformationen dürfen nicht ausschließlich im Chat verbleiben.


## 16. Statusergänzung 2026-09-06 – v8.7.35 Halal-Pipeline

**Entscheidung DEC-016 – Gate-1-Evidenz ist priorisiert und degradationsgeschützt**

- Exakte ISIN bleibt die kanonische Identität.
- Quellenpriorität: `CURATED_ISIN` vor `HPOS_AAOIFI` vor `FREE_PROVIDER`; manuelle Evidenz bleibt die letzte Instanz.
- Fehlende Daten ergeben ausschließlich `OPEN_REVIEW`.
- Ein automatischer `OPEN_REVIEW`-Lauf darf eine frische entscheidende `PASS`-/`FAIL`-Evidenz nicht überschreiben.
- Kuratierte Exact-ISIN-Evidenz darf von keinem automatischen Lauf überschrieben werden.
- Der externe Fallback darf nur bei offenem oder abgelaufenem internen Resultat laufen und nur einen expliziten AAOIFI-Befund übernehmen.
- Kostenpflichtige Providerpläne bleiben blockiert.
- Die bestehende Parqet-Bestands-, Rollback-, Validierungs- und Quarantänearchitektur bleibt unverändert.

**Implementierungsstand**

- Supabase `hpos-api` v24 / Service `0.5.3` aktiv.
- Frontendzielstand v8.7.35.
- Migration `backfill_confirmed_halal_evidence` übernimmt die bereits bestätigten Gate-1-Stände von `IE00B27YCN58` und `DK0062498333` in den kanonischen Backend-Store.
- Halal Terminal Free ist weiterhin nicht verbunden; der reale Providerlauf bleibt bis zur serverseitigen Konfiguration von `HALAL_TERMINAL_API_KEY` offen.
- Ausführliche Evidenz: `docs/STATUS_2026-09-06_HALAL_PIPELINE_HARDENING.md`.

## 17. Statusergänzung 2026-09-07 – accountfreie Halal-Pipeline v8.7.36

**Entscheidung DEC-017 – Keine zusätzlichen Accounts für Halal-Prüfdienste**

- Für HPOS werden keine weiteren Nutzerkonten, API-Accounts oder API-Keys bei Halal-Prüfdiensten angelegt.
- Der zuvor vorgesehene Halal-Terminal-Free-Pfad ist vollständig aus dem aktiven Frontend- und Backend-Laufzeitpfad entfernt.
- Die verbindliche Gate-1-Reihenfolge lautet: `CURATED_ISIN` vor `HPOS_AAOIFI` vor manuell bestätigter Evidenz.
- Fehlende oder unvollständige Daten bleiben ausschließlich `OPEN_REVIEW` beziehungsweise `PRÜFUNG OFFEN`.
- Es erfolgt keine automatische negative Einstufung nur wegen fehlender Evidenz.
- Historische Provider-Evidenz wird nicht stillschweigend gelöscht; es werden jedoch keine neuen `FREE_PROVIDER`-Datensätze mehr erzeugt.
- Die Parqet-, Marktpreis-, Rollback-, Validierungs- und Quarantänelogik bleibt unverändert.

**Implementierungsstand**

- Frontendstand: v8.7.36, produktiv über GitHub Pages verifiziert.
- Supabase `hpos-api` v25 / Service `0.5.4`, Modus `ACCOUNT_FREE`, produktiv verifiziert.
- Entfernt: `/api/halal/provider/status`, `/api/halal/screen`, `HALAL_TERMINAL_API_KEY`-Auswertung und `app/halal-provider.js`.
- Halal Register und Detailansicht erklären den accountfreien Modus und fordern keine Provider-Verbindung mehr an.
- Aktive Regressionstests sichern das Fehlen der kontobasierten Providerpfade ab.
- Pull Request #42 wurde nach erfolgreicher `HPOS Current App CI` als Squash-Commit nach `main` übernommen.
- Produktive Prüfungen: Health HTTP 200, entfernte Providerroute HTTP 404, Evidenz ohne Sitzung HTTP 401.
- Ausführliche Evidenz: `docs/STATUS_2026-09-07_ACCOUNT_FREE_HALAL.md`.

## 18. Statusergänzung 2026-09-08 – transparentes Halal-Prüfergebnis v8.7.37

**Entscheidung DEC-018 – Ein Prüflauf muss seinen tatsächlichen Ausgang sichtbar machen**

- Der bisherige Button führte die accountfreie AAOIFI-Prüfung aus, meldete jedoch weder Abschluss noch Ergebnis. Bei unveränderten Quelldaten entstand dadurch der falsche Eindruck, dass keine Aktion stattgefunden habe.
- Der manuell ausgelöste Lauf zeigt künftig Uhrzeit, Anzahl neu geprüfter Werte, Statusänderungen, PASS-/FAIL-/OFFEN-Summen, technische Fehler und die Zahl offener Fälle mit fehlenden AAOIFI-Pflichtdaten.
- Die Schaltfläche heißt präziser `Prüfung erneut ausführen`; sie verspricht keine Statusänderung.
- Offene Registerzeilen zeigen verfügbare Informationen zum Datenmangel statt der pauschalen Bezeichnung `Kanonische Evidenz`.
- Fehlende Daten bleiben `OPEN_REVIEW`. Der UX-Fix erzeugt keine neue Halal-Einstufung und lockert keine Evidenzanforderung.
- Parqet-, Depot-, Rollback-, Validierungs- und Quarantänelogik bleiben unverändert.

**Implementierungsstand**

- Frontendstand: v8.7.37, produktiv über GitHub Pages verifiziert.
- `HPOS_HALAL_AUTOSCREEN.batch` liefert eine strukturierte Laufzusammenfassung.
- Offene AAOIFI-Ergebnisse führen ihre fehlenden Kriterien explizit mit.
- 16 aktive Halal-, OAuth- und Parqet-Schutztests sowie die JavaScript-Syntaxprüfung sind lokal bestanden.
- Pull Request #44 wurde nach erfolgreicher `HPOS Current App CI` als Squash-Commit nach `main` übernommen.
- GitHub Pages liefert v8.7.37 mit Cache-Key `20260908-halalrefresh1`; die ausgelieferten Halal-Skripte bestehen den Syntaxcheck.
- Offen ist ausschließlich der Gerätetest des sichtbaren Laufberichts.
- Ausführliche Evidenz: `docs/STATUS_2026-09-08_HALAL_REFRESH_FEEDBACK.md`.

## 19. Statusergänzung 2026-09-09 – quellengebundene Geschäftsberichtsdaten v8.7.38

**Entscheidung DEC-019 – Offizielle Berichte statt nicht erreichbarer oder kontobasierter APIs**

- FMP, Finnhub, SimFin und andere Dienste mit Registrierung oder API-Key werden nicht in HPOS aufgenommen.
- SEC EDGAR Companyfacts ist grundsätzlich kostenlos und keyfrei, wird aber von den HPOS-Laufumgebungen GitHub Actions und Supabase Edge Functions aktuell mit HTTP 403 blockiert. Dieser Pfad wird nicht als produktionsfähig behauptet.
- Die zwischenzeitlich getestete SEC-Erweiterung der Edge Function wurde nach dem negativen Live-Test sofort wieder entfernt; `hpos-profile` v9 entspricht wieder dem vorherigen Laufzeitverhalten.
- Verbindliche automatische oder manuelle Rohkennzahlen werden stattdessen ISIN-zentriert aus offiziellen Geschäftsberichten beziehungsweise Emittentenquellen kuratiert.
- Jeder übernommene Wert benötigt Zahlenwert, Berichtszeitraum und konkrete Quellen-URL. Fehlt eines davon, bleibt das Kriterium offen.
- Die Berechnung `Monatskurs × aktuelle Aktienanzahl` wird ausdrücklich als Approximation bezeichnet. Ein einzelner Kurs von vor 36 Monaten ist kein 36-Monats-Durchschnitt.
- Cash und kurzfristige Anlagen gelten nur als konservative Obergrenze für zinstragende Vermögenswerte, nicht als exakte Gleichsetzung.
- Mehrdeutige Netto-Zinspositionen oder bloße Aggregatorwerte bleiben fehlend und damit `OPEN_REVIEW`.
- Keine Portfolio-, Broker-, Stückzahl-, Einstands- oder Steuerdaten werden an die öffentliche Fundamentaldatenfunktion übertragen.

**Implementierungsstand**

- Frontendstand v8.7.38, produktiv über GitHub Pages verifiziert.
- `hpos-profile` wird erstmals vollständig im Repository versioniert.
- `data/halal_financial_evidence.json` bildet den leeren, fail-closed startenden Rohkennzahlenspeicher.
- Datenschutz-, Quellenpflicht- und Fail-closed-Verträge sind durch neue Regressionstests abgesichert.
- Pull Request #46 wurde nach erfolgreicher `HPOS Current App CI` als Squash-Commit nach `main` übernommen.
- Der leere Rohkennzahlenspeicher wird produktiv mit den festgelegten Account-, Quellen- und Fail-closed-Regeln ausgeliefert. Keine Halal-Einstufung wurde dadurch verändert.
- Als nächstes beginnt die belegbasierte Befüllung je offenem Wert.
- Ausführliche Evidenz: `docs/STATUS_2026-09-09_ACCOUNT_FREE_SEC_HALAL.md`.

## 20. Statusergänzung 2026-09-09 – sichtbarer Evidenzfortschritt v8.7.39

**Entscheidung DEC-020 – Teilabdeckung wird sichtbar, bleibt aber nicht entscheidend**

- Ein technisch ausgeführter Halal-Prüflauf muss neben unveränderten Statussummen auch den belegten Datenfortschritt anzeigen.
- Register und Detailansicht zeigen je Instrument die Anzahl offiziell belegter Finanzkennzahlen von fünf.
- Offizielle Quellen sind aus der Detailansicht erreichbar und werden bis in die einzelnen AAOIFI-Kriterien als `OFFICIAL_REPORT_CURATED` fortgeführt.
- Das erste Berichtsdatenpaket umfasst Abbott, McCormick, Medtronic, Merck und Waste Management mit insgesamt 17 belegten Rohkennzahlen.
- Mehrdeutige leasinghaltige Schuldenwerte und nicht separat ausgewiesene Zinserträge werden nicht übernommen.
- Der 36-Monats-Durchschnitt des Marktwerts bleibt für alle fünf Instrumente offen. Deshalb erzeugt die Teilabdeckung keine neue `PASS`-/`FAIL`-Einstufung.
- Parqet-, Depot-, Rollback-, Validierungs- und Quarantänelogik bleiben unverändert.

**Implementierungsziel**

- Frontendstand v8.7.39.
- Rohkennzahlen in `data/halal_financial_evidence.json` mit Zeitraum, Einheit und offizieller Quellen-URL.
- Laufbericht mit Anzahl erkannter Berichtsdaten und belegter Kennzahlen.
- Ausführliche Evidenz: `docs/STATUS_2026-09-09_HALAL_REPORT_BATCH_1.md`.

## 21. Statusergänzung 2026-09-10 – stabiler Halal-Laufstatus v8.7.40

**Entscheidung DEC-021 – Zwischenereignisse dürfen einen laufenden Prüfvorgang nicht optisch beenden**

- Der manuelle Sammellauf besitzt einen persistenten Laufzustand außerhalb des neu gerenderten Halal-Register-DOM.
- Schaltfläche und Laufbericht zeigen während der gesamten Verarbeitung `x/y`; parallele Doppelstarts sind gesperrt.
- Erst nach Abschluss aller Kandidaten wird der finale Ergebnisbericht angezeigt.
- Der Prescreen-Cache wird auf v4 angehoben, damit die mit v8.7.39 eingeführten offiziellen Berichtsdaten unabhängig von älteren lokalen Cache-Einträgen ausgewertet werden.
- Halal-Entscheidungslogik, Supabase, Parqet und Portfolio-Schutz bleiben unverändert.
- Ausführliche Evidenz: `docs/HOTFIX_2026-09-10_HALAL_RUN_STATE.md`.

## 22. Statusergänzung 2026-09-10 – 36-Monats-Marktwert v8.7.41

**Entscheidung DEC-022 – Monatsschlusskurse und zeitnahe berichtete Aktienzahlen statt Einzelkurs oder aktuellem Rückrechnen**

- Der AAOIFI-Marktwert wird aus 36 abgeschlossenen Monatswerten gebildet: letzter Nasdaq-Handelsschlusskurs des Monats multipliziert mit der zuletzt zuvor offiziell gemeldeten Aktienzahl.
- Die Periode umfasst September 2023 bis August 2026. Der unvollständige laufende Monat wird nicht verwendet.
- SEC Companyfacts ist die primäre Quelle der Aktienzahlen. Bei McCormick werden wegen der zwei Klassen die einzelnen Deckblattwerte der 10-Q-/10-K-Filings addiert.
- Alle 180 Monatsbeobachtungen und ihre Quellen werden dauerhaft im Repository nachweisbar gespeichert.
- Die zwischen Berichtsstichtagen fortgeführte Aktienzahl wird ausdrücklich als Approximation dokumentiert.
- Offizielle Geschäftsprofile aus den jeweiligen Jahresberichten ersetzen für diese fünf Werte das inoffizielle Profil als Gate-1-Geschäftsfeldquelle.
- Abbott, McCormick und Merck erreichen dadurch vollständige Finanzdaten. Medtronic und Waste Management bleiben wegen weiterhin fehlender Pflichtwerte offen.
- Supabase, Parqet und Portfolio-Schutz bleiben unverändert.
- Ausführliche Evidenz: `docs/STATUS_2026-09-10_HALAL_MARKET_VALUE_36M.md`.

## 23. Statusergänzung 2026-09-10 – leasingbereinigte Schulden v8.7.42

**Entscheidung DEC-023 – Finanzierungsleasing wird nur anhand bezifferter Primärquellen abgezogen**

- Medtronic weist 6 Mio. USD kurzfristige und 54 Mio. USD langfristige Finanzierungsleasing-Verbindlichkeiten separat aus. Die AAOIFI-Schuldenkennzahl beträgt deshalb 27,901 Mrd. USD und die Schuldenquote 24,912 %.
- Waste Management weist 86 Mio. USD kurzfristige und 477 Mio. USD langfristige Finanzierungsleasing-Verbindlichkeiten separat aus. Die AAOIFI-Schuldenkennzahl beträgt deshalb 22,344 Mrd. USD und die Schuldenquote 26,058 %.
- Ein Netto-Zinsaufwand wird nicht als Zinsertrag verwendet. Waste Management bleibt deshalb trotz ergänzter Schuldenkennzahl offen.
- Johnson & Johnson wird als sechstes Instrument mit 36 Monatsmarktwerten und vier offiziellen Pflichtkennzahlen aufgenommen. Da das Finanzierungsleasing nur als nicht wesentlich beschrieben, aber nicht beziffert wird, bleibt die Schuldenkennzahl offen.
- Der Prescreen-Cache wird auf v6 angehoben, damit der nächste Buttonlauf die neuen Evidenzen sicher neu auswertet.
- Supabase, Parqet und Portfolio-Schutz bleiben unverändert.
- Ausführliche Evidenz: `docs/STATUS_2026-09-10_HALAL_DEBT_EVIDENCE.md`.

## 24. Statusergänzung 2026-09-10 – Watchlist-Identität v8.7.43

**Entscheidung DEC-024 – Alte Ticker-Watchlist-Einträge werden nur bei eindeutigem lokalem ISIN-Treffer hochgestuft**

- Der Gerätetest von v8.7.42 bestätigt 6 halalkonforme und 17 offene Werte sowie die erfolgreiche Medtronic-Auswertung.
- Johnson & Johnson konnte seinen produktiven Berichtsdatenbestand nicht lesen, weil der ältere lokale Watchlist-Eintrag keine ISIN enthielt.
- HPOS ergänzt eine fehlende Watchlist-ISIN künftig ausschließlich dann, wenn der exakte Ticker in der versionierten, verifizierten Marktkonfiguration genau einmal vorkommt.
- Mehrdeutige Identitäten bleiben offen. Die Migration erzeugt keine Halal-Einstufung und verändert keine Depotposition.
- Ausführliche Evidenz: `docs/HOTFIX_2026-09-10_WATCHLIST_IDENTITY.md`.
