# HPOS – UX & User Flows Baseline

Stand: 2026-08-31
Status: IST-ZUSTAND KONSOLIDIERT / v9-RC-MVP-FLOWS MARKIERT / UX-GATE NICHT FREIGEGEBEN

## Zweck
Dokumentation der aktuell belegbaren Navigations- und Kernflows. Keine UI-Änderung und keine Behauptung, dass alle Flows bereits vollständig funktionieren.

**Verbindliche Scope-Entscheidung:** `v9 RC = MVP`.

## 1. Hauptnavigation [MVP]
Mobile Bottom Navigation:
1. Home
2. Portfolio
3. Analyse
4. Income
5. Mehr

Zusätzlich:
- `H` im Header = Home
- Suche im Header = Wertpapiersuche
- Refresh im Header = Portfolioaktualisierung

Für den v9 RC müssen die fünf Hauptbereiche stabil erreichbar sein. Nicht jedes optionale Untermodul im Bereich Mehr ist automatisch MVP-blockierend.

## 2. Flow: App-Start / Home [MVP]
Start → Home → letzten validen Portfolio-State laden → verfügbare Aktualisierung/Parqet-Reconciliation ausführen oder Status anzeigen → Kurs-/Datenstatus anzeigen → Gesamtvermögen / HPOS-Status / Allokation / relevante Signale darstellen.

Fehlerprinzip: fehlende oder fehlerhafte Providerdaten dürfen keinen erfundenen Gesamtzustand erzeugen und den letzten validen Portfolio-State nicht zerstören.

## 3. Flow: Portfolio ansehen [MVP]
Home/Bottom Nav → Portfolio → Filter `Alle | Scalable | TR | Watchlist` → Instrument auswählen → Investment-Akte.

Depot und Watchlist bleiben fachlich getrennt. Brokerfilter sind Darstellungs-/Zuordnungsinformationen und keine parallele Source of Truth zum Parqet-Depot-Master.

## 4. Flow: Wertpapier suchen [MVP]
Header-Suche oder `+ Wertpapier` → gemeinsames Suchfeld → Eingabe Name, Ticker oder ISIN → Such-/Verifizierungsergebnis → Instrument öffnen.

Bei ISIN: exakte Identitätsprüfung.

Fehlerfall: ungültige oder nicht verifizierbare Eingabe darf nicht als kanonisches Instrument übernommen werden.

## 5. Flow: Watchlist hinzufügen/entfernen [MVP]
Verifiziertes Suchergebnis → Investment-Akte → `Watchlist` → hinzufügen/entfernen → Watchlist-Status aktualisieren.

Watchlist beeinflusst Depotwert und Allokation nicht.

## 6. Flow: Investment-Akte [MVP]
Portfolio/Watchlist/Suche → Instrument → Investment-Akte → Identität + Position, sofern Depotbestand + Marktdaten/Evidenz + Dividenden, soweit belegt + Decision-/Halal-Kontext.

Von dort:
- Watchlist toggeln
- Broker-Workflow öffnen
- zurück zur vorherigen Ansicht

Fehlende Research- oder Forward-Daten werden als nicht verfügbar dargestellt und sind kein Grund, Werte zu erfinden.

## 7. Flow: Broker-Order und Reconciliation [MVP]
Investment-Akte → `Broker-Order` → BUY/SELL wählen → Scalable Capital oder Trade Republic wählen → Order extern in Broker-App ausführen → Parqet aktualisieren/reconciliieren → in HPOS Portfolioaktualisierung anstoßen → neuen Parqet-State übernehmen, sofern Aktualisierung erfolgreich und valide.

HPOS selbst sendet keine Order. Eine extern ausgeführte Brokerorder wird nicht allein durch eine manuelle HPOS-Bestätigung zum kanonischen Depotbestand.

## 8. Flow: Analyse / Decision Layer [MVP]
Bottom Nav/Home-Verweis → Analyse → Entscheidungsraum → verdichtete Portfolio-, Halal-, Thesis-, Fundamental-/Valuation- und Evidenzsignale, soweit verfügbar → Prioritäten/Entscheidungsunterstützung.

Die Reihenfolge `HALAL -> PORTFOLIO FIT -> THESIS -> FUNDAMENTALS -> VALUATION -> TIMING -> NEWS EVIDENCE -> EXECUTION` bleibt bindend. Keine autonome Orderausführung.

## 9. Flow: Income [MVP]
Bottom Nav → Income → validierte Ausschüttungen → monatliches Income-Ziel über Regler einstellen → Ist/Ziel-Fortschritt darstellen → verfügbare Ausschüttungsinformationen anzeigen.

Für den MVP erforderlich sind Zielwert, sichtbarer Fortschritt und belegte Ausschüttungsdaten. Weiterführende Funktionen wie 12-Monats-Verlauf, erwartete Ausschüttungen, Forward Income und detaillierte Titelbeiträge sind nur dann MVP-blockierend, wenn die Kernfunktion ohne sie nicht verständlich oder zuverlässig nutzbar wäre.

DivvyDiary ist keine zwingende Voraussetzung für den MVP.

## 10. Flow: Halal-Evidenz [MVP]
Analyse/Mehr/Investment-Akte → Halal-Kontext öffnen → Status + Quelle + Prüf-/Aktualitätsstand anzeigen → bei Konflikten konservativen/ungeklärten Zustand sichtbar machen.

Fehlende oder widersprüchliche Evidenz darf nicht als gesicherte H1-Freigabe erscheinen.

## 11. Flow: Mehr [TEILWEISE MVP]
Bottom Nav → Mehr → Modul auswählen.

Aktuell vorgesehene Module:
- Halal Register
- News & Evidenz
- Steuer & FSA
- Datenquellen
- Regelwerk
- Backup & Diagnose

Modul → Detailansicht → `‹ Mehr` zurück.

Für v9 RC muss `Mehr` als Navigationsbereich stabil funktionieren und MVP-relevante System-/Halal-/Datenstatuspfade erreichbar machen. Steuer & FSA, vollständiges Backup/Restore oder zusätzliche News-Funktionen sind nicht automatisch MVP-Blocker, solange kein MUST-Requirement davon abhängt.

## 12. UX-Leitplanken
- Mobile-first.
- Kernaktionen mit wenigen Navigationsebenen erreichbar.
- Status und Fehler sichtbar statt stiller Datenänderung.
- Verifizierung vor Watchlist-Aufnahme.
- Depot-/Marktdaten-/Watchlist-Wahrheiten nicht vermischen.
- Parqet bleibt Depot-Master; Broker bleiben Execution-Orte.
- Orderausführung klar von HPOS trennen.
- Keine Scheingenauigkeit bei fehlenden Daten.
- Optionaler Funktionsumfang darf den MVP-Kern nicht visuell oder funktional überladen.

## 13. UX-MVP-Kernpfade für Regression
Vor v9 RC sind mindestens folgende End-to-End-Flows tatsächlich zu prüfen:
1. Start → Home → valider Portfolio-State
2. Refresh → erfolgreiche Parqet-Reconciliation
3. Refresh → Provider-/Netzwerkfehler ohne State-Korruption
4. Portfolio → Investment-Akte
5. Suche Name/Ticker → verifiziertes Instrument
6. Suche gültige ISIN → exakt verifiziertes Instrument
7. Suche ungültige ISIN → sicherer Fehlerzustand
8. Investment-Akte → Watchlist hinzufügen/entfernen
9. Investment-Akte → externer Broker-Workflow → Parqet-Reconciliation
10. Analyse → Decision-/Halal-Kontext
11. Income → Monatsziel ändern → Fortschritt darstellen
12. Bottom Navigation + `H`-Home über alle Kernbereiche
13. Mehr → MVP-relevantes Untermodul → zurück

## 14. Noch zu prüfen
- tatsächliches Verhalten jedes MVP-Flows im aktuellen Build
- Back-Navigation aus allen Einstiegspunkten
- Empty States und Offline-Verhalten
- Loading-/Error-States
- Accessibility über bestehende ARIA-Beschriftungen hinaus
- Bedienbarkeit auf unterschiedlichen iPhone-Größen
- endgültige Informationsarchitektur optionaler Mehr-Module

## Quellenbasis
- `app/index.html`
- `docs/ROADMAP-v9.md`
- `README.md`
- `docs/app-factory/01-produktdefinition/PRODUCT_DEFINITION.md`
- `docs/app-factory/02-anforderungen-akzeptanzkriterien/REQUIREMENTS_BASELINE.md`
- `config/hpos_constitution.json`

## Gate-Hinweis
Diese Baseline dokumentiert den belegbaren Ist-/Ziel-Flow und grenzt die v9-RC-MVP-Kernpfade ein. Sie ersetzt keinen tatsächlichen UX-Test und markiert kein bestandenes UX-Gate.