# HPOS – Produktdefinition

Stand: 2026-08-31
Status: KONSOLIDIERT / MVP-SCOPE VERBINDLICH FESTGELEGT / APP-FACTORY-GATE NOCH NICHT FREIGEGEBEN

## 1. Produkt
HPOS steht für **Halal Portfolio Optimization System / Portfolio Intelligence**.

HPOS ist eine persönliche Analyse-, Entscheidungs- und Orchestrierungsschicht für ein halal-konformes Wertpapierportfolio. Die Anwendung bündelt Depotbestand, Marktinformationen, Investment-Evidenz, Watchlist, Dividenden-/Income-Sicht und regelbasierte Entscheidungsunterstützung in einer Oberfläche.

HPOS ist **kein Broker** und führt keine Orders aus.

## 2. Kernproblem
Portfolio-, Kurs-, Dividenden-, Research-, Halal- und Entscheidungsinformationen liegen über mehrere Quellen und Anwendungen verteilt. Dadurch entstehen Medienbrüche, inkonsistente Datenstände und das Risiko, Entscheidungen auf unvollständige oder nicht ausreichend belegte Informationen zu stützen.

HPOS soll diese Informationen getrennt nach ihrer fachlichen Rolle zusammenführen, normalisieren, plausibilisieren und verständlich darstellen, ohne fehlende Daten zu erfinden.

## 3. Zielbild
HPOS soll als persönliches Portfolio-Intelligence-System:
- den validierten Depotbestand zuverlässig abbilden,
- Depotbestand und externe Marktdaten strikt trennen,
- Wertpapiere eindeutig identifizieren,
- Watchlist und Depot logisch trennen,
- Investment-Akten mit belegten Informationen bereitstellen,
- Halal-Evidenz nachvollziehbar führen,
- Dividenden und Income inklusive Zielbezug darstellen,
- Portfolio-, Performance-, Cash- und Income-Daten visuell aufbereiten,
- regelbasierte Entscheidungsunterstützung liefern,
- bei Daten- oder Providerfehlern den letzten validen Zustand schützen.

## 4. Primärer Nutzer
Aktueller Scope ist eine persönliche Single-User-Anwendung. Multi-User-, Mandanten-, öffentliche Portfolio- oder Social-Funktionen sind nicht als aktueller Produktumfang belegt.

## 5. Systemrollen
### HPOS
Liest, normalisiert, analysiert, plausibilisiert und visualisiert Daten. HPOS unterstützt Entscheidungen, führt aber keine Broker-Order aus.

### Broker
Scalable Capital und Trade Republic sind die Orte der tatsächlichen Orderausführung.

### Depot-Master
Parqet ist nach aktuellem Entscheidungsstand die kanonische Quelle für Depotbestand, Stückzahlen, Einstand und Cash-Snapshot. Der technische Zugriff soll perspektivisch über eine verifizierte offizielle Schnittstelle erfolgen.

### Marktdaten- und Evidenzquellen
Externe Quellen dürfen Bestand nicht verändern. Sie liefern ausschließlich ergänzende Markt-, Instrument-, Dividenden-, Fundamental-, News- oder Evidenzinformationen entsprechend ihrer jeweils verifizierten Rolle.

## 6. Zentrale Produktbereiche
Der aktuelle Produktumfang umfasst bzw. plant:
1. Home / Portfolioübersicht
2. Depot / Positionen
3. Watchlist
4. Wertpapiersuche und Identitätsprüfung
5. Investment-Akte / Portfolio Intelligence
6. Dividenden / Income
7. Analyse- und Decision Layer
8. Halal-Register / Evidenz
9. Portfolio-, Performance-, Cash- und Income-Visualisierungen
10. Datenaktualisierung und Providerstatus
11. weitere Informations-/Einstellungsbereiche über die Navigation

Der genaue Funktionsumfang und die Akzeptanzkriterien werden im App-Factory-Bereich `02 · Anforderungen & Akzeptanzkriterien` konsolidiert.

## 7. Harte Produktleitplanken
- Keine Broker-Orders aus HPOS.
- Kein Depotbestand wird durch manuelle UI-Eingaben oder Marktdaten verändert.
- ISIN ist nach erfolgreicher Verifizierung der kanonische Instrumentenschlüssel.
- Keine ungeprüfte Übernahme frei eingegebener Instrumente in die Watchlist.
- Keine erfundenen Halal-, Dividenden-, Steuer-, Fundamental-, Kurs- oder Newsdaten.
- Bei Providerfehlern bleibt der letzte valide Portfolio-State erhalten.
- Reale Current-State-, Broker- und Nutzerdaten bleiben außerhalb des öffentlichen Repositorys.
- Secrets und OAuth-Tokens gehören nicht in Frontendcode, Repository oder localStorage.
- Datenintegrität und Stabilität haben Vorrang vor kosmetischen Umbauten.

## 8. Entscheidungslogik
Die bestehende fachliche Reihenfolge lautet:

`HALAL -> PORTFOLIO FIT -> THESIS -> FUNDAMENTALS -> VALUATION -> TIMING -> NEWS EVIDENCE -> EXECUTION`

Ein späterer Layer darf einen früheren Hard Gate nicht überstimmen.

## 9. Daten- und Governance-Prinzip
Die operative Wahrheit ist in getrennte Schichten gegliedert:
- Constitution: langlebige Systemregeln
- Current State: privater aktueller Zustand
- Thesis Registry: versionierbare Investmentthesen
- operative Agents / Entscheidungslogik

Bei Widersprüchen gilt nach bestehender Architektur:
1. jüngste ausdrückliche Nutzerentscheidung
2. Constitution / neueste verbindliche HPOS-Regel
3. Current State mit Zeitstempel
4. Thesis Registry mit Review-Stand
5. historische Masterfiles/Snapshots

## 10. Nicht-Ziele im aktuellen Scope
Nach aktuellem Quellenstand nicht vorgesehen bzw. nicht belegt:
- automatische Orderausführung bei Brokern
- öffentliches Teilen realer Depotdaten
- ungeprüfte KI-generierte Investment-, Halal- oder Marktfakten
- manuelle Manipulation des kanonischen Depotbestands in HPOS
- Multi-User-/Mandantenbetrieb
- Abhängigkeit von kostenpflichtigen Datenprovidern als zwingende Produktvoraussetzung

## 11. Verbindliches MVP-Ziel: v9 Release Candidate

**Entscheidung vom 2026-08-31:** `v9 RC = MVP`.

Der v9 Release Candidate ist der erste verbindliche App-Factory-Releaseumfang. Für den MVP müssen folgende Kernbereiche zuverlässig und anhand definierter Akzeptanzkriterien funktionieren:
- Home / Portfolioübersicht
- Portfolio / Depot mit Parqet als kanonischem Depot-Master
- Wertpapiersuche mit ISIN-Verifizierung
- Watchlist
- Investment-Akte / Portfolio Intelligence
- Income / Dividenden inklusive Monatszielbezug
- Analyse- und Decision Layer
- Halal-Evidenz / Halal-Register
- stabile Navigation zwischen den Kernbereichen
- nachvollziehbarer Daten-, Aktualisierungs- und Fehlerstatus

Nicht erforderlich für die MVP-Freigabe sind zusätzliche Research-Tiefe, perfekte bzw. abschließend optimierte Charts, optionale DivvyDiary-Erweiterungen und rein kosmetische Feinoptimierungen, sofern dadurch keine Kernfunktion, Datenintegrität, Verständlichkeit oder Bedienbarkeit beeinträchtigt wird.

Die konkrete Prüfbarkeit dieses MVP-Scopes wird in `02 · Anforderungen & Akzeptanzkriterien` über REQ-/AC-Strukturen hergestellt. Die Festlegung `v9 RC = MVP` ist eine Scope-Entscheidung und allein noch keine Release- oder Gate-Freigabe.

## 12. Aktueller Reifegrad
Das Produkt befindet sich im Status **IN DEVELOPMENT**. Es existiert bereits eine funktionsfähige Anwendung und eine umfangreiche technische/fachliche Basis. Die App-Factory-Produktdefinition wurde aus dem bestehenden Projektstand konsolidiert und der MVP-Zielumfang für v9 RC wurde verbindlich festgelegt. Ein App-Factory-Gate wird dadurch nicht rückwirkend als bestanden deklariert.

## 13. Noch zu klären / bewusst nicht erfunden
- formale, messbare Produkt-Erfolgskriterien jenseits der MVP-Akzeptanzkriterien
- konkrete REQ-/AC-Ausprägung für jeden verbindlichen v9-RC-Kernbereich
- abschließende Priorisierung einzelner Intelligence- und Visualisierungsfunktionen außerhalb des MVP
- endgültiger produktiver Integrationsweg für alle externen Datenquellen
- finale UI-/Design-System-Freigabe

## 14. Quellenbasis
Konsolidiert aus dem bestehenden HPOS-Projekt, insbesondere:
- `README.md`
- `docs/ROADMAP-v9.md`
- `docs/HPOS_ARCHITECTURE_V1.md`
- `docs/ARCHITECTURE_PROGRESS_v8.7.4.md`
- `docs/API_CONTRACTS_v8.7.4.md`
- bestehende akzeptierte ADRs und App-Factory-Projektstatusakte
- ausdrückliche Nutzerentscheidung vom 2026-08-31: `v9 RC = MVP`

Bei Widersprüchen ist `00 · Projektstatus & Decision Log` die zentrale Steuerungsebene; fachliche Architekturentscheidungen bleiben in den jeweils gültigen ADRs/Architekturdokumenten nachvollziehbar.