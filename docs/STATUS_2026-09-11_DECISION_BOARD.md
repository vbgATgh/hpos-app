# HPOS v8.7.48 – Entscheidungsboard

## Zweck

Das Entscheidungsboard verdichtet den validierten Depotstand zu nachvollziehbaren Entscheidungsvorlagen. Es erzeugt keine Orders und ersetzt keine Kapitalentscheidung des Nutzers.

## Verbindliche Reihenfolge

1. Halal
2. Portfolio Fit
3. Thesis
4. Fundamentals
5. Valuation
6. Timing
7. News Evidence
8. Execution

Ein offenes oder nicht bestandenes früheres Gate blockiert alle späteren Freigaben. Momentum, Dividende oder Kursentwicklung können Gate 1 nicht überstimmen.

## Board-Zustände

- `PRÜFUNG OFFEN`: Gate 1 ist nicht vollständig belegt. Kleinster nächster Schritt ist das Schließen der AAOIFI-Evidenzlücke.
- `FREEZE`: Gate 1 ist bestanden, Gate 2 aber noch nicht entscheidbar. Keine Aufstockungsfreigabe.
- `REVIEW`: Gate 1 ist bestanden und der Positionswert liegt unter dem Review-Trigger von 300 Euro. Rolle und Zielgewicht müssen belegt werden.
- `EXIT-REVIEW`: Gate 1 ist nicht bestanden. Auswirkungen eines Ausstiegs werden geprüft; es wird keine automatische Verkaufsorder erzeugt.

## Schutzgrenzen

- Parqet bleibt kanonische Quelle für Bestand und Cash.
- Das Board schreibt weder Portfolio- noch Halal-Daten.
- Ohne freigegebene Toleranzbänder und Konzentrationsgrenzen bleibt Gate 2 offen.
- Orders werden ausschließlich beim Broker ausgeführt.
