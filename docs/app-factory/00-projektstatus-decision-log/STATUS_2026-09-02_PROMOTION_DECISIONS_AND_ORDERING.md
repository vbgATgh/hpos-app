# HPOS Status 2026-09-02 – Promotion Decisions & Ordering

## Ergebnis dieses Arbeitsblocks
Der kontrollierte Morning-Briefing-Fall vom 02.09.2026 wurde für die beiden neuen thesisrelevanten Claims Medtronic und GSK bis zum expliziten Promotion-Decision-Schritt weitergeführt.

### Medtronic
- Upstream Candidate bleibt EXTERNAL_AGENT / UNVERIFIED.
- Curated Primary Evidence: Q1 FY27 Margin, EPS und FY27 Guidance.
- Evidence Review: REVIEW_READY.
- Explizite HPOS Promotion Decision angelegt: `data/promotion_decisions/2026-09-02_medtronic_verified.json`.
- Zielstatus: VERIFIED ausschließlich für den belegten Evidence Claim.
- Keine THS-, Action-, Order- oder Portfolio-Mutation Bestandteil der Promotion.

### GSK
- Upstream Candidate bleibt EXTERNAL_AGENT / UNVERIFIED.
- Curated Primary Evidence: positive Phase-II-mRNA-Flu-Daten / geplanter Phase-III-Start.
- Evidence Review: REVIEW_READY.
- Explizite HPOS Promotion Decision angelegt: `data/promotion_decisions/2026-09-02_gsk_verified.json`.
- Zielstatus: VERIFIED ausschließlich für den belegten Evidence Claim.
- Keine automatische Novartis→GSK-Rotation und keine THS-Mutation.

## Zusätzlich behobene Lücke: stale / out-of-order promotion
Die zuvor dokumentierte Gefahr, dass ein später eintreffendes älteres Briefing einen neueren Evidence-State überschreiben könnte, ist jetzt vor dem späteren Canonical-State-Writer technisch adressiert.

Neu:
- `scripts/validate_promotion_sequence.py`
- `tests/test_promotion_sequence.py`
- CI validiert Promotion-Dateien als zeitlich monotone Sequenz.

Regeln:
1. `decisionId` muss eindeutig sein.
2. Ein älteres `sourceAsOf` darf einen neueren Asset-State nicht überschreiben, auch wenn die Entscheidung später eingegangen ist.
3. Zwei Entscheidungen für dasselbe Asset mit identischem `sourceAsOf` gelten als Konflikt, außer die spätere nennt die unmittelbar vorherige Entscheidung explizit über `supersedesDecisionId`.
4. Eine solche Korrektur muss einen späteren `decidedAt` besitzen.
5. Der Sequenzvalidator schreibt noch keinen kanonischen State; er ist eine Schutzschicht vor dem zukünftigen Writer.

## Teststatus
- Promotion Decisions sind gegen das tatsächlich erzeugte Upstream-Review gebunden.
- Regression prüft, dass weder THS noch Action in den Promotion-Dateien enthalten sind.
- GitHub CI Run 33674374423 war erfolgreich für die expliziten Medtronic/GSK-Promotion-Fixtures.
- Der nachgelagerte CI Run für den neuen Sequenzschutz ist zum Zeitpunkt dieses Statusdokuments noch abzuschließen und darf erst nach tatsächlichem Success als PASS referenziert werden.

## Verbindliche Grenze
`Evidence VERIFIED` bedeutet nicht `BUY`, `ADD`, `ROTATE` oder eine THS-Änderung. Die Architektur bleibt:

External Briefing → Candidate Validation → Evidence Match → Evidence Review → Promotion Decision → HPOS Decision Gates → ggf. externer Broker.

## Nächster sinnvoller Schritt
Nach erfolgreichem Sequenz-CI: einen read-only Canonical Verification Projection Layer bauen, der aus gültigen Promotion Decisions den aktuellen Evidence-Verifikationszustand je Asset berechnet, ohne Portfolio-/THS-State zu mutieren. Erst danach sollte ein persistenter Canonical-State-Writer erwogen werden.
