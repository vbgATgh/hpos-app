# HPOS – Security & Datenschutz Baseline

Stand: 2026-09-01
Status: HISTORISCHER PRIVACY-BLOCKER BEREINIGT / RELEASE-SMOKE 2026-09-28 BESTANDEN

## Schutzbedarf
HPOS verarbeitet bzw. kann verarbeiten:
- reale Depotbestände und Vermögenswerte
- Brokerzuordnungen
- Einstandswerte und Cash
- persönliche Portfolio-/Watchlistdaten
- OAuth-/API-Zugänge zu externen Diensten

Diese Daten sind nicht für das öffentliche Repository bestimmt.

## Verbindliche Regeln
1. Kein realer Current-State-/Portfolio-Snapshot im öffentlichen Repository oder in dessen erreichbarer Git-Historie.
2. Keine Secrets, API-Keys, Access-/Refresh-Tokens im Frontendcode oder Repository.
3. Keine OAuth-Tokens in `localStorage`.
4. Secret-basierte Providerzugriffe nur über private Integrationsschicht.
5. Frontend erhält nur die für die Funktion benötigten normalisierten Daten.
6. Providerfehler dürfen keinen validierten privaten State zerstören.
7. CORS für private Integrationsschicht nur für freigegebenen HPOS-Origin.
8. Datenminimierung: keine unnötigen persönlichen Daten in Logs/Testdaten.

## Verifizierter aktueller Stand
- Aktueller Git-Baum enthält keinen realen Portfolio-Bootstrap unter `data/bootstrap/`; dort liegt nur `README.md`.
- Repository-Suchen nach typischen Secret-/Tokenmustern (`access_token`, `refresh_token`, `client_secret`, `private_key`, Bearer-/Service-Role-Begriffen) lieferten im aktuellen indizierten Stand keine Treffer.
- Suchen nach dem aktuellen realen Cash-/Portfolio-State lieferten im aktuellen Baum keine Treffer.
- Die deployte Supabase Edge Function Version 17 bezieht `PARQET_CLIENT_ID` und `SUPABASE_SERVICE_ROLE_KEY` ausschließlich über `Deno.env`; konkrete Secretwerte sind nicht im Funktionsquelltext hinterlegt.
- Parqet Access-/Refresh-Tokens werden serverseitig in Supabase gespeichert; das Frontend erhält nur eine opake HPOS-Session-ID.
- `.gitignore` wurde am 2026-09-01 zusätzlich gegen `data/bootstrap/portfolio*.json` und `data/bootstrap/*snapshot*.json` gehärtet.

## Historischer Privacy-Befund

Der frühere reale Portfolio-Snapshot wurde mit dem bereinigten Verlauf `7388d8f` aus der erreichbaren Git-Historie entfernt. Der zuvor bekannte Commit `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af` ist am 2026-09-28 weder als Commitobjekt vorhanden noch über einen Branch erreichbar. Unter `data/bootstrap/` ist über alle erreichbaren Revisionen nur der bereinigte Wiederaufbau sichtbar.

## Release-Blocker SEC-001

**Status:** GESCHLOSSEN

Der erneute Release-Smoke vom 2026-09-28 bestätigt:

1. Der bekannte sensible Commit ist nicht mehr abrufbar.
2. Der aktuelle Baum enthält keinen privaten Portfolio-Snapshot.
3. In 841 erreichbaren Commits wurden außerhalb von Dokumentation und Berechtigungsmigrationen keine Treffer für private Schlüssel, belegte `client_secret`-Werte oder `service_role_key`-Werte gefunden.
4. Alle sechs privaten Supabase-Tabellen haben RLS aktiviert; `anon` und `authenticated` besitzen kein Leserecht.
5. Fremder Origin am Marktpfad wird mit HTTP 403 abgewiesen; der private Parqet-Pfad ohne Sitzung mit HTTP 401.

## Noch nicht als abgeschlossen behauptet
- externer unabhängiger Secret-Scan mit einem spezialisierten Scanner
- Logging-/Retention-Konzept
- Dependency-/Supply-Chain-Prüfung
- Restore-/Gerätewechsel-Sicherheitskonzept

## Release-Bedingung

T-020 ist für den v9-RC-Umfang bestanden. Die noch offenen Betriebsaufgaben sind dokumentierte Weiterentwicklungen und kein Nachweis eines aktuellen Datenlecks.

## Quellenbasis
- `docs/app-factory/00-projektstatus-decision-log/PROJECTSTATUS_DECISION_LOG.md`
- `docs/app-factory/08-qa-tests/QA_BASELINE.md`
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- aktueller GitHub-Baum und Commit-Historie vom 2026-09-01
- Supabase Edge Function `hpos-api` Version 17
