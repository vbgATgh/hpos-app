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
