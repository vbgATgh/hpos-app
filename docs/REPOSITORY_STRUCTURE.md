# HPOS Repository Structure

Stand: 2026-08-30

## Ziel

Das Repository wird schrittweise bereinigt, ohne funktionierende HPOS-Stände, GitHub-Pages-Links, Daten-Workflows oder historische Referenzen vorschnell zu zerstören.

## Aktiver Produktpfad

Ab **HPOS v8.5** ist `app/` der einzige aktive UI-Pfad:

- `app/index.html`
- `app/app.js`
- `app/styles.css`

`ui83/index.html` ist nur noch eine Weiterleitung auf `app/`, damit bestehende Testlinks erhalten bleiben.

## Aktive Systembereiche

- `app/` – aktive HPOS-Anwendung
- `.github/workflows/` – Daten-, News-, Fundamental- und CI-Workflows
- `data/` – strukturierte HPOS-Daten; `data/bootstrap/` nur als gekennzeichneter Fallback
- `config/` – Instrument-, Markt- und Systemkonfiguration
- `docs/` – Architektur, Prüfungen und technische Dokumentation
- Root-PWA-Dateien vorerst nur solange Abhängigkeiten nicht vollständig geprüft sind

## Historische UI-Stände

Legacy, vorerst nicht löschen:

- `ui5/`
- `ui6/`
- `ui7/`
- `ui8/`
- `ui81/`
- `ui82/`
- `ui83/` als Redirect-Kompatibilität
- ältere Alpha-Verzeichnisse und Alpha-Testdateien

## Aufräumstrategie

### Phase 1 – abgeschlossen

1. Aktiven UI-Pfad dokumentiert.
2. `app/` als kanonischen Produktpfad eingeführt.
3. UI in HTML, CSS und JavaScript getrennt.
4. Parqet-Fallback aus dem UI-Code nach `data/bootstrap/` ausgelagert.
5. `ui83` auf den aktiven Produktpfad weitergeleitet.

### Phase 2 – nach v8.5-Test

1. Referenzen aus Workflows und Dokumentation auf Legacy-Pfade prüfen.
2. Nicht mehr verwendete UI-Versionen nach `archive/ui/` verschieben.
3. Alte Alpha-Artefakte nach `archive/alpha/` verschieben.
4. Veraltete Audit-/Hotfix-Einzeldateien in `docs/archive/` konsolidieren.
5. Doppelte oder obsolete Workflows deaktivieren oder archivieren.

### Zielstruktur

```text
hpos-app/
├── app/                  # aktive HPOS-Anwendung
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── assets/
├── data/                 # Portfolio-, Markt-, Fundamental-, News-Daten
│   └── bootstrap/        # nur gekennzeichnete Fallback-Snapshots
├── config/               # Konfiguration
├── docs/                 # aktive Dokumentation
│   └── archive/          # historische Doku
├── archive/
│   ├── ui/
│   └── alpha/
├── .github/workflows/
├── README.md
└── manifest.webmanifest
```

## Verbindliche Architekturregeln

1. **Parqet = kanonischer Depot-Snapshot** für Bestand, Stückzahlen, Einstand und Cash.
2. Marktquellen ergänzen nur Preise/Marktdaten und verändern niemals Stückzahlen oder Depotbestand.
3. Kauf/Verkauf erfolgt ausschließlich bei Scalable Capital bzw. Trade Republic.
4. HPOS führt keine Brokerorder aus; nach einer echten Brokerorder wird der Bestand über Parqet reconciled.
5. Watchlist und Depotbestand sind getrennte Datenmodelle.
6. Wertpapiere werden nicht als feste UI-Liste programmiert. Suche/Watchlist arbeiten dynamisch; Instrumentmetadaten liegen in Konfiguration oder externen Datenadaptern.
7. Die UI erzeugt keine erfundenen Halal-, Fundamental-, Steuer- oder BUY/SELL-Daten.
8. Neue Module greifen auf gemeinsame normalisierte Datenobjekte zu; keine parallelen Schatten-Stores pro Ansicht.
9. Alte UI-Versionen werden funktional nicht weiterentwickelt.

## Aktueller v8.5-Schritt

- dynamische Watchlist mit Hinzufügen/Entfernen
- Wertpapiersuche über Bestand, Watchlist und `config/market_sources.json`
- externer Suchadapter mit sicherem Fallback, falls der Proxy keine Suche liefert
- Broker-Workflow für Kauf/Verkauf ohne autonome Orderausführung
- anschließender manueller Parqet-Abgleich
- automatischer Parqet-Hintergrundcheck ab 15 Minuten
- Marktpreise getrennt vom Depotbestand

## Nächster technischer Schritt

Nach dem v8.5-Test werden zuerst Boot, Navigation, Watchlist-Persistenz, Broker-Workflow und Parqet-Reconciliation verifiziert. Erst danach folgen Halal-/Fundamental-/News-Verknüpfung und der physische Legacy-Cleanup.
