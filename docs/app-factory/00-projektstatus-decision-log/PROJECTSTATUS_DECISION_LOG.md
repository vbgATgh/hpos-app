# HPOS App – Projektstatus & Decision Log

Stand: 2026-09-01

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

**Phase:** Parqet-E2E, produktiver Parqet-Live-Sync sowie Search/Quotes über Supabase real nachgewiesen. Der erprobte `live9`-Stand wurde in den kanonischen Produktpfad `app/index.html` übernommen. Canonical-Smoke-/Regressionstest und anschließende RC-Härtung sind offen.

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

Wichtig: Die Produktion darf nicht dauerhaft auf exakt 19 Positionen oder exakt 246,73 EUR Cash fest verdrahtet sein. Mit Edge Function Version 17 und dem aktualisierten Adapter wurden diese Testassertionen durch strukturelle Plausibilitätsprüfungen ersetzt, damit reale Käufe/Verkäufe und Cash-Änderungen künftig nicht fälschlich als Providerfehler blockiert werden. Dieser neue flexible Pfad ist implementiert, aber im kanonischen Browserpfad noch zu regressionsprüfen.

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

Produktiver Browserlauf nachgewiesen: `PARQET LIVE SYNC`, 19 aktive Positionen, 246,73 EUR Cash, aktueller Bestandszeitpunkt.

### OPEN-004 – Search/ISIN und Quotes migrieren
**Status:** ERLEDIGT / PASS 2026-09-01

Browser- und Serverlog-Nachweis liegen vor. Search und Yahoo-Quotes liefen über Supabase `hpos-api` Version 16 mit HTTP 200; Abbott wurde auf `US0028241000` / `ABT` ISIN-verifiziert. `runtime-config.js` enthält keinen aktiven Cloudflare-Zielhost mehr.

### OPEN-005 – QA / Regression / Security / Rollback
**Kritikalität:** HOCH

Parqet-Livepfad sowie Search/Quotes sind einzeln nachgewiesen. Vollständige Regression des kanonischen `app/`-Pfads, Security-/Fehlerfallprüfung und finaler Rollback-/Cleanup-Nachweis bleiben offen.

**Status:** TEILWEISE OFFEN

### OPEN-006 – Kanonischen Produktpfad nach Promotion prüfen
**Kritikalität:** HOCH

Der erprobte Live-Stand wurde am 2026-09-01 als `v8.7.5` nach `app/index.html` übernommen. Edge Function Version 17 redirectet OAuth nun direkt auf `app/`. Dieser kanonische Pfad muss real im Browser mit Refresh, OAuth, Parqet-Sync, Search, Watchlist-Persistenz und Quotes geprüft werden.

**Status:** IMPLEMENTIERT / BROWSERTEST OFFEN

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
**Status:** AKTIV / TEST OFFEN

Temporäre `liveN`-Redirects dürfen nicht Teil des finalen Produkts bleiben. Edge Function Version 17 verwendet deshalb `https://vbgatgh.github.io/hpos-app/app/` als Frontend-Rücksprung nach erfolgreichem Parqet-OAuth. Der zugehörige kanonische Browser-Smoke-Test ist noch offen.

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
**Status:** REDUZIERT; Parqet OAuth-Tokens bleiben serverseitig. Die opake HPOS-Session-ID ist der einzige Browser-Bearer. Vollständiger Security-PASS vor RC weiterhin offen.

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

1. kanonischen Pfad `https://vbgatgh.github.io/hpos-app/app/` im primären Browser öffnen.
2. Version `v8.7.5` und bestehenden validierten State prüfen.
3. manuellen Refresh ausführen und bei Bedarf Parqet einmal autorisieren; Rücksprung muss auf `app/` erfolgen.
4. `PARQET LIVE SYNC`, plausible Positions-/Cashwerte und aktuellen Bestandszeitpunkt prüfen.
5. Search mit Name und exakter ISIN sowie Watchlist-Hinzufügen prüfen; Browser-Neuladen und Watchlist-Persistenz im selben Browser prüfen.
6. Quotes prüfen und Supabase-Logs gegen Market-Requests verifizieren.
7. Fehler-/Fallback-Verhalten und Security-/Origin-Fälle testen.
8. vollständigen Regressionstest dokumentieren.
9. danach verbindliches Final-Cleanup-Gate durchführen: `docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md`.
10. erst danach `v9 RC = MVP` freigeben.

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

## 14. Aktualisierungsregel

Dieses Dokument wird bei Änderungen an Status, Gate, Architektur, Entscheidung, Blocker, Risiko, Scope, Release oder wesentlicher Implementierung aktualisiert. Wesentliche Projektinformationen dürfen nicht ausschließlich im Chat verbleiben.