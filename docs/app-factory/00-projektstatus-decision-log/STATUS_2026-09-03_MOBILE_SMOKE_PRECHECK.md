# HPOS Mobile/Safari/PWA Smoke Precheck · 2026-09-03

## Zweck
Vor dem realen iPhone-/Safari-/PWA-Smoke wurde der aktuell deployte kanonische Pfad statisch auf Update-, Einstieg-, Performance- und Runtime-Inkonsistenzen geprüft. Nicht auf einem realen iPhone ausgeführte Punkte bleiben offen.

## Tatsächlich geprüft
- GitHub Pages Deployment des kanonischen Einstieg-Fixes erfolgreich: Run `33681993348`, Build und Deploy = success.
- `app/live.html` ist nur noch Redirect auf `index.html`; keine zweite App-Shell mehr.
- `manifest.webmanifest`: `start_url` und `scope` jeweils `./`, `display: standalone`.
- `index.html` enthält iOS/PWA-Metatags und Safe-Area-fähige CSS-Basis.
- Default-Branch-Suche: kein aktiver `serviceWorker.register`, kein `MutationObserver`, kein `setInterval` im aktuellen Frontendcode gefunden.
- `mvp-hardening.js` und `verification-status.js` arbeiten ereignis-/lazy-basiert statt mit globaler DOM-Dauerbeobachtung.

## Behobene Inkonsistenz
`app/index.html` zeigte bereits `v8.7.7`, während `app/runtime-config.js` intern noch `version: 8.7.5` führte. Das erzeugte zwei unterschiedliche Versionswahrheiten und hätte Diagnose-/Cachefehler erschweren können.

Behoben:
- `runtime-config.js` auf `8.7.7` angehoben.
- eigener Runtime-Cache-Key `20260903-runtime1` in `index.html`, damit Safari/Edge nicht still den alten Runtime-Config-Stand weiterverwenden.

Commits:
- `8f7c7ccc...` Runtime-Version synchronisiert
- `e61a10b2...` Runtime-Cache-Bust

## Neu erkannte Pre-RC-Risiken
### RISK-MOB-001 · Versteckter Legacy-Host im Hauptcode
`app/app.js` enthält weiterhin `const WORKER='https://hpos-proxy.vbginbox.workers.dev'`. `quote-policy.js` rewritet diesen Legacy-Host zur Laufzeit auf die aktive Supabase-Base-URL. Funktional kann das korrekt laufen, architektonisch ist es aber ein versteckter Compatibility-Pfad und widerspricht dem Ziel eines sauberen direkten Supabase-Routings.

Bewertung: vor Final-Cleanup beseitigen, aber nicht mitten im Mobile-Smoke ohne Regression umstellen.

### RISK-MOB-002 · Vollständiger Reload beim Watchlist-Add
`app/watchlist-policy.js` führt nach erfolgreichem verifiziertem Watchlist-Add `location.reload()` aus. Das ist kein Datenfehler, aber unnötig schwergewichtig und kann Cache-/PWA-Reibung erzeugen.

Bewertung: nach dem realen Mobile-Smoke prüfen, ob der Reload sichtbar stört. Nur dann auf event-driven Aktualisierung umstellen; keine vorsorgliche Zusatzarchitektur.

## Reeller iPhone-/Safari-/PWA-Smoke – noch OFFEN
Folgende Punkte müssen auf dem Gerät beobachtet werden und dürfen vorher nicht als PASS gelten:
1. Öffnen über bisherigen `live.html`-Link landet direkt auf `index.html` und zeigt v8.7.7.
2. Normaler Reload zeigt weiterhin v8.7.7, kein Rückfall auf ältere Builds.
3. Home, Portfolio, Analyse, Income, Mehr ohne Flackern/Sackgasse.
4. Investment-Akte: Scroll, Back, „Warum sagt HPOS das?“, Halal-Status verständlich.
5. Suchdialog: Tastatur, Close, exakte ISIN-Suche, Scroll in Treffern.
6. Watchlist hinzufügen/entfernen; beobachten, ob Reload störend oder Cache-anfällig ist.
7. `↻` Refresh: klarer Status, kein doppeltes Starten, kein Freeze.
8. Safari in Hintergrund und zurück: kein unnötiger Reload; Sync nur nach bestehender Zeitregel.
9. Zum Home-Bildschirm hinzufügen / PWA öffnen: standalone, Safe Areas korrekt, Navigation bedienbar.
10. Parqet OAuth/Reauth-Rücksprung im Safari/PWA-Kontext separat nach dem Basis-Smoke.

## Leitplanke
Keine zusätzliche PWA-/Service-Worker-Schicht einführen, solange der reale Smoke keinen konkreten Bedarf zeigt. Ziel bleibt: möglichst wenig Runtime-State, keine Dauer-Poller, keine zweite App-Shell und keine versteckten Parallelpfade.
