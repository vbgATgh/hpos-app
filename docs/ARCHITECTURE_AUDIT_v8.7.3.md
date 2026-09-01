# HPOS Architektur-Audit – v8.7.3

Stand: 2026-08-31
Status: IN KLÄRUNG

## Ziel
Dieses Audit trennt die aktuelle HPOS-App von Legacy-Abhängigkeiten und richtet die weitere Entwicklung an den App-Factory-Grundsätzen aus: klare Architektur, keine versteckten Platzhalter, keine hart codierten Secrets, nachvollziehbare Datenquellen, Fehlerfälle und Tests vor weiterer Erweiterung.

## Tatsächlich geprüft

### Aktive App
Die aktive Anwendung liegt unter `/app` und besteht aktuell aus:
- `index.html`
- `styles.css`
- `app.js`
- `search-guard.js`
- `quote-policy.js`
- `asset-intelligence.js`

### Bestehende Architekturgrundlage
`docs/HPOS_ARCHITECTURE_V1.md` definiert bereits:
- Constitution
- privaten/local-first Current State
- Thesis Registry
- operative Agenten
- klare Source-of-Truth-Hierarchie
- keine reale Current-State-Datei im öffentlichen Repository

Diese Architektur bleibt die fachliche Grundlage.

## Gefundene Vermischungen / technische Schulden

### A-001 – Legacy Worker im aktiven Frontend
`app/app.js` referenziert noch `https://hpos-proxy.vbginbox.workers.dev`.

Bewertung: LEGACY / NICHT ALS NEUE HPOS-INFRASTRUKTUR FREIGEGEBEN.

Folge:
- Der alte Worker darf nicht automatisch für neue Integrationen wie DivvyDiary weiterverwendet werden.
- Neue Backend-/Secret-Infrastruktur wird erst nach bewusster Architekturentscheidung eingeführt.

### A-002 – Parqet-Token im Browser
Der aktuelle Parqet-Sync erwartet einen lokal gespeicherten Token (`hpos_parqet_token`).

Bewertung: FÜR EINEN PERSÖNLICHEN PROTOTYP TECHNISCH MÖGLICH, ABER NICHT ZIELARCHITEKTUR.

Risiko:
- Geheimnis liegt im Browser-Storage.
- Keine saubere zentrale Secret-Verwaltung.

Ziel:
- Entweder Parqet ohne Secret nutzbar machen, sofern zulässig,
- oder private serverseitige Integration mit Secret-Speicherung.

### A-003 – Öffentlicher Portfolio-Bootstrap
Status: **BEHOBEN am 31.08.2026**.

Die Datei `data/bootstrap/portfolio-2026-08-29.json` enthielt reale Depot-, Cash-, Broker- und Einstandsdaten und widersprach damit der Privacy Boundary aus `HPOS_ARCHITECTURE_V1.md`.

Maßnahme:
- reale Snapshot-Datei aus dem öffentlichen Repository entfernt
- `data/bootstrap/README.md` als verbindliche Privacy-Regel ergänzt
- künftig nur anonymisierte Demo-, Schema- oder reproduzierbare Testdaten erlaubt

Hinweis:
`app/app.js` referenziert den alten Dateipfad derzeit noch als optionalen Fallback. Ein 404 wird bereits abgefangen und führt zu `NO_VALID_PORTFOLIO`. Die Referenz selbst wird im Zuge der Legacy-Entkopplung entfernt, damit auch die technische Intention zur Privacy Boundary passt.

### A-004 – DivvyDiary-Proxy wurde zu früh vorausgesetzt
Die frühere Dokumentation hatte einen "HPOS-Proxy" und konkrete Client-Endpunkte bereits vorausgesetzt.

Bewertung: NICHT FREIGEGEBENE ANNAHME.

Status:
- Dokumentation korrigiert
- DivvyDiary bleibt geplante Datenquelle
- Transport-/Backend-Technologie wird erst nach Architekturentscheidung festgelegt
- keine erfundenen Endpunkte gelten als bestehende Schnittstelle

### A-005 – Yahoo/Worker-Kopplung
Marktdaten laufen teilweise über den alten Worker bzw. Yahoo-Fallbacks.

Bewertung: ÜBERGANGSLÖSUNG.

Ziel:
- Provider-unabhängiger Quote-Adapter
- ISIN -> Instrument -> Listing -> Börse -> Währung -> Kurs
- Fallback nur bei eindeutiger Identität und Plausibilitätsprüfung

## App-Factory-Abgleich
Die weitere Arbeit folgt den im App-Factory-Projekt definierten Regeln:
- Anforderungen und Integrationen nicht erfinden
- kritische externe APIs vor abhängiger Implementierung verifizieren
- echte Nutzerdaten nicht unkontrolliert als Testdaten verwenden
- Happy Path, Fehlerzustände und Regressionen prüfen
- Secrets nicht in Client, Logs oder öffentliche Dateien schreiben
- einfachste belastbare Lösung bevorzugen und unnötige Komplexität vermeiden

## Zielarchitektur

### Frontend
GitHub Pages / statische Web-App bleibt möglich.
Aufgaben:
- UI
- lokale Watchlist
- Darstellung und Interaktion
- local-first Cache
- keinerlei Secrets im ausgelieferten Code

### Private Daten-/Integrationsschicht
Nur erforderlich für Quellen, die einen geheimen Schlüssel benötigen oder browserseitig technisch/rechtlich nicht sauber nutzbar sind.
Technologie: NOCH NICHT FESTGELEGT.
Mögliche Varianten werden separat bewertet; kein Legacy-System wird automatisch übernommen.

Aufgaben:
- Secrets halten
- externe APIs aufrufen
- Antworten normalisieren
- CORS/Rate-Limits kontrollieren
- keine Investmententscheidung treffen

### Datenrollen
- Parqet: kanonischer Depotbestand/Cash, soweit Schnittstelle tatsächlich belastbar verfügbar
- DivvyDiary: Dividenden-/Income-Ergänzung, sobald API und Nutzungsweg verifiziert
- Marktdaten: separater Quote-Layer
- Halal-Quellen: separater Compliance-Layer
- MarketScreener: manuelle Research-Referenz, keine operative Abhängigkeit

## Harte Architekturregeln ab diesem Audit
1. Keine neue Abhängigkeit ohne dokumentierten Zweck und API-/Zugriffsprüfung.
2. Keine Secrets im öffentlichen Repo, Browser-JS oder öffentlich lesbaren JSON-Dateien.
3. Keine Legacy-Infrastruktur automatisch weiterverwenden.
4. Keine API-Endpunkte als vorhanden dokumentieren, bevor sie verifiziert sind.
5. ISIN ist nach Verifikation kanonischer Instrumentenschlüssel.
6. Portfolio-State, Marktdaten, Dividenden, Halal und Research bleiben getrennte Datenklassen.
7. Fehler einer externen Quelle dürfen keinen validen Portfolio-State zerstören.
8. Bestehende funktionierende App-Teile werden nicht ohne Not neu geschrieben.
9. Echte Nutzerdaten dürfen nicht als öffentliche Test-/Fallback-Daten dienen.
10. Eine Funktion gilt erst nach relevantem Re-Test und Regressionstest als abgeschlossen.

## Nächste Arbeitspakete

### AP-ARCH-01 – Legacy-Entkopplung · IN ARBEIT
- Abhängigkeiten des alten Workers im aktiven Code vollständig inventarisieren
- keine neuen Funktionen daran anbinden
- Runtime-Konfiguration von Legacy-Endpunkten trennen
- anschließend Worker-Referenz aus der Zielarchitektur entfernen

### AP-ARCH-02 – Privacy Boundary · ERLEDIGT
- öffentlichen Bootstrap geprüft
- reale Daten aus öffentlichem Repository entfernt
- Privacy-Regel im Bootstrap-Ordner dokumentiert

### AP-ARCH-03 – Integration Architecture Decision · NÄCHSTER SCHRITT
Für Parqet + DivvyDiary entscheiden:
- direkte browserseitige Nutzung technisch und rechtlich möglich?
- falls nein: kleine private Backend-/Serverless-Schicht notwendig?
- Technologie erst danach auswählen

### AP-ARCH-04 – API Contracts
Erst nach echter API-Verifizierung konkrete Endpunkte, Authentifizierung, Datenfelder und Fehlerzustände dokumentieren.

### AP-ARCH-05 – Regression / QA
Vor weiterer Feature-Ausweitung prüfen:
- App-Boot ohne öffentlichen Portfolio-Fallback
- Portfolio-State-Fallback
- Watchlist
- Suche
- Kurs-Fallback
- Fehlerzustände bei nicht erreichbaren Datenquellen

## Freigabestatus
Architektur: IN KLÄRUNG

Erledigt:
- öffentliche Privacy Boundary bereinigt
- zu früh vorausgesetzte DivvyDiary-Proxyarchitektur zurückgenommen

Blocker vor neuer Secret-Integration:
- Backend-/Serverless-Entscheidung
- tatsächliche Parqet-Schnittstelle verifizieren
- tatsächliche DivvyDiary-API verifizieren
