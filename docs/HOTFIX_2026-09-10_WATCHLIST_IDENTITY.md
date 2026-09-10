# HPOS v8.7.43 – eindeutige Watchlist-Identität

## Fehlerbild

Der produktive Gerätetest von v8.7.42 bestätigte Medtronic als sechsten halalkonformen Wert. Gleichzeitig wurden im Laufbericht nur fünf statt sechs offizielle Berichtswerte erkannt. Johnson & Johnson blieb beim alten tickerbasierten Watchlist-Eintrag, obwohl der neue ISIN-zentrierte Berichtsdatenbestand produktiv vorhanden war.

## Ursache

Ältere Watchlist-Einträge können nur Name und Ticker enthalten. Die kuratierte Finanzdatendatei ist absichtlich ausschließlich über die ISIN adressiert. Ohne Migration konnte der Eintrag `JNJ` daher nicht mit `US4781601046` verbunden werden.

## Korrektur

- Nach dem Laden der lokalen, verifizierten Marktkonfiguration werden alte Watchlist-Einträge ohne ISIN geprüft.
- Eine automatische Ergänzung erfolgt nur, wenn der Ticker exakt einen aktivierten Eintrag mit syntaktisch gültiger ISIN trifft.
- Mehrdeutige oder fehlende Treffer bleiben unverändert offen.
- Doppelte Watchlist-Einträge und bereits im Depot vorhandene Instrumente werden nicht erzeugt.
- Für Johnson & Johnson ist die lokale Zuordnung eindeutig: `JNJ` → `US4781601046`.

## Schutzgrenzen

- Die Migration verwendet keine externe Suche, kein Konto und keinen API-Key.
- Sie verändert weder Depotpositionen noch Parqet-Daten.
- Sie erzeugt keine neue Halal-Einstufung. Johnson & Johnson bleibt wegen der fehlenden bezifferten leasingbereinigten Schuldenkennzahl `OPEN_REVIEW`.

