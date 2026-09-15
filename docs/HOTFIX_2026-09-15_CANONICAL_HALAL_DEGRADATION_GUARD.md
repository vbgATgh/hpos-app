# HPOS – kanonischer Halal-Degradationsschutz

Stand: 2026-09-15

## Auslöser

Der produktive Screenshot von Cardinal Energy zeigte gleichzeitig den kanonischen Status `HALALKONFORM` und im neuen Einzelprüflauf `PRÜFUNG OFFEN`. Ursache war keine fehlende Cardinal-Evidenz. Der neue Research-Dienst konnte die Kombination `CA14150G4007` / `C.JO` extern nicht bestätigen und gab deshalb den offenen Nachlauf direkt an die Oberfläche zurück.

## Korrektur

- `hpos-screen` liest bei einer formal gültigen ISIN zuerst den bestehenden kanonischen Evidenzstand.
- Ein frisches `PASS`- oder `FAIL`-Ergebnis bleibt wirksam, wenn die externe Identität im aktuellen Nachlauf nicht aufgelöst werden kann.
- Kann die Identität aufgelöst werden, aber der neue Evidenzlauf endet offen, wird der offene Lauf weiterhin protokolliert; die Oberfläche erhält jedoch das frische entscheidende kanonische Ergebnis.
- Die Antwort kennzeichnet diesen Fall mit `degraded: true` und führt Nachlaufstatus, Grund, offene Kriterien und gegebenenfalls die neue Run-ID separat mit.
- Ein fehlendes, abgelaufenes oder bereits offenes kanonisches Ergebnis erhält keinen Bestandsschutz.

Der Schutz ist generisch und nicht auf Cardinal Energy beschränkt. Er verändert keine Depot-, Watchlist-, Broker-, Stückzahl- oder Einstandsdaten.

## Verifikation

- Aktiver App-Regressionstest: 53 Tests bestanden.
- Supabase `hpos-screen` Version 11: `ACTIVE`.
- Produktiver Request mit `CA14150G4007`, `C.JO` und `force: true`: HTTP 200, effektiver Status `PASS`, `cached: true`, `degraded: true` und separater `researchState: OPEN_REVIEW`.
- Vor und nach dem Test existierten null Cardinal-Läufe in `hpos_halal_runs`; der nicht aufgelöste Identitätsnachlauf erzeugte keinen irreführenden Auditlauf.
- Der kanonische Cardinal-Status blieb `PASS`.
- Die temporäre Testsitzung wurde nach dem Nachweis entfernt.
