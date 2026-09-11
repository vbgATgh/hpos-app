# Cardinal Energy: vollständiger accountfreier AAOIFI-Pilot

## Entscheidung

Cardinal Energy Ltd. (`CJ.TO`, ISIN `CA14150G4007`) wird nach der HPOS-AAOIFI-Rule-Engine als `PASS` eingestuft. Alle vier Entscheidungskriterien sind mit kostenlosen offiziellen Unternehmensquellen belegt. Es wird kein externer Halal-Account und kein API-Schlüssel verwendet.

## Identität und Kerngeschäft

- Emittent: Cardinal Energy Ltd.
- ISIN: `CA14150G4007`
- Börsensymbol: `CJ.TO`
- Geschäft: Erwerb, Exploration und Produktion von Erdöl und Erdgas in Westkanada
- Quelle: Cardinal Energy Q2 2026 Financial Statements, Note 1

Die bisher mögliche lose Wikipedia-Zuordnung wurde gehärtet. Für `CJ.TO` verwendet `hpos-profile` nun das offizielle Cardinal-Profil; ein beliebiger erster Wikipedia-Suchtreffer ist nicht mehr zulässig.

## Pflichtkennzahlen und Ergebnis

| Kriterium | Belegter Wert | Nenner | Quote | Grenze | Ergebnis |
|---|---:|---:|---:|---:|---|
| Nicht-zulässige Einnahmen | konservative Obergrenze 4,674 Mio. CAD | Umsatz 538,342 Mio. CAD | 0,87 % | 5 % | PASS |
| Zinstragende Vermögenswerte | konservative Obergrenze 59,211 Mio. CAD | 36M-Ø Marktwert 1.226,390 Mio. CAD | 4,83 % | 30 % | PASS |
| Zinstragende Schulden | 238,644 Mio. CAD, Leasing ausgeschlossen | 36M-Ø Marktwert 1.226,390 Mio. CAD | 19,46 % | 30 % | PASS |
| Kerngeschäft | Öl- und Erdgasproduktion | – | – | kein Ausschlusstreffer | PASS |

Für die Einnahmenquote wird vorsichtig die gesamte Position „Processing and other revenue“ als potenziell nicht zulässig behandelt, obwohl der Bericht keine Zinseinnahmen ausweist und „Other income“ null beträgt. Dadurch hängt der PASS nicht von einer Nullannahme ab.

## 36-Monats-Marktwert

Der Zeitraum Juli 2023 bis Juni 2026 umfasst 36 Monate. Weil eine kostenlose offizielle tägliche TSX-Historie ohne weiteres Konto nicht verfügbar war, verwendet HPOS die von Cardinal selbst berichteten durchschnittlichen Aktienkurse und gewichteten durchschnittlichen Aktienzahlen:

- H2 2023: 6 Monate
- FY 2024: 12 Monate
- FY 2025: 12 Monate
- H1 2026: 6 Monate

Methode: `ISSUER_REPORTED_PERIOD_AVG_PRICE_X_WEIGHTED_AVG_SHARES`. Die Berechnung ist als dokumentierte Approximation gekennzeichnet und liegt mit ausreichendem Abstand unter den relevanten Grenzwerten.

## Quellen

- [Cardinal Energy Q2 2026 Financial Statements](https://cardinalenergy.ca/wp-content/uploads/2026/07/Q2-2026-Financial-Statements-FINAL.pdf)
- [Cardinal Energy 2025 Audited Financial Statements](https://cardinalenergy.ca/wp-content/uploads/2026/03/2025-Financial-Statements-FINAL.pdf)
- [Cardinal Energy 2023 Audited Financial Statements](https://cardinalenergy.ca/wp-content/uploads/2024/03/2023-FS-FINAL.pdf)
- [Cardinal Energy Financial Reports](https://cardinalenergy.ca/investors/financial-reports/)

## Schutzregeln

- Fehlende Nachweise bei anderen Wertpapieren bleiben `OPEN_REVIEW`.
- Bestehende `PASS`- oder `FAIL`-Evidenz wird nicht degradiert.
- Portfolio-, Parqet-, Rollback- und Quarantänedaten werden nicht verändert.
- Die Einstufung erzeugt keine Order oder autonome Handlungsempfehlung.
