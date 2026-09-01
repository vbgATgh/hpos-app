# HPOS – Final Legacy Cleanup Gate

Stand: 2026-09-01
Status: VERBINDLICH VOR GO-LIVE

## Zweck

Vor dem finalen v9-RC-/MVP-Go-live wird das Repository und die aktive Laufzeit gezielt von überholten Artefakten, Altpfaden und nicht mehr benötigten Daten bereinigt. Ziel ist, dass keine historische Implementierung versehentlich wieder greifen, geroutet, deployed oder als aktuelle Architektur missverstanden werden kann.

## Verbindliche Regel

Die Bereinigung erfolgt **erst**, wenn die aktive Supabase-/GitHub-Pages-Zielarchitektur vollständig regressionsgetestet ist und für die betroffenen Funktionen kein Rollback auf Legacy mehr benötigt wird.

Historische Architekturentscheidungen, die für Nachvollziehbarkeit erforderlich sind, werden **nicht gelöscht**, sondern eindeutig als `SUPERSEDED`, `HISTORICAL` oder `ARCHIVED` gekennzeichnet. Ausführbarer oder routbarer Legacy-Code darf dagegen nach belegter Nichtnutzung entfernt oder technisch neutralisiert werden.

## Cleanup-Scope vor Go-live

Mindestens zu prüfen und, soweit nicht mehr benötigt, zu entfernen oder zu archivieren:

- alter Cloudflare-Worker-/Proxy-Code, insbesondere `backend/hpos-api/`
- alte `workers.dev`-Runtime-Verweise im aktiven Produktpfad
- historische UI-/Alpha-/Testpfade, die außerhalb des kanonischen Produktpfads `app/` noch ausführbaren Altcode enthalten
- temporäre `liveN`-/Debug-/Diagnose-Bridges, sofern sie nicht Teil des finalen Produkts sind
- temporäre Health-/E2E-Diagnosepfade, die für Produktion nicht benötigt werden
- veraltete Runtime-Konfigurationen und Compatibility-Shims
- nicht mehr benötigte lokale Fallback-/Bootstrap-Daten, sofern ein sicherer Recovery-Pfad anderweitig nachgewiesen ist
- abgelaufene/obsolete serverseitige OAuth-/Session-Datensätze nach der festgelegten Retention-Regel
- unreferenzierte Testdaten, temporäre Dateien und überholte Build-/Deployment-Artefakte

## Nicht löschen ohne bewusste Entscheidung

- `docs/ADR-001_PRIVATE_INTEGRATION_LAYER.md`: historische, superseded ADR
- andere ADRs, Decision-Log-Einträge und Audit-Nachweise, die Architekturentscheidungen oder Testhistorie dokumentieren
- Daten oder Artefakte, die für einen ausdrücklich dokumentierten Rollback noch benötigt werden

## Go-live-Kriterien für dieses Gate

Das Cleanup-Gate gilt nur als bestanden, wenn tatsächlich geprüft und dokumentiert wurde:

1. Aktiver Produktpfad ist ausschließlich `app/`.
2. Parqet, Search und Quotes laufen ohne Cloudflare-Abhängigkeit über Supabase.
3. Repository-Suche findet im aktiven Runtime-Code keine unerwarteten Legacy-Hosts oder Legacy-Router.
4. Entfernte Legacy-Komponenten werden von keinem aktiven HTML-, JS-, Config-, Deployment- oder Backend-Pfad mehr referenziert.
5. Frontend-Smoke-Test und Regression nach der Bereinigung wurden real durchgeführt.
6. Supabase Edge Function und GitHub Pages funktionieren nach dem Cleanup weiterhin.
7. Kein Secret, Token oder privater Portfolio-Snapshot wurde durch die Bereinigung ins Repository eingebracht.
8. Projektstatus/Decision Log wird abschließend auf den bereinigten Produktionsstand aktualisiert.

## Risikoregel

Löschungen mit möglicher Rollback- oder Produktionsauswirkung sind irreversible/riskante Aktionen und werden erst nach belegtem Nichtgebrauch und, falls erforderlich, ausdrücklicher Freigabe ausgeführt.

Bis dahin gilt: Legacy darf nicht erweitert werden und darf nicht wieder in den aktiven Produktpfad zurückkehren.
