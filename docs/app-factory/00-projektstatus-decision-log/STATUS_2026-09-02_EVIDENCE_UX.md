# HPOS Status 2026-09-02 – Explainable Evidence UX

## Umgesetzt
Der read-only Verification Projection Layer wurde erstmals in die Investment-Akte der App eingebunden.

Neu:
- `data/verification_projection.json` als abgeleitetes UI-Artefakt, nicht als Source of Truth.
- `scripts/project_verification_state.py --check ...` validiert, dass das UI-Artefakt exakt aus den Promotion Decisions reproduzierbar ist.
- `app/verification-status.js` zeigt in der Investment-Akte einen Abschnitt `Warum sagt HPOS das?`.
- Der Abschnitt unterscheidet explizit zwischen Evidence-Verifikation und Investmententscheidung.
- VERIFIED wird in der Nutzeroberfläche als `Aussage belegt` formuliert, nicht als Kaufempfehlung.
- Ohne explizite Promotion wird `Noch keine explizite Freigabe` gezeigt; daraus folgt weder ein positives noch negatives Investmenturteil.
- Registrierte These und offene Risiken werden ergänzend aus der Thesis Registry angezeigt.
- `index.html` und `live.html` wurden auf v8.7.6 / Evidence-UX-Cache-Bust angehoben.

## Architekturentscheidung
Die Promotion Decisions bleiben Source of Truth. `data/verification_projection.json` ist ausschließlich ein deterministisch erzeugtes, read-only UI-Artefakt. CI blockiert Drift zwischen Promotion Decisions und Projection.

Es wurde bewusst kein persistenter Canonical Verification Writer eingeführt.

## Sicherheitsgrenzen
Der neue UX-Layer:
- mutiert keinen THS,
- erzeugt keine BUY/SELL/ADD/ROTATE-Entscheidung,
- verändert keinen Portfolio-State,
- sendet keine Order,
- wertet fehlende Verification nicht als negatives Urteil.

## Teststatus
GitHub Actions Run `33679028332`: SUCCESS.
Erfolgreich geprüft wurden:
- bestehende Briefing-Pipeline,
- Promotion Ordering,
- read-only Projection,
- Drift-Check des committed UI-Artefakts,
- JavaScript-Syntax von `app/verification-status.js`.

## Review-Erkenntnis nach diesem Block
1. Die Trennung `Evidence-Verifikation != Investmententscheidung` lässt sich verständlich in der UI abbilden und sollte als Standardmuster auch für Halal-Status, Datenaktualität und Thesis-Signale verwendet werden.
2. Ein abgeleitetes UI-Artefakt ist vertretbar, solange CI seine Reproduzierbarkeit gegen die eigentliche Source of Truth erzwingt. Damit vermeiden wir Runtime-Komplexität auf GitHub Pages.
3. Der Asset Catalog ist weiterhin eine kritische Identitätsschicht. Fehlende ISINs bei einzelnen Registry-Assets werden aktuell über Namen/Aliase aufgefangen; langfristig sollten Identitäten weiter vervollständigt werden.
4. Die App sollte technische Statuswörter möglichst in Nutzerbedeutung übersetzen: `VERIFIED` → `Aussage belegt`; `UNKNOWN` → `Prüfung offen`; Provider-/HTTP-Zustände → konkrete Nutzerwirkung und nächste Aktion.

## Nächste sinnvolle Schritte
- Evidence-UX im Browser auf mindestens Medtronic, GSK und einem Asset ohne Promotion visuell prüfen.
- Danach denselben verständlichen Statusansatz auf Halal UNKNOWN und Daten-/Sync-Zustände übertragen.
- Anschließend erneuter kurzer Architektur-/Produktreview vor dem nächsten größeren Block.
