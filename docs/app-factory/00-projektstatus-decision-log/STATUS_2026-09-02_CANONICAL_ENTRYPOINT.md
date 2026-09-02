# HPOS Status · 02.09.2026 · Canonical Entry Point

## Anlass
Beim visuellen/UX-Review wurde eine relevante Inkonsistenz zwischen `app/index.html` und `app/live.html` festgestellt.

`index.html` war bereits auf v8.7.7 mit aktuellem Cache-Key, Watchlist-Policy, Verification-UX und MVP-Hardening. `live.html` enthielt dagegen weiterhin eine eigene, ältere App-Shell (v8.7.6-live) und lud nicht alle aktuellen Runtime-Module. Da `live.html` in der Praxis als aufgerufener/bookmarkter Einstieg verwendet wurde, konnte dies alte oder unvollständige UI-Zustände erzeugen und Cache-Probleme wie Versionsdrift begünstigen.

## Entscheidung
Es gibt ab jetzt nur noch **einen kanonischen App-Einstieg: `app/index.html`**.

`app/live.html` ist kein zweiter App-Build mehr, sondern nur noch ein sehr kleiner Kompatibilitäts-Redirect auf `index.html`. Query-Parameter und Hash werden übernommen, damit bestehende Links/Bookmarks weiterhin funktionieren.

## Nutzen
- keine doppelte App-Shell mehr
- keine Versionsdrift zwischen `index.html` und `live.html`
- kein unterschiedliches Laden von Runtime-Modulen
- weniger Wartungsaufwand und geringeres Cache-Risiko
- bestehende `live.html`-Links bleiben nutzbar
- App wird leichter statt größer

## Cache/PWA-Erkenntnis
Im aktuellen Runtime-Code wurde keine aktive Service-Worker-Registrierung gefunden. Das bisher beobachtete Versions-/Cache-Verhalten ist daher nicht automatisch einem Service Worker zuzuschreiben. Browser-/GitHub-Pages-/Asset-Caching bleibt separat vor RC zu prüfen.

## Leitplanke
Keine weiteren parallelen HTML-Einstiegspunkte mit eigener Runtime-Shell. Neue öffentliche Einstiegspfade müssen auf den kanonischen Einstieg verweisen, statt den App-Code zu duplizieren.

## Änderungen
- `app/live.html` auf Redirect-Shell reduziert
- Commit: `0d67126eb30dd04d911be681f74a3997d04fd4fe`

## Gate-Status
- Codeänderung umgesetzt
- visueller iPhone-Redirect-/Regressionstest noch ausstehend
- kein Go-live-Gate hierdurch automatisch freigegeben
