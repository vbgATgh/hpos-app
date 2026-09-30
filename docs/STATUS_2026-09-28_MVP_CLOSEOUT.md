# HPOS v8.7.75 – verbindlicher Abschlussplan mit 12 Arbeitspaketen

Stand: 2026-09-29
Status: Feature Freeze; nur Abschlussarbeit, Fehlerkorrekturen und belegte Datenaktualisierungen

## Fertig bedeutet ab jetzt

HPOS gilt erst als fertig, wenn alle zwölf unten genannten Abnahmekriterien erfüllt, die releasekritischen Tests grün, der Produktions-Smoke dokumentiert und der reale iPhone/Home-Screen-Test bestanden sind.

Ein fachlich korrektes `OPEN_REVIEW` ist dabei ein gültiges Prüfergebnis, wenn die konkret fehlende Evidenz, die Quelle und der Datenstand sichtbar sind. Externe Datenlücken einzelner Aktien dürfen den Release nicht endlos blockieren und werden nicht durch Schätzwerte künstlich geschlossen.

## Belastbarer Ausgangsstand

- Kanonische Oberfläche im Arbeitsbranch: HPOS v8.7.75.
- Produktives `hpos-api`: Service 0.5.12 / Function Version 33.
- Produktives `hpos-screen`: Service 1.6.1 / Function Version 22.
- Vollständiger lokaler Testlauf: 238 bestanden, 6 bekannte Legacy-Fehler.
- Kanonischer Halal-Bestand: 23 ISINs, davon 1 kuratierter `PASS` und 22 nachvollziehbare `OPEN_REVIEW`.
- Repräsentativer Batchnachweis: 21 unterschiedliche Werte und 43 protokollierte Läufe ohne falschen `PASS` oder `FAIL`.
- Datenschutz-Smoke: fremder Origin `403`, privater Parqet-Pfad ohne Sitzung `401`, private Tabellen nicht für `anon` oder `authenticated` lesbar.
- AP 1 / v8.7.73 ist produktiv. AP 2 / v8.7.74 wurde veröffentlicht; v8.7.75 beseitigt den im Produktions-Smoke gefundenen Cardinal-Widerspruch zwischen kanonischer Halal-Evidenz und statischer Investment-Akte.

## Status der zwölf Arbeitspakete

| AP | Priorität | Status | Bereits umgesetzt | Bis zur Abnahme fehlt |
|---|---|---|---|---|
| 1 Datenintegrität & Broker-Overrides | P0 | **ABNAHMEBEREIT** | Parqet-Normalisierung, Validierung und Rollback; feldbezogene lokale Broker-Overrides; Craneware-Korrekturfluss; Quellen-/Standanzeige für Positions- und Portfolio-KPIs; dauerhaftes lokales Abweichungsprotokoll; 4 neue AP-1-Tests; v8.7.73 produktiv und iPhone-Smoke erfolgt | Einmalige lokale Erfassung des bestätigten Craneware-Brokerstands und Prüfung des Abweichungsprotokolls |
| 2 Regelwerk & Gate-Engine | P0 | **ABNAHMEBEREIT** | Kanonische Engine für acht Gates; Hard-/Review-/Execution-Trennung; fünf eindeutige Entscheidungszustände; fehlende bzw. widersprüchliche Evidenz getrennt von `WAIT_TRIGGER`; T90 nur Review-Hinweis; EIB bleibt unberechnet; Cardinal-Hotfix synchronisiert Gate 1, Investment-Akte und Portfolio Fit | Produktions-Smoke von v8.7.75 für Cardinal: überall `PRÜFUNG OFFEN`, Gate 2 gesperrt, Gesamtstatus `EVIDENZ FEHLT` |
| 3 Depot- und Watchlist-Abdeckung | P0 | **IN ARBEIT** | Depot-/Watchlist-Batch, Identitätsauflösung, 23 kanonische ISINs und protokollierte Halal-Läufe | Ein gemeinsamer Coverage-Report für jede Position, jeden Watchlistwert und jeden Kandidaten mit Prüfstatus, Quelle, Aktualität und Blocker |
| 4 Dynamische Fair-Value- und Kaufzonen | P0 | **TEILWEISE** | Fundamentaldaten-Schemata, Quellenregister und einzelne Investment Cases | Allgemeines Bewertungsmodell über Gewinn, FCF, Schulden, Wachstum, Margen und Sicherheitsabschlag; versionierte Kaufzonen mit Evidenz-Triggern |
| 5 Thesis- und News-Agent | P1 | **TEILWEISE** | Thesis-Register, Proofpoint-/Falsifizierungsmodell, News-Ingestion, Evidence Review und Deduplizierungslogik | Einheitlicher produktiver Lauf für alle Assets, belastbare THS-Versionierung und Abnahme gegen doppelte News bzw. unbegründete THS-Änderungen |
| 6 Halal- und Risiko-Governance | P0 | **IN ARBEIT** | AAOIFI Gate 1, Quellenkonflikte, Gültigkeit, private Prüfprotokolle, Portfolio-Regeln und Healthcare-Cap im Regelwerk | Vollständiger Musaffa/Zoya/Sharlife-Nachweis je freigegebenem Wert sowie harte Kopplung jeder Kapitalfreigabe an Halal- und Cap-Ergebnis |
| 7 Kapitalranking & Opportunitätskosten | P0 | **TEILWEISE** | Kapitalwettbewerbs-Policy, Eligibility-Reihenfolge und Dominanzregeln | Ein berechnetes Ranking über Bestand, Aufstockung, Watchlist, Neukandidaten und Cash sowie erklärbarer Abstand zur zweitbesten Alternative bei `EIB > 0` |
| 8 Cash, Marktregime & Investitionsreserve | P1 | **TEILWEISE** | 2-%-Floor, 3-%-Ziel, 150-Euro-Absolutfloor und Cash als Optionalität im Regelwerk | Getrennte Berechnung von hartem Floor, Ziel, Reserve, Sparplänen, Marktregime und gestaffelten Freigaben ohne starre Zielquotenblockade |
| 9 Kleinpositionen, Verkäufe & Rotation | P1 | **OFFEN** | Unter-300-Euro-Erkennung und allgemeine Rotationsregeln | Verbindliche A/B/C-Entscheidung für Craneware, IVU, Frequentis und alle übrigen Kleinpositionen inklusive Steuer, Verkaufserlös und Reinvestition |
| 10 Execution- und EIB-Rechner | P1 | **TEILWEISE** | Transaktionsmasken, Cashprüfung und externe Orderhoheit; fixe Gebühr ist als Nutzerregel bekannt | Gemeinsamer Vorab-Rechner für Stückzahl, Limit, 1-Euro-Gebühr, Cash danach, Gewicht, Caps, Reserve und EIB; keine automatische Order |
| 11 Historischer Entscheidungstest | P0 | **OFFEN** | Testinfrastruktur und historische Artefakte vorhanden | Reproduzierbarer Vergleich der Läufe 24.–28.09. mit alter und korrigierter Logik, Point-in-Time-Evidenz und erklärtem Delta |
| 12 Decision Board & täglicher Controller | P1 | **TEILWEISE** | HTML Decision Board, Investment-Akte, Gate-Anzeige und Datenstatus | Eine gemeinsame Entscheidungsgrundlage für Live-Daten, Coverage, Gates, Ranking, THS-Delta, Reserve, Trigger und Final Decision |

Formaler Abnahmestand: **0 von 12 AP abgenommen**. Das ist die strenge Sicht nach den neuen Kriterien; es bestehen verwertbare Teilimplementierungen in zehn AP.

## Trendzahlen-Leiste

Die Trendzahlen-Leiste ist umgesetzt und abgeschlossen, aber bewusst kein eigenes Entscheidungs-Gate:

- **Tagesbewegung:** Veränderung gegenüber dem letzten verfügbaren Schlusskurs.
- **5 Handelstage:** Veränderung vom ersten zum letzten verfügbaren Schlusskurs der kurzen Reihe.
- **Trendlage:** `AUFWÄRTS`, `ABWÄRTS`, `GEMISCHT` oder `OFFEN` aus beiden belegten Werten.
- Die Anzahl der Beobachtungen wird mitgeliefert, damit eine kurze Datenreihe sichtbar bleibt.

Die Trendwerte sind rückblickender Timing-Kontext. Sie sind kein Kursziel, keine Wahrscheinlichkeit, kein Halal-Nachweis und keine Kauf- oder Kapitalfreigabe. Sie dürfen erst nach Halal, Datenqualität, Portfolio-Fit, These und Bewertung als Timing-Hinweis betrachtet werden.

## Novo Nordisk: Warum weiterhin `PRÜFUNG OFFEN`

Bei Novo Nordisk bestehen drei Gate-1-Teilprüfungen; offen bleibt die Einnahmenprüfung. Die angezeigten rund 3,1 % stammen nur aus dem offiziell erkannten `Finance Income` und beweisen nicht, dass sämtliche nicht zulässigen Einnahmen vollständig erfasst sind. Deshalb ist die korrekte Quellenbezeichnung jetzt `ESEF_FINANCE_INCOME_PARTIAL_EVIDENCE`. Der Wert ist nicht als haram entschieden, sondern noch nicht vollständig als halal belegt. Trendzahlen dürfen diesen Zustand nicht überschreiben.

## Abschlussreihenfolge und Zieltermin

| Zeitraum | Abschlussziel |
|---|---|
| 29.–30.09.2026 | Phase 1: AP 1–3 abnehmen; gleichzeitig die 6 Legacy-Testfehler beseitigen oder nachweislich archivieren |
| 01.–05.10.2026 | Phase 2: AP 4–6 abnehmen |
| 06.–07.10.2026 | Phase 3: AP 7–9 abnehmen |
| 08.–09.10.2026 | Phase 4: AP 10–12, historischer Vergleich, Produktions-Smoke und Release Candidate |

Ziel ist damit **Freitag, 09.10.2026**, sofern keine neue Funktion in den Scope aufgenommen wird. Externe Evidenzlücken bleiben als `OPEN_REVIEW` sichtbar und verschieben diesen Termin nicht. Verschieben dürfen ihn nur reproduzierbare technische Fehler, Datenverlust, Datenschutzprobleme oder falsche Kapital-/Gate-Entscheidungen.

## Verbindliche Arbeitsregel bis zum Abschluss

1. Kein neues Feature außerhalb AP 1–12.
2. Ein AP wird nur mit Test bzw. reproduzierbarem Nachweis und erfülltem Abnahmekriterium auf `ABGENOMMEN` gesetzt.
3. P0 wird vor P1 abgeschlossen; P1-Arbeit ist nur zulässig, wenn sie einen laufenden P0-End-to-End-Pfad direkt vervollständigt.
4. Keine autonome Order. Die finale Kapitalentscheidung bleibt beim Nutzer.
5. Der Status wird in dieser Datei fortgeschrieben; keine parallele neue Abschluss-Roadmap.
