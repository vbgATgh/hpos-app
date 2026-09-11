# HPOS v8.7.45 – fachliche Dividendendubletten entfernt

## Anlass

Nach der ersten produktiven Parqet-Ausschüttungssynchronisierung erschienen zahlreiche Buchungen doppelt. Die Datensätze besaßen unterschiedliche Aktivitäts-IDs, waren wirtschaftlich jedoch identisch. Sichtbar war insbesondere die technisch gleichbedeutende Zeitdarstellung `00:00:00Z` und `00:00:00.000Z`.

## Entscheidung

- Parqet-Aktivitäts-IDs bleiben als Herkunftsnachweis erhalten, sind aber nicht mehr der alleinige Dublettenschlüssel.
- Ausschüttungen werden zusätzlich anhand von ISIN, UTC-Buchungstag, Brutto, Netto, Steuer, Gebühr, Stückzahl und Währung abgeglichen.
- Der Schutz greift in der Edge Function und nochmals im Browseradapter.
- Zeitstempel werden vor der Speicherung einheitlich als ISO-Zeit ausgegeben.
- Unterschiedliche Beträge, Stückzahlen, Steuerwerte oder Währungen bleiben getrennte Buchungen.

## Schutzgrenzen

- keine Veränderung an Positionen, Cash, Halal-Evidenz oder Quarantäne
- keine neue Datenquelle und kein zusätzlicher Account
- keine Speicherung persönlicher Ausschüttungsdaten im öffentlichen Repository
