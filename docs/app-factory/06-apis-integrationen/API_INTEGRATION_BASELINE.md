# HPOS – APIs & Integrationen Baseline

Stand: 2026-09-01
Status: PARQET E2E + FRONTEND PASS / SEARCH & QUOTES ÜBER SUPABASE PASS / CANONICAL REGRESSION OFFEN

## 1. Parqet
Status: VERIFIZIERTE ZIELQUELLE / E2E PASS.

Fachliche Rolle:
- Depotbestand
- Stückzahlen
- Einstand
- Cash/Portfolio-State
- Aktivitäten/Transaktionen
- Performance-/Dividendeninformationen soweit verifiziert verfügbar

Verifizierter technischer Vertrag:
- Parqet Connect
- OAuth 2.0 Authorization Code Flow mit PKCE S256
- Scope `portfolio:read`
- Authorization Endpoint: `https://connect.parqet.com/oauth2/authorize`
- Token Endpoint: `https://connect.parqet.com/oauth2/token`
- GitHub Pages → Supabase Edge Function `hpos-api` → Parqet Connect API

Supabase Endpoint:
`https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api`

Parqet Redirect URI:
`https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api/auth/parqet/callback`

Frontend-Rücksprung ab `hpos-api` Version 17:
`https://vbgatgh.github.io/hpos-app/app/`

Aktive Pfade:
- `/health`
- `/auth/parqet/start`
- `/auth/parqet/callback`
- `/api/parqet/status`
- `/api/parqet/portfolios`
- `/api/parqet/holdings?portfolioId=...`
- `/api/parqet/normalized`
- `/api/parqet/activities?portfolioId=...`

Tatsächlich nachgewiesen:
- private Parqet-Integration angelegt
- `PARQET_CLIENT_ID` als Supabase Secret vorhanden
- OAuth-Autorisierung erfolgreich
- Access-/Refresh-Tokens ausschließlich serverseitig gespeichert
- abgelaufener Access Token erfolgreich per Refresh Token erneuert
- Portfolio über Parqet abrufbar
- Holdings-/Performance-Daten erfolgreich abrufbar
- rohe Parqet-Struktur: 96 Holdings im geprüften Performance-State
- serverseitige Normalisierung real geprüft: 19 aktive Wertpapierpositionen, 246,73 EUR Cash, 17 Scalable, 2 Trade Republic
- produktiver Browserlauf am 2026-09-01 erfolgreich: `PARQET LIVE SYNC`, 19 Positionen, Cash 246,73 EUR, aktueller Bestandszeitpunkt
- nach Session-Bereinigung erneuter OAuth-Lauf erfolgreich; `/api/parqet/normalized` serverseitig HTTP 200
- im erfolgreichen Browserlauf wurde ein Gesamtvermögen von 10.036,20 EUR dargestellt; dieser UI-Wert hängt von der separaten Marktdaten-/Kursstufe ab und ist nicht als unveränderlicher Reconciliation-Wert festgeschrieben

Damit ist der Parqet-Pfad vom OAuth bis zur HPOS-Oberfläche tatsächlich verifiziert.

### Holdings-Normalisierung
Die rohe Parqet-Holdings-/Performance-Liste ist nicht identisch mit den wirtschaftlich relevanten HPOS-Depotpositionen. Sie enthält neben regulären Positionen auch Kleinst-/Markerpositionen.

Verbindliche Normalisierung für HPOS:
- Parqet bleibt Source of Truth für alle Holdings.
- Verkaufte Holdings gehören nicht zum aktuellen Depotbestand.
- Cash wird separat als Cash geführt.
- Offene Wertpapier-Holdings mit einem aktuellen Positionswert von mindestens 1,00 EUR zählen als aktive Depotpositionen.
- Offene Wertpapier-Holdings mit einem aktuellen Positionswert unter 1,00 EUR sind Watchlist-Kandidaten und zählen nicht als aktive Depotpositionen.
- Watchlist-Kandidaten werden nicht automatisch in die lokale Watchlist übernommen; eine Aufnahme bleibt eine bewusste Watchlist-Entscheidung.
- Die 1-EUR-Grenze ist eine fachlich bestätigte Klassifikationsregel für die vorhandenen Marker-/Kandidatenpositionen, nicht eine Kursquelle und nicht ein Mechanismus zur Veränderung des Parqet-Bestands.

Der bislang verifizierte Bestand ergab:
- 19 aktive Wertpapierpositionen plus Cash
- 17 aktive Positionen bei Scalable Capital
- 2 aktive Positionen bei Trade Republic
- Trade-Republic-Zuordnung ausschließlich für Cardinal Energy (`CA14150G4007`) und Savaria (`CA8051121090`)
- alle übrigen aktiven Wertpapierpositionen werden Scalable Capital zugeordnet

Produktionshärtung am 2026-09-01:
- starre Server-/Adapter-Assertions auf exakt 19 Positionen und exakt 246,73 EUR Cash wurden entfernt
- stattdessen gelten strukturelle Plausibilitätsprüfungen für ISIN, positive Stückzahl/Positionswerte, Duplikate, Positionsanzahl und Cash-Bereich
- damit dürfen reale Käufe, Verkäufe und Cash-Änderungen künftig nicht allein wegen Abweichung vom Testbestand als Providerfehler verworfen werden
- der flexible Pfad ist implementiert; der kanonische Browser-Regressionstest steht noch aus

Die Brokerzuordnung ist UI-/Workflow-Metadatum. Parqet bleibt Depot-Master; HPOS führt keine Broker-Orders aus.

### Frontend-Bridge
`app/parqet-supabase-adapter.js` übernimmt die opake HPOS-Session-ID und den direkten Abruf von `/api/parqet/normalized`.

Der Compatibility-Key `hpos_parqet_token` enthält keinen Parqet-Token, sondern nur einen statischen Übergangsmarker. Der echte Browser-Bearer ist ausschließlich die opake HPOS-Session-ID unter `hpos_parqet_session`. Parqet Access-/Refresh-Tokens bleiben serverseitig.

## 2. Broker
Scalable Capital und Trade Republic:
- tatsächliche Orderausführung außerhalb HPOS
- keine direkte Order-API im aktuellen HPOS-Scope
- nach Order: Parqet-Reconciliation/Bestandsaktualisierung
- aktuell Cardinal Energy und Savaria bei Trade Republic
- übrige aktive Depotpositionen bei Scalable Capital

## 3. Supabase
Rolle: private Integrations-, Token-/Session- und Market-Proxy-Schicht.

Project Ref: `moxyhjfbrmsnphikxqje`

Aktuelle Edge Function: `hpos-api`, Version 17, `ACTIVE`, `verify_jwt=false` wegen eigener HPOS-/OAuth-Authentifizierung.

Serverseitige Persistenz:
- `hpos_oauth_pending`
- `hpos_parqet_sessions`

Security:
- RLS aktiv
- DENY-ALL für öffentliche Rollen
- `anon`/`authenticated` ohne Tabellenrechte
- `service_role` serverseitig
- Parqet OAuth-Tokens werden nicht an das Frontend ausgegeben
- Edge Function bewusst mit `verify_jwt=false`; OAuth-Start/-Callback sind öffentlich, geschützte Parqet-API-Pfade prüfen eigene Session und Origin
- Market-Proxy akzeptiert nur das HPOS-GitHub-Pages-Origin und validiert Symbol-/Suchparameter

## 4. Search / ISIN
Status: SUPABASE-MIGRATION REAL NACHGEWIESEN / PASS 2026-09-01.

Aktiver Zielpfad:
- historische Requests `?s=search&q=...` bzw. `?s=yahoo-search&q=...` werden über `quote-policy.js` an Supabase `hpos-api` geführt
- Supabase ruft Yahoo Finance Search serverseitig ab
- OpenFIGI bleibt für exakte ISIN-Verifikation im Browserpfad erhalten
- verifizierte ISIN bleibt kanonischer Instrumentenschlüssel

Tatsächlich geprüft:
- Suche nach `Abbott`
- Supabase-Request `?s=search&q=Abbott` mit HTTP 200 im Serverlog
- UI-Treffer Abbott Laboratories mit `US0028241000` und `ABT`
- Watchlist-Aufnahme nur für ISIN-verifizierte Treffer zugelassen

## 5. Quotes / Marktdaten
Status: SUPABASE-MIGRATION REAL NACHGEWIESEN / PASS 2026-09-01.

Aktiver Zielpfad:
- historische Requests `?s=yahoo&t=SYMBOL` werden durch `quote-policy.js` auf Supabase `hpos-api` geführt
- Supabase verwendet Yahoo Chart als Quote-Quelle und liefert mindestens `price`, `previousClose`, `currency`, `exchange`, `marketTime`
- bestehende Currency-Guards und `SNAPSHOT_ONLY`-Regeln im Frontend bleiben aktiv
- Frankfurter bleibt öffentliche FX-Quelle

Tatsächlich geprüft:
- mehrere reale Quote-Requests im Browserlauf wurden in Supabase mit HTTP 200 protokolliert, darunter ABT, NOVO-B.CO, FPE3.DE, NOVN.SW, WM, RIO.L und weitere
- damit ist der Transportpfad GitHub Pages → Supabase → Yahoo für Quotes nachgewiesen

Wichtig: Marktdaten dürfen niemals Depotbestände, Stückzahlen oder Brokerzuordnung verändern. Sie dürfen nur die Marktbewertung des bereits validierten Parqet-Bestands aktualisieren.

## 6. DivvyDiary
Status: TEILWEISE VERIFIZIERT / READ-INTEGRATION NICHT FREIGEGEBEN / KEIN MVP-BLOCKER.

Keine produktive Read-Integration bis ein stabiler offizieller Vertrag für die benötigten persönlichen Daten verifiziert ist.

## 7. Öffentliche Quellen
### Frankfurter
Rolle: FX-Daten; öffentliche Quelle ohne Secret.

### OpenFIGI
Rolle: Instrument-/ISIN-Mapping und Identitätsprüfung; keine Portfolioquelle.

### Yahoo
Rolle: Marktdaten und Suchtreffer über den Supabase-Proxy; keine kanonische Portfolioquelle.

## 8. Integrationsregeln
- keine erfundenen Endpunkte
- keine Provider-Secrets oder Parqet OAuth-Tokens im Frontend
- Portfolio-State und Marktdaten strikt trennen
- verifizierte ISIN als kanonischer Instrumentenschlüssel
- Fehler externer Quellen überschreiben keinen validierten Portfolio-State
- neue Quelle erst nach dokumentiertem Vertrag, Authentifizierung, Datenfeldern und Fehlerverhalten
- kostenpflichtige Datenquellen sind keine zwingende Produktvoraussetzung
- Frontend-Aktivierung erst nach Datenmapping-/Fallback-Prüfung

## 9. Browserlokaler Zustand
HPOS-Session, Watchlist und weitere lokale Einstellungen liegen aktuell im Browser-LocalStorage. Safari, Edge und PWA-Kontexte teilen diesen Zustand nicht automatisch. Auf iOS kann ein OAuth-Rücksprung im eingestellten Standardbrowser landen.

Für den MVP wird dafür kein zusätzlicher Cross-Browser-Sync-Dienst eingeführt. Stattdessen muss der kanonische Browser-/PWA-Kontext im Regressionstest geprüft werden. Watchlist-Persistenz ist im selben Browser nach Reload nachzuweisen.

## 10. Legacy
Cloudflare ist nicht mehr Zielarchitektur. Parqet, Search und Quotes wurden funktional über Supabase nachgewiesen. `app/runtime-config.js` enthält keinen aktiven Cloudflare-Zielhost mehr.

Im aktiven JavaScript existieren noch Compatibility-Matches für historische Requestformen. Sie dienen ausschließlich dem kontrollierten Übergang und werden gemäß `docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md` erst nach bestandenem kanonischem Regressionstest entfernt.

`backend/hpos-api/` bleibt historischer Entwurf und wird nicht als produktive Zielimplementierung behandelt.

## 11. Offene Punkte
- kanonischen `app/`-Pfad nach Promotion real im Browser testen
- OAuth-Rücksprung auf `app/` prüfen
- Watchlist-Persistenz im selben Browser nach Reload prüfen
- Fallback-/Providerfehler und Origin-/Security-Fälle prüfen
- vollständige Regression durchführen
- danach Final-Legacy-Cleanup durchführen
- Rate Limits, Timeouts und Retry-Regeln je aktivem Provider final dokumentieren
- Datenherkunft/Freshness für UI weiter normalisieren

## Quellenbasis
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- `supabase/functions/hpos-api/index.ts`
- `supabase/migrations/`
- `app/parqet-supabase-adapter.js`
- `app/quote-policy.js`
- `app/runtime-config.js`
- `docs/API_CONTRACTS_v8.7.4.md`
- Requirements- und Architektur-Baseline
- offizielle Parqet Developer-Hub-Dokumentation

## Gate-Hinweis
Parqet OAuth, Refresh, Reconciliation, produktiver Frontend-Sync sowie Search und Quotes über Supabase wurden real verifiziert. Das Release-Gate bleibt offen, bis der kanonische `app/`-Pfad, Watchlist-Persistenz, Fehlerfälle, Regression, Security und Final-Cleanup nachgewiesen sind.