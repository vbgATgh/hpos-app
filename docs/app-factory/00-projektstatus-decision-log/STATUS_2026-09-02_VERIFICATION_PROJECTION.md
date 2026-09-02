# HPOS Status 2026-09-02 – Read-only Verification Projection

## Ergebnis dieses Arbeitsblocks
Der geplante read-only Canonical Verification Projection Layer ist implementiert.

Neu:
- `scripts/project_verification_state.py`
- `tests/test_verification_projection.py`
- CI kompiliert, testet und führt die Projektion gegen `data/promotion_decisions/` aus.

## Zweck
Die Projektion berechnet ausschließlich aus den gültigen Promotion Decisions den aktuellsten Evidence-Verifikationszustand pro Asset. Sie schreibt keinen persistenten kanonischen State und verändert insbesondere nicht:
- THS
- Action/Rotation
- Orders
- Portfolio-Positionen
- Brokerdaten

Aktuell ergeben die vorhandenen Promotion Decisions für die neue 02.09.-Evidenz:
- MEDTRONIC: VERIFIED (Evidence Claim; Promotion Decision `prom_20260902_medtronic_verified_001`)
- GSK: VERIFIED (Evidence Claim; Promotion Decision `prom_20260902_gsk_verified_001`)

Das bedeutet ausdrücklich nicht BUY/ADD/ROTATE und ändert die externen THS-Metadaten nicht.

## Fail-closed Regeln
Die Projektion bricht ab bei:
1. ungültiger oder stale/out-of-order Promotion-Sequenz,
2. Asset, das nicht in `thesis_registry.json` existiert,
3. ungültigem Verification-Zielstatus,
4. ungültigen Evidence-IDs,
5. eingeschmuggelten THS-/Action-/Order-/Portfolio-Feldern.

Korrekturen bei identischem `sourceAsOf` bleiben nur mit expliziter `supersedesDecisionId`-Kette zulässig.

## Tests
Automatisierte Tests decken ab:
- latest valid decision wins pro Asset,
- unabhängige Projektion mehrerer Assets,
- stale/out-of-order wird blockiert,
- unbekannte Assets werden blockiert,
- THS/Action-Smuggling wird blockiert,
- same-source Korrektur erfordert explizite Supersedes-Kette.

GitHub Actions Run `33675417873` ist erfolgreich abgeschlossen. Alle Pipeline-Tests, der Promotion-Sequence-Check und die reale Projektion der committed Decisions waren SUCCESS.

## Architekturstatus
Aktuelle Kette:
External Briefing → Candidate Validation → Evidence Match → Evidence Review → Promotion Decision → Sequence Guard → Read-only Verification Projection.

Die Projektion ist bewusst noch kein Canonical-State-Writer.

## Nächster sinnvoller Schritt
Vor einem persistenten Writer soll zunächst geklärt und implementiert werden, wie dieser Verification-State sicher in die App-UX einfließt: verständliche Statuslabels, Evidence-Audit-Trail und klare Trennung von Evidence-Verifikation versus Investmententscheidung. Erst danach ist zu entscheiden, ob ein persistenter Writer überhaupt benötigt wird oder die Projection-on-read Architektur ausreicht.
