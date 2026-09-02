# HPOS Status 2026-09-02 – Promotion / Evidence Hardening

## Anlass
Auf Wunsch wurde der Morning-Briefing-/Evidence-Pfad nicht nur funktional fortgesetzt, sondern gezielt auf sinnvolle Lücken, Fehlkopplungen und unnötige automatische Vertrauensannahmen geprüft.

## Erkannte und behobene Lücken

### 1. Promotion durfte dem selbst gemeldeten Review-Status vertrauen
Risiko: Ein Promotion-Payload hätte theoretisch `REVIEW_READY` und beliebige `evidenceIds` behaupten können, ohne technisch an das tatsächliche Upstream-Review-Ergebnis gebunden zu sein.

Behebung:
- `scripts/validate_morning_briefing_promotion.py` validiert Promotion-Entscheidungen.
- Bei vorhandenem Review-Ergebnis müssen `assetKey`, `sourceAsOf`, `reviewStatus` und `evidenceIds` exakt zum Upstream-Review passen.
- Ein Review-Status kann damit nicht nachträglich still hochgestuft und eine Evidence-ID nicht nach dem Review ausgetauscht werden.
- `VERIFIED` ist nur bei `REVIEW_READY`, vorhandener Evidenz und ohne ungelöste Punkte zulässig.
- `PARTIALLY_VERIFIED` hält verbleibende Gaps explizit in `unresolvedIssues` fest.
- THS-, Action-, Order- und Portfolio-Mutationsfelder sind im Promotion-Payload ausdrücklich verboten.
- Jede Promotion benötigt `decisionId`, `sourceAsOf`, `decidedAt` und eine aussagekräftige Begründung; `decidedAt < sourceAsOf` wird abgewiesen.
- `supersedesDecisionId` ermöglicht später eine nachvollziehbare Korrekturkette; eine Entscheidung darf sich nicht selbst superseden.

### 2. Semantisches Evidence-Matching war zu großzügig
Risiko: Generische Begriffe in Notizen wie `growth` oder `margin` konnten eine semantische Verbindung suggerieren, obwohl der explizite `thesisDriver` nicht zur registrierten These bzw. zum Proofpoint gehörte.

Behebung:
- Explizite `thesisDriver`-Verknüpfung hat jetzt Vorrang.
- Ist ein `thesisDriver` vorhanden, muss dieser zur Thesis/Risiko/Falsifikation oder zum Proofpoint passen.
- Generische Notes-/Category-/Metric-Tokens können einen widersprechenden bzw. unpassenden `thesisDriver` nicht mehr überstimmen.
- Nur wenn gar kein `thesisDriver` vorhanden ist, existiert ein konservativer Fallback; dafür sind mindestens zwei semantische Stütztreffer nötig.
- Die tatsächlich verwendeten Anchor-Tokens werden im Review-Ergebnis ausgegeben und bleiben damit auditierbar.

## Testabdeckung
Neue Promotion-Tests decken mindestens ab:
- gültige VERIFIED-Promotion,
- VERIFIED trotz Date-Gap,
- VERIFIED mit unresolved issue,
- PARTIALLY_VERIFIED ohne benannten Gap,
- Entscheidung vor Briefing-Zeitpunkt,
- eingeschmuggelte THS-/Action-Mutation,
- Self-supersede,
- unbekanntes Asset,
- gefälschter Review-Status,
- ausgetauschte Evidence-IDs,
- abweichender sourceAsOf.

Der bestehende Evidence-Review-Testblock bleibt aktiv und prüft u. a. Future Evidence, Secondary-only Evidence, fehlenden semantischen Anker und undatierte Primärevidenz.

## CI-Nachweis
GitHub Actions Lauf `33670919273` für Commit `f8e36a221d78b76f012b46fdbdb5ef2bf3afefcb` wurde erfolgreich abgeschlossen. Dieser Lauf enthält Candidate Validation, Evidence Matcher, Evidence Review und Promotion-Contract-Tests inklusive der verschärften semantischen Ankerlogik.

## Verbindliche Systemgrenze
Auch nach diesem Hardening führt kein Morning-Briefing-Signal automatisch zu einer Investmentaktion. Der Pfad bleibt:

`External Briefing -> Candidate Validation -> Evidence Match -> Evidence Review -> Promotion Decision -> HPOS Decision Gates -> Broker extern`

Promotion betrifft ausschließlich den Evidenz-/Verifikationsstatus. THS und Portfolioaktion sind weiterhin getrennte nachgelagerte Entscheidungen.

## Noch offen
- Das konkrete Morgenbriefing vom 02.09.2026 als kontrollierten Pipeline-Fall modellieren; Fakten werden nur übernommen, soweit Primärevidenz im HPOS-Evidence-Store vorhanden und ausreichend passend ist.
- THS-Granularität bleibt ein separater Produktentscheid; externe Dezimalwerte überschreiben den kanonischen HPOS-THS weiterhin nicht.
- Stale-/Out-of-order-Promotions müssen beim späteren Persistenzlayer zusätzlich gegen den jeweils aktuelleren kanonischen Asset-State geschützt werden. `sourceAsOf`, `decisionId` und `supersedesDecisionId` sind dafür bereits vorbereitet, aber noch kein persistenter Canonical-State-Writer wurde freigegeben.

## Bewertung
Das Hardening ist sinnvoll, weil es keine neue Nutzerfunktion oder Parallelarchitektur erzeugt, sondern zwei reale Vertrauenslücken im bestehenden Evidence-Pfad schließt. Kein Go-live-Gate wird dadurch vorzeitig als PASS markiert.
