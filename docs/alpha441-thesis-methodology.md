# HPOS Alpha 4.4.1 – Thesis Intelligence

## Ziel
HPOS verdichtet These, Evidenz, Portfolio-Fit, Marktregime, News und Halal-Compliance zu einer nachvollziehbaren Entscheidung. Keine KI-Freigabe und keine gewichtete Pseudopräzision.

## Quellenbasis
Die Methodik baut auf den im Projekt bereits dokumentierten HPOS-Regeln und der vorhandenen App-Logik auf. Für ausdrücklich genannte frühere Agenten konnte im aktuell abrufbaren Projektkontext kein belastbarer separater Agenten-Datensatz gefunden werden. Deshalb werden keine nicht belegten Agentenregeln erfunden. Neue Methodikbausteine werden als HPOS-4.4.1-Erweiterung gekennzeichnet.

## Entscheidungsreihenfolge
1. **Hard Gates:** H0 = Veto/Exit-Review; H2 = Freeze/Review; UNKNOWN = kein Neukauf/keine Aufstockung; nur belegtes H1 öffnet das Kauf-Gate.
2. **Portfolio-Fit:** Positionsgewicht, Konzentration, Sektor-Caps, Cashreserve und Mindestpositionslogik.
3. **Investmentthese:** These → Evidenz → Risiken → Katalysatoren → Invalidierung. Eine These muss falsifizierbar sein.
4. **Fundamentale Qualität:** Wachstum, Cashflow, Bewertung, Stabilität, Dividende, Schulden. Diagnosefaktoren dürfen harte Gates nicht überstimmen.
5. **Markt/Timing:** Momentum, Drawdown, 52W-Kontext und Kaufzone. Momentum allein erzeugt nie ein Kaufsignal.
6. **News/Ereignisse:** nur neue, entscheidungsrelevante Ereignisse; Duplikate clustern; Wirkung auf These, Umsatz/Gewinn, Bilanz, Dividende, Regulierung oder Halal-Gate benennen.
7. **Konfidenz:** Datenvollständigkeit und Quellenqualität bestimmen, wie sicher die Schlussfolgerung ist. Fehlende Daten reduzieren Konfidenz statt Annahmen zu erfinden.

## Halal-Methodik
AAOIFI-orientiert. Musaffa primär, Zoya sekundär, Sharlife ergänzend. Ratio-Urteile nur mit Rechenlogik, Zeitbezug, Nenner und Schwelle. Quellenkonflikt führt zu H2/Freeze und Review; UNKNOWN ist keine Kauf-/Aufstockungsfreigabe.

## UI-Prinzip
Asset-Übersicht beantwortet in dieser Reihenfolge: Was ist die Lage? Warum? Was hat sich verändert? Was würde die Entscheidung ändern? Detaildaten bleiben drill-down-fähig, werden aber nicht mehrfach auf der Hauptfläche wiederholt.
