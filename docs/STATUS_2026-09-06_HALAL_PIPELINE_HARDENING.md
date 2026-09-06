# HPOS v8.7.35 – Halal-Pipeline-Härtung

**Datum:** 2026-09-06  
**Frontend:** v8.7.35  
**Supabase Edge Function:** `hpos-api` v24 (`0.5.3`)  
**Status:** IMPLEMENTIERT; EXTERNER FREE-PROVIDER WEITERHIN NICHT VERBUNDEN

## Ziel

Die bestehende automatische Gate-1-Prüfung wird in der vorhandenen Supabase-Architektur konsolidiert. Die Parqet-Bestands-, Validierungs-, Rollback- und Quarantänelogik wird nicht verändert.

## Verifizierter Ist-Stand

- Supabase-Projekt: `moxyhjfbrmsnphikxqje`
- Edge Functions: `hpos-api`, `hpos-profile`
- `hpos-api` hält Parqet, Markt- und Halal-Routen hinter der bestehenden privaten Integrationsschicht.
- `hpos-profile` liefert Unternehmens- und Fundamentaldaten; fehlende Daten bleiben fehlend.
- Halal Terminal ist ohne `HALAL_TERMINAL_API_KEY` nicht verbunden.
- Kostenpflichtige Pläne bleiben blockiert.

## Änderungen

- Exakte ISIN bleibt der kanonische Schlüssel.
- Priorität bleibt: kuratierte Exact-ISIN-Evidenz → HPOS AAOIFI → kostenloser externer Gegencheck → manuelle Evidenz.
- Ein neuer `OPEN_REVIEW`-Lauf überschreibt keine frische, entscheidende `PASS`-/`FAIL`-Evidenz.
- Kuratierte Exact-ISIN-Evidenz kann nicht durch automatische Resultate überschrieben werden.
- Der kostenlose externe Provider darf nur einen offenen oder abgelaufenen internen AAOIFI-Stand ersetzen.
- Die Provider-Auswertung nutzt ausschließlich ein explizites AAOIFI-Ergebnis, nicht einen generischen Gesamtstatus.
- Der Provider versucht zuerst den günstigeren Cache-Leseweg; nur fehlende/veraltete Treffer führen zum Live-Screen.
- Provider-Evidenz verfällt nach sieben Tagen.
- Holdings werden vor dem Hintergrundlauf mit vorhandenen Marktsymbolen angereichert.
- Halal Register und Detailansicht führen den externen Fallback nur bei `OPEN_REVIEW`, konfiguriertem Provider und Free-Plan aus.
- Ohne Provider bleibt die UI ausdrücklich bei „noch nicht verbunden“ und `PRÜFUNG OFFEN`.

## Kanonische Evidenzmigration

Migration `backfill_confirmed_halal_evidence` übernimmt ausschließlich bereits bestätigte Zustände:

- `IE00B27YCN58`: `PASS`, Quelle `CURATED_ISIN`, drei Evidenzobjekte aus dem bestehenden Registry-Stand.
- `DK0062498333`: `PASS`, Quelle `HPOS_AAOIFI`, eine Evidenz; Migration des bereits bestätigten v8.7.28-Gate-1-Stands, keine neue Einstufung.

## Tatsächlich ausgeführte Prüfungen

- Browser-JavaScript-Syntaxcheck für `app.js`, `halal-autoscreen.js`, `halal-register.js`, `halal-evidence.js`: PASS.
- `hpos-api /health`: HTTP 200, Version `0.5.3`: PASS.
- Provider-Status ohne Key: `configured=false`, `reason=api_key_missing`: PASS.
- Halal-Evidence ohne Session: HTTP 401: PASS.
- Fremder Origin erhält keinen lesbaren CORS-Freigabeheader: PASS.
- Temporärer Integrationstest: frisches `PASS` gespeichert, anschließendes `OPEN_REVIEW` hat `PASS` nicht überschrieben: PASS.
- Temporäre Testsession und Testevidenz anschließend gelöscht: PASS.
- Kanonische Backendzeilen für Novo Nordisk und den iShares Islamic ETF nach Migration als `PASS` gelesen: PASS.
- Live-Test des externen Halal-Terminal-Laufs: NICHT AUSGEFÜHRT, da kein Free-API-Key konfiguriert ist.

## Offener Blocker

Für den realen externen Gegencheck muss ein kostenloser Halal-Terminal-API-Key ausschließlich als Supabase Edge-Function-Secret `HALAL_TERMINAL_API_KEY` hinterlegt werden. Kein Key gehört ins Repository oder Frontend.
