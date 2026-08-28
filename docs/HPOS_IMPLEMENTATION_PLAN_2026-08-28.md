# HPOS implementation plan · 28.08.2026

## Leitprinzip
Neue Intelligenz wird nur auf verifizierte Daten und eine aufgeräumte Informationsarchitektur gesetzt. Jeder größere Schritt endet in einem stabilen Teststand. Der Nutzer prüft diesen Stand mobil anhand fest definierter Screenshots, bevor das nächste Paket auf derselben UI-Fläche aufsetzt.

## WP 4.7.1 · Data Integrity + Asset UX Cleanup · P0
Ziele:
- Opening Position / Ledger / Einstand konsistent verknüpfen.
- `purchasePrice` als gültigen lokalen Einstand in allen Asset-Komponenten verwenden; 0,00 EUR darf nur bei wirklich unbekanntem Einstand erscheinen.
- Widersprüche zwischen Historie, Kurskarte, P/L und Current State als Data-Quality-Issue anzeigen.
- Asset-Navigation auf eine einzige Ebene reduzieren: Übersicht | Analyse | Historie. Halal und News werden als Status/Detail aus der Entscheidung erreichbar, nicht als redundante Hauptnavigation.
- Übersicht zeigt eine Information nur einmal.

Screenshot checkpoint A:
1. Gesamtdepot/Home.
2. Scalable-Depotübersicht.
3. Trade-Republic-Depotübersicht.
4. 4imprint Übersicht komplett.
5. 4imprint Analyse komplett.
6. 4imprint Historie.
7. Eine Aktie mit bekanntem Einstand und eine mit unbekanntem Einstand.

Abnahme:
- kein widersprüchlicher Einstand;
- keine doppelte Asset-Navigation;
- keine mehrfach wiederholte Halal-/News-Aussage;
- mobile Seite deutlich kürzer als Alpha 4.7.

## WP 4.8 · Income Quality & Dividend Engine · P0/P1
Ziele:
- Dividende pro Asset als austauschbare Evidenzdimension.
- Gross/Net, Quellensteuer, Ausschüttungswachstum, FCF-/Cashflow-Deckung, Kürzungsrisiko, Zuverlässigkeit und nächster bestätigter Termin.
- Income Quality bleibt UNKNOWN, solange erforderliche Evidenz fehlt.
- Fortschritt zum HPOS-Ziel 100 EUR netto/Monat bis 10/2029.
- Dividende bleibt nach Halal, Qualität, Portfolio-Fit, Bewertung und Total Return nachgeordnet.

Screenshot checkpoint B:
1. Income-Gesamtübersicht.
2. Asset mit Dividende.
3. Asset ohne Dividende.
4. Quellensteuer-/Nettoansicht.
5. Zielpfad 100 EUR/Monat.

## WP 4.9 · Valuation Evidence Engine · P0/P1
Ziele:
- Bewertungsstatus nicht manuell erfinden, sondern aus belegten Kennzahlen ableiten.
- historische/Peer-kontextuelle Bewertung, FCF-/Earnings-Basis und Datenalter.
- Bewertung ist vergleichbare Dimension der Capital Allocation Engine; UNKNOWN erzeugt keinen Vorteil.

Screenshot checkpoint C:
1. zwei vergleichbare Kandidaten;
2. Bewertungsdetails je Titel;
3. Capital-Competition-Vergleich mit bekannten/unbekannten Dimensionen.

## WP 5.0 · Portfolio Controller + Risk Engine · P0
Ziele:
- Current State, Caps, Cash, offene Orders, T90, Sektor-/Commodity-/Satellite-Risiken zentral auswerten.
- Delta zum letzten Controller-Lauf.
- klare Ampel und EIB = 0, wenn ein Hard Gate verletzt ist.
- ETF-Look-through und gemeinsame Risikotreiber schrittweise integrieren.

Screenshot checkpoint D:
1. Controller Home;
2. Caps;
3. T90-Liste;
4. Cash inkl. reservierter Orders;
5. konkreter blockierter Kauf mit Begründung.

## WP 5.1 · Tax/FSA + Purification/Zakat UI · P1
Ziele:
- lokales Broker-Steuerprofil je Broker;
- verbleibender Sparer-Pauschbetrag;
- Verkaufssimulation und maximale Stückzahl innerhalb des bekannten Freibetrags;
- Verlusttöpfe/Teilfreistellung soweit belastbar;
- Purification und Zakat strikt getrennt;
- keine Steuer- oder Religionsscheingenauigkeit bei fehlenden Daten.

Screenshot checkpoint E:
1. FSA-Dashboard;
2. Verkaufssimulation innerhalb/über Freibetrag;
3. Purification;
4. Zakat-Methodik und Betrag.

## WP 5.2 · Capital Allocator + Rotation + EIB · P0
Ziele:
- Pareto-Logik aus 4.7 mit Income, Bewertung, Risiko, Steuer und Nettoeffekt vervollständigen.
- NEXT EUR 100/250/500.
- EIB inkl. Cash nach Transaktion, Gewicht und Caps.
- Rotation nur bei Eligibility Gate + deutlichem Vorteil + bekanntem Nettoeffekt.

Screenshot checkpoint F:
1. Nächster Euro;
2. Vergleich 2–3 Titel;
3. blockierter Kandidat;
4. Rotation NONE;
5. echte Rotation, falls Kriterien erfüllt.

## WP 5.3 · Beta Hardening + UX Freeze
Ziele:
- Reconciliation, Migration, Cache/PWA, Backup/Restore, E2E;
- Root-URL zeigt aktuellen stabilen Build;
- keine neue Feature-Fläche vor Behebung offener P0/P1-Fehler;
- endgültige mobile Informationsarchitektur einfrieren.

Screenshot checkpoint G:
kompletter Regression-Satz A–F plus iPhone Home-Screen/PWA-Neustart.

## Arbeitsregel
Nach jedem Screenshot-Checkpoint werden Auffälligkeiten in drei Klassen eingeordnet:
- P0: falsche Daten/Entscheidung/Privacy/Gate -> nächstes Paket stoppt;
- P1: deutlicher Nutzungs- oder Verständlichkeitsfehler -> vor nächstem Major-Paket beheben;
- P2: kosmetisch -> gesammelt bis UX Freeze.
