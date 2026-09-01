# HPOS – Security Blocker: historischer Portfolio-Snapshot in öffentlicher Git-Historie

Stand: 2026-09-01
Status: OFFEN / v9-RC-BLOCKER

## Befund
Der aktuelle `main`-Baum enthält keinen realen Portfolio-Snapshot mehr. Die Datei `data/bootstrap/portfolio-2026-08-29.json` wurde jedoch zuvor öffentlich committed und anschließend nur gelöscht.

Nachweisbare Historie:
- `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af` – realen Parqet-Fallback-Snapshot ins Repository aufgenommen
- `fcf3ab8ec6cd8d7c2fb91caeaaed1c6c592334e4` – Snapshot aus dem aktuellen Baum entfernt

Ein normales Löschen entfernt Inhalte nicht aus bereits öffentlichen Git-Commits. Der Snapshot bleibt daher ohne History-Rewrite historisch abrufbar.

## Auswirkung
Dies verletzt die verbindliche HPOS-Regel, dass reale private Portfolio-Snapshots nicht im öffentlichen GitHub-Repository verbleiben dürfen. T-020 Secret-/Privacy-Smoke kann deshalb nicht vollständig PASS sein.

## Bereits erledigt
- aktueller `main`-Baum: Snapshot entfernt
- `data/bootstrap/` enthält aktuell nur `README.md`
- aktueller Code-/Repository-Scan: keine Treffer für typische Secret-/Tokenmuster
- Supabase Edge Function enthält nur Environment-Variablennamen, keine konkreten Secretwerte
- `.gitignore` zusätzlich gegen Portfolio-/Snapshot-Dateien unter `data/bootstrap/` gehärtet

## Erforderliche Entscheidung
Eine vollständige Entfernung aus der öffentlichen Historie erfordert einen Git-History-Rewrite und Force-Push bzw. eine vergleichbare GitHub-Bereinigung. Das ist eine irreversible/riskante Repository-Aktion und benötigt vor Durchführung ausdrückliche Freigabe.

## Nach Freigabe erforderlicher Ablauf
1. Backup/Recovery-Referenz des aktuellen `main` festhalten.
2. betroffene Datei aus allen erreichbaren Commits entfernen.
3. bereinigte Historie force-pushen.
4. prüfen, dass bekannte historische Snapshot-Commits/Blobs nicht mehr über den Repository-Verlauf erreichbar sind.
5. GitHub Pages und kanonischen `/app/`-Pfad regressionsprüfen.
6. Parqet-Supabase-Live-Sync regressionsprüfen.
7. finalen Secret-/Privacy-Smoke erneut durchführen.

## Release-Regel
Kein v9 RC / kein finales Go-live-Cleanup als abgeschlossen markieren, solange SEC-001 offen ist.
