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
