# HPOS Pre-RC Audit Backlog · 2026-09-02

## Zweck
Vor `v9 RC = MVP` wird nicht nur Feature-Funktionalität geprüft, sondern gezielt nach historischen Lücken, widersprüchlichen Projektquellen, UX-Reibung, Dateninkonsistenzen, unnötiger Komplexität und Legacy-Resten gesucht. Ziel ist eine saubere, effiziente und selbsterklärende App statt eines bloß technisch funktionierenden Builds.

## Verbindliche Audit-Regel
- Kein PASS allein aufgrund älterer Dokumentation oder früherer Alpha-/canonical-Stände.
- Bei widersprüchlichen Projektquellen gilt der jüngste tatsächlich belegte Test gegen den aktuellen kanonischen Build; die Quellen werden anschließend synchronisiert.
- Technische Funktion ohne verständliches Nutzerfeedback gilt nicht automatisch als UX-PASS.
- Fallback, Snapshot, Live, UNKNOWN, UNVERIFIED und Fehlerzustände müssen für Nutzer unterscheidbar sein.
- Keine versteckte Doppelarchitektur, unnötige Parallelpfade oder Legacy-Abhängigkeit darf bis Go-live unbewertet bleiben.
- Nach Final-Cleanup folgt zwingend eine erneute Regression.

## Bereits erkannte Dokumentationsinkonsistenzen
1. `QA_BASELINE.md` ist gegenüber jüngeren realen Tests teilweise veraltet.
   - T-003 wird dort noch als offen geführt, obwohl am 02.09.2026 ein kontrollierter Offline-/Recovery-Fall real durchgeführt wurde. Der endgültige PASS muss im QA-Ausführungsnachweis sauber nachgetragen werden.
   - T-010, T-012, T-013, T-014, T-015 und T-016 stehen in der QA-Baseline teilweise noch auf OFFEN/TEIL-PASS, während der zentrale Projektstatus jüngere Browsernachweise teilweise bereits als PASS aufführt. Diese Abweichungen müssen je Testfall anhand des tatsächlichen Nachweises reconciled werden; es wird nichts pauschal hochgestuft.
   - T-020 wird in der QA-Baseline noch als final offen beschrieben, während GitHub Support Cleanup/GC und die anschließende Nicht-Erreichbarkeit der alten SHA bereits nachgewiesen wurden. Der finale Release-Smoke bleibt trotzdem als separater Pre-Release-Schritt bestehen.
2. `PROJECTSTATUS_DECISION_LOG.md` enthält an einzelnen Stellen ältere Formulierungen wie „Providerfehler/Fallback-Nachweis offen“, obwohl der Fehlerfall inzwischen real getestet wurde. Statusbeschreibung und Ausführungsreihenfolge müssen vor dem nächsten Gate auf den belegten Stand gebracht werden.
3. Mehrere Dokumente verwenden historische Build-Bezeichnungen wie `canonical4`, `canonical7` oder ältere App-Versionen. Für den RC-Nachweis muss jeder relevante Test auf den tatsächlichen Release-Commit/Build referenzieren.

## Produkt-/UX-Audit vor RC
Zu prüfen und zu dokumentieren:
- Startzustand: Nutzer versteht auf Home sofort Vermögen, Datenstatus und relevante nächste Aktion.
- Begriffe: `PARQET LIVE SYNC`, `Snapshot`, `Fallback`, `validiert`, `UNKNOWN`, `UNVERIFIED`, Broker und Halal-Status sind konsistent und nicht technisch kryptisch.
- Fehlermeldungen: keine internen Implementierungsdetails wie rohe HTTP-Codes als alleinige Nutzerbotschaft; Fehler muss Handlung oder Zustand verständlich machen.
- Refresh: klar erkennbar, was aktualisiert wurde (Bestand, Kurse, Evidenz) und was unverändert blieb.
- Navigation: keine Sackgassen, doppelte Einstiege oder versteckten Funktionen; H/Home und Bottom-Navigation verhalten sich konsistent.
- Investment-Akte: Holding, Watchlist-Kandidat, Markt-/Thesis-/Halal-Evidenz und Broker-Aktion visuell getrennt.
- Income: Ist, Ziel und nicht verfügbare Forward-Daten eindeutig getrennt; keine Scheingenauigkeit.
- Watchlist: Depotpositionen und Kandidaten unter 1 EUR werden nicht verwechselt; Kandidaten werden nicht automatisch als Watchlist-Wahrheit übernommen.
- Mobile/PWA: Touch-Ziele, Scroll, Safe Areas, Tastatur, Reload, Back-Navigation, OAuth-Rücksprung und Browser-/PWA-Kontext.
- Leere/fehlende Daten: sinnvolle Empty States statt leerer Karten oder technischer Platzhalter.
- Performance: keine unnötigen Mehrfachrequests, Endlosschleifen oder sichtbares Flackern bei Refresh/Boot.

## Daten-/Logik-Audit vor RC
- Parqet bleibt alleiniger Depot-Master.
- Quotes dürfen Bestand/Stückzahlen/Einstand nie verändern.
- Broker-Mapping Cardinal Energy und Savaria = Trade Republic; übrige aktive Positionen = Scalable, solange kein aktueller bestätigter State anderes sagt.
- Sub-1-EUR-Holdings bleiben Watchlist-Kandidaten und zählen nicht als aktive Positionen.
- Session-/OAuth-Reauth darf validierten State nicht zerstören.
- Halal UNKNOWN bleibt Fail-Closed; keine positive Einstufung ohne Evidenz.
- Morgenbriefing bleibt Candidate Layer; externe Agenten dürfen keinen kanonischen VERIFIED-State setzen.
- THS-Granularität 0,5 vs. externe Dezimalwerte bleibt expliziter Produktentscheid und wird nicht still verändert.
- Evidence-Promotion muss Quelle, Asset-Zuordnung, Zeitbezug und Konflikte nachvollziehbar prüfen.
- Rotationen benötigen Halal-/Portfolio-/Kosten-/Execution-Gates und dürfen nicht nur aus externem Agentenurteil entstehen.

## Technik-/Architektur-Audit vor RC
- GitHub Pages nur Frontend; private Integrationen ausschließlich über Supabase.
- Kein aktiver Cloudflare-Zielpfad nach Final-Cleanup.
- `app/live.html`, historische Alpha-Pfade, `backend/hpos-api/` und Compatibility-Shims nur behalten, wenn nachweislich noch erforderlich.
- Cache-/Versionierung vereinheitlichen, damit kein alter Build wie v8.5.1 statt des aktuellen Builds ausgeliefert wird.
- Service Worker/PWA-Cache auf kontrollierte Update-Strategie prüfen.
- Keine Secrets, Tokens oder private Current-State-Daten im öffentlichen Repo, Build-Artefakt oder Browsercode.
- CI muss nur relevante aktuelle Tests enthalten; historische Workflows werden klassifiziert und ggf. deaktiviert/archiviert.
- Provider-/Netzwerkfehler müssen zeitlich begrenzt sein; keine endlosen Retries.

## Offene RC-Arbeit in risikobasierter Reihenfolge
1. Projektquellen-Drift reconciliieren und aktuellen Teststatus je T-001 bis T-020 eindeutig machen.
2. Promotion-/Evidence-Matcher für Morning-Briefing Candidates implementieren und testen.
3. Halal-Evidenz- und Evidence-Promotion-Flow mit echten belegten und fehlenden Daten testen.
4. Refresh/Provider/Session-/Reauth-Regression inklusive bereits getesteten Offline-Falls auf aktuellem Build wiederholbar dokumentieren.
5. UX-/Selbsterklärungs-Audit für Home, Portfolio, Investment-Akte, Analyse, Income und Mehr.
6. Mobile Edge sowie definierter Safari/PWA-Smoke; Cache-/Service-Worker-Updateverhalten explizit prüfen.
7. Vollständige v9-RC-Regression auf einem fixierten Release-Commit.
8. Final-Legacy-Cleanup gemäß Gate.
9. Regression nach Cleanup inklusive Security-/Privacy-Smoke.
10. Erst danach formale App-Factory-/RC-Freigabe und Go-live.

## Definition „sauber genug für Go-live“
Go-live ist erst zulässig, wenn die App nicht nur technisch funktioniert, sondern ein Nutzer ohne Kenntnis der internen Architektur erkennen kann:
- welche Daten aktuell und welche nur Fallback/Snapshot sind,
- was HPOS empfiehlt und warum,
- was lediglich Kandidat/UNKNOWN/UNVERIFIED ist,
- wo echte Brokerausführung stattfindet,
- was bei Fehlern passiert,
- und wie er ohne versteckte technische Kenntnisse durch die fünf Kernbereiche navigiert.
