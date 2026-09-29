# HPOS v8.7.72 – verbindlicher MVP-Abschlussstand

Stand: 2026-09-28

## Ziel

HPOS wird ab diesem Stand nicht mehr durch neue Funktionswünsche erweitert. Der Abschluss erfolgt in vier begrenzten Arbeitspaketen. Ein fachlich korrektes `OPEN_REVIEW` gilt als abgeschlossenes Prüfergebnis, wenn die fehlende Evidenz konkret benannt wird; es ist kein technischer Fehler und darf nicht durch Schätzwerte künstlich grün werden.

## Bereits umgesetzt

- Mobile HPOS-Oberfläche mit Depot, Watchlist, Analyse, Dividenden und Investment-Akte.
- Parqet als kanonische Bestandsquelle mit Validierung, Quarantäne und Rollback.
- Getrennte Marktpreis-, Portfolio- und Halal-Evidenzebenen.
- Gate 1 mit `PASS`, `FAIL` und `OPEN_REVIEW`, privaten Prüfprotokollen und fail-closed Regeln.
- Generische Identitätsauflösung sowie SEC- und ESEF-XBRL-Evidenzpfade.
- Marktwert am Prüftag für die beiden AAOIFI-Bilanzquoten.
- Regelbasierte Geschäftsmodellklassifikation ohne aktienspezifische Freigabecodes.
- Entscheidungsgates und Entscheidungsboard ohne autonome Orderausführung.
- Validierte Ausschüttungen und Monatsziel ohne erfundene Forward-Erträge.
- Neue, datenbasierte Trendzahlen-Leiste in der Investment-Akte.

## Bedeutung der Trendzahlen-Leiste

Die Leiste zeigt ausschließlich rückblickenden Timing-Kontext:

- **Tagesbewegung:** Veränderung gegenüber dem letzten verfügbaren Schlusskurs.
- **5 Handelstage:** Veränderung vom ersten zum letzten verfügbaren Schlusskurs der kurzen Reihe.
- **Trendlage:** `AUFWÄRTS`, `ABWÄRTS`, `GEMISCHT` oder `OFFEN` aus diesen beiden belegten Werten.

Die Zahlen sind weder Kursziel noch Eintrittswahrscheinlichkeit. Sie verändern Gate 1, den Halal-Status und die Portfolio-Freigabe nicht. Opaque Zählwerte wie „4 T“ oder „10 W“ werden nicht kopiert, solange Definition und Datenbasis nicht nachvollziehbar sind. Eine Zielzone wird nicht aus dem Trend erfunden.

## Noch offene Abschlussarbeitspakete

| Paket | Inhalt | Fertig, wenn | Status |
|---|---|---|---|
| 1 | Einnahmenprüfung und Trendkontext | Keine falsche Halal-Freigabe; Trendzahlen sichtbar erklärt; Backend und Regressionstests geprüft | abgeschlossen |
| 2 | Depot- und Watchlist-Abdeckung | Repräsentativer Batchlauf; Identitäts-, PASS/FAIL/OPEN- und Fehlerfälle dokumentiert | abgeschlossen |
| 3 | iPhone/PWA, Fehlerfälle und Datenschutz | Installation/Persistenz, Offline-/Reconnect-Verhalten, lange Texte, private Datenpfade und Session-Ablauf geprüft | offen |
| 4 | Release Candidate | Bekannte Restpunkte klassifiziert, Entscheidungslog aktualisiert, Produktions-Smoke und v9-RC-Freigabe dokumentiert | offen |

## Verbindlicher Ausblick

Ohne neue Features ist der MVP in etwa **zwei bis drei fokussierten Arbeitstagen** bis zum Release Candidate abschließbar:

1. Paket 1 und Produktions-Smoke: bis 0,5 Arbeitstag.
2. Repräsentativer Depot-/Watchlist-Lauf: etwa 1 Arbeitstag.
3. iPhone/PWA-, Datenschutz- und Fehlerfallprüfung: etwa 1 Arbeitstag.
4. Schlussdokumentation und RC-Freigabe: bis 0,5 Arbeitstag.

Externe Datenlücken einzelner Aktien verlängern den Release nicht. Sie bleiben sichtbar als `OPEN_REVIEW`. Verlängern dürfen den Abschluss nur reproduzierbare technische Fehler, Datenverlust, Datenschutzprobleme oder falsche Gate-Entscheidungen.

## Aktueller Nachweis

- `hpos-api` Version 33 / Service 0.5.12 ist produktiv.
- Der produktive Novo-Nordisk-Abruf liefert Tages- und 5-Handelstage-Veränderung samt Beobachtungszahl.
- Die bestehende Einnahmen-Evidenz von 3,13 % bleibt ein Teilbeleg und erzeugt keinen künstlichen `PASS`.
- Die technische Quellenbezeichnung lautet deshalb nun eindeutig `ESEF_FINANCE_INCOME_PARTIAL_EVIDENCE` statt des missverständlichen Begriffs „Upper Bound“.
- Die neue Trendanzeige nennt ausdrücklich: kein Kursziel, keine Wahrscheinlichkeit, kein Kauf- oder Halal-Signal.
- Der produktive Batchnachweis umfasst 21 unterschiedliche Depot-/Watchlist-Werte und 43 vollständig protokollierte Läufe ohne falschen `PASS` oder `FAIL`.
- Der kanonische Bestand umfasst 23 ISINs: 1 unverändert kuratierter `PASS` und 22 nachvollziehbare `OPEN_REVIEW`-Ergebnisse.
- Bekannte Datenquellen-Grenze: Die SEC-Faktenbeschaffung aus der Edge-Runtime liefert für mehrere US-Werte aktuell keine Pflichtwerte. Das Ergebnis bleibt deshalb korrekt offen; die App und der Release dürfen keine Vollständigkeit vortäuschen.
- Der Privacy-Blocker aus der alten Git-Historie ist geschlossen: der bekannte sensible Commit ist nicht mehr erreichbar, der aktuelle Baum enthält keinen privaten Snapshot und die privaten Supabase-Tabellen sind für `anon` und `authenticated` nicht lesbar.
- CORS-/Session-Smoke: fremder Origin `403`, privater Parqet-Pfad ohne Sitzung `401`.
- HPOS bleibt bewusst eine online benötigte Home-Screen-Web-App. Es gibt keinen Service Worker und damit keinen behaupteten Offlinebetrieb oder verdeckten veralteten App-Cache.
- Noch offen in Paket 3 ist ausschließlich der reale Endgeräte-Smoke der neuen v8.7.72-Ansicht auf iPhone/Home-Screen; die lokale Browserautomation konnte in der Ausführungsumgebung nicht auf den lokalen Build zugreifen.
