# HPOS v8.7.39 – sichtbarer Prüffortschritt und erstes Berichtsdatenpaket

## Anlass

Der Gerätetest zeigte, dass `Prüfung erneut ausführen` zwar arbeitet, aber ohne neue entscheidende Evidenz keine Statusänderung erzeugt. Dadurch wirkte die Schaltfläche trotz ausgeführtem Lauf ohne Wirkung.

## Entscheidung

- Der Laufbericht zeigt zusätzlich, bei wie vielen Instrumenten offizielle Geschäftsberichtsdaten erkannt wurden und wie viele der fünf Finanzkennzahlen belegt sind.
- Offene Registerzeilen zeigen den Fortschritt als `x/5 Finanzwerte belegt`.
- Die Detailansicht zeigt denselben Abdeckungsstand und verlinkt die zugrunde liegenden offiziellen Berichte.
- Die Kriterien übernehmen die tatsächliche Quellenherkunft `OFFICIAL_REPORT_CURATED`; frühere generische Herkunftsbezeichnungen werden für kuratierte Werte nicht mehr verwendet.
- Fehlende Werte bleiben fehlend. Es werden keine Nullwerte, Näherungen ohne Kennzeichnung oder Aggregatorwerte ergänzt.
- Ohne belastbaren 36-Monats-Durchschnitt des Marktwerts entsteht aus diesem Datenpaket weder `PASS` noch `FAIL`.

## Erstes Evidenzpaket

| Instrument | ISIN | Belegte Finanzwerte | Bewusst offen |
|---|---|---:|---|
| Abbott Laboratories | US0028241000 | 4/5 | 36M-Ø-Marktwert |
| McCormick & Company | US5797802064 | 4/5 | 36M-Ø-Marktwert |
| Medtronic plc | IE00BTN1Y115 | 3/5 | leasingbereinigte Schulden, 36M-Ø-Marktwert |
| Merck & Co., Inc. | US58933Y1055 | 4/5 | 36M-Ø-Marktwert |
| Waste Management, Inc. | US94106L1098 | 2/5 | leasingbereinigte Schulden, separater Zinsertrag, 36M-Ø-Marktwert |

Die Rohwerte liegen ausschließlich in `data/halal_financial_evidence.json`. Jede Kennzahl enthält Zeitraum, Einheit, Bezeichnung und konkrete offizielle Quellen-URL.

## Schutzgrenzen

- Keine neuen Accounts, API-Keys oder kostenpflichtigen Dienste.
- Keine Änderung der bestehenden Halal-Einstufungen allein durch Teilabdeckung.
- Keine Änderung an Parqet, Portfolio-State, Cash, Rollback, Validierung oder Quarantäne.
- Unvollständige Evidenz bleibt `OPEN_REVIEW` beziehungsweise `PRÜFUNG OFFEN`.

## Verifikation

- JSON-Validierung und Quellenvertragsprüfung für alle 17 übernommenen Kennzahlen.
- Browser-JavaScript-Syntaxprüfung.
- Aktive Halal-, OAuth- und Parqet-Schutztests.
- Versions- und Cache-Key-Prüfung für v8.7.39.

