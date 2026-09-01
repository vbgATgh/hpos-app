# HPOS Datenquellen – Stand v8.7.3 (korrigiert)

## Ziel
HPOS trennt Bestandsdaten, Marktdaten, Dividenden, Halal und Research strikt. Keine Quelle darf stillschweigend eine andere überschreiben.

## Verantwortlichkeiten

### Parqet
- Zielrolle: kanonische Quelle für Depotbestand und Cash.
- Nach Broker-Kauf/-Verkauf soll der Bestand über Parqet neu synchronisiert werden.
- HPOS verändert Bestände nie manuell.
- Die tatsächlich nutzbare technische Schnittstelle und Authentifizierung müssen noch verifiziert werden.
- Die aktuell im Frontend vorhandene Legacy-Worker-/Browser-Token-Lösung ist nicht automatisch Teil der Zielarchitektur.

### DivvyDiary
- Geplante Ergänzungsquelle für Dividenden-Metadaten, Ausschüttungskalender und Income-Daten.
- Der vorhandene Free-Account/API-Key darf genutzt werden, sofern die tatsächliche API und die erlaubte Nutzung verifiziert sind.
- Der API-Schlüssel darf niemals im öffentlichen GitHub-Repository oder im ausgelieferten Browser-JavaScript stehen.
- Eine konkrete Backend-/Serverless-Technologie ist noch NICHT festgelegt.
- Konkrete HPOS-Endpunkte werden erst dokumentiert, nachdem die DivvyDiary-API tatsächlich geprüft wurde.
- DivvyDiary darf nie Depotbestand, Stückzahl, Einstand oder Cash verändern.

### Marktdaten
- Separater Quote-Layer gemäß `quote-policy.js` und `config/market_sources.json`.
- Plausibilitätsfilter bleiben aktiv.
- Kursdaten dürfen Bestand/Stückzahl/Einstand nicht verändern.
- Zielkette: ISIN -> Instrument -> Listing -> Börse -> Währung -> Kurs.
- Yahoo bzw. alte Worker-Aufrufe gelten nur als Übergangs-/Fallbacklogik und nicht als endgültige Source of Truth.

### Halal
- Eigener Compliance-Layer.
- Halal-Status darf nicht aus Kurs-, Depot- oder Researchquellen abgeleitet werden.
- Quellen und Prüfzeitpunkt müssen je Instrument nachvollziehbar bleiben.

### MarketScreener
- Nur Research-Benchmark / manuelle Evidenz.
- Keine operative Abhängigkeit und kein automatisiertes Scraping.

## Identität
- ISIN ist nach Verifikation der kanonische Instrumentenschlüssel.
- Name und Ticker sind Suchhilfen.
- Freie Fantasieeinträge werden nicht als verifizierte Wertpapiere gespeichert.

## Sicherheitsregel
Secrets gehören in eine private Laufzeit-/Backend-Schicht, sofern eine Integration sie benötigt. Niemals in HTML, JavaScript, öffentliches JSON oder LocalStorage als Zielarchitektur.

## Aktueller Architekturhinweis
Der aktive `/app`-Code enthält noch Legacy-Abhängigkeiten aus früheren HPOS-Ständen. Diese werden im Dokument `ARCHITECTURE_AUDIT_v8.7.3.md` erfasst und vor neuen Secret-Integrationen bereinigt.

## Rollout
1. tatsächliche APIs und Zugriffsmöglichkeiten verifizieren
2. Architekturentscheidung für private Integrationsschicht treffen
3. API-Verträge dokumentieren
4. genau einen bestehenden Depotwert Ende-zu-Ende testen
5. Fehler-/Fallbackfälle testen
6. erst danach Rollout auf alle Positionen
