# HPOS – Security & Datenschutz Baseline

Stand: 2026-09-01
Status: SECURITY-PRÜFUNG TEILWEISE DURCHGEFÜHRT / HISTORISCHER PRIVACY-BLOCKER OFFEN

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

## Kritischer Befund: Git-Historie
Ein realer Portfolio-Snapshot war nachweislich bereits öffentlich committed und wurde später nur aus dem aktuellen Baum gelöscht:
- Commit `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af`: `chore(data): externalize canonical Parqet fallback snapshot`
- Commit `fcf3ab8ec6cd8d7c2fb91caeaaed1c6c592334e4`: `Remove real portfolio snapshot from public repository`

Damit ist die Datei zwar nicht mehr auf `main` vorhanden, aber ohne History-Rewrite weiterhin über die öffentliche Git-Historie erreichbar. Das verletzt die verbindliche Privacy-Regel für reale Portfolio-Snapshots.

## Release-Blocker SEC-001
**Status:** OFFEN / BLOCKIERT v9 RC

Vor v9 RC muss entschieden und durchgeführt werden, wie der historische reale Portfolio-Snapshot aus der öffentlichen Git-Historie entfernt wird. Ein History-Rewrite mit Force-Push ist irreversibel/riskant und darf nicht ohne ausdrückliche Freigabe durchgeführt werden.

Nach einer Bereinigung müssen mindestens geprüft werden:
1. Snapshot ist über bekannte historische Commits nicht mehr öffentlich abrufbar.
2. `main` und GitHub Pages funktionieren weiterhin.
3. kanonischer `/app/`-Pfad bootet.
4. Supabase-Parqet-Live-Sync funktioniert weiterhin.
5. keine Secrets oder neuen privaten Snapshots sind vorhanden.

## Noch nicht als abgeschlossen behauptet
- vollständiger Secret-Scan des gesamten Repository-Verlaufs nach History-Bereinigung
- gezielter CORS-/Session-Missbrauchstest
- Logging-/Retention-Konzept
- Dependency-/Supply-Chain-Prüfung
- Restore-/Gerätewechsel-Sicherheitskonzept

## Release-Bedingung
T-020 darf erst vollständig PASS sein, wenn der historische Snapshot nicht mehr über die öffentliche Repository-Historie erreichbar ist und der anschließende Security-/Privacy-Smoke bestanden wurde.

## Quellenbasis
- `docs/app-factory/00-projektstatus-decision-log/PROJECTSTATUS_DECISION_LOG.md`
- `docs/app-factory/08-qa-tests/QA_BASELINE.md`
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- aktueller GitHub-Baum und Commit-Historie vom 2026-09-01
- Supabase Edge Function `hpos-api` Version 17
