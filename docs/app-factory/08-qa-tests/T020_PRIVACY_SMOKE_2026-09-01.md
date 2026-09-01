# HPOS – T-020 Secret-/Privacy-Smoke

Stand: 2026-09-01
Ergebnis: FAIL / BLOCKED durch historische Snapshot-Exposition

## Tatsächlich geprüft
- aktueller `main`-Baum auf typische Secret-/Tokenbegriffe durchsucht: keine Treffer im aktuellen indizierten Stand
- aktueller Baum auf aktuelle reale Portfolio-/Cashwerte durchsucht: keine Treffer
- `data/bootstrap/` geprüft: aktuell nur `README.md`, kein realer Portfolio-Snapshot
- deployte Supabase Edge Function `hpos-api` Version 17 geprüft: Secrets werden über `Deno.env` gelesen; konkrete `PARQET_CLIENT_ID`-/Service-Role-/OAuth-Tokenwerte sind nicht im Funktionsquelltext enthalten
- Frontend-Architektur geprüft: Parqet Access-/Refresh-Tokens bleiben serverseitig; Browser verwendet opake HPOS-Session-ID

## Kritischer negativer Befund
GitHub-Commit-Historie für `data/bootstrap/portfolio-2026-08-29.json` zeigt:
- Commit `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af` nahm den realen Snapshot ins öffentliche Repository auf.
- Commit `fcf3ab8ec6cd8d7c2fb91caeaaed1c6c592334e4` entfernte ihn später nur aus dem aktuellen Baum.

Damit verbleibt der private Snapshot ohne History-Rewrite in der öffentlich erreichbaren Git-Historie. T-020 ist daher nicht PASS.

## Präventive Maßnahme
`.gitignore` wurde zusätzlich um folgende Muster erweitert:
- `data/bootstrap/portfolio*.json`
- `data/bootstrap/*snapshot*.json`

## Blocker
SEC-001: History-Rewrite/Force-Push erforderlich. Wegen Irreversibilität und Risiko nur nach ausdrücklicher Freigabe.

## Retest nach Bereinigung
T-020 darf erst PASS werden, wenn:
1. die historische Datei aus der öffentlichen Historie entfernt wurde,
2. erneuter Repo-/History-Scan keine privaten Snapshots/Secrets findet,
3. GitHub Pages `/app/` weiterhin funktioniert,
4. Supabase-Parqet-Live-Sync regressionsgeprüft wurde.
