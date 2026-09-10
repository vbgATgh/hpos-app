# HPOS v8.7.42 – leasingbereinigte Schulden und zweites Evidenzpaket

## Ergebnis

Die in v8.7.41 noch offenen Schuldenwerte von Medtronic und Waste Management wurden anhand ihrer offiziellen Form 10-K um separat ausgewiesene Finanzierungsleasing-Verbindlichkeiten bereinigt. Zusätzlich wurde Johnson & Johnson als sechstes Unternehmen in den offiziellen Berichtsdaten- und 36-Monats-Marktwertbestand aufgenommen.

| Instrument | Belegte Finanzkennzahlen | Fachliche Wirkung |
|---|---:|---|
| Medtronic plc | 5/5 | Alle Pflichtkriterien belegt; Schuldenquote 24,912 % und damit innerhalb der 30-%-Grenze |
| Waste Management, Inc. | 4/5 | Schuldenquote 26,058 %; separat ausgewiesener Zinsertrag fehlt weiterhin, daher `OPEN_REVIEW` |
| Johnson & Johnson | 4/5 | Umsatz, Zinseinnahmen, Vermögenswerte und 36M-Marktwert belegt; leasingbereinigte Schulden nicht beziffert, daher `OPEN_REVIEW` |

## Belegte Berechnungen

- Medtronic: 1,788 Mrd. USD kurzfristige plus 26,173 Mrd. USD langfristige Schulden abzüglich 6 Mio. USD kurzfristiger und 54 Mio. USD langfristiger Finanzierungsleasing-Verbindlichkeiten = 27,901 Mrd. USD.
- Waste Management: 22,907 Mrd. USD Gesamtverschuldung abzüglich 86 Mio. USD kurzfristiger und 477 Mio. USD langfristiger Finanzierungsleasing-Verbindlichkeiten = 22,344 Mrd. USD.
- Johnson & Johnson: 36 vollständige Monatsmarktwerte von September 2023 bis August 2026 ergeben einen Durchschnitt von 435.975.519.778,53 USD.

## Quellen und Schutzgrenzen

- Medtronic 2026 Form 10-K: `https://www.sec.gov/Archives/edgar/data/1613103/000162828026044354/mdt-20260424.htm`
- Waste Management 2025 Form 10-K: `https://www.sec.gov/Archives/edgar/data/823768/000110465926012049/wm-20251231x10k.htm`
- Johnson & Johnson 2025 Form 10-K: `https://www.sec.gov/Archives/edgar/data/200406/000020040626000016/jnj-20251228.htm`
- Historische Kurse: offizieller öffentlicher Nasdaq-Endpunkt; Aktienzahlen: SEC EDGAR.
- Johnson & Johnson beschreibt Finanzierungsleasing lediglich als nicht wesentlich. Ohne bezifferten Betrag wird keine leasingbereinigte Schuldenkennzahl erzeugt.
- Waste Management weist den Zinsaufwand nur netto aus. Dieser Wert wird nicht als Zinsertrag umgedeutet.
- Keine Accounts, API-Keys oder kostenpflichtigen Dienste.
- Keine Änderung an Supabase, Parqet, Portfolio-State, Cash, Rollback, Validierung oder Quarantäne.

