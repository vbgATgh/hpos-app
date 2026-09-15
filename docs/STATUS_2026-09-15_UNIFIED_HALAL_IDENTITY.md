# HPOS v8.7.69 – einheitlicher Halal-Status und aliasfähige Identität

## Ausgangsfehler

Depot, Watchlist, Detailkopf und Prüfprotokoll konnten verschiedene Gate-1-Zustände anzeigen. Ursache waren konkurrierende lokale und kanonische Statusquellen. Zusätzlich verlangte die OpenFIGI-Prüfung trotz exakter ISIN denselben Tickertext wie Yahoo beziehungsweise der Broker. Dadurch blieb beispielsweise `DK0062498333` mit `NOVO-B.CO` offen.

## Umsetzung

- Der kanonische Supabase-Zustand hat in allen Primäransichten Vorrang, einschließlich `OPEN_REVIEW`.
- Ein lokaler alter `PASS` oder `FAIL` darf einen kanonischen offenen Zustand nicht mehr übermalen.
- Einzelprüfung, Depot und Watchlist verwenden denselben `hpos-screen`-Backendpfad.
- Die alte lokale AAOIFI-Vorprüfung startet nicht mehr eigenständig im Hintergrund. Sie bleibt lediglich als expliziter Fallback im Code erhalten.
- OpenFIGI bestätigt eine formal gültige ISIN auch bei börsenüblichen Tickerabweichungen. Börsensuffixe und Trennzeichen werden für den Vergleich normalisiert; der vom Portfolio benötigte Yahoo-Ticker bleibt erhalten.
- Bereits extern bestätigte Identitäten werden in `hpos_security_identities` wiederverwendet, ohne die ursprüngliche Quellenprovenienz durch eine Cache-Bezeichnung zu ersetzen.

## Produktionsnachweis

- Supabase `hpos-screen` Version 14 / Service 1.4.0 ist aktiv.
- Der Live-Aufruf für `DK0062498333` und `NOVO-B.CO` liefert `VERIFIED` über `OPENFIGI_EXACT_ISIN`.
- Der vollständige Novo-Nordisk-Lauf wurde unter Run-ID `a5ba2bc0-904e-4742-8f3a-668c71033b0b` gespeichert.
- Bereits bestätigte Identitäten werden vor erneuten externen Suchaufrufen aus dem Identitätscache geladen.
- Gate 1 bleibt für Novo Nordisk korrekt `OPEN_REVIEW`, weil Geschäftsmodellbeleg und drei AAOIFI-Finanzkriterien noch nicht ausreichend beschafft wurden. Die Identität ist dagegen nicht mehr der Blocker.
- 52 direkt betroffene Frontend-, Backend- und Integrationsregressionen sind grün; JavaScript-Syntax und Diff-Prüfung sind fehlerfrei.

## Verbleibender nächster Block

Der nächste Engpass ist nicht mehr die Novo-Identität, sondern die offizielle Berichtsdatenbeschaffung außerhalb des SEC-Pfads. Dafür folgt ein regulatorischer Dokument- und XBRL-Cache mit Quellen-, Perioden-, Einheiten- und Fundstellenprotokoll.
