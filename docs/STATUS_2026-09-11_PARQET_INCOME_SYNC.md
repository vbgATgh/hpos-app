# HPOS v8.7.44 – validierte Parqet-Ausschüttungen

## Anlass

Die produktive Income-Seite konnte Ausschüttungen darstellen, der normalisierte Parqet-Pfad lieferte bisher jedoch ausschließlich Positionen und Cash. Dadurch blieb eine bei Scalable Capital belegte Dividende in HPOS unsichtbar.

## Entscheidung

- Ausschüttungen werden über den bestehenden, sitzungsgeschützten Parqet-Connect-Endpunkt gelesen.
- Verwendet wird ausschließlich `portfolio:read`; HPOS schreibt keine Aktivität nach Parqet.
- Der Abruf ist auf `activityType=dividend` und maximal 500 Datensätze begrenzt.
- Nur Datensätze mit gültiger ISIN, Datum, eindeutiger ID und nichtnegativen Beträgen werden übernommen.
- Dubletten werden anhand der Parqet-Aktivitäts-ID verworfen.
- Fällt der Aktivitätsabruf aus, bleibt der validierte Positions- und Cash-Abgleich funktionsfähig. Der Income-Status wird dann als `UNAVAILABLE` markiert.
- Ausschüttungen verbleiben im privaten lokalen Portfolio-State des Browsers. Es werden keine persönlichen Transaktionszeilen in GitHub oder einer neuen Supabase-Tabelle gespeichert.

## Beleg vom 10.09.2026

Der vorgelegte Scalable-Capital-Beleg weist 1,94 EUR brutto und netto für acht berechtigte Anteile aus; Steuer und zu versteuernder Betrag sind 0,00 EUR. Der sichtbare Ausschnitt enthält keine Wertpapierbezeichnung oder ISIN. Deshalb wird der Beleg nicht manuell einem Titel zugeordnet. Die eindeutige Zuordnung erfolgt über die ISIN der Parqet-Aktivität.

## Schutzgrenzen

- keine neue Konto- oder API-Verbindung
- keine Broker-Schreibrechte
- keine Veröffentlichung persönlicher Transaktionsdaten
- keine Veränderung der Depotvalidierung, Quarantäne oder Halal-Einstufungen
