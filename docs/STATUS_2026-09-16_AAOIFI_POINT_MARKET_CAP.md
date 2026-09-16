# HPOS v8.7.71 – AAOIFI-Marktwert am Prüftag

Stand: 2026-09-16

## Ergebnis

Der geplante historische Aktienzahl- und 36-Monats-Marktwertdienst wurde zurückgebaut. Gate 1 verwendet für die beiden Bilanzquoten jetzt den Marktwert zum Zeitpunkt der Prüfung.

Unverändert verpflichtend bleiben:

- `zinstragende Vermögenswerte / Marktwert am Prüftag`,
- `zinstragende Schulden / Marktwert am Prüftag`.

Entfallen sind:

- der Abruf einer dreijährigen monatlichen Kurshistorie,
- die Zuordnung historischer Aktienzahlen,
- der 36-Monats-Durchschnitt,
- die Mindestabdeckung von 30 Monaten als Gate-1-Bedingung.

## Nachvollziehbarkeit und Schutzgrenzen

Der Marktdatenpunkt wird pro Prüflauf als `marketValueAtCheck` mit Währung, Zeitstempel, Quell-URL und Methode dokumentiert. Wenn der Datenanbieter einen Marktwert direkt ausweist, lautet die Methode `YAHOO_REPORTED_MARKET_CAP_AT_CHECK`. Andernfalls berechnet HPOS ihn als aktuellen Kurs × zuletzt gemeldete ausstehende Stammaktien und speichert Kurs- und Aktienzahlbeleg getrennt. Er wird nicht als regulatorischer XBRL-Fakt im Berichtscache gespeichert, weil er sich laufend verändert.

Die Quote wird nur berechnet, wenn Berichtswährung und Marktwertwährung übereinstimmen. Fehlt der Marktwert oder weichen die Währungen ab, bleiben beide Kriterien `OPEN`. Die Entfernung der Historie lockert damit nicht das fail-closed Verhalten.

Die früher erzeugten Dateien mit historischen Marktwerten bleiben als gekennzeichnete Audit-Artefakte erhalten, werden aber weder vom Browser-Fallback noch vom kanonischen Supabase-Prüfdienst konsumiert.

## Technischer Stand

- `hpos-screen` Service 1.6.0 weist `MARKET_CAP_AT_CHECK` im Healthcheck aus.
- `hpos-profile` liefert keine 36-Monats-Felder und lädt keine monatliche Historie mehr.
- UI-Regeln und Evidenzabdeckung verwenden ausschließlich `marketValueAtCheck`.
- HPOS-Version: 8.7.71.

## Produktiver Nachweis: Novo Nordisk

- Kurs am Prüftag: 275,90 DKK, Stand 2026-09-15 14:59:52 UTC
- zuletzt gemeldete ausstehende Stammaktien: 4.424.805.520, Stand 2026-06-30
- Marktwert am Prüftag: 1.220.803.842.968 DKK
- zinstragende Vermögenswerte / Marktwert: 2,756 % · `PASS`
- zinstragende Schulden / Marktwert: 10,727 % · `PASS`
- Gesamtergebnis: weiterhin `OPEN_REVIEW`, weil Geschäftsmodellklassifikation und vollständige nicht zulässige Einnahmen noch offen sind
- produktiv: `hpos-screen` Function 20 / Service 1.6.0 und `hpos-profile` Function 12

## Verifikation

- 213 aktive Regressionstests bestanden.
- Gesamtsuite: 229 bestanden; sechs bereits bekannte Legacy-Fehler außerhalb dieses Pakets bleiben unverändert.
- Beide Edge Functions bestehen die TypeScript-Bundleprüfung.
- Der produktive Healthcheck meldet `MARKET_CAP_AT_CHECK`.
- Der temporäre Smoke-Test-Zugang wurde nach der Prüfung wieder gelöscht.
