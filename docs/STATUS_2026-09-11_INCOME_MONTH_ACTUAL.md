# HPOS v8.7.46 – Monats-Ist aus validierten Ausschüttungen

## Anlass

Die Income-Liste zeigte Parqet-Ausschüttungen, während der Monats-Ist-Wert 0,00 EUR meldete. Das Income-Hardening bevorzugt den laufenden HPOS-State; dieser Live-Snapshot enthielt bislang jedoch keine Dividenden.

## Entscheidung

- Der lokale Live-Snapshot stellt neben Positionen und Cash nun auch die bereits validierten Dividenden bereit.
- Die vorhandene Monatslogik summiert weiterhin ausschließlich Netto-Ausschüttungen mit einem Buchungsdatum im aktuellen Kalendermonat.
- Es werden keine erwarteten oder hochgerechneten Ausschüttungen als Ist-Wert verwendet.

## Schutzgrenzen

- keine Veränderung an Parqet, Positionen, Cash, Halal-Evidenz oder Quarantäne
- keine Übertragung persönlicher Dividendendaten an GitHub oder eine neue Datenbanktabelle
