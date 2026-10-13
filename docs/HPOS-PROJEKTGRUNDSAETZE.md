# HPOS – Verbindliche Projektgrundsätze

Stand: 2026-10-13. Status: Vom Auftraggeber ausdrücklich bekräftigte, dauerhafte Produkt- und Arbeitsleitplanken. Ergänzt die App Factory Master-Agent-Instruktion und den Projektstatus/Decision Log; ersetzt diese nicht.

## Produktcharakter
- HPOS ist ausschließlich für die private Nutzung durch den Eigentümer bestimmt. Kein öffentliches Produkt, keine fremden Benutzer, kein Vertrieb, keine Mehrmandantenanforderung.
- Zielgerät ist das eigene iPhone; mobile PWA/Home-Bildschirm-Nutzung genügt. Keine App-Store-Veröffentlichung nötig.
- „Go-live“ bedeutet persönlicher Alltagsbetrieb auf dem eigenen Handy, **nicht** externe Veröffentlichung oder kommerzielle Produktionsreife.
- Eine private Nutzungsfreigabe ist von der evidenzbasierten Investment-/Orderfreigabe strikt zu trennen.

## Produktfunktion
- Generische autonome Wertpapier-Identifikation, Quellenrecherche, Evidenzbeschaffung, Halal-Prüfung, Gate-Auswertung und Aktualisierung für Depot, Watchlist und neu gesuchte Aktien. Keine manuellen Einzelaktien-Hardcodierungen je Release.
- Halal-Konformität ist zwingendes Gate. Fehlende, veraltete oder widersprüchliche Evidenz = offen/Review, niemals unbelegtes PASS. Musaffa primär, Zoya sekundär, weitere belastbare Quellen ergänzend.
- HPOS unterstützt BUY, HOLD, REDUCE, SELL, ROTATE, CONSOLIDATE und WAIT; keine autonome Broker-Order. Letzte Kapitalentscheidung beim Eigentümer.
- Portfolio-Rahmen und bereits freigegebene Regeln gelten weiter, bis sie ausdrücklich geändert werden.

## Entwicklungsmodus
- Möglichst selbständig umsetzen, verfügbare Tools verwenden, normale technische Folgeaktionen ohne wiederholte Rückfrage durchführen. Bei echten Produktentscheidungen, riskanten irreversiblen Änderungen, Secrets oder extern nötigen Aktionen stoppen.
- Freigegebene Entscheidungen und funktionierende Features erhalten; Änderungen mit Regressionstests absichern.
- Nur verhältnismäßige Sicherheitsmaßnahmen für eine private App; trotzdem Authentifizierung, Schutz persönlicher Depotdaten und keine unberechtigte Freigabe.
- Implementiert, geprüft, End-to-End-getestet und freigegeben sind unterschiedliche Zustände; keine fiktiven Testerfolge oder Go-live-Zusagen.
- Entscheidungen, Risiken, offene Punkte und Status in Projektquellen dokumentieren, nicht ausschließlich im Chat.

## Aktueller privater Go-live-Fokus (2026-10-13)
1. Zugriffsschutz von Frontend und hpos-api/hpos-profile/hpos-screen überprüfen (verify_jwt=false erfordert Prüfung der internen Authentifizierung).
2. Evidenzgesicherte Freigabeansicht vollständig in die verwendeten Backend-/Frontend-Entscheidungen integrieren.
3. iPhone-Test von Login, Depot, Watchlist, Einzelaktie, Buttons, Aktualisierung, Fehlermeldungen und Home-Screen-PWA.
4. Nach erfolgreichem privatem End-to-End-Test persönliche Nutzungsfreigabe; fachlich offene Aktien bleiben OPEN_REVIEW.

Diese Leitplanken bei jedem neuen HPOS-Arbeitspaket zuerst beachten. Änderungen nur ausdrücklich und dokumentiert.

## P1 – Tatsächliche Bestandsaufnahme der Edge-Authentifizierung (2026-10-13)
- Quellcode der aktiven Funktionen hpos-api v33, hpos-profile v16, hpos-screen v28 geprüft. Alle sind mit verify_jwt=false deployt.
- hpos-api: private Parqet-/Halal-Endpunkte verlangen Bearer-Session und prüfen diese in hpos_parqet_sessions; /health, Marktsuche/-kurse und OAuth-Start sind ohne Session erreichbar. OAuth-Start erzeugt einen ausstehenden Zustand; Parqet-Autorisierung ist für Token nötig.
- hpos-screen: /identity, /check, /runs/latest verlangen Session-ID aus hpos_parqet_sessions; /health ohne Session. Origin-Prüfung ist zusätzlich vorhanden.
- hpos-profile: nur Origin-Prüfung, keine Sessionprüfung. Liefert öffentliche Emittenten-/Marktdaten, keine persönlichen Portfoliodaten nach aktuellem Codebefund. Origin/CORS ist keine Authentifizierung.
- Wesentliche Grenze: Parqet-Session ist aktuell der Zugriffsnachweis, nicht eine explizite Eigentümer-Identität. Nur ein persönlicher Nutzer ist daher nicht nachgewiesen; Zugriff mit gültigem Session-Token bleibt möglich. Vor privater Nutzungsfreigabe Eigentümerbindung und Token-Verwahrung prüfen.
- Keine Live-HTTP- oder iPhone-End-to-End-Tests in diesem Schritt; kein Go-live-Test bestanden behauptet.
- Nachgelagerte Freigabeansichten wurden zuvor für anon/authenticated gesperrt; die vollständige Frontend-/Backend-Anbindung bleibt offen.

## P1 – Authentifizierungsdesign, konkretisiert (2026-10-13)
- OAuth-Callback in hpos-api speichert Parqet-Token und zufällige session_id in hpos_parqet_sessions und gibt die session_id im URL-Fragment an die PWA zurück. Die private API nutzt diese Bearer-Session; hpos-screen prüft dieselbe Session.
- Aktuelles Schema hpos_parqet_sessions enthält keine explizite owner_user_id / provider_account_id; eindeutige Bindung an das eine Eigentümerkonto ist daher **nicht nachgewiesen**.
- 35 Sessions gespeichert, davon zum Prüfzeitpunkt 1 innerhalb der letzten 12 Stunden angelegt. Keine Tokenwerte ausgelesen oder offengelegt. Bereinigung und Widerruf alter Sessions ist ein separates, vorab zu prüfendes Arbeitspaket.
- hpos-screen.requireSession prüft created_at gegen 12h, aber nicht expires_at; hpos-api.access verwendet den Refresh-Token bei Ablauf des Access-Tokens. Die unterschiedliche Behandlung muss auf gewünschte Semantik geprüft werden, bevor sie vereinheitlicht wird.
- Geplanter Fix: Parqet-Identität serverseitig am OAuth-Callback ermitteln und gegen eine ausschließlich serverseitige, nicht aus Clientdaten manipulierbare Eigentümerkennung prüfen; bei fehlender Identitätsquelle nicht blind Sessions akzeptieren. Keine zusätzliche Benutzerregistrierung einführen.
- Kein produktiver Auth-Fix ausgerollt: Die Identität des Eigentümerkontos und ein belastbarer Parqet-Identitätsendpunkt sind noch nicht verifiziert. Bis dahin private Go-live-Freigabe gesperrt.

## P1 – Supabase Security Advisor, behobener Befund (2026-10-13)
- Supabase Security Advisor meldete public.hpos_sync_capital_gates() als SECURITY DEFINER-Funktion mit EXECUTE-Recht für anon/authenticated. Dies ist eine ältere Triggerfunktion und wird vom aktuellen hpos_gate_audit_sync-Trigger nicht verwendet.
- Migration hpos_private_revoke_legacy_definer_rpc angewendet: EXECUTE für PUBLIC, anon, authenticated entzogen; service_role behält EXECUTE.
- SQL-Kontrolle: anon_exec=false, auth_exec=false, service_exec=true.
- Security Advisor erneut ausgeführt: nur INFO-Befund „RLS enabled, no policy“ für 8 backendverwaltete Tabellen. Dies ist bei bewusst ausschließlich service_role-gesteuertem Zugriff kein unmittelbarer Fehler; keine pauschalen RLS-Policies hinzufügen.
- Noch offen: tatsächliche Bindung von Parqet OAuth an ein festes Eigentümerkonto, Client-Token-Speicherung, API-/PWA-End-to-End-Test und GitHub-Pages-Zugriffsschutz. Keine private Go-live-Freigabe.

## P2 – Frontend-Parqet-Datenweg, Quellcodeprüfung (2026-10-13)
- app/app.js::syncParqet enthält noch einen Legacy-Aufruf an hpos-proxy.vbginbox.workers.dev mit lokalem Kompatibilitätswert hpos_parqet_token als URL-Parameter.
- app/parqet-supabase-adapter.js wird **vor** app.js geladen und überschreibt window.fetch; Legacy-Host + s=parqet wird auf hpos-api/api/parqet/normalized mit Authorization: Bearer <session_id> umgeleitet. Kompatibilitätswert wird beim OAuth-Callback auf SUPABASE_ADAPTER gesetzt. Der Legacy-Aufruf sendet unter normalem Ladepfad deshalb keinen Parqet-Zugangstoken an Cloudflare.
- Wichtig: Ohne erfolgreich geladenen Adapter kann app.js den alten Worker direkt ansprechen. Ein aktiver Parqet-Token ist im vorgesehenen Adapterbetrieb nicht als COMPAT_KEY hinterlegt, aber die Fallback-Abhängigkeit ist zu beseitigen.
- Geplanter eng begrenzter Fix: app.js::syncParqet direkt über eine explizit exportierte Adapterfunktion (ohne Legacy-URL, ohne Token im Querystring) an Supabase anbinden; bei fehlendem Adapter sicher abbrechen statt an Worker ausweichen. Bestehende Plausibilitätsprüfung, Quarantäne und Portfolio-Integrität erhalten. Vor Live-Änderung isolierte Tests für gültige Session, abgelaufene Session, Adapter fehlt, ungültige Antwort, Portfolio-Quarantäne.
- Diese Erkenntnis korrigiert die erste Vermutung eines direkten Cloudflare-Tokenversands; die tatsächliche Laufzeit-Umleitung wurde durch Codeprüfung festgestellt, nicht durch einen Browser-Netzwerkmitschnitt bestätigt.

## P2 – Implementierung in Prüfbranch (2026-10-13)
- PR #97 (Draft): https://github.com/vbgATgh/hpos-app/pull/97, Branch fix/parqet-direct-adapter-20261013.
- app/parqet-supabase-adapter.js exportiert HPOS_PARQET_ADAPTER.normalizedPortfolio; app/app.js::syncParqet ruft die Methode direkt auf, statt den Legacy-Worker mit Token im Querystring anzusprechen.
- Statische Prüfung erfolgreich: Adapterexport, direkter Aufruf, fehlender-Adapter-Abbruch, Bearer-Header, bisherige Validierung/Quarantäne. Kein echter iPhone-/Browser-End-to-End-Test; kein Merge und kein Go-live.
- Offene Prüfung vor Merge: echter Parqet-Sync, Reauth nach Ablauf, Fehlerfälle, Browser-Konsole, Quarantäne bei unplausiblen Depotdaten.

## P2 – Reauth-Nachbesserung (2026-10-13)
- PR #97 um HPOS_PARQET_ADAPTER.syncPortfolio() erweitert: delegiert an normalizedPortfolio() und löst bei REAUTH dieselbe bisherige reconnect('refresh_401')-Logik aus.
- app.js::syncParqet ruft jetzt syncPortfolio() auf. Acht statische Invarianten überprüft: kein Legacy-Worker in syncParqet, direkter Aufruf, Export, Reauth, Fail-Closed, Datenvalidierung, Quarantäne, Bearer-Header.
- PR bleibt Draft, ungemergt. Noch keine Live-OAuth-/iPhone-Tests. Produktive App nicht geändert.

## Gate-Abnahme: verifizierter Iststand und Testfolge (2026-10-13)
- Live-SQL der hpos_capital_release_live_v1: Masterflex SE und technotrans SE jeweils present_gates=5, validated_gates=0, investment_release_status=OPEN_REVIEW, order_release_status=NOT RELEASED, investment_eligible=false. Damit ist die Sperrlogik für diese beiden realen Datensätze lesend überprüft; kein vollständiger End-to-End-Test.
- Frontend app/gate-engine.js enthält acht historische Gates (Halal, Portfolio Fit, Investmentthese, Fundamentaldaten, Bewertung, Timing, News-Evidenz, Ausführung), die nicht 1:1 der verbindlichen Backend-Struktur G1 Halal, G2 Financial Data Verified, G3 Quality & Thesis, G4 Valuation, G5 Portfolio Fit plus separatem O1 Timing entsprechen.
- Blocker für iPhone-Gate-Abnahme: einheitliche Gate-Mapping-/API-Projektion, sichere Session-/Eigentümerbindung, Detailansicht und klickbare Gate-Abschnitte, Fehlerevidenz, Aktualisierung durch den Halal-Prüfbutton, negative Tests.
- Reihenfolge: (1) PR #97 Laufzeit-/Reauth-Test, (2) Backend-Gate-Leseendpunkt nur mit privater Session, (3) UI mit 5 Gates + O1 und Evidenzdetails, (4) automatische Prüfung aller Gates und fehlender Halal-Evidenz, (5) iPhone-Abnahme. Kein fixes Lieferdatum; grobe Schätzung 1–2 fokussierte Entwicklungstage bis erste Gate-Testversion, 3–5 bis iPhone-Abnahme, abhängig von Tests und Zugriff.

## P2 – Erste Live-Gate-Integration (2026-10-13)
- Supabase hpos-api Edge Function v34 deployed: GET /api/gates/status?isin=...; Origin- und vorhandene Parqet-Bearer-Session-Prüfung, ISIN-Validierung, service_role liest hpos_gate_status_v1 und hpos_capital_release_live_v1. G1–G5 mit fail-closed OPEN_REVIEW-Default; O1 Timing separat NOT_EVALUATED. Eigentümerbindung noch nicht gelöst.
- GitHub Draft-PR #98 https://github.com/vbgATgh/hpos-app/pull/98 gegen Branch fix/parqet-direct-adapter-20261013 (PR #97): neue app/live-gates.js mit aufklappbaren Gate-Details, Live-Status, manuellem Status-Reload und fehlersicherer Anzeige. Historisches 8-Gate-Modell ist noch nicht ersetzt; dies ist eine ergänzende autoritative Anzeige.
- Verifiziert: Deployment-Version und Routenquellcode, statische UI-Prüfungen für fünf Gates, Script-Ladereihenfolge, Bearer-Header, Fail-Closed, Expandierbarkeit, Reload. Kein echter HTTP-/iPhone-Test durchgeführt.
- Noch offen: Test mit gültiger und ungültiger Sitzung, Eigentümerbindung, echte Gate-Neuberechnung und Halal-Evidenzbeschaffung beim Prüfen-Button, historische Gate-Entscheidungen aus der UI entfernen, Merge erst nach Abnahme.

## P1/P2 – Gate-Owner-Binding und Fail-Closed UI (2026-10-13)
- hpos-api v35 deployed: GET /api/gates/status verlangt zusätzlich zur gültigen Parqet-Session eine serverseitige Prüfung der Parqet-/portfolios-Antwort auf die für HPOS hinterlegte Portfolio-ID 68e417d0d3a7de5073e5d189. Fehlende Berechtigung ergibt 403 owner_portfolio_not_authorized. Dies ist ein **portfolio-bezogener** Gate-Endpunktschutz, kein vollständiger Owner-Account-Identitätsnachweis. Die Portfolio-ID ist aus dem Projektkontext übernommen, aber ihre aktuelle Zugehörigkeit wurde nicht live verifiziert.
- Andere private hpos-api-Endpunkte sind noch nicht gleichermaßen an das Eigentümerportfolio gebunden. P1 bleibt offen; insbesondere OAuth-Callback und private Parqet-/Halal-Routen.
- PR #98 app/live-gates.js nachgebessert: Session-Ablaufzeit geprüft; positive Freigabeanzeige nur bei serverseitigem Investment-Release, investment_eligible=true, validated_gates=5 sowie fünf PASS-Gates mit vollständiger Evidenz; sonst bei Widerspruch OPEN_REVIEW.
- Deploy v35 bestätigt, Code statisch geprüft. Echter HTTP-/Parqet-/iPhone-Test noch nicht möglich/erfolgt; Produktiv-Freigabe weiterhin gesperrt.

## PR #97/#98 – Blocker aus Quellcodeprüfung (2026-10-13)
- Bestätigter Regressionsverdacht: syncPortfolio() in app/parqet-supabase-adapter.js gibt rohe normalizedPortfolio()-Daten zurück; der bisherige Legacy-Fetch-Adapter konvertiert diese zuvor mittels appHoldings() und appDividends(). Das neue app.js::syncParqet() übernimmt die Rohdaten in extractPortfolio(); Einstandspreise/Dividenden können dadurch abweichen. Vor Merge exakt dieselbe Konvertierung in syncPortfolio() wiederherstellen.
- Direkte GitHub-Dateiaktualisierung wurde zweimal durch Tool-Sicherheitsprüfung blockiert; kein erfolgreicher Fix am Adapter. Ein experimentelles, derzeit nicht in index.html eingebundenes app/parqet-direct-compat.js wurde im Testbranch erstellt; nicht als Lösung abgenommen oder produktiv aktiv.
- PRs #97 und #98 bleiben Draft und dürfen bis zum Mapping-Fix sowie Test nicht gemergt werden.

## PR #98 – Parqet-Kompatibilitätsfix nach Prüfung (2026-10-13)
- Im Testbranch feature/live-gate-panel-20261013 ist app/parqet-direct-compat.js nun in app/index.html zwischen parqet-supabase-adapter.js und app.js eingebunden. Commit 805e86608f4ab4b353e43537995b378d75ac5ce1 konvertiert die wichtigsten Holdings-Felder (Kurs, Marktwert, Einstand, halal) und erhält Dividendendaten als Array.
- Statische Prüfungen: Script vor app.js geladen, Kurs-/Einstandsmapping, Dividendenarray, Gate-Panel und Fail-Closed vorhanden. Dies ist nur eine **Zwischenkorrektur**, nicht identisch mit der bisherigen vollständigen appHoldings()/appDividends()-Konvertierung; vollständige Datenparität und Laufzeittests offen. Keine produktive Freigabe.

## PR #98 – Parqet-Datenparität: Korrektur des Korrekturpfads (2026-10-13)
- Codevergleich ergab, dass die erste app/parqet-direct-compat.js nicht alle Funktionen des alten Interceptors abdeckte: appHolding() enthält Broker-/Provenance-/Einstand-Fallback, appDividends() dedupliziert und validiert. Dies war ein konkreter Regressionsrisiko-Fund.
- Testbranch Commit 7fc10dc2e7be78b8246e9e09884be029f84807be: Der Kompatibilitätsadapter ruft jetzt die **bereits vorhandene** Fetch-Interception in parqet-supabase-adapter.js auf; diese ruft den Supabase-/api/parqet/normalized-Endpunkt mit Bearer-Sitzung auf und konvertiert über appHoldings() und appDividends(). Der Worker-Hostname ist hier nur ein intern abgefangener Kompatibilitäts-URL, keine beabsichtigte Netzwerkanfrage an den alten Worker.
- Statische Checks bestätigen Host-/Query-Match, Interception, vollständige Konverter und Script-Reihenfolge. Live-HTTP, Browser und Parqet-Datenvergleich bleiben offen. Der PR ist nicht produktiv freigegeben.
