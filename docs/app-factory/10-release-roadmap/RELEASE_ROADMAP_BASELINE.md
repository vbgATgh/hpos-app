# HPOS – Release & Roadmap Baseline

Stand: 2026-08-31
Status: KONSOLIDIERT / v9 RC = MVP / KEIN RELEASE CANDIDATE

## Ziel
Der **v9 Release Candidate ist der verbindliche MVP-Zielstand**. Er wird erst markiert, wenn die definierten MUST-Requirements erfüllt, die Kernflows tatsächlich regressionsgeprüft und Security-/Betriebsfragen ausreichend geklärt sind.

## P0 – Datenintegrität und Stabilität [MVP-BLOCKER]
1. Suche/ISIN-Verifizierung stabilisieren.
2. Portfolio-/Parqet-Synchronisation atomar und fehlertolerant machen.
3. Marktdatenprovider, Währung, Zeitstempel und soweit verfügbar Börsenplatz normalisieren.
4. Daten-/Fehlerstatus für Kernbereiche verständlich anzeigen.
5. State-Schema und Migrationen soweit erforderlich bis v9 absichern.

## P1 – Investment Intelligence [MVP-BLOCKER]
6. Investment-Akte in der notwendigen MVP-Tiefe mit belegten Identitäts-, Positions-, Markt-, Dividenden- und Evidenzinformationen vervollständigen.
7. Halal-Register mit Quelle, Prüfdatum/Aktualitätsstand und Konfliktbehandlung anbinden.
8. Decision Layer ausschließlich aus HPOS-Regelwerk und belegter Evidenz speisen.
9. Watchlist-/Broker-Workflow aus der Investment-Akte stabilisieren.

## P2 – Income und notwendige Visualisierung [MVP-BLOCKER IN KERNTIEFE]
10. Income-Monatsziel einstellbar machen und Ist/Ziel-Fortschritt zuverlässig darstellen.
11. validierte Ausschüttungsinformationen verständlich anzeigen.
12. die für Home, Portfolio und Income notwendigen Kernvisualisierungen belastbar bereitstellen.

Nicht zwingend für den MVP sind, solange kein MUST-Requirement davon abhängt:
- vollständiger 12-Monats-Income-Verlauf
- erwartete Ausschüttungen
- Forward Income
- detaillierte Titelbeiträge
- zusätzliche Research-Charts
- DivvyDiary-Anreicherung
- rein kosmetische Chart-/Farbanpassungen

## P3 – UX/UI Stabilisierung [MVP-BLOCKER FÜR BEDIENBARKEIT]
13. Home, Portfolio, Analyse, Income und Mehr stabil über Bottom Navigation erreichbar machen.
14. `H` als Home-Button regressionssicher prüfen.
15. MVP-relevante Mehr-/Systempfade erreichbar machen.
16. iPhone Safari/PWA-Kernbedienung prüfen.
17. Farbpalette, visuelle Dichte und zusätzliche Grafiken dürfen nachjustiert werden; sie blockieren den MVP nur bei tatsächlicher Beeinträchtigung von Verständlichkeit oder Bedienbarkeit.

## P4 – Release Candidate
18. vollständige Kernregression gegen Requirements/AC und definierte UX-MVP-Flows.
19. kritische Fehlerfälle für Parqet/Provider, ungültige Instrumentidentität und State-Schutz tatsächlich testen.
20. Security-/Privacy-Check durchführen.
21. Deployment-/Rollback-/Betriebsweg verifizieren.
22. Legacy-/Altverzeichnisse erst nach ausreichend sicherer Migration kontrolliert archivieren oder entfernen.
23. erst danach v9 RC markieren.

## Nach v9 RC / Post-MVP
- zusätzliche Research-/Fundamental-Tiefe
- erweiterte Charts und Visualisierungen
- optionaler DivvyDiary-Read-Zugriff, sofern zulässig und verifiziert
- zusätzliche Income-Prognosen/Forward-Modelle nach definierter Berechnungslogik
- weitergehende Steuer-/FSA-Funktionen
- Desktop-/Tablet-Feinschliff
- kosmetische Designoptimierungen, die nicht für die Kernnutzung nötig sind

## Historischer Fortschrittswert
Die bisherige Roadmap nennt einen Gesamtfortschritt von ca. 70 %. Dieser Wert wird als historische Planung übernommen, aber **nicht als App-Factory-Gate- oder MVP-Fortschritt interpretiert**.

## Release-Regel
Keine Release-Freigabe aufgrund einer Prozentzahl oder einer vorhandenen UI. Entscheidend sind erfüllte Requirements, bestandene Tests, geklärte Security-/Betriebsfragen und dokumentierte Gate-Entscheidungen.

Nicht tatsächlich durchgeführte Prüfungen werden nicht als bestanden markiert.

## Quellenbasis
- `docs/ROADMAP-v9.md`
- `docs/app-factory/01-produktdefinition/PRODUCT_DEFINITION.md`
- `docs/app-factory/02-anforderungen-akzeptanzkriterien/REQUIREMENTS_BASELINE.md`
- `docs/app-factory/03-ux-user-flows/UX_USER_FLOWS_BASELINE.md`
- App-Factory QA-, Security- und Deployment-Baselines
- ausdrückliche Nutzerentscheidung vom 2026-08-31: `v9 RC = MVP`
