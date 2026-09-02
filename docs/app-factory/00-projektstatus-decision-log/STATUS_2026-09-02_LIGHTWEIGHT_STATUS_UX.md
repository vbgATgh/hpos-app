# HPOS Status 2026-09-02 – Lightweight Status UX

## Ziel
Halal-, Daten- und Sync-Zustände verständlicher darstellen, ohne HPOS schwerer zu machen oder einen weiteren Daten-/State-Pfad einzuführen.

## Umgesetzt
- Bestehendes `app/mvp-hardening.js` weiterverwendet; kein neues Runtime-Modul angelegt.
- Body-weiten `MutationObserver` entfernt. Hardening läuft jetzt ereignisgesteuert über bestehende Klick-, Input- und Visibility-Ereignisse.
- Rohes `UNKNOWN` wird in der Nutzeroberfläche als `Prüfung offen` dargestellt.
- `Prüfung offen` wird ausdrücklich weder als Halal-Freigabe noch als negative Einstufung gewertet.
- Decision-Gate-Texte wurden verständlicher und kürzer formuliert.
- `State: validiert` wird nutzerseitig als `Depotdaten: Geprüfter Stand` erklärt.
- `Kurse: Snapshot` wird nutzerseitig als `Gespeicherter Stand` erklärt.
- Sichtbare `HTTP 401`-/Fallback-Zustände werden in handlungsorientierte Sprache übersetzt, ohne den zugrunde liegenden Datenzustand zu verändern.
- Portfoliozeilen zeigen statt `UNKNOWN` kompakt `Prüfung offen`.
- Canonical `app/index.html` auf v8.7.7 angehoben; nur `mvp-hardening.js` erhielt einen neuen Cache-Key `20260902-lightux1`.

## Performance-/Komplexitätsreview
Neue Erkenntnis: Nicht nur neue Features, sondern auch bestehende Hilfsmodule können schleichend Dauerarbeit erzeugen. `verification-status.js` und `mvp-hardening.js` hatten zuvor jeweils einen body-weiten MutationObserver. Beide wurden jetzt auf ereignisgesteuerte Aktualisierung umgestellt.

Leitlinie ab jetzt:
1. Keine body-weiten Observer ohne nachgewiesenen Bedarf.
2. Keine neuen Runtime-Dateien für reine Text-/Darstellungslogik.
3. Bestehende Daten lesen, keine parallelen Zustände erzeugen.
4. Verständlichkeit verbessern, ohne mehr Requests zu erzeugen.
5. App-Runtime und UX-Komplexität in den regelmäßigen Reviews ausdrücklich mitprüfen.

## Prüfung
- JavaScript-Syntax von `mvp-hardening.js` lokal mit `node --check` geprüft: erfolgreich.
- GitHub Pages Deployment für Commit `8713d4a958508f206bffaed8e87e1e1b2d9a899d` war beim Erstellen dieses Status noch im Lauf und wird erst nach tatsächlichem Success als erfolgreich dokumentiert.

## Noch offen
- Visueller Realtest auf iPhone/Safari für Home, Portfolio, Halal Register und Investment-Akte.
- Prüfen, ob die verständlichen Statusbegriffe an allen sichtbaren Stellen konsistent sind.
- `live.html` bleibt vorerst unangetastet; Canonical-Pfad ist `app/index.html`. Legacy-/Doppelpfade werden erst im finalen Cleanup entfernt, wie im Projekt vereinbart.
