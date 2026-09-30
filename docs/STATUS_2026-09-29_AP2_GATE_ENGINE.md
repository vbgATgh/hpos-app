# AP 2 – Regelwerk & Gate-Engine

Stand: 2026-09-29  
Release-Kandidat: HPOS v8.7.75
Status: ABNAHMEBEREIT, noch nicht veröffentlicht

## Umgesetzt

- Eine kanonische Gate-Engine wertet alle acht Gates in verbindlicher Reihenfolge aus.
- Gate 1 und Gate 2 sind Hard Gates; Gate 3 bis 7 sind fachliche Review-Gates; Gate 8 bleibt reine externe Ausführung.
- Historische Zustände werden auf eindeutige Zustände normalisiert: `PASS`, `FAIL`, `OPEN_REVIEW`, `REVIEW`, `WAIT_TRIGGER`, `LOCKED` und `EXTERNAL_ONLY`.
- Die Gesamtentscheidung verwendet nur noch fünf eindeutige Zustände: `HARD_BLOCKED`, `EVIDENCE_REQUIRED`, `REVIEW_REQUIRED`, `WAIT_TRIGGER` und `READY_FOR_RANKING`.
- Fehlende oder widersprüchliche Evidenz erzeugt `EVIDENCE_REQUIRED`, niemals automatisch `WAIT_TRIGGER`.
- `WAIT_TRIGGER` entsteht ausschließlich durch einen ausdrücklich hinterlegten Timing-Trigger.
- T90 ist ein eigener Review-Hinweis und verändert weder Gate-Status noch Kapitalfreigabe.
- Die Gate-Engine berechnet keinen EIB. Sie liefert immer `NOT_CALCULATED` und `amount: null`; EIB gehört ausschließlich in AP 7 und AP 10.
- Investment-Akte und Decision Board verwenden dieselbe kanonische Auswertung.
- Der historische Cardinal-Zustand `WAIT` wurde zu `WAIT_TRIGGER`, `HOLD_REVIEW` zu `REVIEW_REQUIRED` migriert. Gate 2 Review hat Vorrang vor einem späteren Timing-Trigger.

## Nachweise

- `tests/test_gate_engine.mjs` prüft Hard Block, Evidenzlücke, Review, echten Trigger, T90-Neutralität, Konflikte und EIB-Abgrenzung.
- Browser-JavaScript-Syntaxprüfung für alle Dateien unter `app/` bestanden.
- AP-2-bezogene Python-Regressionstests bestanden.
- Vollständiger Testlauf: 239 bestanden; 5 bekannte Legacy-Fehler außerhalb AP 2.

## Noch vor formaler Abnahme

1. v8.7.75 veröffentlichen und den Cardinal-Hotfix im Produktions-Smoke bestätigen.
2. Produktions-Smoke auf dem iPhone durchführen.
3. Einen offenen Wert, einen halalkonformen Wert und Cardinal Energy prüfen.
4. Bestätigen, dass T90 nur als Review-Hinweis erscheint und kein automatisches `WAIT` oder `EIB 0` erzeugt.
