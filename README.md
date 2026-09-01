# HPOS

Halal Portfolio Optimization System / Portfolio Intelligence.

## Aktueller Produktpfad

Die aktive HPOS-Anwendung liegt ab v8.5 unter:

- `app/index.html`
- `app/app.js`
- `app/styles.css`

Der bisherige Pfad `ui83/` bleibt als Weiterleitung bestehen, damit vorhandene Testlinks nicht brechen. Neue Produktivarbeit erfolgt ausschließlich unter `app/`.

## Datenprinzip

- **Parqet** ist die kanonische Quelle für Depotbestand, Stückzahlen, Einstand und Cash-Snapshot.
- **Marktdaten** dürfen den Bestand nicht verändern; sie ergänzen ausschließlich Kurse und Marktinformationen.
- **Scalable Capital** und **Trade Republic** bleiben die Orte der tatsächlichen Orderausführung.
- **HPOS** liest, normalisiert, analysiert und visualisiert. Es führt keine Broker-Orders aus.
- **Watchlist** ist ein eigenes lokales HPOS-Datenmodell und wird nicht in Depotwert oder Allokation gerechnet.
- Der historische Parqet-Fallback liegt als Datendatei unter `data/bootstrap/` und nicht mehr im UI-Code.

## Aktueller Funktionsstand

v8.5 enthält den Hybrid-Parqet-Sync, getrennte Marktpreis-Aktualisierung, dynamische Watchlist, Wertpapiersuche mit Adapter/Fallback, Investment-Akte und einen Broker-Workflow mit anschließendem Parqet-Abgleich.

Siehe `docs/REPOSITORY_STRUCTURE.md` für die Aufräum- und Archivierungslogik.
