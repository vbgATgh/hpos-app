# HPOS API Contracts – v8.7.4

Stand: 2026-08-31

## Zweck
Dieses Dokument enthält nur verifizierte externe Schnittstellen. Nicht dokumentierte Annahmen werden nicht als API-Vertrag behandelt.

## Parqet

Status: VERIFIZIERT / ZIELQUELLE

Parqet stellt 2026 eine offizielle Connect API bereit. Relevante Read-Pfade sind dokumentiert und produktiv verfügbar.

### Verifizierte Funktionen
- Portfolios auflisten
- Holdings eines Portfolios lesen
- Aktivitäten/Transaktionen lesen
- Performance lesen
- Dividenden/Income über Performance- und Portfolio-Daten auswerten
- Währung und Quote-Metadaten je Holding auslesen
- OAuth-basierte Authentifizierung für Integrationen

### Für HPOS relevante Datenfelder
- Portfolio-ID
- Holding-ID
- Name
- ISIN/Identifier
- Asset-Typ
- Stückzahl
- aktueller Wert
- aktueller Kurs
- Einstandswert / Einstandskurs
- realisierter und unrealisierter Gewinn
- Performance
- Quote-Währung
- Quote-Börse
- Quote-Zeitpunkt
- Aktivitäten wie Kauf, Verkauf, Dividende, Ein-/Auszahlung

### Architekturentscheidung
Parqet bleibt kanonische Quelle für Depotbestand und Cash. Der bisherige Browser-Token + Legacy-Worker-Pfad ist Übergangscode und soll durch die offizielle Connect-API-Anbindung ersetzt werden.

Secrets/OAuth-Tokens dürfen nicht im öffentlichen Frontend oder Repository liegen.

## DivvyDiary

Status: TEILWEISE VERIFIZIERT / READ-INTEGRATION NOCH NICHT FREIGEGEBEN

Verifiziert ist:
- Free-Account vorhanden
- persönlicher API-Key kann erzeugt werden
- Portfolio Performance nutzt diesen Schlüssel für Uploads zu DivvyDiary
- DivvyDiary veröffentlicht Wertpapierseiten mit ISIN, WKN, Symbol/Börse, Kurs, Dividendenhistorie, Ex-Tag/Zahltag, Dividendenrhythmus und weiteren Metadaten

Nicht ausreichend verifiziert ist:
- offiziell dokumentierter Read-Endpunkt für persönliche Dividenden-/Portfolio-Daten
- stabile API-Basis-URL für lesenden HPOS-Zugriff
- Authentifizierungsformat für Read-Requests
- Rate Limits und erlaubte Automatisierungsnutzung

### Architekturentscheidung
Kein produktiver DivvyDiary-Adapter, bis ein echter Read-Vertrag verifiziert ist. Der zuvor angelegte Adapter mit angenommenen `/divvydiary/*`-Endpunkten wurde entfernt.

DivvyDiary bleibt fachlich eine mögliche Ergänzungsquelle für Dividendendaten. Eine Integration erfolgt erst nach belegbarer Read-Schnittstelle oder ausdrücklich zulässigem Exportweg.

## Öffentliche Quellen ohne Secret

### Frankfurter
- FX-Daten
- kann direkt aus dem Frontend angesprochen werden

### OpenFIGI
- ISIN-/Instrument-Mapping
- für exakte Identitätsprüfung vorgesehen
- keine Portfolio-Datenquelle

### Yahoo
- nur Übergangs-/Fallback-Marktdaten
- keine kanonische Instrument- oder Depotquelle
- Nutzung weiterhin durch Quote-Policy und Plausibilitätsprüfung begrenzt

## Harte Regeln
1. Keine erfundenen Endpunkte.
2. Keine Secrets im Frontend.
3. Parqet-Portfolio-State und externe Marktdaten bleiben getrennt.
4. ISIN bleibt nach Verifikation kanonischer Instrumentenschlüssel.
5. Fehler externer Quellen dürfen validierten Portfolio-State nicht überschreiben.
6. Neue Datenquelle erst nach dokumentiertem Vertrag und Fehlerverhalten.
