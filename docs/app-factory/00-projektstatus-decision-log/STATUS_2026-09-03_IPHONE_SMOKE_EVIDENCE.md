# HPOS iPhone Smoke Evidence · 2026-09-03

## Nachweisbasis
Zwei reale Screenshots vom 03.09.2026 gegen den deployten HPOS-Build `v8.7.7`.

## Tatsächlich sichtbar nachgewiesen
- HPOS zeigt in beiden Screens `Portfolio Intelligence · v8.7.7`.
- Depotbestand: 19 Positionen.
- Datenquelle: `PARQET LIVE SYNC` mit Bestandszeitpunkt 03.09., 07:11.
- Cash: 690,13 EUR.
- Watchlist: 1.
- Halal offen: 19.
- Nutzerverständliche Statusübersetzung ist aktiv:
  - `Depotdaten` → `Geprüfter Stand`
  - `Kurse` → `Gespeicherter Stand`
- Bottom-Navigation ist auf iPhone sichtbar und nicht von der Safe Area abgeschnitten.
- Header und Aktionsbuttons sind sichtbar und innerhalb des Viewports.
- Home-Layout ist ohne offensichtlichen horizontalen Overflow oder abgeschnittene Kerninhalte sichtbar.
- Ein Screenshot zeigt HPOS ohne sichtbare Browser-Adressleiste; ein weiterer zeigt HPOS in einem iPhone-Browserkontext mit sichtbarer Adressleiste. Daraus wird kein Safari-spezifischer PASS abgeleitet.

## Noch nicht aus Screenshots als PASS ableitbar
- Suchdialog inklusive Tastaturverhalten.
- Navigation durch Portfolio, Analyse, Income und Mehr.
- Investment-Akte inklusive Zurück-Navigation.
- Watchlist hinzufügen/entfernen ohne unerwünschten Reload-/Cache-Effekt.
- Refresh während Providerfehler/401 und Recovery.
- OAuth-/Reauth-Rücksprung im Browser- und installierten App-Kontext.
- PWA-Installation/Start aus dem Home-Screen ist anhand der Bilder allein nicht zweifelsfrei nachgewiesen.
- Safari-spezifischer Primärfluss ist nicht zweifelsfrei nachgewiesen.

## Bewertung
`HOME MOBILE VISUAL SMOKE = PASS` für den sichtbaren Startzustand von v8.7.7.

Kein Gesamt-PASS für Safari/PWA. Der nächste Testblock soll nur die noch offenen Interaktionen abdecken und keine neue Funktionalität hinzufügen.
