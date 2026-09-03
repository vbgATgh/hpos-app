# HPOS Zwischenstand & Review · 03.09.2026

## Zwischenstand

- Portfolio/Parqet, Watchlist, globale Suche und Investment-Akte funktionieren als getrennte Ebenen.
- Globale Treffer können ohne Watchlist-Zwang als `VORSCHAU` geöffnet werden.
- Sektor, Branche und Unternehmensprofil/Fundamentaldaten werden on-demand geladen und lokal gecacht.
- Offene Identitäten bleiben für Halal, Thesis, Decision Gates und Broker-Entscheidungen gesperrt.
- Die Investment-Akte bietet eine fail-closed Identitätsprüfung; nur eine eindeutige verifizierte ISIN darf promoted werden.
- Der Runtime-Ausbau bleibt leichtgewichtig: keine neue Hintergrundschleife, kein neuer Discovery-State, kein weiterer UI-Screen.

## Review: neue Erkenntnisse

### 1. Ticker allein ist kein stabiler Discovery-Schlüssel
Ein Unternehmen kann an mehreren Börsen mit verschiedenen oder teilweise identischen Symbolen erscheinen. Ein reiner Ticker-Schlüssel kann Watchlist-Treffer zusammenwerfen oder die falsche Börsen-Variante als bereits gespeichert markieren.

Entscheidung: Solange keine ISIN verifiziert ist, nutzt HPOS `Ticker + Börsenplatz` als Discovery-Identität. Sobald eine ISIN verifiziert ist, bleibt die ISIN der kanonische Schlüssel.

### 2. Verifikation darf einen bestehenden Watchlist-Eintrag nicht verlieren
Wenn eine offene Watchlist-Beobachtung später eine verifizierte ISIN erhält, darf sie nicht als neuer, separater Wert erscheinen.

Entscheidung: Eine erfolgreiche Identitätsprüfung promoted den vorhandenen Discovery-Eintrag auf die verifizierte Identität und bewahrt den ursprünglichen Watchlist-Zeitpunkt.

### 3. Börsenplatz gehört zur Vorschau
Bei globalen Treffern ist der Börsenplatz für die Auswahl relevant. Er wird deshalb in der Investment-Akte sichtbar gezeigt. Der technische Datenquellenstatus wird ebenfalls transparent angezeigt.

## Direkt umgesetzt

- Discovery-Key von `Ticker` auf `Ticker + Börsenplatz` gehärtet.
- Watchlist-Migration auf denselben Schlüssel umgestellt.
- Promotion einer gespeicherten offenen Watchlist-Identität auf die verifizierte ISIN ergänzt.
- Identitätsprüfung priorisiert bei mehreren Kandidaten denselben Börsenplatz, bleibt aber fail-closed.
- Vorschau zeigt Börsenplatz, Identitätsstatus und Datenquelle explizit.
- Ein bereits verifizierter Vorschauwert zeigt keinen erneut ausführbaren Identitäts-Button.
- Cache-Key `search-guard.js` auf `20260903-identity3` angehoben.

## Noch offen

- Reale iPhone-Prüfung des neuen `Identität prüfen`-Flows, insbesondere IVU und Microsoft.
- Small-/Mid-Cap-Unternehmensporträts haben je nach Datenquelle noch Coverage-Lücken.
- Vor einer Sektor-Gewichtungsvisualisierung muss die Sektor-Coverage des Depotbestands gemessen werden.
- Der verbleibende Watchlist-Reload wird nur bei realem UX-/State-Nachteil ersetzt; kein vorsorglicher State-Overhead.

## Leitplanke

HPOS bleibt schlank: neue Informationen werden bevorzugt in bestehenden Ansichten ergänzt. Zusätzliche States, Hintergrundprozesse oder Module werden nur eingeführt, wenn ein konkretes Problem sie rechtfertigt.
