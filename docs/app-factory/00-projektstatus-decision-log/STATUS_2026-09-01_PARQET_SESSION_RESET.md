# HPOS – Parqet Session Reset 2026-09-01

Status: RECOVERY STEP IMPLEMENTED / BROWSER REAUTH REQUIRED

## Befund

Der produktive Supabase-Parqet-Pfad war zuvor erfolgreich nachgewiesen (`PARQET LIVE SYNC`, 19 aktive Positionen, 246,73 EUR Cash). Im späteren Browserlauf fiel der Bestand wieder auf den letzten validierten State zurück. Die UI meldete `Supabase/Parqet HTTP 502 · internal_error`, während Search und Quotes über Supabase real mit HTTP 200 funktionierten.

Die serverseitige Session-Tabelle enthielt mehrere parallel entstandene Parqet-Sessions aus früheren OAuth-Testläufen. Die zuletzt gespeicherten Access Tokens waren abgelaufen; mehrere Sessionzeilen konnten dadurch als zusätzliche Fehlerquelle für den Browserzustand nicht ausgeschlossen werden.

## Durchgeführte Maßnahmen

- `app/parqet-supabase-adapter.js` gehärtet.
- Auth-/Sessionfehler werden explizit als Reauth behandelt.
- Bei einem `502 internal_error` wird höchstens einmal ein sauberer OAuth-Neuaufbau ausgelöst; eine Redirect-Schleife wird über einen lokalen Guard verhindert.
- Der historische Parqet-Compatibility-Pfad darf einen vorhandenen validierten lokalen Portfolio-State nicht mehr durch einen weiteren redundanten Backendabruf verdrängen.
- Bestehende serverseitige `hpos_parqet_sessions` wurden kontrolliert gelöscht. Ergebnis unmittelbar nach Cleanup: 0 Sessions.
- Portfolio- und Watchlist-Daten wurden durch diesen Cleanup nicht verändert. Der Browser behält den letzten validierten State, bis ein neuer Parqet-Live-Sync erfolgreich abgeschlossen ist.
- Testbuild `app/live.html` auf `v8.7.5-live9` angehoben.

## Nächster notwendiger Schritt

Ein einmaliger neuer OAuth-Login im Browser ist erforderlich, weil alle alten serverseitigen HPOS-Parqet-Sessions bewusst invalidiert wurden. Danach ist zu prüfen, ob `/api/parqet/normalized` wieder 19 aktive Positionen und 246,73 EUR Cash liefert und die UI `PARQET LIVE SYNC` zeigt.

## Gate-Regel

Der Parqet-Livepfad wird erst nach diesem erneuten Browsernachweis wieder als aktuell bestanden gewertet. Der letzte validierte Depot-State darf bei Fehlern weiterhin nicht überschrieben werden.
