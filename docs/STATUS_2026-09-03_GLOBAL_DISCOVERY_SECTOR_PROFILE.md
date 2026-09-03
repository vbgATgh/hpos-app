# HPOS Status – Global Discovery, Sektor & Unternehmensporträt

Stand: 03.09.2026

## Umgesetzt

- Die Wertpapiersuche ist wieder eine globale Discovery-Suche nach Name, Ticker oder ISIN.
- Yahoo-Suchergebnisse ohne ISIN dürfen als klar gekennzeichnete **Beobachtung** in die Watchlist aufgenommen werden.
- Eine formal und extern bestätigte ISIN bleibt der kanonische Instrumentenschlüssel für Halal-Evidenz, Thesis, Decision Gates und brokernahe Entscheidungen.
- Depotpositionen werden weiterhin nicht zusätzlich als Watchlist-Eintrag dupliziert.
- Bereits vorhandene Watchlist-Einträge werden weiterhin dedupliziert.
- Die Investment-Akte erhält ein neues, schlankes **Unternehmensporträt** mit Sektor, Branche, Unternehmensgröße/Marktkapitalisierung, Beschäftigten, Sitz und kurzem Geschäftsmodell, soweit die Quelle diese Daten liefert.
- Unternehmensprofile werden clientseitig für sieben Tage gecacht. Es gibt bewusst keinen permanenten Profil-Poller.
- Der bisherige `MutationObserver` in `asset-intelligence.js` wurde entfernt; die Aktualisierung erfolgt ereignisnah über vorhandene Interaktionen.
- Neue Supabase Edge Function `hpos-profile` liefert ausschließlich Firmen-/Sektorprofilinformationen und erzwingt den HPOS-GitHub-Pages-Origin.

## Governance

Discovery und Entscheidung bleiben getrennt:

1. **DISCOVERY**: Name/Ticker reicht zum Finden, Anschauen und Beobachten.
2. **VERIFIED**: ISIN ist eindeutig bestätigt.
3. Erst **VERIFIED** darf in Halal-/Thesis-/Decision-Gate-Logik als kanonische Identität einfließen.

Ein global gefundener Titel ohne bestätigte ISIN darf niemals stillschweigend als freigegeben oder entscheidungsreif dargestellt werden.

## Sektor-Allokation

Die Profilbasis ist jetzt vorhanden, aber die vollständige Depot-Sektorverteilung wird noch **nicht** dargestellt. Das ist bewusst: Eine belastbare Sektorallokation benötigt Profilabdeckung für alle relevanten Depotpositionen. Die App soll dafür nicht bei jedem Start 19+ zusätzliche Netzwerkaufrufe durchführen.

Nächster sinnvoller Schritt ist daher ein kontrollierter, cachebarer Profil-Enrichment-Lauf mit Coverage-Anzeige. Erst wenn die Abdeckung ausreichend ist, wird die Sektor-Gewichtung visualisiert. Fehlende Profile bleiben sichtbar fehlend und werden nicht geschätzt.

## Datenquelle / Einschränkung

Die Profilfunktion verwendet Yahoo-Finance-Endpunkte als inoffizielle Markt-/Unternehmensdatenquelle. Felder werden nur angezeigt, wenn die Quelle sie liefert. Fehlende Sektor-, Branchen- oder Business-Summary-Daten werden nicht erfunden.

## Teststatus

- Code und Edge Function umgesetzt.
- GitHub-Pages-Deployment nach dem letzten Commit war beim Erstellen dieses Status noch nicht als erfolgreicher Live-Smoke bestätigt.
- Reale Regressionstests: globale Suche (z. B. Microsoft), Discovery-Watchlist, Investment-Akte mit Profil, bestehende ISIN-verifizierte Suche und Depotpositionen.
