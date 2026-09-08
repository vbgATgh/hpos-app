# HPOS v8.7.37 – sichtbares Ergebnis der Halal-Prüfung

## Befund

`Halal-Prüfung aktualisieren` führte die accountfreie AAOIFI-Prüfkaskade tatsächlich erneut aus. Wenn dieselben kostenlosen Quelldaten weiterhin unvollständig waren, blieben die Einstufungen fachlich korrekt unverändert. Die Oberfläche zeigte jedoch weder Abschluss noch Ursache und vermittelte deshalb den Eindruck eines wirkungslosen Buttons.

Ein neutraler Profilabruf bestätigte, dass der kostenlose Fallback zwar Geschäftsprofildaten, aber nicht zuverlässig Umsatz, Schulden, zinstragende Vermögenswerte, Zinserträge und einen ausreichend langen 36-Monats-Marktwert liefert. Ohne diese Pflichtdaten bleibt `OPEN_REVIEW` zwingend erhalten.

## Änderung

- Schaltfläche in `Prüfung erneut ausführen` umbenannt.
- Sichtbarer Laufbericht mit Zeit, geprüfter Anzahl, Statusänderungen, PASS, FAIL, OFFEN und technischen Fehlern ergänzt.
- Fehlende AAOIFI-Pflichtkriterien werden gezählt und in den Registerzeilen kenntlich gemacht.
- Veralteten Hinweis auf externe Restfall-Evidenz entfernt; die accountfreie Regel wird nun konsequent benannt.
- Batch-API liefert eine strukturierte Zusammenfassung statt nur einer Zahl.
- Fehlendes Geschäftsprofil bleibt offen und wird nicht als teilweise bestanden behandelt.

## Unveränderte Sicherheits- und Fachregeln

- Keine neuen Accounts oder API-Keys.
- Keine automatische Ablehnung wegen fehlender Daten.
- Keine PASS-Einstufung ohne vollständig belegte Kriterien.
- Kuratierte und entscheidende Evidenz behält ihre Priorität.
- Keine Änderung an Portfolio, Parqet, Cash, Rollback, Validierung oder Quarantäne.

## Verifikation vor Veröffentlichung

- Alle Browser-JavaScript-Dateien syntaktisch gültig.
- `git diff --check` bestanden.
- 16 aktive Halal-, OAuth- und Parqet-Schutztests bestanden.
- Versions- und Cache-Konsistenz auf v8.7.37 aktualisiert.

## Noch ausstehend

- Pull Request und GitHub-CI.
- Produktive Pages-Prüfung.
- Gerätetest des sichtbaren Laufberichts.
