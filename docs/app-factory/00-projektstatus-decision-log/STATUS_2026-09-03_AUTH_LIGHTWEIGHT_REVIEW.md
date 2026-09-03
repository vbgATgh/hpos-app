# HPOS Status — Lightweight Parqet Auth Review

Datum: 2026-09-03

## Anlass

Nach dem realen iPhone-Home-Smoke wurde der verbleibende Parqet-/Reauth-Pfad auf unnötige Reloads, doppelte Requests und Versions-/Konfigurationsdrift geprüft. Leitplanke: kein Feature-Ausbau, sondern weniger Laufzeitgewicht und weniger versteckte Seiteneffekte.

## Gefundene Lücke

`parqet-supabase-adapter.js` führte bei bestehender Parqet-Session bei jedem App-Start einen zusätzlichen Live-Bootstrap aus, sobald der gespeicherte Live-State älter als 5 Minuten war. Nach erfolgreichem Fetch folgte `location.reload()`. Parallel besitzt `app.js` bereits die kanonische Refresh-Logik mit eigenem Altersfenster und manuellem Refresh.

Folge: unnötiger zusätzlicher Request und ein sichtbarer Start-Reload bei normalen Wiederaufrufen der App.

## Umsetzung

- Der Adapter bootstrapped Parqet nicht mehr bei jedem normalen App-Start.
- Ein sofortiger Adapter-Refresh bleibt nur direkt nach einem erfolgreich erkannten OAuth-Callback (`#parqet=connected...`) erhalten, damit die neue Session unmittelbar in einen validierten State überführt wird.
- Normale Refresh-Taktung bleibt bei `app.js`; Transport/Auth bleibt im Adapter.
- Die Supabase-API-Basis wird im Adapter jetzt aus `HPOS_RUNTIME.integration.parqetBaseUrl/baseUrl` gelesen. Der bisher doppelt hart hinterlegte Supabase-Endpunkt bleibt nur als Fail-safe-Fallback.
- Cache-Bust für den Adapter: `20260903-authlight1`.

## Reales iPhone-Smoke-Ergebnis 03.09.2026

Beim erneuten Öffnen der App um ca. 08:48 lief der grüne Refresh-Indikator automatisch an. Der letzte validierte Bestandsstand lag bei 07:11 und war damit deutlich älter als das in `app.js` definierte Auto-Sync-Fenster von 15 Minuten.

Bewertung: **kein Seiten-Reload und kein Rückfall des alten Adapter-Bootstraps**. Beobachtet wurde der kanonische, bewusst vorhandene Auto-Sync aus `app.js`. Zusätzlich darf beim Zurückkehren in den Vordergrund nach mehr als 30 Minuten ein Sync gestartet werden.

Entscheidung: Auto-Sync bleibt bestehen. Für eine Portfolio-App ist ein frischer Datenstand nach längerer Pause sinnvoll. Optimierungsziel ist nicht, jede automatische Aktualisierung zu entfernen, sondern doppelte Requests und komplette Seiten-Reloads zu vermeiden.

## Search-/Watchlist-Code-Review

Die Suche selbst ist weiterhin fail-closed: Nur formal gültige und extern bzw. katalogseitig bestätigte ISINs können in die Watchlist gelangen. Depotwerte werden nicht erneut als Watchlist-Werte übernommen.

Es existieren derzeit noch zwei gezielte `location.reload()`-Pfade nach einem erfolgreichen Watchlist-Add:

- `search-guard.js` nach dem Hinzufügen aus einem verifizierten Suchtreffer.
- `watchlist-policy.js` nach dem Hinzufügen aus einer Investment-Akte.

Diese Reloads sind seltene Mutationspfade und keine Hintergrundlast. Sie werden **nicht vorschnell durch zusätzliche Event-/State-Bridges ersetzt**, solange der reale iPhone-Test keinen störenden Sprung, State-Verlust oder Cachefehler zeigt. Damit bleibt die Architektur kleiner und konsistenter.

## Bewusste Nicht-Änderungen

- Die beiden Watchlist-Add-Reloads bleiben bis zum realen Interaktionstest bestehen.
- Der alte Cloudflare-Kompatibilitätspfad in `app.js`/`quote-policy.js` bleibt bis zu einem gezielten Sync-Transport-Refactor bestehen. Er wird nicht nebenbei entfernt, weil `quote-policy.js` den Legacy-Host derzeit kontrolliert auf die aktive Runtime-Integration routet und gleichzeitig Kurs-Plausibilitätsregeln erzwingt.

## Risiko-/Nutzenbewertung

Nutzen: weniger Start-Requests, weniger Reloads im normalen Startpfad, weniger Konfigurationsdrift, gleiche bestehende Auth-Sicherheitslogik.

Risiko: OAuth-Callback benötigt weiterhin genau einen Refresh nach erfolgreicher Session-Übernahme. Watchlist-Adds führen aktuell noch zu einem einmaligen Reload. Beide Pfade sind bewusst begrenzt und werden im Mobile-Smoke separat geprüft.

## Nachweise

- Code-Commit Auth-Light: `32ec04e5c96b488c5f53d30ecf9b78705eff2644`
- Cache-Bust-Commit: `d11db005c6913c4c4f0effcfacc78049cfe9f3ed`
- GitHub Pages Run `33721889777` ist abgeschlossen mit `success`; der Auth-Light-Stand ist damit deployt.
- Reales iPhone-Smoke: Auto-Sync nach >15 Minuten beobachtet, ohne Nachweis eines kompletten Seiten-Reloads.

Wichtig: Deployment-Erfolg ist kein Ersatz für den realen Browser-/PWA-Smoke. Der Lauf bestätigt nur Build und Veröffentlichung.

## Nächste reale Smoke-Fälle

1. Manueller Refresh: Parqet-Sync bleibt funktionsfähig und endet sauber.
2. Search → verifizierten Kandidaten öffnen/hinzufügen: Reload-Verhalten, Tastatur und Rückkehr prüfen.
3. Watchlist-Akte → hinzufügen/entfernen: State nach Reload bzw. erneutem Öffnen prüfen.
4. Ablauf/401: Reauth startet weiterhin korrekt.
5. OAuth-Rückkehr: Session wird übernommen und einmalig aktualisiert.
6. Danach kurzer Review: nur bei realem Nutzen Reload-Pfade oder Legacy-Transport weiter vereinfachen.

## Review-Erkenntnis

Der aktuelle Frontendpfad wird nicht weiter vorauseilend optimiert. Automatische Aktualisierung ist nicht automatisch Ballast; problematisch sind doppelte Verantwortlichkeiten, parallele Zustände und unnötige komplette Reloads. Die nächsten Änderungen erfolgen nur noch auf Basis real beobachteter Interaktionsprobleme oder eines klaren Pre-RC-Risikos.
