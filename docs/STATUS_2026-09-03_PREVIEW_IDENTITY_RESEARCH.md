# HPOS Status · 03.09.2026 · Preview Identity & Research

## Umgesetzt

- Globale Suchtreffer können als reine Vorschau geöffnet werden, ohne Watchlist-Zwang.
- Der Portfolio-Status einer nicht gespeicherten Vorschau heißt jetzt `VORSCHAU` statt `BEOBACHTUNG`, damit Watchlist und reine Ansicht sprachlich getrennt bleiben.
- Offene globale Treffer erhalten in der Investment-Akte die Aktion `Identität prüfen`.
- Die Identitätsprüfung arbeitet fail-closed: Sie prüft vorhandenen Asset-Katalog sowie externe Suchtreffer und übernimmt nur dann eine ISIN, wenn genau ein eindeutiger verifizierter Kandidat zum Ticker bzw. Namen passt. Bei keinem oder mehreren Kandidaten bleibt die Identität offen.
- Eine offene Identität schaltet Halal-, Thesis-, Decision-Gate- und Broker-Entscheidungen weiterhin nicht frei.
- `hpos-profile` wurde um zusätzliche fundamentale Felder erweitert: Market Cap, KGV, Dividendenrendite, 52-Wochen-Spanne, Umsatz, Umsatzwachstum, Margen und Debt/Equity, sofern die Quelle diese liefert.
- `asset-intelligence.js` nutzt diese Profildaten als Fallback für Investment-Kennzahlen, wenn der reguläre Quote-Pfad keine ausreichenden Kennzahlen liefert.
- Profil-Cache auf `hpos_asset_profiles_v2` angehoben, damit alte unvollständige Profile nicht weiterverwendet werden.

## Architekturentscheidung

Die globale Suche bleibt eine Discovery-Ebene. Eine Vorschau darf ohne ISIN angezeigt werden. Kanonische Investment-Entscheidungen setzen weiterhin eine verifizierte ISIN voraus. Es wird kein separater Discovery-State und kein zusätzlicher Hintergrunddienst eingeführt.

## Offene Punkte

- Nicht jeder Börsenticker lässt sich mit den aktuell verfügbaren Quellen eindeutig auf eine ISIN auflösen. HPOS darf das nicht erraten.
- Bei einzelnen Small-/Mid-Caps liefern die aktuellen Profildaten kein belastbares Firmen-Kurzprofil. Diese Lücke bleibt sichtbar, bis eine zusätzliche verlässliche Quelle ausgewählt ist.
- Sektor-/Branchen-Coverage muss über das Gesamtdepot gemessen werden, bevor eine Portfolio-Sektorverteilung als belastbar visualisiert wird.

## Review-Erkenntnis

Die Trennung `VORSCHAU → WATCHLIST → VERIFIZIERTE IDENTITÄT → EVIDENZ/ENTSCHEIDUNG` ist verständlicher und sicherer als ein Zwang, globale Treffer zuerst zu speichern. Zusätzliche Research-Daten werden nur on-demand geladen; keine dauerhafte Hintergrundlogik wurde ergänzt.
