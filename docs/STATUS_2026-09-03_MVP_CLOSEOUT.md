# HPOS MVP Closeout – Status 2026-09-03

## Ziel
HPOS wird ab jetzt im MVP-Abschlussmodus geführt. Keine neue Großbaustelle vor Abschluss der Kernblöcke. Neue Ideen werden nur aufgenommen, wenn sie einen Fehler, eine Inkonsistenz oder eine zwingende MVP-Lücke schließen.

## Block 1 – Suche & Watchlist
**Status: PASS / abgeschlossen**

Realer mobiler Test auf v8.7.9 bestätigt:
- Globale Suche liefert Treffer und Trefferzahl.
- Discovery-Treffer können ohne verifizierte ISIN als Vorschau angesehen werden.
- Unverifizierte Discovery-Treffer können bewusst zur Watchlist hinzugefügt werden.
- Microsoft wurde von Watchlist 3 auf 4 hinzugefügt; Status in der Investment-Akte wurde WATCHLIST.
- Microsoft wurde wieder entfernt; Watchlist fiel 4 auf 3 und der CTA kehrte zu „Zur Watchlist“ zurück.
- BYD kann unverifiziert als Watchlist-Beobachtung geführt werden.
- Halal-/Thesis-/Execution-Gates bleiben bei offener Identität gesperrt.

Root Cause des vorherigen CTA-Bugs war `app/watchlist-policy.js`: die Alt-Policy blockierte Nicht-ISIN-Werte und überschieb den Discovery-CTA. Die Policy wurde auf Depot-Schutz reduziert; Discovery/Watchlist liegt wieder bei der zentralen Such-/Watchlistlogik.

## Block 2 – Unternehmensdaten
**Status: in Arbeit**

Zielumfang vor MVP-Freeze:
- Sektor
- Branche
- verständliches Kurzporträt / Geschäftsmodell
- Unternehmensgröße, soweit belastbar verfügbar
- keine zusätzliche Hintergrundlogik

Umsetzung gestartet:
- Supabase Edge Function `hpos-profile` auf Version 3 erweitert.
- Primär bleibt Yahoo Quote Summary.
- Fallback ergänzt: Yahoo Search/Quote für Basisdaten und Wikipedia (DE, dann EN) ausschließlich für das beschreibende Firmenkurzporträt.
- Wikipedia-Inhalte sind Darstellungs-/Porträtdaten und keine Investment-Evidence.
- Fehlende Daten werden weiterhin nicht erfunden.
- Veralteter lokaler Profilcache wird einmalig invalidiert, damit die neue Profilquelle wirksam werden kann.

## Danach offen
1. Block 2 real auf mindestens Microsoft, BYD und einem Depotwert prüfen.
2. Block 3: HPOS-Intelligenz konsolidieren (Morning Briefing, Thesis/THS, Evidence, Gates, gleicher Datenstand).
3. Block 4: Abschlussreview, Mobile UX, Cache/Refresh, Parqet-Sync, Fehler-/Leerzustände, Performance.
4. Danach MVP Feature Freeze / v8.8.0.
