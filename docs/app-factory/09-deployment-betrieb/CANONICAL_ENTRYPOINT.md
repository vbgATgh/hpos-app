# HPOS – Canonical Entrypoint

Stand: 2026-09-01

## Verbindlicher Produktpfad

Der kanonische HPOS-Produktpfad ist ausschließlich:

`https://vbgatgh.github.io/hpos-app/app/`

Der Repository-Root `https://vbgatgh.github.io/hpos-app/` darf keine eigenständige alte HPOS-Anwendung mehr ausliefern.

## Anlass

Im mobilen Browser wurde am 2026-09-01 über den Repository-Root noch eine historische HPOS-PWA mit dem Titel „Halal Portfolio Optimization System“ und lokalem Portfolio-Cockpit geladen. Diese Root-Anwendung gehört nicht zum aktuellen v9-RC-Produktpfad und erzeugte eine reale Verwechslungs-/Fehlbedienungsgefahr.

## Umgesetzte Härtung

- `index.html` im Repository-Root leitet auf `./app/` um und lädt keinen historischen Root-App-Code mehr.
- Query-String und Hash werden beim Redirect erhalten.
- Root-Manifest zeigt ebenfalls auf `./app/`.
- `app/manifest.webmanifest` ist der Manifest-Pfad der kanonischen App.
- `app/index.html` bindet das kanonische Manifest ein.
- Cache-Bust wurde auf `canonical7` erhöht.

## Legacy-Regel

Historische Root-/Alpha-Artefakte werden noch nicht blind gelöscht. Sie bleiben bis zum finalen Legacy-Cleanup als Legacy klassifiziert. Vor Go-live werden ausführbare Altpfade nach Abhängigkeitsprüfung entfernt oder archiviert, gefolgt von einer vollständigen Regression.

## Teststatus

Implementiert. Browser-Nachweis des Root-Redirects und des canonical7-App-Boots ist noch offen und darf bis zur tatsächlichen Prüfung nicht als PASS bezeichnet werden.
