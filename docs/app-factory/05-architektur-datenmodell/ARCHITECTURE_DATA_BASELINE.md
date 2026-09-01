# HPOS – Architektur & Datenmodell Baseline

Stand: 2026-08-31
Status: KONSOLIDIERT / SUPABASE-ZIELARCHITEKTUR IN UMSETZUNG / ARCHITEKTUR-GATE NICHT FREIGEGEBEN

## 1. Aktiver Produktpfad
`app/` ist der kanonische aktive Frontend-Pfad. Historische UI-/Alpha-Stände sind Legacy und keine parallelen Produktlinien.

## 2. Architekturprinzip
HPOS trennt fachliche Wahrheit in vier Schichten:
1. Constitution
2. Current State
3. Thesis Registry
4. operative Entscheidungs-/Governance-Logik

## 3. Constitution
Quelle: `config/hpos_constitution.json`

Enthält langlebige Systemregeln und Governance. Current-State-Daten dürfen nicht in die Constitution hartcodiert werden.

Die Constitution steht auf `4.3-consolidated`. Die operative Portfolio-Datenpriorität ist auf Parqet als Depot-Master bereinigt.

## 4. Current State
Schema: `config/current_state.schema.json`

Der echte aktuelle Zustand ist privat/local-first bzw. geschützt serverseitig zu verarbeiten. Es gibt absichtlich keine reale Current-State-Datei im öffentlichen Repository.

## 5. Thesis Registry
Quelle: `data/thesis_registry.json`

Versionierbare Asset-Thesen mit Rolle, These, Risiken, Katalysatoren/Proof Points und Falsification.

## 6. Datenrollen
- Portfolio-State: Parqet ist kanonischer Depot-Master.
- Broker: Scalable Capital und Trade Republic sind ausschließlich Orte der tatsächlichen Orderausführung.
- Reconciliation: Brokerorder wird erst nach Parqet-Aktualisierung zum neuen HPOS-Portfolio-State.
- Marktdaten: Kurs/Währung/Börse/Zeitpunkt, ohne Bestandsmutation.
- Instrumentidentität: verifizierte ISIN ist kanonischer Schlüssel.
- Watchlist: eigenes HPOS-Datenmodell, getrennt vom Depot.
- Halal: evidenzbasiertes Register mit Quellenpriorität und Konfliktbehandlung.
- Thesis/Evidenz: versionierbare Analyseinformationen.

## 7. Source-of-Truth-Prinzip
Systemweit:
1. jüngste ausdrückliche Nutzerentscheidung
2. Constitution / neueste verbindliche HPOS-Regel
3. Current State mit Zeitstempel
4. Thesis Registry mit Review-Stand
5. historische Masterfiles/Snapshots

Operative Portfolio-Daten:
1. `PARQET_LIVE`
2. `CURRENT_HPOS_LOCAL_STATE`
3. `USER_CONFIRMED_OVERRIDE`
4. `HISTORICAL_MASTERFILE`

## 8. Integrationsarchitektur
Aktueller Übergang:
- GitHub Pages als statisches Frontend
- alter `hpos-proxy` noch für Teile von Parqet, Quotes und Suche gekoppelt
- zentrale Runtime-Routing-Kapselung vorhanden

Verbindliches Zielbild laut `ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`:
- GitHub Pages bleibt Frontend
- Supabase Edge Function `hpos-api` ist private Integrationsschicht
- Supabase Project Ref: `moxyhjfbrmsnphikxqje`
- OAuth-/Providerzugriffe laufen serverseitig
- alter Worker wird nicht erweitert
- Cloudflare-Neuentwurf aus ADR-001 ist hinsichtlich Plattform durch ADR-002 ersetzt

Bereits umgesetzt:
- Edge Function `hpos-api` Version 1 ist ACTIVE
- serverseitiger OAuth-/Session-Store ist migriert
- RLS ist aktiv
- öffentliche Rollen sind explizit gesperrt
- Security Advisor aktuell ohne Findings

Noch nicht nachgewiesen:
- Parqet Client-ID konfiguriert
- Parqet OAuth E2E erfolgreich
- Portfolios/Holdings gegen reales Parqet verifiziert
- Frontend auf Supabase-Parqet umgestellt

## 9. Parqet Session-/Token-Modell
Tabellen:
- `public.hpos_oauth_pending`
- `public.hpos_parqet_sessions`

Regeln:
- OAuth `state` und PKCE `code_verifier` kurzzeitig serverseitig
- Parqet Access-/Refresh-Tokens ausschließlich serverseitig
- Browser erhält nur opake, zeitlich begrenzte HPOS-Sitzungs-ID
- keine Parqet OAuth-Tokens in Frontend oder `localStorage`
- geschützte API-Pfade prüfen Origin und Sitzung

## 10. Harte technische Regeln
- keine Secrets im öffentlichen Frontend/Repository
- kein realer Portfolio-Snapshot im öffentlichen Repository
- unbekannte Daten bleiben unbekannt
- externe Providerfehler zerstören keinen validierten State
- keine neue produktive Datenquelle ohne verifizierten Vertrag
- keine neue Funktion direkt an Legacy-Worker koppeln
- Brokerorders werden nicht aus HPOS ausgeführt
- Frontend-Umschaltung erst nach E2E-PASS des Zielpfads

## 11. Offene Architekturpunkte
- Parqet private Integration/Client-ID konfigurieren
- Parqet OAuth und Holdings E2E testen
- Legacy-Parqet-Pfad danach ablösen
- Such-/Quote-Provider festlegen und migrieren
- DivvyDiary Read-Vertrag offen, aber kein MVP-Blocker
- State-Migration/versionierung bis v9 absichern
- Backup-/Restore-Architektur soweit für MVP erforderlich spezifizieren

## 12. v9-RC-MVP Architekturwirkung
Kernpfade müssen stabil und nachvollziehbar sein. Datenintegrität, Parqet-Reconciliation, Instrumentidentität, Watchlist, Investment-Akte, Income-Grundfunktion, Halal-Evidenz, Decision Layer und Fehlerstatus haben Vorrang. Zusätzliche Research-Tiefe, optionale DivvyDiary-Anreicherung und rein kosmetische UI-Erweiterungen blockieren den MVP nicht, solange kein MUST-Requirement betroffen ist.

## 13. Quellenbasis
- `docs/HPOS_ARCHITECTURE_V1.md`
- `config/hpos_constitution.json`
- `config/current_state.schema.json`
- `data/thesis_registry.json`
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- `supabase/functions/hpos-api/index.ts`
- `supabase/migrations/`
- `docs/app-factory/01-produktdefinition/PRODUCT_DEFINITION.md`
- `docs/app-factory/02-anforderungen-akzeptanzkriterien/REQUIREMENTS_BASELINE.md`

## Gate-Hinweis
Die Zielarchitektur ist festgelegt und technisch vorbereitet. Wegen offenem Parqet-E2E, Legacy-Migration, QA und Betrieb wird noch kein abgeschlossenes Architektur-Gate behauptet.