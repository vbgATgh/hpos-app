# HPOS v8.7.40 – stabiler Laufstatus der Halal-Prüfung

## Reproduziertes Fehlerbild

Nach dem Start einer manuellen Sammelprüfung speichert jedes fertig geprüfte Instrument seinen Zwischenstand. Dieses Ereignis rendert das Halal Register neu. Dabei wurde die laufende Schaltfläche durch die normale Schaltfläche ersetzt, obwohl weitere Instrumente noch verarbeitet wurden. Der Lauf wirkte dadurch beendet und ohne Ergebnis.

Zusätzlich verwendete v8.7.39 denselben lokalen Prescreen-Cache wie der vorherige, noch leere Berichtsdatenstand. Deshalb erschienen die neuen Angaben `x/5 Finanzwerte belegt` nicht sofort zuverlässig.

## Korrektur

- Der Laufzustand liegt außerhalb des jeweils neu gerenderten DOM und bleibt über alle Zwischenereignisse erhalten.
- Solange die Prüfung läuft, bleibt die Schaltfläche deaktiviert und zeigt `Prüfung läuft · x/y`.
- Unter der Schaltfläche wird derselbe Fortschritt als Live-Status angezeigt.
- Ein zweiter paralleler Lauf wird technisch blockiert.
- Nach Abschluss bleibt der bestehende Ergebnisbericht sichtbar.
- Der lokale Prescreen-Cache wechselt einmalig von v3 auf v4, damit die in v8.7.39 ergänzten offiziellen Berichtsdaten neu eingelesen werden.

## Unveränderte Schutzgrenzen

- Keine neue Halal-Einstufung ohne vollständige Evidenz.
- Fehlende Daten bleiben `OPEN_REVIEW` beziehungsweise `PRÜFUNG OFFEN`.
- Keine Änderung an Supabase, Parqet, Portfolio-State, Cash, Rollback, Validierung oder Quarantäne.

