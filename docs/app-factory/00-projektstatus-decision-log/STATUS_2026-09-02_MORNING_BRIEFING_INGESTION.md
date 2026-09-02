# HPOS Status 2026-09-02 – Morgenbriefing / Thesis-Agent Integration

## Anlass
Der bestehende externe Morgenbriefing-Agent liefert täglich Depot- und Watchlist-Bewertungen mit Thesis-Änderungen, THS-Werten, Actions, Rotationsideen, Coverage und offenen Proofpoints.

## Entscheidung / Integrationsgrenze
Der Morgenbriefing-Agent wird fachlich als vorgelagerter **Evidence-Candidate- und Decision-Candidate-Layer** berücksichtigt. Seine Ausgabe darf HPOS nicht ungeprüft als kanonischen Investment-State überschreiben.

Verbindlicher Ablauf:
1. Briefing-Asset auf `data/thesis_registry.json` abbilden.
2. Behauptete neue Evidenz gegen Primärquelle oder vorhandene `evidenceId` prüfen.
3. Thesis-Impact als `STRENGTHENING`, `WEAKENING`, `NEUTRAL`, `INSUFFICIENT` oder `BROKEN` klassifizieren.
4. Halal-Gate vor jeder Portfolioaktion prüfen.
5. Portfolio-Fit, Caps, Bewertung, Timing, News-Evidenz und Execution-Gate in der festgelegten Reihenfolge prüfen.
6. Action erst danach als HPOS-Decision-Output zulassen; HPOS führt weiterhin keine Broker-Order aus.
7. Coverage und `kein neues Signal` werden als explizites Ergebnis mitgeführt.
8. Offene Proofpoints bleiben offen, bis passende Evidenz tatsächlich eingetreten und belegt ist.

## Bewertung des Morgenbriefings vom 02.09.2026
Die Struktur ist mit der bestehenden HPOS-Methodik grundsätzlich kompatibel:
- thesisrelevantes Delta statt News-Sammlung,
- explizite Action je Asset,
- Trennung von Kursbewegung und These,
- Rotation als relative Entscheidung,
- Coverage auch für Werte ohne neues Signal,
- offene Proofpoints/Falsifikationstests,
- kein Forced Trade.

Die enthaltenen konkreten Fakten und Urteile zu Medtronic, GSK, Novartis, Novo Nordisk, Craneware, 4imprint, IVU, Frequentis und weiteren Kandidaten werden **nicht allein aufgrund des Briefingtexts** als verifizierte HPOS-Evidenz markiert. Dazu müssen die im Briefing verwendeten Primärquellen bzw. Evidence-Referenzen verfügbar und geprüft sein.

## Offener Produktentscheid: THS-Granularität
Es besteht ein echter Policy-Konflikt:
- aktueller HPOS-Agentenvertrag: THS 0–10 nur in 0,5-Schritten,
- externer Morgenbriefing-Agent: feinere Werte/Änderungen, z. B. `7,8 → 8,2` oder `7,8 → 8,0`.

Bis zur expliziten Freigabe wird die bestehende 0,5-Baseline **nicht stillschweigend geändert**. Feinere externe Scores dürfen als Briefing-Metadatum angezeigt/gespeichert werden, aber nicht den kanonischen THS-State überschreiben.

## Technische Folge für v9 RC
Für den MVP ist keine zweite autonome Agentenplattform erforderlich. Die bestehende Thesis-/Evidence-Engine bleibt kanonisch. Ein späterer Importpfad soll mindestens diese Felder unterstützen:
- `asOf`
- `assetKey`
- `externalThsBefore`
- `externalThsAfter`
- `actionCandidate`
- `thesisDelta`
- `riskDelta`
- `evidenceUrls[]` / `evidenceIds[]`
- `coverageStatus`
- `proofpoints[]`
- `rotationCandidate`
- `verificationStatus`

`verificationStatus` ist standardmäßig `UNVERIFIED` und wird erst nach HPOS-Evidenzprüfung hochgestuft.

## Prompt-Bedarf
Der vollständige Prompt des externen Agenten ist aktuell **nicht zwingend erforderlich**, weil die bereitgestellte Ausgabe und der bestehende HPOS-Agentenvertrag die Kernmechanik bereits ausreichend erkennen lassen. Er wird erst benötigt, wenn versteckte Gewichtungen, Scoreformeln, Quellenregeln oder Rotationsschwellen übernommen bzw. exakt gespiegelt werden sollen.
