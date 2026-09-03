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

## Bewusste Nicht-Änderungen

- Der Watchlist-Add-Pfad besitzt derzeit noch einen Reload. Dieser wird nicht isoliert entfernt, solange `app.js` seine Watchlist intern kapselt. Ein vorschneller Fix würde entweder inkonsistenten UI-State oder eine zusätzliche Bridge-/Event-Architektur erzeugen. Erst realer Interaktionstest, dann Entscheidung.
- Der alte Cloudflare-Kompatibilitätspfad in `app.js`/Adapter bleibt bis zu einem gezielten Sync-Transport-Refactor bestehen. Er wird nicht nebenbei entfernt, weil der Adapter diesen Aufruf derzeit bewusst abfängt.

## Risiko-/Nutzenbewertung

Nutzen: weniger Start-Requests, weniger Reloads, weniger Konfigurationsdrift, gleiche bestehende Auth-Sicherheitslogik.

Risiko: OAuth-Callback benötigt weiterhin genau einen Refresh nach erfolgreicher Session-Übernahme. Das ist bewusst und wesentlich seltener als der bisherige regelmäßige Bootstrap-Reload.

## Nachweise

- Code-Commit: `32ec04e5c96b488c5f53d30ecf9b78705eff2644`
- Cache-Bust-Commit: `d11db005c6913c4c4f0effcfacc78049cfe9f3ed`
- Dokumentations-Commit: `c1974177a8b18594cee7676ce8b5caf1c00ba52b`
- GitHub Pages Run `33721889777` ist abgeschlossen mit `success`; der Auth-Light-Stand ist damit deployt.

Wichtig: Deployment-Erfolg ist kein Ersatz für den realen Browser-/PWA-Smoke. Der Lauf bestätigt nur Build und Veröffentlichung.

## Nächste reale Smoke-Fälle

1. Normaler App-Wiederaufruf nach >5 Minuten: kein zusätzlicher Start-Reload.
2. Manueller Refresh: Parqet-Sync bleibt funktionsfähig.
3. Ablauf/401: Reauth startet weiterhin korrekt.
4. OAuth-Rückkehr: Session wird übernommen und einmalig aktualisiert.
5. Search/Watchlist: reales Verhalten prüfen, bevor der verbleibende Add-Reload verändert wird.

## Review-Erkenntnis

Der aktuelle Frontendpfad wird nicht weiter vorauseilend optimiert. Die nächsten Änderungen erfolgen nur noch auf Basis real beobachteter Interaktionsprobleme oder eines klaren Pre-RC-Risikos. Damit vermeiden wir zusätzliche Event-Bridges, parallele Zustände und unnötige Runtime-Komplexität.
