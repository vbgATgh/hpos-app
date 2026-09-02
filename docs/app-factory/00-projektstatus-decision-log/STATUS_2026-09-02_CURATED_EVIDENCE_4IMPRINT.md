# HPOS Status 2026-09-02 – Curated Evidence / 4imprint

## Anlass
Der kontrollierte Morgenbriefing-Fall vom 02.09.2026 zeigte drei konkrete Lücken: Medtronic und GSK waren nur über generische IR-Seiten belegt; 4imprint war als Rotation-Quelle nicht in der Thesis Registry registriert.

## Umgesetzt
- `data/fundamental/evidence_curated.json` als additive, handkuratierte Primärquellen-Schicht eingeführt. Sie ersetzt den automatischen Evidence Store nicht.
- Medtronic Q1 FY27 strukturiert erfasst: organisches Wachstum, EPS, operative Marge und angehobene FY27-Guidance aus der offiziellen Medtronic-Mitteilung vom 01.09.2026.
- GSK Phase-II-mRNA-Grippeimpfstoff strukturiert erfasst: positive Phase-II-Daten und geplanter Phase-III-Start im September 2026 aus der offiziellen GSK-Mitteilung vom 01.09.2026.
- 4imprint H1 2026 strukturiert erfasst: Margendruck und schwächere Neukundengewinnung, bei weiterhin starker Bestandskundenbindung, aus den offiziellen Halbjahreszahlen vom 05.08.2026.
- Matcher und Evidence Review laden Base-Evidence plus Curated Overlay additiv.
- `4IMPRINT_GROUP` in `data/thesis_registry.json` registriert; Provider-Alias `4IMPRINT_GROUP_PLC -> 4IMPRINT_GROUP` ergänzt.
- Der reale Briefing-Fall bindet Medtronic und GSK nun an die präzisen Evidence-IDs und enthält 4imprint -> IVU als ausdrücklich carry-forward Rotation (`PRIOR_VALIDATED_STATE`).
- Regressionstest aktualisiert: Medtronic und GSK dürfen jetzt `REVIEW_READY` erreichen, bleiben aber weiterhin `UNVERIFIED`, solange keine separate Promotion-Entscheidung erfolgt.
- CI-Workflow beobachtet nun auch `evidence_curated.json`.

## Sicherheitsgrenzen
- `REVIEW_READY` ist kein `VERIFIED`.
- Externe THS-Werte bleiben Metadaten und ändern den kanonischen HPOS-THS nicht.
- Die 4imprint->IVU-Rotation bleibt eine bestehende Decision Candidate; keine Order und keine Portfolio-Mutation wird erzeugt.
- Curated Evidence darf nur auf konkrete, datierte Primärquellen gestützt werden; generische IR-Landingpages genügen dafür nicht.

## Noch offen
- CI-Ergebnis des letzten Änderungsblocks als Nachweis festhalten, sobald der Lauf abgeschlossen ist.
- Danach Promotion Decision für die neuen Medtronic-/GSK-Evidence-Reviews kontrolliert modellieren; keine automatische Promotion.
- Stale-/out-of-order Schutz bleibt Aufgabe des späteren Canonical-State-Writers.
- THS-Granularität 0,5 vs. externe 0,1-Schritte bleibt separater Produktentscheid.

## Bewertung
Die Änderung reduziert falsche Evidenzsicherheit und schließt die identifizierte 4imprint-Identitätslücke, ohne einen parallelen Decision- oder Execution-Pfad einzuführen. Go-live bleibt unverändert nicht freigegeben.
