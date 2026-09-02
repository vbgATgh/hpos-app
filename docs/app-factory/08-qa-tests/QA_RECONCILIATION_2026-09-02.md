# HPOS – QA Reconciliation 2026-09-02

Status: AKTUELLER ARBEITSSTAND / KEIN v9-RC-GATE-PASS

## Zweck
Diese Datei reconciliert die bisher verteilten QA-Aussagen gegen die jüngsten tatsächlich beobachteten Browser-, Backend- und Security-Nachweise. Sie ersetzt keine finale v9-RC-Regression. Historische `canonicalN`-Bezeichnungen bleiben nur Provenienz; für den finalen RC zählt ein fixierter Release-Commit.

## Bewertungsregel
- PASS nur bei tatsächlich beobachtetem Verhalten.
- PARTIAL PASS, wenn nur ein repräsentativer Teilfall belegt ist.
- OPEN, wenn der für RC notwendige Nachweis noch fehlt.
- Ein späterer finaler RC-Test darf frühere PASS-Ergebnisse erneut prüfen und bei Regression zurückstufen.

## Reconciled Teststatus T-001 bis T-020

| Test | Status 02.09.2026 | Begründung / verbleibender Scope |
|---|---|---|
| T-001 App Boot / valider State | PASS | Kanonischer `app/`-Pfad startet mit validiertem Portfolio-State; Root-Entrypoint auf `/app/` nachgewiesen. |
| T-002 Parqet Refresh / Reconciliation | PASS | Erfolgreicher Parqet-Live-Sync und unveränderter Bestandsfall real beobachtet. Starre Bestandsassertionen wurden entfernt. |
| T-003 Provider-/Netzwerkfehler | PASS für kontrollierten Offline-/Recovery-Fall | Auf iPhone wurde bei deaktivierter Konnektivität manuell refreshed. 19 Positionen, Cash 690,13 EUR, Gesamtvermögen 10.662,01 EUR und Bestandszeitpunkt 02.09. 06:11 blieben unverändert; State blieb `validiert`. Nach Wiederherstellung der Verbindung erholte sich der Marktpfad, anschließend wurde die abgelaufene Parqet-Session erkannt, Reauth-Pfad korrigiert und Parqet wieder als `LIVE SYNC` mit aktualisiertem Bestandszeitpunkt 02.09. 08:13 beobachtet. Kein falscher/leerer Depot-State ersetzte den letzten validierten Bestand. Finaler RC-Commit muss diesen Schutz erneut smoken. |
| T-004 Portfolio / Instrument öffnen | PARTIAL PASS | Abbott/JNJ repräsentativ beobachtet. Breitere repräsentative Navigation kann im finalen RC-Smoke mit abgedeckt werden. |
| T-005 Suche Name/Ticker | PASS | Abbott real gesucht und ISIN-verifiziert. |
| T-006 gültige ISIN | PASS | `US4781601046` exakt als Johnson & Johnson verifiziert. |
| T-007 ungültige ISIN | PASS | `US4781601047` sicher abgelehnt, kein Autocreate. |
| T-008 Watchlist Add/Remove/Persistenz | PASS | Hinzufügen, Reload-Persistenz und Entfernen im gleichen Browser real geprüft; Depot unverändert. |
| T-009 Investment-Akte Datenrollen | PASS für HOLDING + WATCHLIST | Abbott als Holding, JNJ als Watchlist/Missing-Position-Fall beobachtet; keine erfundenen Positionsdaten. |
| T-010 Broker-Workflow ohne HPOS-Order | PASS | Broker-Dialog erklärt externe Ausführung; HPOS sendet keine Brokerorder. |
| T-011 Broker → Parqet → HPOS nach realer Bestandsänderung | OPEN | Erfordert eine echte oder kontrolliert nachstellbare Brokeränderung und anschließende Parqet-Reconciliation. Kein Ersatz durch UI-Test. |
| T-012 Decision Layer | PASS für Missing-Halal-Evidence-Fall | HALAL-Hard-Gate blockiert nachgelagerte Gates; keine erfundene Freigabe. Positive Evidence-/Promotion-Fälle bleiben Bestandteil des neuen Evidence-Workflows. |
| T-013 Halal-Evidenz | PASS für UNKNOWN/Missing Evidence | UNKNOWN wird fail-closed behandelt; Quelle/Prüfstand fehlen sichtbar. Belegter positiver/negativer/Konfliktfall noch offen, sobald reale Evidence-Promotion vorhanden ist. |
| T-014 Income Monatsziel | PASS | Monats-Ist und Ziel sind getrennt; Zieländerung greift nicht in Depotdaten ein. |
| T-015 Dividenden ohne Scheindaten | PASS | Fehlende Forward-/Dividendendaten werden als nicht verfügbar dargestellt, nicht geschätzt. |
| T-016 Hauptnavigation + H/Home | PASS für beobachteten Kernfluss | Home, Portfolio, Analyse, Income und Mehr/Halal wurden durchlaufen; H führt zu Home; State blieb erhalten. Finaler Safari/PWA-Smoke bleibt T-019. |
| T-017 Mehr / Daten-/System-/Diagnosepfade | PARTIAL PASS | Halal Register belegt; verbleibende Datenquellen-/Diagnose-/Return-Pfade offen. |
| T-018 Kernvisualisierungen | PARTIAL PASS | Home-Allokation, Decision-Gates und Income-Zustände beobachtet. Missing-Data-/Mobile-Darstellung und finale RC-Konsistenz offen. |
| T-019 iPhone Safari/PWA | PARTIAL PASS / OPEN für finalen definierten Nutzungskontext | Viele Kernflüsse in Edge auf iPhone beobachtet. Safari/PWA, OAuth-Rücksprung, Service-Worker-/Cache-Update und definierter Primärkontext noch nicht final abgenommen. |
| T-020 Secret-/Privacy-Smoke | PASS für GitHub-Historien-Cleanup; finaler Release-Smoke bleibt Pflicht | GitHub Support #4720320 führte GC/Cache-Cleanup durch; alte sensible SHA anschließend nicht mehr als Commit abrufbar. Vor Go-live wird der bereinigte Release-Commit erneut auf Secrets/private Current-State-Daten geprüft. |

## Zusätzlich seit 02.09. technisch nachgewiesen

### Parqet Session / Reauth / Cache-Befund
- Manueller Refresh läuft jetzt über die Supabase-Session statt historischen lokalen Parqet-Token-Pfad.
- Ein HTTP-401-/Reauth-Zustand wurde real beobachtet; der Adapter wurde danach so korrigiert, dass ein expliziter Reauth-Fall in den Parqet-OAuth-Pfad führt.
- Ein Browser-Cache-Fall lieferte zeitweise einen alten Build `v8.5.1` statt `v8.7.5`. Ein Cache-Bust auf den kanonischen `app/index.html` lieferte anschließend wieder `v8.7.5` und `PARQET LIVE SYNC`.
- Daraus folgt: Cache-/Service-Worker-Versionierung ist ein echter Pre-RC-Prüfpunkt und kein kosmetisches Thema.

### Morning-Briefing Candidate Layer
- Externer Morgenbriefing-Agent ist nur Evidence-/Decision-Candidate-Layer.
- Candidate-Schema, Validator und Tests existieren.
- Externe Agenten dürfen keinen `VERIFIED`/`PARTIALLY_VERIFIED` HPOS-State setzen.
- CI für den Candidate-Contract läuft erfolgreich.
- Promotion-/Evidence-Matcher fehlt noch und ist der nächste fachliche Implementierungsblock.

## Reconciled offene RC-Punkte
1. T-011 echte Bestandsänderung via Broker → Parqet → HPOS, sofern vor RC praktikabel und risikolos reproduzierbar; andernfalls muss der Releaseentscheid explizit begründen, wie dieser Integrationsfall anderweitig ausreichend abgesichert wird.
2. T-017 verbleibende Mehr-/Datenquellen-/Diagnosepfade.
3. T-018 finale Visualisierungs-/Missing-Data-Konsistenz.
4. T-019 definierter iPhone Safari/PWA-/Primärbrowser-Smoke einschließlich OAuth-Rücksprung und Cache/Service Worker.
5. Promotion-/Evidence-Matcher und danach positive/negative/conflicting Halal-/Thesis-Evidence-Fälle.
6. vollständiger UX-/Selbsterklärungs-Audit: technische Statusbegriffe in verständliche Nutzerzustände übersetzen.
7. fixierter v9-RC-Commit und vollständige Regression.
8. Final-Legacy-Cleanup erst nach vorangehender erfolgreicher Regression.
9. erneute Regression und finaler Security-/Privacy-Smoke nach Cleanup.
10. erst danach formale RC-/Go-live-Freigabe.

## Dokumentationsdrift – Entscheidung
`QA_BASELINE.md` und `QA_EXECUTION_2026-09-01.md` bleiben als historische Baseline/Migrationsevidenz erhalten. Bei Statusabweichungen ab 02.09.2026 ist diese Reconciliation der aktuellere QA-Arbeitsstand, bis sie durch den finalen v9-RC-Testreport abgelöst wird. Es werden keine historischen Dateien gelöscht, bevor das Final-Cleanup-Gate die Klassifizierung abgeschlossen hat.
