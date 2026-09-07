# HPOS v8.7.36 – Accountfreie Halal-Pipeline

**Datum:** 2026-09-07  
**Frontend:** v8.7.36  
**Supabase Edge Function:** `hpos-api` v25 / Service `0.5.4`  
**Status:** PRODUKTIV VERÖFFENTLICHT UND VERIFIZIERT

## Verbindliche Entscheidung

HPOS verlangt keine zusätzlichen Konten bei Halal-Prüfdiensten. Halal Terminal und andere kontobasierte Ersatzdienste sind keine Produktabhängigkeit.

## Aktiver Gate-1-Pfad

1. kuratierte Exact-ISIN-Evidenz (`CURATED_ISIN`)
2. interne AAOIFI-Regelprüfung (`HPOS_AAOIFI`)
3. manuell bestätigte, eindeutig zugeordnete Evidenz
4. bei fehlenden oder unvollständigen Daten: `OPEN_REVIEW`

## Änderungen

- Halal-Terminal-Konstante und API-Key-Auswertung aus `hpos-api` entfernt.
- Providerstatus- und Screening-Routen entfernt.
- Speicherung neuer `FREE_PROVIDER`-Ergebnisse entfernt.
- Frontend-Provideradapter und Script-Einbindung entfernt.
- Provideraufrufe aus Halal Register und Detailansicht entfernt.
- UI-Texte auf den accountfreien Modus angepasst.
- Health-Antwort kennzeichnet `halalMode: ACCOUNT_FREE`.
- Versionen und Cache-Keys auf v8.7.36 aktualisiert.

## Unveränderte Schutzgrenzen

- Parqet-Bestand und Cash
- OAuth, Token-Refresh und Session-Speicher
- Rollback, Validierung und Quarantäne
- kanonischer, ISIN-basierter Evidenzstore
- Schutz frischer `PASS`-/`FAIL`-Evidenz vor `OPEN_REVIEW`
- Schutz kuratierter Exact-ISIN-Evidenz

## Prüfstatus

- Browser-JavaScript-Syntaxcheck: PASS.
- Git-Diff-Check: PASS.
- Aktive Halal-/OAuth-/Parqet-Schutzsuite: 15 Tests bestanden.
- Aktiver Laufzeitpfad enthält keine Referenz auf Halal Terminal, dessen API-Key, Providerstatus- oder Screeningroute: PASS.
- Gesamte Repository-Suite: 148 Tests bestanden, 7 bereits vorhandene Fehler in historischen Alpha-/News-Pfaden. Keine zusätzliche Regression durch v8.7.36 festgestellt.
- Pull Request #42: CI erfolgreich, konfliktfrei als Squash-Commit nach `main` übernommen.
- GitHub Pages liefert v8.7.36 mit Cache-Key `20260907-accountfree1` und ohne `halal-provider.js`: PASS.
- Ausgelieferte Produktionsskripte `runtime-config.js`, `halal-register.js` und `halal-evidence.js`: Syntaxcheck PASS.
- Supabase `hpos-api` v25 / Service `0.5.4`: ACTIVE.
- Produktiver Healthcheck: HTTP 200, `halalMode: ACCOUNT_FREE`.
- Entfernte Providerstatusroute: HTTP 404.
- Halal-Evidenz ohne HPOS-Sitzung: weiterhin HTTP 401.
- Aktiver Edge-Function-Quellstand enthält keine Halal-Terminal-, API-Key-, Providerstatus- oder Screeningreferenz.
- Supabase Security Advisor: keine neue Warnung. Der Hinweis `RLS enabled no policy` für `hpos_halal_evidence` ist weiterhin das beabsichtigte serverseitige Deny-all-Modell.
