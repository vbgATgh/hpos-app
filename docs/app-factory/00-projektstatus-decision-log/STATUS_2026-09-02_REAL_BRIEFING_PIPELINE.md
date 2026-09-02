# HPOS Status 2026-09-02 – Real Morning Briefing Pipeline

## Zweck
Das reale Morgenbriefing vom 02.09.2026 wurde als kontrollierter Regression-Fall in die HPOS-Pipeline überführt. Es wird weiterhin als EXTERNAL_AGENT-Input behandelt und darf keine kanonische Wahrheit, THS-Änderung oder Investmentaktion direkt erzeugen.

## Neue reale Lücken und Behebungen

### 1. Asset-Identität war zwischen Thesis Registry und Evidence Store inkonsistent
Im Evidence Store existieren mehrere Provider-/Legacy-Keys, die von den kanonischen Thesis-Keys abweichen, unter anderem:
- NOVO_NORDISK_B -> NOVO_NORDISK
- CRANEWARE_PLC -> CRANEWARE
- ABBOTT_LABORATORIES -> ABBOTT
- MERCK___CO___INC -> MERCK
- RELX_PLC -> RELX

Ohne Normalisierung hätten valide Evidenzreferenzen fälschlich als Cross-Asset-Mismatch blockiert werden können.

Behebung:
- `data/asset_identity_aliases.json` eingeführt.
- Evidence Matcher canonicalisiert ausschließlich explizit freigegebene Aliase.
- Alias-Ziele müssen bereits in `thesis_registry.json` existieren; ein Alias darf keinen neuen kanonischen Asset-State erfinden.
- Tatsächlich angewandte Aliase werden im Matcher-Ergebnis als `appliedAssetAliases` ausgegeben.
- Echte Cross-Asset-Mismatches bleiben blockiert.

### 2. No-Delta-Briefings konnten bestehende Aktionen nicht sauber darstellen
Das reale Briefing enthält Fälle wie IVU/Frequentis: keine neue thesisverändernde Evidenz am 02.09., aber eine bereits bestehende Kauf-/Neukapital-Einschätzung bleibt gültig.

Die frühere Contract-Regel hätte `BUY` bei `NO_RELEVANT_DELTA` pauschal abgewiesen. Das hätte Agenten dazu verleiten können, einen künstlichen neuen Delta-Grund zu erzeugen.

Behebung:
- neues optionales Feld `actionBasis` mit `NEW_DELTA`, `PRIOR_VALIDATED_STATE`, `NONE`.
- directional action + `NO_RELEVANT_DELTA` ist nur mit `PRIOR_VALIDATED_STATE` zulässig.
- `NEW_DELTA` ist nur bei `DELTA_FOUND` zulässig.
- Damit wird sauber getrennt zwischen neuer Empfehlung und Carry-forward eines bestehenden validierten Urteils.

## Kontrollierter Realfall
Datei:
`data/briefing_cases/2026-09-02_external_agent.json`

Modellierte Kandidaten:
- Medtronic
- GSK
- Novartis
- Novo Nordisk
- Craneware
- IVU Traffic
- Frequentis

Alle Kandidaten bleiben beim Ingest `UNVERIFIED`.

### Ergebnis nach aktuellem Evidence Store
- Medtronic: Der Store enthält primäre Medtronic-IR-Seiten, aber aktuell keinen ausreichend strukturierten, datierten Beleg für die im Briefing behauptete Q1-FY27-Profitabilitäts-/Margenverbesserung. Der neue Claim darf daher nicht still zu REVIEW_READY/VERIFIED werden.
- GSK: Der Store enthält generische GSK-Ergebnis-/IR-Seiten, aber aktuell keinen strukturierten Beleg für den im Briefing behaupteten neuen Phase-II-mRNA-Influenza-Proofpoint. Der neue Claim bleibt ebenfalls nicht automatisch verifizierbar.
- Novo Nordisk und Craneware: Provider-Key-Abweichungen werden jetzt korrekt auf die kanonischen Registry-Assets normalisiert.
- IVU: Bestehende strukturierte Primärevidenz für H1 2026 kann zugeordnet werden; fehlende publishedAt-Werte bleiben als Date-Gap sichtbar. BUY im Briefing ist als `PRIOR_VALIDATED_STATE` gekennzeichnet und wird nicht als neue Delta-Aktion ausgegeben.
- Frequentis: Strukturierte Primärevidenz zu H1 2026 ist vorhanden. BUY bleibt dennoch ausdrücklich ein Carry-forward und kein neuer 02.09-Delta-Trigger.

## Regression
`tests/test_morning_briefing_case_2026_09_02.py` prüft den kontrollierten Realfall gegen die reale Registry und den realen Evidence Store.

Verbindlich geprüft werden insbesondere:
- Contract des Realfalls bleibt valide.
- Alle externen Kandidaten bleiben UNVERIFIED.
- Novo/Craneware scheitern nicht mehr fälschlich an Asset-Key-Mismatch.
- Review führt niemals automatisch Verification, THS oder Action Promotion aus.
- Generische Medtronic-/GSK-Seiten dürfen die neuen spezifischen Claims nicht als REVIEW_READY durchwinken.
- Carry-forward BUY für IVU/Frequentis bleibt explizit von NEW_DELTA getrennt.

GitHub Actions Run 33671871294 für Commit `510e2c5a45e64e38b3476b847cb01187259339e0` ist mit `success` abgeschlossen.

## Weiterhin offene Lücken

### 4imprint ist im Briefing relevant, aber nicht in der aktuellen Thesis Registry
Das reale Briefing enthält die Rotation `4imprint -> IVU`. Der Evidence Store kennt `4IMPRINT_GROUP_PLC`, die aktuelle `thesis_registry.json` enthält jedoch keinen freigegebenen kanonischen 4imprint-Thesis-Eintrag.

Folge:
- Die Rotation darf aktuell nicht als kanonischer Morning-Briefing-Candidate modelliert oder promoted werden.
- Es wird bewusst kein Thesis-Eintrag erfunden.
- Vor einer echten Rotation-Pipeline muss 4imprint entweder aus einer bestehenden freigegebenen Projektquelle in die Registry übernommen oder fachlich neu als Thesis registriert werden.

### Neue Medtronic-/GSK-Proofpoints fehlen noch als strukturierte Evidenz
Für die beiden wichtigsten neuen Aussagen des Briefings reicht der heutige Evidence Store nicht aus. Er enthält zwar Primärquellen-Seiten, aber nicht die nötigen strukturierten Fakten mit belastbarem Thesis Driver und Zeitbezug.

Nächster fachlicher Schritt:
- gezieltes Ingest der passenden offiziellen Medtronic-Q1-FY27- und GSK-Phase-II-Primärquellen,
- strukturierte Extraktion der tatsächlich thesisrelevanten Kennzahlen/Proofpoints,
- danach erneuter Matcher/Review-Lauf.

## Bewertung
Der Realfall hat zwei sinnvolle Systemverbesserungen offengelegt: Asset-Identity-Normalisierung und saubere Trennung zwischen neuem Delta und fortgeschriebener Aktion. Beide wurden behoben, ohne automatische Investmententscheidungen einzuführen. Go-live bleibt davon unberührt und wird nicht vorzeitig freigegeben.
