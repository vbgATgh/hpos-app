# HPOS Repository Structure

Stand: 2026-08-30

## Ziel

Das Repository wird schrittweise bereinigt, ohne funktionierende HPOS-Stände, GitHub-Pages-Links, Daten-Workflows oder historische Referenzen vorschnell zu zerstören.

## Aktiver Produktpfad

### UI

- `ui83/index.html`
- interne Version im Dokument: **HPOS UI v8.4**
- Status: **aktive Entwicklungsbasis**

Der Ordner bleibt vorerst `ui83`, obwohl der Inhalt bereits v8.4 ist. Eine Umbenennung erfolgt erst, wenn alle Links, Pages-Pfade und Tests kontrolliert migriert werden können.

## Aktive Systembereiche

Diese Bereiche bleiben erhalten und werden nicht pauschal archiviert:

- `.github/workflows/` – Daten-, News-, Fundamental- und CI-Workflows
- `data/` – strukturierte HPOS-Daten
- `config/` – Konfiguration
- `docs/` – Architektur, Prüfungen und technische Dokumentation
- Root-PWA-Dateien (`index.html`, `app.js`, `styles.css`, Manifest/Icons), solange nicht geklärt ist, ob einzelne Deployments oder Workflows davon abhängen
- `ui83/` – aktuelle UI-Basis

## Historische UI-Stände

Als Legacy einzustufen, aber vorerst **nicht löschen**:

- `ui5/`
- `ui6/`
- `ui7/`
- `ui8/`
- `ui81/`
- `ui82/`
- ältere Alpha-Verzeichnisse und Alpha-Testdateien

Grund: Diese Stände sind historisch, können aber noch von Workflows, Vergleichstests, GitHub-Pages-URLs oder Audit-Dokumenten referenziert werden.

## Aufräumstrategie

### Phase 1 – sofort und risikoarm

1. Aktiven UI-Pfad dokumentieren.
2. README eindeutig machen.
3. Keine neue Entwicklung mehr in alten UI-/Alpha-Verzeichnissen.
4. Neue Features nur noch in der aktiven Linie entwickeln.
5. Vor jeder strukturellen Löschung Abhängigkeiten prüfen.

### Phase 2 – nach stabilem v8.4/v8.5-Test

1. Referenzen aus Workflows und Dokumentation auf Legacy-Pfade suchen.
2. Nicht mehr verwendete UI-Versionen nach `archive/ui/` verschieben.
3. Alte Alpha-Artefakte nach `archive/alpha/` verschieben.
4. Veraltete Audit-/Hotfix-Einzeldateien in `docs/archive/` konsolidieren.
5. Doppelte oder obsolete Workflows deaktivieren oder archivieren.

### Phase 3 – Zielstruktur

```text
hpos-app/
├── app/                  # aktive HPOS-Anwendung
│   ├── index.html
│   ├── app.js
│   ├── styles.css
│   └── assets/
├── data/                 # Portfolio-, Markt-, Fundamental-, News-Daten
├── config/               # Konfiguration
├── docs/                 # aktive Dokumentation
│   └── archive/          # historische Doku
├── archive/
│   ├── ui/               # alte UI-Versionen
│   └── alpha/            # alte Alpha-Stände
├── .github/workflows/    # nur aktive CI-/Datenjobs
├── README.md
└── manifest.webmanifest
```

Diese Zielstruktur wird **nicht in einem großen Umbau** erzwungen. Die Migration erfolgt inkrementell, damit HPOS stabil bleibt.

## Verbindliche Architekturregeln

1. **Parqet = kanonischer Depot-Snapshot** für Bestand, Stückzahlen und Cash.
2. Marktquellen dürfen nur Kurse/Marktdaten ergänzen und niemals Stückzahlen oder Depotbestand überschreiben.
3. Kauf/Verkauf wird ausschließlich bei Scalable Capital bzw. Trade Republic ausgeführt.
4. HPOS führt keine Brokerorder aus.
5. Watchlist und Depotbestand sind getrennte Datenmodelle.
6. Die UI erzeugt keine erfundenen Halal-, Fundamental-, Steuer- oder BUY/SELL-Daten.
7. Neue Module greifen auf gemeinsame normalisierte Datenobjekte zu; keine parallelen Schatten-Stores pro Ansicht.
8. Alte UI-Versionen werden nicht mehr funktional erweitert.

## Aktueller Befund

- `ui81/index.html` ist noch die historische v8.1-Test-Shell.
- `ui82/index.html` ist der historische v8.2-Stand.
- `ui83/index.html` enthält bereits HPOS UI v8.4 und ist deshalb die aktuelle Entwicklungsbasis.
- Das Repository enthält zahlreiche Alpha- und Audit-Artefakte. Sie sind gute Archivkandidaten, sollen aber erst nach Abhängigkeitsprüfung verschoben werden.

## Nächster technischer Schritt

Bevor Dateien physisch verschoben oder gelöscht werden:

1. aktuelle UI stabilisieren,
2. Watchlist/Search/Portfolio-Sync sauber vervollständigen,
3. Abhängigkeiten der GitHub Actions auf alte Pfade prüfen,
4. anschließend Legacy-Migration in einem getrennten Cleanup-Commit durchführen.
