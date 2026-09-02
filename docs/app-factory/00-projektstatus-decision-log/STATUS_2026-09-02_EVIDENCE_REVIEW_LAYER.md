# HPOS Status 2026-09-02 – Evidence Review Layer

## Ziel
Der Morgenbriefing-Pfad wurde um eine konservative Review-Stufe zwischen Evidence-Matcher und kanonischer HPOS-Entscheidung erweitert.

## Aktive Kette
`EXTERNAL_AGENT -> Candidate Validation -> Evidence Matcher -> Evidence Review -> separate HPOS/Human Review Decision -> Decision Gates`

Keine Stufe vor der separaten HPOS/Human-Review darf automatisch THS, Verification Status, Portfolio-State oder Action-State kanonisch verändern.

## Implementiert
- `scripts/review_morning_briefing_evidence.py`
- zeitliche Plausibilitätsprüfung gegen `asOf`
- Primärquellen-Gate
- sichtbare Kennzeichnung fehlender Veröffentlichungsdaten
- konservativer Thesis-/Risk-/Falsification- bzw. Proofpoint-Anker über vorhandene strukturierte Evidence-Metadaten
- Block bei Evidence nach Briefing-Zeitpunkt
- Block bei ausschließlich nicht-primärer Evidence
- Manual-Semantic-Review bei fehlendem fachlichen Anker
- kein automatisches VERIFIED
- kein automatischer THS-Change
- keine automatische Action-Promotion

## Tests
Neue Tests unter `tests/test_morning_briefing_evidence_review.py` decken u. a. ab:
- timely PRIMARY + Thesis-Anker -> REVIEW_READY
- Future Evidence -> BLOCKED
- Non-Primary only -> BLOCKED
- fehlender semantischer Anker -> MANUAL_SEMANTIC_REVIEW_REQUIRED
- fehlendes PublishedAt -> REVIEW_READY_WITH_DATE_GAP
- vorgelagerter Matcher-Block bleibt Block
- auch REVIEW_READY führt zu keiner automatischen Action-Promotion

Der erste CI-Lauf der Review-Schicht deckte einen fehlerhaft konstruierten Negativ-Test auf; der Test enthielt trotz angeblich unverbundener Evidence weiterhin Margin-Begriffe in Notes/Category/Metric. Der Test wurde korrigiert, nicht die Schutzlogik aufgeweicht. Der nachfolgende Workflow-Lauf `33667820580` war erfolgreich.

## Noch bewusst offen
- REVIEW_READY bedeutet ausdrücklich nicht VERIFIED.
- Die eigentliche fachliche Promotion auf PARTIALLY_VERIFIED / VERIFIED / REJECTED braucht weiterhin einen separaten Review-Entscheid mit nachvollziehbarer Begründung.
- THS 0,5-Schritt-Policy versus externe Dezimalwerte bleibt ungelöst.
- Halal-Evidenz bleibt ein vorgelagertes Hard Gate und darf durch Thesis-Evidence nicht umgangen werden.
- Das konkrete Morgenbriefing vom 02.09.2026 wurde noch nicht pauschal in kanonische Entscheidungen übertragen.

## Qualitätsbefund
Die Pipeline ist absichtlich fail-closed. Ein technischer Quellenmatch allein reicht nicht für eine Investmententscheidung. Damit wird vermieden, dass ein externer Agent, eine falsche Asset-Zuordnung, eine veraltete Quelle oder ein bloßer Keyword-Treffer unkontrolliert als HPOS-Wahrheit endet.
