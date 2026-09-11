# HPOS v8.7.49 – kompakte Entscheidungswarteschlange

## Ergebnis

Das Entscheidungsboard zeigt standardmäßig nur noch die fünf fachlich höchst priorisierten Depotwerte. Weitere Werte lassen sich bewusst einblenden. Dadurch bleibt die mobile Analyse kurz, ohne Informationen zu verbergen.

## Informationshierarchie

1. Status und Gate
2. Positionswert und Depotanteil
3. kleinster nächster Schritt
4. aufklappbare Regeln und Evidenz
5. Sprung zur Investment-Akte

Die fachliche Sortierung bleibt fail-closed: `EXIT-REVIEW` vor `PRÜFUNG OFFEN`, danach `REVIEW` und `FREEZE`.

## Unveränderte Schutzgrenzen

- keine Änderung an Depot-, Cash- oder Halal-Daten
- keine automatische Order oder Handlungsfreigabe
- keine Lockerung der acht Decision Gates
- keine erfundenen Portfolio-Grenzwerte
