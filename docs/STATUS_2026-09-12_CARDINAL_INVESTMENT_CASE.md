# HPOS v8.7.52 - Cardinal Energy Investment-Akte

## Ziel

Nach dem vollständigen Gate-1-Screening wird Cardinal Energy als erster Pilotwert auch für Gate 2 bis Gate 8 fachlich ausgewertet. Evidenz und Kapitalentscheidung bleiben getrennt. Kein späteres Signal umgeht ein früheres Hard Gate.

## Ergebnis

- Gate 1: PASS / halalkonform.
- Gate 2: REVIEW. Cardinal ist dem Turbo-Bucket und der Rolle Energy Income Satellite zugeordnet. Wegen fehlendem freigegebenem Toleranzband und bereits über Ziel liegendem Turbo-Anteil entsteht keine automatische Aufstockungsfreigabe.
- Gate 3: Investmentthese belegt, Signal staerkend.
- Gate 4: Fundamentaldaten staerkend auf Basis Q2/H1 2026.
- Gate 5: Bewertung fair bis anspruchsvoll; kein belegter Sicherheitsabschlag.
- Gate 6: Abwarten; positiver Trend, aber Kurs oberhalb der Trendmittel und nahe am 52-Wochen-Hoch.
- Gate 7: Primaere News-Evidenz aktuell; naechster Pflichttermin Q3-Bericht am 5. November 2026.
- Gate 8: Ausschliesslich externer Broker-Workflow; HPOS fuehrt keine Order aus.

## Produktdarstellung

Die Investment-Akte zeigt einen kompakten visuellen Acht-Gate-Pfad, die begruendete Gesamtlage, Fundamentalkennzahlen, Bewertungsanker, Timing und Primaerquellen. Das Entscheidungsboard verwendet fuer Cardinal den belegten Fall statt der generischen Unter-300-EUR-Vorlage.

## Quellen

- Cardinal Energy Q2 2026 Press Release
- Cardinal Energy Q2 2026 Financial Statements
- Cardinal Energy 2025 Year-End Reserves
- Cardinal Energy Dividend History
- Cardinal Energy News Releases

Alle Quellen sind im kanonischen Investment-Case mit direkter URL hinterlegt.

## v8.7.53 Darstellungsfix

Die Investment-Akte wird beim ersten Öffnen auch dann eingeblendet, wenn das ältere Portfolio-Fit-Modul erst verzögert in den DOM eingesetzt wird. Gestaffelte Wiederholungsversuche beseitigen das auf dem Gerät nachgewiesene Initialisierungsrennen; Entscheidungsdaten und Gate-Zustände bleiben unverändert.

## v8.7.54 Interaktionsfix

Klicks auf die aufklappbaren Gate-Abschnitte lösen keinen Neuaufbau der Investment-Akte mehr aus. Der geöffnete Zustand bleibt erhalten. Portfolio Fit übernimmt außerdem den bereits geladenen, vollständigen Gate-1-PASS des Investment-Case und zeigt nicht länger fälschlich LOCKED.

## v8.7.55 Visuelles Entscheidungscockpit

Die doppelte Gate-Liste und der separate Portfolio-Fit-Block werden im vollständigen Cardinal-Fall ausgeblendet. Eine kompakte Übersicht zeigt Entscheidung, Halal-Status, Portfolio-Freigabe, Gewichtung, nächsten Prüftermin, den achtstufigen Pfad, den Live-Portfolio-Fit, Pro/Contra und die qualitative Bewertung. Analyse und Primärquellen sind über die Register Übersicht, Analyse und Evidenz erreichbar.

## v8.7.56 Einheitliche Aktienakte

- Das Entscheidungscockpit ist nicht mehr an eine bereits vollständige Investment-Falldatei gekoppelt.
- Jeder Depot- und Watchlist-Wert mit gültiger ISIN erhält dieselben Ansichten: Übersicht, Analyse und Evidenz.
- Vollständig belegte Werte wie Cardinal Energy behalten ihre ausgearbeiteten Gates und Kennzahlen.
- Bei allen anderen Werten bleiben fehlende Prüfungen ausdrücklich offen oder gesperrt; es werden keine Daten ergänzt oder Freigaben erfunden.
- Der Wechsel zwischen Aktien ersetzt die Akte vollständig, damit keine Inhalte eines vorherigen Werts stehen bleiben.

## v8.7.57 Mobile-UX und visuelle Konsistenz

- Der Aktienkopf ist kompakter und zeigt Kürzel, Identität sowie den evidenzbasierten Halal-Status unmittelbar.
- Die Entscheidungskarte verwendet Grün, Gelb und Rot ausschließlich entsprechend dem tatsächlichen Entscheidungszustand.
- Der Fortschritt wird aus den acht realen Gate-Zuständen berechnet; offene und gesperrte Gates zählen nicht als abgeschlossen.
- Position, Marktdaten, Dividenden, Halal-Evidenz sowie Kennzahlen und Unternehmensprofil sind platzsparend aufklappbar.
- Lesbarkeit, Kontrast und mobile Informationsdichte wurden verbessert, ohne Daten oder Entscheidungsergebnisse zu verändern.

## v8.7.58 Ergebnis- und Evidenzklarheit

- Eine vollständig ausgewertete Gate-Kette wird nicht mehr mit einer Freigabe verwechselt: Fortschritt, Entscheidung und Aufstockungsstatus werden getrennt benannt.
- Im vollständigen Investment-Case entfällt der doppelte Halal-Evidenzblock unterhalb der Tabs; offene Fälle behalten ihn für die noch erforderliche Belegarbeit.
- Pro- und Contra-Punkte sind größer und kompakter dargestellt. Die vollständigen Inhalte bleiben in der Analyse erhalten.

## v8.7.59 Finaler Mobile-Schliff

- Pro und Contra stehen auf Smartphones untereinander und bleiben dadurch ohne schmale Textspalten lesbar.
- Der Portfolio-Fit benennt ausdrücklich den Turbo-Bucket, den aktuellen Turbo-Anteil und das maximale Ziel. Damit ist die Bucket-Allokation klar von der Einzelgewichtung der Aktie getrennt.

## v8.7.60 Einstandspreis-Härtung

- Der Supabase-/Parqet-Normalisierer berücksichtigt mehrere eindeutig benannte Felder für Durchschnittspreis und investiertes Kapital.
- Ist nur ein validierter Gesamteinstand vorhanden, wird der durchschnittliche Einstand durch die aktuelle Stückzahl geteilt.
- Fehlt der Einstand bei einem einzelnen Sync vorübergehend, bleibt der letzte validierte Wert nur dann erhalten, wenn die Stückzahl exakt unverändert ist. Bei einer Bestandsänderung wird nicht geschätzt.

## v8.7.61 Strukturierte Parqet-Geldwerte

- Einstandspreis und investiertes Kapital werden zusätzlich aus strukturierten Geldwerten wie `{ value, currency }` oder `{ amount, currency }` gelesen.
- Backend und Browser-Adapter verwenden dieselben erlaubten Zahlenfelder.
- Der aktuelle Marktpreis bleibt ausdrücklich ausgeschlossen und wird niemals als Einstand eingesetzt.
