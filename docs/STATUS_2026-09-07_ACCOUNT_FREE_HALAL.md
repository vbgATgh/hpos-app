# HPOS v8.7.36 – Accountfreie Halal-Pipeline

**Datum:** 2026-09-07  
**Frontend:** v8.7.36  
**Supabase Edge Function:** `hpos-api` Service `0.5.4`  
**Status:** LOKAL IMPLEMENTIERT UND GEPRÜFT; PRODUKTIONSNACHWEIS AUSSTEHEND

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

## Lokaler Prüfstatus

- Browser-JavaScript-Syntaxcheck: PASS.
- Git-Diff-Check: PASS.
- Aktive Halal-/OAuth-/Parqet-Schutzsuite: 15 Tests bestanden.
- Aktiver Laufzeitpfad enthält keine Referenz auf Halal Terminal, dessen API-Key, Providerstatus- oder Screeningroute: PASS.
- Gesamte Repository-Suite: 148 Tests bestanden, 7 bereits vorhandene Fehler in historischen Alpha-/News-Pfaden. Keine zusätzliche Regression durch v8.7.36 festgestellt.

Der Produktivstatus wird erst nach erfolgreicher Pull-Request-CI, Edge-Function-Deployment und direktem Produktionsabgleich auf PASS gesetzt.
