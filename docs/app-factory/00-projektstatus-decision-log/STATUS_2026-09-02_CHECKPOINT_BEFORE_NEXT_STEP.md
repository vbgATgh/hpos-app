# HPOS Zwischenstand vor nächstem Arbeitsschritt

Stand: 2026-09-02, 10:17 CEST

## Zweck
Dieser Checkpoint friert den tatsächlich belegten Entwicklungsstand ein, bevor die nächste technische Ausbaustufe beginnt. Er ersetzt keine bestehende Entscheidung im zentralen `PROJECTSTATUS_DECISION_LOG.md`, sondern ergänzt sie um den aktuellen Zwischenstand und die noch offenen Arbeiten.

## 1. Aktuell belastbar erreicht

### Kanonischer Produktpfad
- `app/` ist der aktive Produktpfad.
- GitHub Pages dient weiterhin als Frontend.
- Supabase `hpos-api` ist die private Integrationsschicht.
- Cloudflare-Altpfade und sonstige historische UI-/Backendpfade gelten als Legacy und dürfen nicht weiter ausgebaut werden.

### Parqet / Portfolio-State
- Parqet ist weiterhin kanonischer Depot-Master und Reconciliation-Quelle.
- OAuth Authorization Code Flow mit PKCE, serverseitige Session und Token-Refresh wurden real nachgewiesen.
- Der produktive Browserpfad zeigte `PARQET LIVE SYNC` mit aktuellem Bestandszeitpunkt.
- Search/ISIN und Quotes laufen funktional über Supabase.
- Ein Providerfehler darf den letzten validierten State nicht unkontrolliert überschreiben.
- HPOS führt keine Broker-Orders aus.

### Watchlist / Investment-Akte / Analyse
- Watchlist-Persistenz wurde im Browser nachgewiesen.
- ISIN-verifizierte Suche und kanonische ISIN-Nutzung wurden nachgewiesen.
- Investment-Akte, Analyse/Decision Layer, Income-Grundlogik, Halal-UNKNOWN-Verhalten, Broker-Guard und Hauptnavigation wurden bereits real geprüft.

### Security / GitHub-Historie
- Der frühere sensible Portfolio-Snapshot wurde aus der aktiven Git-Historie entfernt.
- GitHub Support hat Garbage Collection und Cache-Cleanup durchgeführt.
- Die betroffene alte Commit-SHA ist anschließend über GitHub nicht mehr als Commit abrufbar gewesen.
- Dieser Security-Blocker ist geschlossen.

### Externer Morgenbriefing-Agent
Die Integration ist jetzt fachlich und technisch abgegrenzt:

1. Externe Morgenbriefings gelten nur als `Evidence-Candidate` / `Decision-Candidate`.
2. Sie dürfen den kanonischen HPOS-State nicht direkt überschreiben.
3. Ein eigenes Candidate-Schema ist vorhanden.
4. Ein Validator prüft u. a. Asset-Key, Action, Thesis-Delta, Risk-Delta, Coverage, Evidenzreferenzen und Rotation-Ziele gegen die HPOS-Struktur.
5. Ein externer Agent darf niemals selbst `VERIFIED` oder `PARTIALLY_VERIFIED` setzen; für `EXTERNAL_AGENT` ist nur `UNVERIFIED` zulässig.
6. Ein eigener GitHub-Actions-CI-Workflow prüft diesen Contract automatisiert.
7. Der aktuelle CI-Lauf nach der Korrektur der Testabhängigkeit ist erfolgreich durchgelaufen.
8. Die Tests verwenden synthetische Daten und keine realen privaten Depot-Snapshots.

Die feingranularen THS-Werte des externen Agents dürfen weiterhin als externes Metadatum übernommen werden. Die bestehende kanonische HPOS-THS-Regel wird dadurch nicht stillschweigend verändert.

## 2. Noch offen vor v9 RC / MVP

### A. Morning-Briefing Promotion / Evidence-Matcher — NÄCHSTER LOGISCHER BAUSTEIN
**Status:** OFFEN

Noch fehlt der technische Promotion-Schritt zwischen `UNVERIFIED` Candidate und kanonischem HPOS-State.

Er muss mindestens:
- `assetKey` eindeutig auf das Thesis Registry Asset abbilden,
- `evidenceIds` gegen den echten Evidence Store prüfen,
- externe Primärquellen nicht allein anhand einer URL als verifiziert behandeln,
- Evidenz-Deduplizierung berücksichtigen,
- Thesis-Impact nur nach belegter Evidenz hochstufen,
- Hard Gates einschließlich Halal-Gate respektieren,
- aus einem Candidate niemals automatisch eine Broker-Order machen,
- Audit-/Reason-Felder für Promotion, Rejection oder Pending erzeugen.

Erst danach darf ein Briefing-Signal in den kanonischen Decision Layer gelangen.

### B. Konkretes Morgenbriefing vom 02.09.2026 verifizieren
**Status:** OFFEN

Medtronic, GSK, Novartis, Novo Nordisk, Craneware, 4imprint, IVU, Frequentis und weitere dort genannte Werte sind bislang nicht allein wegen des Briefingtexts als HPOS-Evidenz verifiziert.

Die dort behaupteten neuen Fakten müssen je nach Relevanz gegen Primärquelle bzw. bereits vorhandene Evidence-ID geprüft werden. Erst danach können THS-/Action-Änderungen HPOS-seitig übernommen oder verworfen werden.

### C. Providerfehler / Fallback real provozieren und prüfen
**Status:** OFFEN · HOCH

Der Schutzmechanismus ist implementiert, aber der gezielte reale Fehlerfall ist noch nicht vollständig als PASS dokumentiert.

Zu prüfen:
- Provider HTTP-Fehler / Auth-Fehler,
- unplausible oder unvollständige Bestandsantwort,
- Erhalt des letzten validierten Portfolio-State,
- sichtbarer und verständlicher Fehlerstatus,
- kein stilles Überschreiben mit Fallback-/Altwerten,
- sauberer Recovery-Pfad nach Provider-Erholung.

### D. Parqet Session-/Reauth-Primärfluss final regressionsprüfen
**Status:** OFFEN / TEILWEISE GEPRÜFT

Der manuelle Refresh wurde auf Supabase-Session umgestellt und ein expliziter Reauth-Redirect wurde implementiert. Vor RC muss der vollständige Nutzerfluss nochmals als zusammenhängender Browsertest geprüft werden.

### E. Safari / iPhone / PWA Primärfluss
**Status:** OFFEN · HOCH

Da HPOS praktisch mobil genutzt wird, müssen vor RC mindestens folgende Flüsse auf Safari/iPhone bzw. installiertem PWA-Pfad geprüft werden:
- App-Start,
- aktueller Build statt Alt-Cache,
- Parqet-Sync,
- Refresh,
- Search/ISIN,
- Watchlist add/remove + Reload,
- Investment-Akte,
- Analyse,
- Income,
- Reauth,
- Navigation und Back/Forward-Verhalten.

### F. Cache-/Release-Verhalten härten
**Status:** OFFEN

Im bisherigen Testverlauf traten mehrfach alte App-Versionen bzw. alte Zustände im Browser auf. Vor RC muss eindeutig geklärt sein:
- welche Dateien gecacht werden,
- wie Build-/Asset-Versionen invalidiert werden,
- wie ein Service Worker/PWA-Cache aktualisiert wird,
- wie verhindert wird, dass Benutzer nach einem Release auf einer alten Version verbleiben,
- ob eine sichtbare Build-/Release-ID für Diagnosezwecke sinnvoll ist.

### G. Verbleibende Diagnose-/Systempfade
**Status:** OFFEN

Noch vorhandene technische Hilfs-, Debug-, Diagnose- oder Übergangspfade müssen inventarisiert und vor RC entweder produktiv begründet, abgesichert oder entfernt werden.

### H. Legacy-Cleanup — ERST AM ENDE
**Status:** BEWUSST ZURÜCKGESTELLT

Nach erfolgreicher RC-Regression sind alte und überflüssige Artefakte zu löschen, damit sie später nicht versehentlich wieder greifen.

Mindestens zu prüfen:
- alter Cloudflare Worker / Cloudflare-Routing,
- `backend/hpos-api/`,
- historische UI-/Alpha-Pfade außerhalb `app/`,
- `app/live.html` und temporäre Testpfade,
- überholte Runtime-/Cache-Hilfen,
- veraltete Daten-/Snapshot-Artefakte,
- nicht mehr benötigte Scripts, Configs und Dokumente,
- alte Secrets/Variablen oder Providerkonfigurationen außerhalb der Zielarchitektur.

Wichtig: Nicht blind löschen. Zuerst Abhängigkeitsprüfung, dann Cleanup, danach vollständige Regression.

### I. v9-RC Vollregression
**Status:** OFFEN · RELEASE-BLOCKER

Nach Abschluss der oben relevanten Arbeiten ist eine saubere End-to-End-Regression notwendig. Dabei dürfen keine bislang ungeprüften Punkte als PASS markiert werden.

### J. Formale App-Factory-Gates / Releasefreigabe
**Status:** OFFEN

Der Entwicklungsstand ist weit fortgeschritten, aber bislang ist kein formales App-Factory-Gate nachweislich als abgeschlossen dokumentiert. Vor `v9 RC = MVP` muss die tatsächliche Gate-/Releasefreigabe noch dokumentiert werden.

## 3. Priorisierte Reihenfolge ab diesem Checkpoint

1. Promotion-/Evidence-Matcher für Morgenbriefing bauen und testen.
2. Danach konkreten Briefing-Import zunächst mit synthetischen bzw. kontrollierten Beispielen prüfen.
3. Providerfehler/Fallback kontrolliert testen.
4. Reauth-/Session-/Refresh-Pfad vollständig regressionsprüfen.
5. Safari/iPhone/PWA und Cache-/Release-Verhalten härten.
6. Diagnose-/Systempfade bereinigen bzw. absichern.
7. Vollständige v9-RC Regression.
8. Erst danach Legacy-/Altartefakte löschen.
9. Nach Cleanup erneut Regression durchführen.
10. App-Factory Release-/Go-live-Gate dokumentieren und erst danach live gehen.

## 4. Aktuelle Freigabegrenze

**Weiterentwicklung ist freigegeben. Go-live ist noch nicht freigegeben.**

Der aktuelle Stand ist für die weitere Entwicklung belastbar genug. Noch nicht zulässig ist, externe Agentenurteile ungeprüft als HPOS-Wahrheit zu übernehmen oder Legacy-Artefakte vor erfolgreicher Endregression zu löschen.
