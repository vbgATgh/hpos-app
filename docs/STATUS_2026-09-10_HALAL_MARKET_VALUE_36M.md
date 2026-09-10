# HPOS v8.7.41 – accountfreier 36-Monats-Marktwert

## Ergebnis

Für das erste Evidenzpaket wurden 36 vollständige Monatsmarktwerte von September 2023 bis August 2026 berechnet. Jeder Monatswert besteht aus dem letzten Nasdaq-Handelsschlusskurs des Monats und der zuletzt vor diesem Kursdatum offiziell gemeldeten Aktienzahl aus SEC EDGAR.

| Instrument | 36M-Ø-Marktwert USD | Finanzdaten vollständig |
|---|---:|---:|
| Abbott Laboratories | 199.064.968.227,78 | 5/5 |
| McCormick & Company | 18.566.436.985,47 | 5/5 |
| Medtronic plc | 111.999.101.020,15 | 4/5 |
| Merck & Co., Inc. | 270.245.343.910,19 | 5/5 |
| Waste Management, Inc. | 85.747.142.438,28 | 3/5 |

## Methodik und Quellen

- Preisquelle: offizieller öffentlicher Nasdaq-Historienendpunkt, ohne Konto und API-Key.
- Aktienzahlen: SEC Companyfacts beziehungsweise einzelne 10-Q-/10-K-Deckblätter.
- McCormick: beide gemeldeten Aktienklassen werden je Stichtag addiert.
- Zeitraum: 36 abgeschlossene Kalendermonate; der unvollständige September 2026 bleibt ausgeschlossen.
- Zwischen Berichtsstichtagen wird die zuletzt gemeldete Aktienzahl fortgeführt. Der Marktwert ist deshalb eine dokumentierte historische Approximation, keine behauptete tägliche Börsenkapitalisierung.
- Der vollständige Audit-Datensatz mit 180 Monatsbeobachtungen liegt in `data/halal_market_value_36m.json`.
- Der reproduzierbare Builder liegt in `scripts/build_halal_market_value_evidence.py`.

## Fachliche Wirkung

- Abbott, McCormick und Merck besitzen jetzt alle fünf erforderlichen Finanzkennzahlen sowie ein offiziell belegtes Geschäftsprofil.
- Medtronic bleibt offen, weil die Verschuldung noch nicht belastbar um Finanzleasing bereinigt ist.
- Waste Management bleibt offen, weil leasingbereinigte Verschuldung und separat ausgewiesener Zinsertrag fehlen.
- Fehlende Daten erzeugen weiterhin weder `PASS` noch `FAIL`.

## Schutzgrenzen

- Keine Accounts, API-Keys oder kostenpflichtigen Datenquellen.
- Keine Verwendung von yfinance oder Yahoo-Kurshistorien für den AAOIFI-Marktwert.
- Keine Änderung an Supabase, Parqet, Portfolio-State, Cash, Rollback, Validierung oder Quarantäne.

