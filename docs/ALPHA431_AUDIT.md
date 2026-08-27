# HPOS Alpha 4.3.1 – Audit

## Ergebnis
- CI: grün
- Browser Smoke: Home, Depot, Income, Analyse, News grün
- Marktdaten: 19/19 reale Depotpositionen konfiguriert; Live-Audit ohne Fehler, 21 aktivierte Marktassets CURRENT
- Savaria und Cardinal Energy besitzen jetzt 5Y/Intraday-Zeitreihen
- News Discovery: 42/42 Abfragen erfolgreich, 19 Depotwerte vollständig im Scope, 18/60 Watchlistwerte im aktuellen Rotationslauf
- Test-/Import-Invarianten: grün, Patch idempotent

## UX
- klickbare Home-, Income- und Analyse-Kacheln
- Zeitraumwahl: Aktuell, 7T, 30T, 1J, YTD, Max; historische Werte klar als gewichtete Kursentwicklung des aktuellen Bestands gekennzeichnet, nicht als TWR/IZF
- besser lesbarer und anklickbarer Depot-Donut
- deutlich unterscheidbare Broker-Badges
- Top Mover Gewinner / Verlierer
- Income: TTM-Ist-Rate, Zielgrad, Monats-Gap
- Kontextnavigation/Breadcrumbs für Haupt- und Unterbereiche
- Newsfilter: Alle, Mein Depot, Scalable, Trade Republic, Watchlist
- Asset-Tabs um Datenbasis/Abdeckung ergänzt

## Bewusste Grenzen
- keine erfundenen Halal-Screenings
- Zeitraum-Performance ist noch keine vollständige cashflowbereinigte historische Depot-Performance
- offizielle Firmen-/Brokerlogos sind als spätere Design-Optimierung zurückgestellt
