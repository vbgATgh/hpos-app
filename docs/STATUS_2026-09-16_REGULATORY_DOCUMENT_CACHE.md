# HPOS v8.7.70 – regulatorischer Dokument- und Fakten-Cache

Stand: 2026-09-16

## Ergebnis

Der erste Nicht-US-Pfad für offizielle Berichtsdaten ist produktiv. `hpos-screen` löst einen bereits verifizierten Emittenten über GLEIF zur LEI auf, sucht dessen eingereichte ESEF-Berichte und speichert den verwendeten Jahresbericht sowie die extrahierten XBRL-Fakten getrennt im privaten Supabase-Cache.

Gespeichert werden insbesondere:

- ISIN, LEI, juristischer Name und Berichtsart,
- Berichtszeitraum, Abrufzeitpunkt und Dokument-Hash,
- Report-, Paket-, Viewer- und JSON-URL,
- Kennzahl, Wert, Einheit, Periode und XBRL-Konzept,
- die genaue Fundstelle als XBRL-Fact-ID,
- Extraktionsmethode und Evidenzqualität.

`hpos_regulatory_documents` und `hpos_regulatory_facts` haben RLS aktiviert. `anon` und `authenticated` besitzen keine Tabellenrechte. Der Zugriff erfolgt ausschließlich serverseitig über `service_role`; bestehende Portfolio-, Parqet- und Brokerdaten werden nicht verändert.

## Quellenbewertung

GLEIF dient der LEI-Auflösung. Die ESEF-Pakete werden über das von XBRL International betriebene Filing-Repository bezogen. Dieses Repository gibt an, seine ESEF-Berichte von den jeweiligen Officially Appointed Mechanisms zu beziehen. HPOS kennzeichnet den Bestand deshalb ausdrücklich als Kopie eines offiziell eingereichten Pakets und speichert Hash sowie Originalfundstellen. Der Aggregator wird nicht als eigenständige Halal-Entscheidungsquelle behandelt.

## Produktiver Novo-Nordisk-Nachweis

- ISIN: `DK0062498333`
- LEI: `549300DAQ1CVT6CXN342`
- Bericht: ESEF-Jahresbericht 2025
- Zeitraum: 2025-01-01 bis 2025-12-31
- Dokumentstatus: `EXTRACTED`
- SHA-256: `98a7dd83b7b040d0829f8a9befd951fb981681d50bcb9165352f0d8f4c4089d7`
- Umsatz: 309.064.000.000 DKK
- Finance Income: 9.660.000.000 DKK
- zinstragende Schulden: 130.958.000.000 DKK
- konservative Obergrenze zinstragender Vermögenswerte: 33.644.000.000 DKK
- Geschäftsmodellbeschreibung und alle vier Finanzwerte besitzen eine XBRL-Fact-ID als Fundstelle.

Der zweite produktive Lauf verwendete bereits `ESEF_XBRL_CACHE`. Der Cache ist damit nicht nur befüllt, sondern wird auch tatsächlich gelesen.

## Fachliche Grenze

Gate 1 bleibt für Novo Nordisk korrekt `OPEN_REVIEW`.

- `FinanceIncome / Umsatz = 3,13 %` ist nur ein konservativer Finance-Income-Proxy und kein vollständiger Nachweis aller nicht zulässigen Einnahmen.
- Für die beiden Bilanzquoten fehlte in diesem Stand noch ein belastbarer Marktwert-Nenner. Der anschließend geplante historische 36-Monats-Dienst wurde mit DEC-029 verworfen; aktiv verwendet HPOS den dokumentierten Marktwert am Prüftag.
- Die offizielle Tätigkeitsbeschreibung ist vorhanden, benötigt aber noch eine belastbare regelbasierte Geschäftsmodellklassifikation.

HPOS verwendet diese Teilwerte deshalb nicht als Halal-Freigabe und erzeugt auch kein falsches `FAIL` aus einem überbreiten Finance-Income-Wert.

## Verifikation

- Supabase `hpos-screen` Version 18 / Service 1.5.0 ist aktiv.
- Healthcheck meldet `SEC_AND_ESEF_XBRL_CACHE` und `regulatoryDocumentCache: true`.
- 56 direkt betroffene Tests sind grün.
- Gesamtsuite: 228 bestanden; sechs bekannte Legacy-Fehler außerhalb dieses Arbeitspakets bleiben unverändert.
- TypeScript-Bundleprüfung mit esbuild ist bestanden.
- RLS und Tabellenrechte wurden produktiv abgefragt und bestätigt.

## Nächstes kleines Paket

Dieser damalige nächste Schritt ist durch DEC-029 überholt. Statt einer historischen Aktienzahl- und Marktwertreihe verwendet HPOS für beide Bilanzquoten den Marktwert am Prüftag. Danach folgt weiterhin die regelbasierte Geschäftsmodellklassifikation.
