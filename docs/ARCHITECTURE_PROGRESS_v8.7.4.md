# HPOS Architekturfortschritt – v8.7.4

Stand: 2026-08-31

## Erledigt
- AP-ARCH-02 Privacy Boundary: echter öffentlicher Portfolio-Snapshot entfernt.
- AP-ARCH-01 Inventur: Legacy-Worker-Abhängigkeiten vollständig identifiziert.
- AP-ARCH-01 Kapselung: Runtime-Routing über `app/runtime-config.js` eingeführt.
- Quote-Policy auf zentrale Routing-Konfiguration umgestellt.
- Syntaxprüfung für `runtime-config.js` und `quote-policy.js` erfolgreich.
- AP-ARCH-03 Architekturentscheidung: Secret-basierte Provider benötigen private Integrationsschicht. Provider selbst noch offen.

## Noch Legacy, aber kontrolliert
- `app/app.js` konstruiert weiterhin alte Worker-URLs für Parqet und Kurse.
- `app/search-guard.js` konstruiert weiterhin alte Worker-URLs für externe Suche.
- Diese Aufrufe laufen in v8.7.4 über die zentrale Fetch-Routing-Schicht.
- Keine neue Funktion darf direkt an den Legacy-Worker gekoppelt werden.

## Nächster Block
### AP-ARCH-04 API Contracts
1. Parqet-Zugriffsweg verifizieren.
2. DivvyDiary-API anhand offizieller/echter Schnittstelle verifizieren.
3. Datenfelder, Authentifizierung und Fehlerzustände dokumentieren.
4. Danach kostenlosen Serverless-Provider auswählen.

### AP-ARCH-05 Regression
Nach Providerwechsel:
- Boot
- lokaler State
- Portfolio-Sync
- Suche/ISIN
- Kursaktualisierung
- Watchlist
- Offline-/Providerfehler

## Regel
Keine neue UI-Funktion auf unbestätigte Datenquellen aufsetzen.
