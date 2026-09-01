# HPOS – Historie & Archiv: Migrationsregel

Stand: 2026-08-31
Status: AKTIV FÜR DIE APP-FACTORY-MIGRATION

## Grundsatz
Historische HPOS-Dateien werden nicht gelöscht oder verschoben, solange ihre fachliche Relevanz für aktuelle Anforderungen, Entscheidungen, QA oder Architektur nicht geprüft wurde.

## Klassifikation
Jedes bestehende Artefakt erhält später genau einen Status:
- AKTUELL: verbindliche aktive Quelle
- KONSOLIDIERT: Inhalt wurde in App-Factory-Quelle übernommen; Original bleibt vorerst nachvollziehbar
- HISTORISCH: nur noch Entwicklungs-/Entscheidungshistorie
- ERSETZT: durch neuere benannte Quelle abgelöst
- ZU VERIFIZIEREN: Relevanz oder Aktualität noch unklar

## Besonders zu prüfen
- historische `ui*`-Verzeichnisse
- Alpha-Prototypen
- Alpha-/Hotfix-/Privacy-/UX-CI-Workflows
- alte Scope-/Audit-/Testnotizen
- doppelte/ältere ADRs
- alte Root-Anwendungsdateien parallel zu `app/`
- veraltete Bootstrap-/Fallback-Dokumentation

## Sicherheitsregel
Archivierung darf keine realen privaten Portfolio-/Broker-/Secret-Daten konservieren, wenn diese nicht ins öffentliche Repository gehören.

## Löschregel
Physisches Löschen erfolgt erst nach:
1. Konsolidierung relevanter Inhalte,
2. Prüfung aktiver Referenzen/Links/Workflows,
3. Regression des aktiven Produktpfads,
4. dokumentierter Entscheidung im Projektstatus & Decision Log.

## Aktueller Stand
Noch keine historische Datei wurde im Rahmen dieser App-Factory-Migrationsphase verschoben oder gelöscht.