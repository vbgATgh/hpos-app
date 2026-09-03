# HPOS Status · 03.09.2026 · Search Cache Regression

## Beobachtung

Auf dem iPhone erschien nach dem Discovery-/Identity-Review wieder die ältere Suchoberfläche (Depot/Watchlist/Instrumentkatalog + manuelle Verifikation) statt der aktuellen globalen Discovery-Suche. Dadurch wurden z. B. für `Byd` keine globalen Treffer angezeigt.

## Einordnung

Der Screenshot entspricht nicht der aktuellen kanonischen `app/index.html`-Suchoberfläche. Die aktuelle Shell beschreibt ausdrücklich die globale Suche nach Name/Ticker und lädt `search-guard.js`. GitHub Pages hatte den Identity-Stand erfolgreich deployed. Das Verhalten ist deshalb als Cache-/Shell-Regressionssignal zu behandeln und nicht als fachliche Entscheidung, die globale Suche wieder einzuschränken.

## Umsetzung

- sichtbare App-Version auf `v8.7.8` angehoben, damit der tatsächlich geladene Stand eindeutig erkennbar ist;
- Runtime-Version ebenfalls auf `8.7.8` synchronisiert;
- `search-guard.js` erhält einen neuen Cache-Key `20260903-searchfix1`;
- `app/index.html` enthält zusätzliche No-Cache-Meta-Hinweise;
- Root-Redirect ergänzt `build=20260903-searchfix1`, damit der kanonische App-Einstieg eine frische URL erhält.

## Validierung offen

Noch kein PASS für die globale Suche. Realer Regressionstest erforderlich:
1. App muss oben `v8.7.8` anzeigen.
2. Suche `BYD` oder `Microsoft`.
3. Erwartet: Abschnitt `Globale Treffer` mit Trefferzahl und auswählbaren Vorschauen.
4. Alte Maske `EXAKT PRÜFEN` darf nicht mehr erscheinen.

Wenn trotz `v8.7.8` weiterhin die alte Suchmaske erscheint, liegt ein echter Runtime-Konflikt zwischen der Basissuche in `app.js` und `search-guard.js` vor; dann wird die Suchverantwortung im nächsten Schritt technisch auf genau einen Owner reduziert.
