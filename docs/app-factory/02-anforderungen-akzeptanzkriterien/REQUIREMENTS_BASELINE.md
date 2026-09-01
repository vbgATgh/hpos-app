# HPOS – Requirements Baseline

Stand: 2026-08-31
Status: KONSOLIDIERT / v9-RC-MVP-SCOPE EINGEARBEITET / NICHT ALS REQUIREMENTS-GATE FREIGEGEBEN

## Zweck
Diese Baseline übersetzt ausschließlich belegten Produktumfang und bestehende Entscheidungen in nachvollziehbare Anforderungen. Sie behauptet nicht, dass alle Anforderungen bereits vollständig implementiert oder getestet sind.

**Verbindliche Scope-Entscheidung:** `v9 RC = MVP`.

Prioritäten: MUST = für den verbindlichen v9-RC-MVP erforderlich; SHOULD = wichtig, aber kein MVP-Releaseblocker, sofern Kernfunktion, Datenintegrität, Verständlichkeit und Bedienbarkeit nicht beeinträchtigt werden; COULD = optional/später.

## A. Portfolio und Current State

### REQ-001 – Kanonischer Depotbestand [MUST]
HPOS muss den validierten Depotbestand aus Parqet als festgelegtem Depot-Master übernehmen und darf ihn nicht aus externen Marktdaten ableiten.

Akzeptanzkriterien:
- AC-001.1: Stückzahlen, Einstand und Cash werden nicht durch Kurs-/News-/Research-Provider verändert.
- AC-001.2: Manuelle UI-Aktionen verändern den kanonischen Depotbestand nicht.
- AC-001.3: Bei fehlgeschlagener Aktualisierung bleibt der letzte valide State erhalten.
- AC-001.4: Brokerorders aus Scalable Capital oder Trade Republic werden erst nach Parqet-Reconciliation als neuer HPOS-Portfolio-State übernommen.

### REQ-002 – Privater Current State [MUST]
Reale Portfolio-, Broker- und Nutzerdaten dürfen nicht als öffentlicher Repository-State gespeichert werden.

Akzeptanzkriterien:
- AC-002.1: Kein realer Portfolio-Snapshot liegt im öffentlichen Repository.
- AC-002.2: Secrets/OAuth-Tokens liegen weder im Repository noch im öffentlichen Frontendcode.
- AC-002.3: Private Zustandsdaten werden local-first oder über eine private Integrationsschicht verarbeitet.

### REQ-003 – Portfolioaktualisierung [MUST]
Der Nutzer muss den Depotbestand kontrolliert aktualisieren können; die Synchronisation muss fehlertolerant sein.

Akzeptanzkriterien:
- AC-003.1: Refresh ist in der UI erreichbar.
- AC-003.2: Erfolg und Fehler sind für den Nutzer erkennbar.
- AC-003.3: Teil-/Providerfehler erzeugen keinen falschen neuen Depotbestand.
- AC-003.4: Der Daten-/Aktualisierungsstatus macht erkennbar, ob ein neuer Parqet-State erfolgreich übernommen wurde.

## B. Instrumentidentität, Suche und Watchlist

### REQ-004 – Wertpapiersuche [MUST]
Der Nutzer muss Wertpapiere über Name, Ticker oder ISIN suchen können.

Akzeptanzkriterien:
- AC-004.1: Ein gemeinsames Suchfeld akzeptiert Name, Ticker oder 12-stellige ISIN.
- AC-004.2: Ergebnisse sind nicht ausschließlich auf Depotpositionen begrenzt, sofern eine verifizierte externe Suchquelle verfügbar ist.
- AC-004.3: Providerfehler führen zu einem verständlichen Fehler-/Fallbackzustand und nicht zu erfundenen Instrumenten.

### REQ-005 – Verifizierte Instrumentidentität [MUST]
Nach erfolgreicher Verifizierung ist die ISIN der kanonische Instrumentenschlüssel.

Akzeptanzkriterien:
- AC-005.1: Eine eingegebene ISIN wird exakt geprüft.
- AC-005.2: Tippfehler oder ungültige ISINs werden nicht als neue Instrumente übernommen.
- AC-005.3: Freie Namen/Ticker erzeugen ohne Verifizierung keinen kanonischen Datensatz.

### REQ-006 – Watchlist [MUST]
Der Nutzer muss verifizierte Instrumente unabhängig vom Depot beobachten und wieder entfernen können.

Akzeptanzkriterien:
- AC-006.1: Verifiziertes Instrument kann zur Watchlist hinzugefügt werden.
- AC-006.2: Watchlist-Eintrag kann entfernt werden.
- AC-006.3: Watchlist-Werte verändern weder Depotwert noch Portfolioallokation.
- AC-006.4: Watchlist ist in Portfolio-/Filterkontext sichtbar.

## C. Markt- und Kursdaten

### REQ-007 – Aktuelle Marktdaten [MUST]
HPOS soll für Wertpapiere die aktuellsten zuverlässig verfügbaren Kurse und Metadaten darstellen, ohne Scheingenauigkeit zu erzeugen.

Akzeptanzkriterien:
- AC-007.1: Kursquelle, Währung und soweit verfügbar Zeitstempel/Börsenbezug werden normalisiert.
- AC-007.2: Unplausible oder fehlerhafte Quotes dürfen validierte Werte nicht unkontrolliert überschreiben.
- AC-007.3: Marktdaten ändern keine Stückzahlen oder Einstandswerte.

### REQ-008 – Datenquellen- und Fehlerstatus [MUST für v9 RC]
Der Nutzer muss erkennen können, ob relevante Kernbereichsdaten aktuell, verzögert, aus Fallback oder nicht verfügbar sind.

Akzeptanzkriterien:
- AC-008.1: Kernbereiche zeigen einen verständlichen Datenstatus, wenn Aktualität oder Verfügbarkeit relevant ist.
- AC-008.2: Provider-/Netzwerkfehler werden nicht als erfolgreiche Aktualisierung dargestellt.
- AC-008.3: Fallback-Daten sind als solche erkennbar, sofern sie verwendet werden.

## D. Investment-Akte und Intelligence

### REQ-009 – Investment-Akte [MUST]
Für ein ausgewähltes Instrument muss HPOS eine zentrale Investment-Akte bereitstellen.

Akzeptanzkriterien:
- AC-009.1: Identität und Instrumentmetadaten sind sichtbar.
- AC-009.2: Bei Depotpositionen sind mindestens Position, Einstand, aktueller Wert, G/V und Depotgewicht darstellbar, soweit valide Daten vorliegen.
- AC-009.3: Marktdaten/Evidenz werden getrennt vom Portfolio-State dargestellt.
- AC-009.4: Dividendeninformationen werden nur dargestellt, wenn belegt/verfügbar.
- AC-009.5: Watchlist- und Broker-Workflow sind aus der Akte erreichbar.

### REQ-010 – Decision Layer [MUST]
Entscheidungsunterstützung muss aus dem HPOS-Regelwerk und belegter Evidenz entstehen; sie darf keine autonome Brokerorder auslösen.

Akzeptanzkriterien:
- AC-010.1: Entscheidungsreihenfolge respektiert `HALAL -> PORTFOLIO FIT -> THESIS -> FUNDAMENTALS -> VALUATION -> TIMING -> NEWS EVIDENCE -> EXECUTION`.
- AC-010.2: Ein späterer Layer überstimmt keinen früheren Hard Gate.
- AC-010.3: Fehlende Evidenz wird als fehlend behandelt und nicht erfunden.

## E. Halal und Evidenz

### REQ-011 – Halal-Register [MUST]
HPOS muss Halal-Einstufungen mit Quelle, Prüfstand und Konfliktbehandlung nachvollziehbar führen können.

Akzeptanzkriterien:
- AC-011.1: Halal-Status ohne belegte Quelle wird nicht als gesicherte Tatsache ausgegeben.
- AC-011.2: Quelle und Prüf-/Aktualitätsstand sind nachvollziehbar.
- AC-011.3: widersprüchliche Evidenz wird nicht stillschweigend überschrieben.

### REQ-012 – News und Thesis-Evidenz [SHOULD]
Relevante News sollen als Evidenz für Investmentthesen verarbeitet werden, nicht als eigenständige Trade-Freigabe.

## F. Income / Dividenden

### REQ-013 – Income-Ziel [MUST]
Der Nutzer muss ein monatliches Dividenden-/Income-Ziel einstellen und den Fortschritt dazu sehen können.

Akzeptanzkriterien:
- AC-013.1: Monatsziel ist in der Income-Ansicht einstellbar.
- AC-013.2: Zielwert und Fortschritt werden sichtbar dargestellt.
- AC-013.3: Zieländerung verändert keine Depot- oder Ausschüttungsdaten.

### REQ-014 – Dividendenübersicht [MUST]
HPOS muss validierte Ausschüttungen und deren zeitlichen Bezug für den MVP verständlich darstellen.

Akzeptanzkriterien:
- AC-014.1: Monats-Ist und Monatsziel sind unterscheidbar.
- AC-014.2: Ausschüttungswerte werden nur aus belegten/verfügbaren Daten dargestellt.
- AC-014.3: Fehlende erwartete/Forward-Daten werden als nicht verfügbar behandelt und nicht geschätzt, solange keine freigegebene Berechnungsdefinition vorliegt.

Weiterführende Funktionen wie 12-Monats-Verlauf, erwartete Ausschüttungen, Forward Income und detaillierte Titelbeiträge sind erwünscht, aber nur dann MVP-relevant, wenn sie für die verständliche Kernfunktion erforderlich werden. Zusätzliche DivvyDiary-Anreicherung ist kein MVP-Blocker.

## G. Visualisierung und Navigation

### REQ-015 – Hauptnavigation [MUST]
Die mobile Hauptnavigation umfasst Home, Portfolio, Analyse, Income und Mehr.

Akzeptanzkriterien:
- AC-015.1: jeder Hauptbereich ist über die Bottom Navigation erreichbar.
- AC-015.2: das HPOS-`H` oben links führt zu Home.
- AC-015.3: Wechsel zwischen Views erzeugt keinen Verlust des validierten Portfolio-State.

### REQ-016 – Home [MUST]
Home muss eine verdichtete Sicht auf Gesamtvermögen, Datenstatus, HPOS-Status, Allokation und aktuell relevante Signale bieten.

Akzeptanzkriterien:
- AC-016.1: Gesamtvermögen wird aus validiertem Portfolio-State und zulässiger Kursanreicherung berechnet.
- AC-016.2: Daten-/Aktualisierungsstatus ist sichtbar.
- AC-016.3: mindestens eine verständliche Portfolio-/Allokationssicht ist vorhanden, ohne nicht verfügbare Daten vorzutäuschen.

### REQ-017 – Mehr / Systemmodule [SHOULD]
Der Bereich Mehr soll mindestens Halal Register, News & Evidenz, Steuer & FSA, Datenquellen, Regelwerk sowie Backup & Diagnose erreichbar machen, soweit die Module tatsächlich umgesetzt sind. Nicht-MVP-Systemmodule dürfen den v9 RC nicht blockieren, sofern kein MUST-Requirement davon abhängt.

### REQ-018 – Belastbare Kernvisualisierungen [MUST in erforderlicher MVP-Tiefe]
Für Home, Portfolio und Income müssen die zur verständlichen Nutzung notwendigen Visualisierungen vorhanden sein. Perfekte oder zusätzliche Charts sind kein MVP-Blocker.

Akzeptanzkriterien:
- AC-018.1: Visualisierungen basieren ausschließlich auf verfügbaren/validierten Daten.
- AC-018.2: fehlende Daten werden nicht durch Demo- oder erfundene Werte ersetzt.
- AC-018.3: rein kosmetische Chartoptimierung blockiert den v9 RC nicht.

## H. Broker-Workflow

### REQ-019 – Externe Orderausführung [MUST]
HPOS darf keine Brokerorder selbst ausführen.

Akzeptanzkriterien:
- AC-019.1: BUY/SELL-Workflow weist auf externe Ausführung in Scalable Capital oder Trade Republic hin.
- AC-019.2: HPOS sendet keine Order an den Broker.
- AC-019.3: nach externer Ausführung kann eine Bestandsaktualisierung/Reconciliation über Parqet angestoßen werden.

## I. Stabilität, Security und Betrieb

### REQ-020 – Fehlerresilienz [MUST]
Provider-, Netzwerk- oder Datenfehler dürfen nicht zu stiller Datenkorruption führen.

Akzeptanzkriterien:
- AC-020.1: Fehlerzustände sind von Erfolg unterscheidbar.
- AC-020.2: letzter valider Portfolio-State wird bei fehlgeschlagenen Providerantworten nicht unkontrolliert überschrieben.
- AC-020.3: ein Fehler in einer ergänzenden Datenquelle darf den kanonischen Depotbestand nicht beschädigen.

### REQ-021 – Secret-Schutz [MUST]
Secret-basierte Providerzugriffe müssen außerhalb des öffentlichen Frontends stattfinden.

Akzeptanzkriterien:
- AC-021.1: keine Secrets/OAuth-Tokens im öffentlichen Repository oder Frontendcode.
- AC-021.2: secret-basierte Integrationen werden nur über eine private Integrationsschicht oder einen gleichwertig geschützten Mechanismus produktiv genutzt.

### REQ-022 – Mobile/PWA-Tauglichkeit [MUST für v9 RC]
Die Anwendung muss auf iPhone Safari/PWA im definierten Kernumfang stabil nutzbar sein.

Akzeptanzkriterien:
- AC-022.1: die fünf Hauptbereiche sind mobil erreichbar und bedienbar.
- AC-022.2: Kerninhalte sind ohne horizontale Zwangsnavigation oder verdeckte primäre Aktionen nutzbar.
- AC-022.3: Navigation und Refresh führen nicht zu unbeabsichtigtem Verlust des validierten States.

### REQ-023 – Regression vor Release [MUST für v9 RC]
Vor einem v9 Release Candidate müssen mindestens Home, Navigation, Portfolio, Watchlist, Suche/ISIN-Verifizierung, Investment-Akte, Portfolio-Refresh/Parqet-Reconciliation, Kurse, Income, Halal-Evidenz, Decision Layer und relevante Mehr-/Systempfade regressionsgeprüft werden.

Akzeptanzkriterien:
- AC-023.1: jeder MVP-MUST-Bereich besitzt mindestens einen dokumentierten positiven Kernfall.
- AC-023.2: kritische Fehlerfälle für Datenintegrität, Providerfehler und ungültige Instrumentidentität sind geprüft.
- AC-023.3: nicht tatsächlich durchgeführte Tests werden nicht als bestanden markiert.

## J. Bewusst offene Anforderungen
Folgende Punkte sind noch nicht ausreichend spezifiziert und werden nicht erfunden:
- konkrete Aktualitäts-SLAs je Marktdatenprovider
- endgültige Datenfelder und Read-Möglichkeiten von DivvyDiary
- endgültige v9-Kennzahlen je Fundamental-/Research-Bereich außerhalb der notwendigen Investment-Akte
- konkrete Berechnungsdefinition für Forward Income
- finale Charttypen und Visualisierungsdichte über die notwendige MVP-Tiefe hinaus
- Backup-/Restore-Umfang
- Steuer-/FSA-Funktionsumfang
- formale Performance-Grenzwerte

Diese offenen Punkte blockieren den v9-RC-MVP nur dann, wenn sich bei Implementierung oder QA herausstellt, dass ein MUST-Requirement ohne ihre Klärung nicht zuverlässig erfüllt werden kann.

## K. v9-RC-MVP Traceability

| MVP-Kernbereich | Requirements |
|---|---|
| Home / Portfolioübersicht | REQ-016, REQ-018, REQ-020 |
| Portfolio / Parqet Depot-Master | REQ-001, REQ-003, REQ-007, REQ-008 |
| Suche / ISIN-Verifizierung | REQ-004, REQ-005 |
| Watchlist | REQ-006 |
| Investment-Akte | REQ-009 |
| Income / Dividenden / Monatsziel | REQ-013, REQ-014, REQ-018 |
| Analyse / Decision Layer | REQ-010 |
| Halal-Evidenz | REQ-011 |
| stabile Navigation | REQ-015, REQ-022 |
| Daten-/Aktualisierungs-/Fehlerstatus | REQ-003, REQ-008, REQ-020 |
| Security / privater State | REQ-002, REQ-021 |
| Release-Regression | REQ-023 |

## Quellenbasis
- `docs/app-factory/01-produktdefinition/PRODUCT_DEFINITION.md`
- `config/hpos_constitution.json`
- `README.md`
- `docs/ROADMAP-v9.md`
- `docs/HPOS_ARCHITECTURE_V1.md`
- `app/index.html`
- `docs/API_CONTRACTS_v8.7.4.md`
- `docs/ARCHITECTURE_PROGRESS_v8.7.4.md`
- ausdrückliche Nutzerentscheidungen: Parqet als Depot-Master; `v9 RC = MVP`

## Gate-Hinweis
Diese Datei schafft eine rückverfolgbare Requirements-Baseline für den verbindlichen v9-RC-MVP. Sie ist **keine Behauptung eines bestandenen Requirements-Gates**. Implementierungsstatus und tatsächliche Testnachweise werden separat geprüft.