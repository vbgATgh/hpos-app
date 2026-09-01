# HPOS – Git History Rewrite Status

Stand: 2026-09-01
Status: REACHABLE HISTORY BEREINIGT / GITHUB CACHE-PURGE OFFEN

## Anlass
Ein realer Portfolio-Snapshot `data/bootstrap/portfolio-2026-08-29.json` war am 2026-08-30 in der öffentlichen Git-Historie committed und später nur aus dem aktuellen Branch gelöscht worden. Damit blieb er über historische Commit-SHAs erreichbar.

## Freigabe
Der Repository-Owner hat am 2026-09-01 ausdrücklich die Bereinigung der Git-Historie einschließlich Force-Update von `main` freigegeben.

## Tatsächlich ausgeführte Maßnahme
- Der letzte nachweislich saubere Commit vor Einführung des Snapshots wurde als Elternbasis verwendet: `a26f8825f317c6c5956ec44fa6b71a69d0145357`.
- Der komplette aktuelle Repository-Baum von `main` wurde unverändert auf einen neuen Commit mit dieser sauberen Elternbasis gesetzt.
- Neuer kanonischer Commit: `7388d8f068b56431c50bebaafa293dc620db59ff`.
- `main` wurde per Force-Ref-Update auf diesen Commit gesetzt.
- Temporär angelegte Security-/Rewrite-Branches wurden ebenfalls auf den bereinigten Commit gesetzt, sodass sie die belastete Historie nicht mehr referenzieren.
- Abfrage der Commit-Historie für `data/bootstrap/portfolio-2026-08-29.json` auf `main` liefert nach dem Rewrite keine Treffer mehr.
- Der neue Commit verwendet denselben Tree-SHA wie der vorherige aktuelle Produktstand: `f62d3b5e8709ed916a45cd54e0b8db5898cd73dd`. Der aktuelle Dateistand wurde dadurch nicht verändert.

## Verbleibendes Risiko
Ein direkter Abruf des alten Commit-SHA `5a5edb603fdfaedb34a38b7cc74f4d6d4c2106af` liefert den Snapshot derzeit weiterhin aus GitHub. Das ist nach einem History-Rewrite technisch möglich, solange GitHub verwaiste Objekte bzw. gecachte Views noch nicht serverseitig bereinigt hat.

Daher gilt T-020 noch nicht als vollständig bestanden.

## Nächste zwingende Maßnahme
GitHub Support muss für die sensible Datei um serverseitige Dereferenzierung/Cache-Bereinigung/Garbage Collection gebeten werden. Erst wenn der alte Commit-Inhalt nicht mehr direkt abrufbar ist, darf der Privacy-Smoke für diesen Befund auf PASS gesetzt werden.

## Prävention
`.gitignore` blockiert künftig zusätzlich:
- `data/bootstrap/portfolio*.json`
- `data/bootstrap/*snapshot*.json`
- bestehende private Portfolio-/Backup-Muster

## Releasewirkung
`v9 RC = MVP` bleibt bis zur bestätigten Entfernung des sensiblen historischen Objekts und anschließendem T-020-Retest blockiert.
