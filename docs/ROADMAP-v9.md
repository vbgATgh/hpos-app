# HPOS – Roadmap bis v9 Release Candidate

Stand: 30.08.2026

## Zielbild

HPOS bleibt Analyse-, Entscheidungs- und Orchestrierungsschicht. Tatsächliche Orders werden ausschließlich in Scalable Capital oder Trade Republic ausgeführt. Parqet bleibt die kanonische Quelle zur nachgelagerten Bestandsnormalisierung. Die UI erfindet keine Investment-, Halal-, Steuer- oder Marktdaten.

## Verbindliche Reihenfolge

### P0 – Datenintegrität und Stabilität

1. Wertpapiersuche und ISIN-Verifizierung vollständig stabilisieren.
2. Parqet-Synchronisation atomar und fehlertolerant machen.
3. Marktdatenprovider, Währung und Börsenplatz sauber normalisieren.
4. State-Schema versionieren und Migrationen absichern.

### P1 – Investment-Akte und Intelligence

5. Investment-Akte um belegte Kennzahlen erweitern: Kurs, Tagesperformance, Einstand, absoluter/prozentualer G/V, Depotgewicht, Rolle, Dividenden, Halal-Evidenz, relevante Fundamentaldaten und Evidenz.
6. Halal-Register mit Quelle, Prüfdatum und Konfliktbehandlung anbinden.
7. Entscheidungsraum ausschließlich aus HPOS-Regelwerk speisen.

### P2 – Income und Visualisierung

8. Dividendenmodul um Monats-Ist/Ziel, 12-Monats-Verlauf, erwartete Ausschüttungen, Forward Income und Titelbeiträge erweitern.
9. Allokation, Performance, Cash und Income mit belastbaren Charts visualisieren.
10. UI-Farbpalette und visuelle Dichte final feinjustieren, ohne Datenlogik erneut umzubauen.

### P3 – Release Candidate

11. Altverzeichnisse und historische UI-Prototypen archivieren oder entfernen.
12. Regressionstest: Home, Navigation, Portfolio, Watchlist, Suche, Investment-Akte, Parqet Refresh, Kurse, Income, Mehr-Module.
13. Performance-Test auf iPhone Safari/PWA.
14. v9 Release Candidate markieren.

## Aktueller Fortschritt

- UI / Navigation: 88 %
- Portfolio / Parqet: 65 %
- Marktdaten: 65 %
- Suche / Watchlist: 75 %
- Investment-Akte: 55 %
- Income: 55 %
- Analyse / Decision Layer: 40 %
- Halal / Evidenz: 30 %
- Stabilisierung / Release-Reife: 60 %
- Gesamt: ca. 70 %

## Nicht verhandelbare Leitplanken

- Keine freie Watchlist-Übernahme ungeprüfter Instrumente.
- ISIN ist nach Verifizierung der kanonische Instrumentenschlüssel.
- Kein Depotbestand wird durch die UI manuell verändert.
- Kein BUY/SELL aus reiner UI-Heuristik.
- Keine erfundenen Halal-, Dividenden-, Steuer-, Fundamental- oder Newsdaten.
- Bei Providerfehler bleibt der letzte valide State erhalten.
- Änderungen an Datenlogik werden vor kosmetischen Umbauten priorisiert.
