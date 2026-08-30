# HPOS

Halal Portfolio Optimization System / Portfolio Intelligence.

## Aktueller UI-Stand

Der derzeitige aktive Entwicklungsstand liegt unter `ui83/index.html` und trägt intern bereits die Bezeichnung **HPOS UI v8.4**. Der Ordnername `ui83` ist historisch gewachsen und wird vorerst nicht umbenannt, damit bestehende Links und Tests nicht brechen.

## Datenprinzip

- **Parqet** ist die kanonische Quelle für Depotbestand, Stückzahlen und Cash-Snapshot.
- **Marktdaten** dürfen den Bestand nicht verändern; sie ergänzen nur Kurse bzw. Marktinformationen.
- **Scalable Capital** und **Trade Republic** bleiben die Orte der tatsächlichen Orderausführung.
- **HPOS** liest, normalisiert, analysiert und visualisiert. Es führt keine Broker-Orders aus.
- **Watchlist** ist von realen Depotbeständen getrennt zu behandeln.

## Repository-Regel ab jetzt

Neue Produktivarbeit erfolgt nur noch auf dem jeweils dokumentierten aktiven UI-Pfad. Alte Alpha-/UI-Stände werden nicht mehr als Ausgangsbasis verwendet.

Siehe `docs/REPOSITORY_STRUCTURE.md` für die Aufräum- und Archivierungslogik.
