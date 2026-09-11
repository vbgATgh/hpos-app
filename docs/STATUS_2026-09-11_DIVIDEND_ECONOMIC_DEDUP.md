# HPOS v8.7.47 – wirtschaftliche Dividendendubletten

## Anlass

v8.7.46 bestätigte die Monatsberechnung, zeigte die September-Ausschüttung jedoch weiterhin doppelt: 3,88 EUR statt der belegten 1,94 EUR. Die Parqet-Zeilen stimmten in Wertpapier, Buchungstag und angezeigtem Nettobetrag überein, unterschieden sich aber in nicht sichtbaren Nebenfeldern.

## Entscheidung

- Der wirtschaftliche Dublettenschlüssel besteht aus ISIN, UTC-Buchungstag, Währung und auf Cent gerundetem Nettobetrag.
- Abweichende technische Aktivitäts-ID, Millisekunden, Bruttodarstellung, Steuerdetail oder Stückzahlangabe erzeugen keine zweite Ausschüttung mehr.
- Bereits lokal gespeicherte Parqet-Dubletten werden beim Laden der App bereinigt.
- Ausschüttungen mit anderem Tag, anderer ISIN, anderer Währung oder anderem Centbetrag bleiben getrennt.

## Schutzgrenzen

- Parqet bleibt die kanonische Quelle.
- Keine Schätzung und keine manuelle Wertpapierzuordnung.
- Keine Änderung an Depot, Cash, Halal-Evidenz oder Quarantäne.
- Keine Speicherung persönlicher Ausschüttungsdaten im öffentlichen Repository.
