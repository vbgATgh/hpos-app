# HPOS v8.7.38 – quellengebundene Geschäftsberichtsdaten für Gate 1

**Status:** PRODUKTIV VERÖFFENTLICHT UND VERIFIZIERT

## Ausgangslage

Die accountfreie AAOIFI-Prüfung blieb bei vielen Werten offen, weil Yahoo im produktiven Fallback zwar Geschäftsprofile, aber keine belastbaren Pflichtkennzahlen lieferte. Der bereits vorhandene GitHub-SEC-Adapter war korrekt konfiguriert, erhielt im letzten Lauf jedoch für alle fünf erfassten Unternehmen HTTP 403 und erzeugte keine SEC-Evidenz.

## Live-Test und Entscheidung

Die SEC stellt Companyfacts grundsätzlich kostenlos und ohne API-Key bereit. Der reale Zugriff wurde dennoch sowohl aus GitHub Actions als auch aus der Supabase Edge Function mit HTTP 403 abgewiesen. Die getestete Edge-Erweiterung wurde deshalb sofort zurückgerollt. Produktiv läuft `hpos-profile` v9 wieder ohne den langsameren SEC-Versuch.

Damit gilt: SEC bleibt eine geeignete manuelle Primärquelle, ist aber derzeit kein belastbarer unbeaufsichtigter HPOS-Transportweg.

## Verbindlicher Quellenpfad

| Kennzahl | Verbindliche Quelle | Behandlung |
|---|---|---|
| Umsatz | Offizieller Geschäftsbericht / Filing | Wert, Zeitraum und URL zwingend |
| Zinstragende Schulden | Offizieller Geschäftsbericht / Anhang | Finanzschulden getrennt erfassen; konservativ bleiben |
| Zinstragende Vermögenswerte | Offizieller Geschäftsbericht / Anhang | Cash plus kurzfristige Anlagen höchstens als Obergrenze |
| Zinseinnahmen | Offizieller Geschäftsbericht / Anhang | Keine Ableitung aus einer mehrdeutigen Netto-Zinsposition |
| 36-Monats-Marktwert | Belegte Monatskurse × Aktienanzahl | Als Approximation kennzeichnen; ein einzelner 36M-Kurs genügt nicht |

FMP, Finnhub und SimFin werden nicht genutzt, weil dafür neue Accounts oder API-Keys nötig wären. Stockanalysis, Marketscreener und ähnliche Aggregatoren sind keine verbindliche Source of Truth für eine automatische Halal-Freigabe.

Der neue Rohkennzahlenspeicher `data/halal_financial_evidence.json` startet bewusst leer. Er darf nur ISIN-zentrierte Werte aus offiziellen Quellen aufnehmen. Die AAOIFI-Engine lädt diese Werte vor der Auswertung und übernimmt ausschließlich numerische Einträge mit Quellen-URL.

## Schutzregeln

- Keine neue Halal-Einstufung ohne vollständig belegte Kriterien.
- Fehlende oder mehrdeutige Daten bleiben `OPEN_REVIEW`.
- Rohkennzahlen dürfen kuratierte ISIN-Evidenz nicht überschreiben.
- Keine Übertragung von Depotwert, Stückzahl, Einstandspreis, Cash, Broker oder Steuerdaten.
- Kein zusätzlicher Account, kein API-Key und kein kostenpflichtiger Dienst.

## Lokale Verifikation

- `hpos-profile` v9 wurde nach dem negativen SEC-Live-Test erfolgreich auf das vorherige Verhalten zurückgeführt und liefert HTTP 200.
- Der erstmals source-kontrollierte Edge-Function-TypeScript-Stand besteht den Node-22-Strip-Type-Syntaxcheck.
- Alle Browser-JavaScript-Dateien bestehen den Syntaxcheck.
- 20 aktive Halal-, Quellen-, OAuth- und Parqet-Schutztests bestanden.
- `git diff --check` bestanden.

## Produktionsnachweis

- Pull Request #46 nach erfolgreicher `HPOS Current App CI` als Squash-Commit nach `main` übernommen.
- GitHub Pages liefert v8.7.38 mit Cache-Key `20260909-sec1`.
- `data/halal_financial_evidence.json` wird produktiv ausgeliefert und bestätigt `accountsRequired: false`, `officialSourcesOnly: true` sowie `missingDataState: OPEN_REVIEW`.
- Der Rohkennzahlenspeicher enthält noch keine Assets. Dadurch wurde keine bestehende Halal-Einstufung verändert.
