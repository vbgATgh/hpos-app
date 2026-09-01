# HPOS – Deployment & Betrieb Baseline

Stand: 2026-09-01
Status: SUPABASE-ZIELBETRIEB AKTIV / PARQET + SEARCH + QUOTES NACHGEWIESEN / CANONICAL REGRESSION OFFEN

## Aktueller belegter Betriebsansatz
- Frontend: statisch / GitHub Pages
- aktiver Produktpfad: `app/`
- kanonischer Frontendpfad: `https://vbgatgh.github.io/hpos-app/app/`
- Zielbackend: Supabase Edge Function `hpos-api`
- Supabase Project Ref: `moxyhjfbrmsnphikxqje`
- aktuelle Edge Function: Version 17, `ACTIVE`, `verify_jwt=false` wegen eigener HPOS-/OAuth-Authentifizierung
- Parqet, Search und Quotes sind funktional über Supabase nachgewiesen
- Cloudflare ist Legacy und kein Zielbetrieb mehr

## Bereits umgesetzt und real nachgewiesen
- Supabase-Verbindung geprüft
- OAuth-/Session-Store für Parqet angelegt
- RLS aktiviert und öffentliche Rollen gesperrt
- explizite DENY-ALL-RLS-Policies vorhanden
- `PARQET_CLIENT_ID` als Supabase Secret vorhanden
- Parqet OAuth Authorization Code + PKCE real durchgeführt
- Access-/Refresh-Tokens ausschließlich serverseitig gespeichert
- realer Token-Refresh eines abgelaufenen Access Tokens durchgeführt
- Parqet Portfolio-/Performance-Daten erfolgreich gelesen
- serverseitige Normalisierung erfolgreich geprüft
- produktiver Browserlauf mit `PARQET LIVE SYNC` nachgewiesen
- Search über Supabase im Browser und Serverlog mit HTTP 200 nachgewiesen
- Quotes über Supabase im Browser und Serverlog mit HTTP 200 nachgewiesen
- Deploy-Code und Migrationen in GitHub versioniert
- `runtime-config.js` enthält keinen aktiven Cloudflare-Zielhost mehr
- erprobter `live9`-Frontendstand wurde als `v8.7.5` nach `app/index.html` übernommen
- OAuth-Rücksprung der Edge Function wurde in Version 17 auf den kanonischen `app/`-Pfad umgestellt
- starre Testassertionen auf exakt 19 Positionen und 246,73 EUR Cash wurden für den produktiven Pfad durch strukturelle Plausibilitätsprüfungen ersetzt

## Zielprinzipien
- öffentliches Frontend enthält keine Parqet-Secrets oder OAuth-Tokens
- private Providerzugriffe serverseitig über Supabase
- Parqet Access-/Refresh-Tokens serverseitig
- Legacy-Worker wird nicht erweitert
- Migration erfolgt schrittweise und regressionsgesichert
- Legacy wird erst nach bestandenem Final-Cleanup-Gate entfernt
- externe Providerfehler dürfen den letzten validierten Portfolio-State nicht überschreiben
- Marktdaten dürfen Depotbestände nicht verändern

## Aktuelle Edge-Function-Adresse
`https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api`

Parqet Redirect URI:
`https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api/auth/parqet/callback`

Frontend-Rücksprung ab Version 17:
`https://vbgatgh.github.io/hpos-app/app/`

## Noch nicht als erfolgt belegt
- kanonischer `app/`-Smoke-Test nach Promotion von `live9`
- OAuth-Rücksprung auf den kanonischen `app/`-Pfad im realen Browserlauf
- Watchlist-Persistenz nach Reload im selben Browser
- vollständige Fehler-/Fallback-/Origin-/Security-Regression
- Monitoring/Alerting für den MVP-Kern, soweit für eine persönliche App sinnvoll
- Backup/Restore für browserlokale Einstellungen und privaten Current-State-Pfad
- vollständiger Rollback-Prozess für v9 RC
- Final-Legacy-Cleanup nach `FINAL_LEGACY_CLEANUP_GATE.md`

## Browser-/PWA-Betrieb
HPOS-Session, Watchlist und lokale Einstellungen liegen derzeit im LocalStorage des jeweiligen Browser-/PWA-Kontexts. Safari, Edge und PWA teilen diesen Zustand nicht automatisch. Auf iOS kann der OAuth-Rücksprung im eingestellten Standardbrowser landen.

Für den MVP wird kein zusätzlicher Cross-Browser-Synchronisationsdienst eingeführt. Stattdessen wird ein kanonischer Nutzungskontext im Regressionstest geprüft. Ein Browserwechsel darf nicht als Datenverlust des Parqet-Masters missverstanden werden; betroffen sind nur lokale HPOS-Einstellungen/Sessionzustände.

## Rollback-Grundsatz
Der letzte validierte Portfolio-State bleibt die Rückfallebene für Provider-/Backendfehler. Ein fehlerhafter neuer Abruf darf diesen State nicht überschreiben.

Bis zum bestandenen Final-Cleanup-Gate bleiben ausgewählte Compatibility-Shims und historische Artefakte als kontrollierter Rollback-/Vergleichspfad erhalten. Sie dürfen nicht erweitert oder wieder zur Zielarchitektur gemacht werden.

## Release-Betriebscheck
Vor v9 RC müssen mindestens geklärt und soweit relevant real getestet sein:
- welcher Frontend-Commit produktiv ist
- welche Backend-/Providerpfade aktiv sind
- welche Secrets/Tokenarten wo gehalten werden
- wie Provider- und Backendfehler sichtbar werden
- wie ein Rollback auf den letzten validen Build erfolgt
- wie browserlokaler State bei Geräte-/Browserwechsel behandelt wird
- dass keine aktive MVP-Funktion mehr unbeabsichtigt vom Legacy-Worker abhängt
- dass der kanonische `app/`-Pfad OAuth, Parqet, Search, Quotes und Watchlist korrekt abbildet
- dass nach dem Final-Cleanup keine entfernte Legacy-Komponente mehr referenziert wird

## Final-Cleanup
Verbindliche Quelle:
`docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md`

Das Cleanup erfolgt erst nach vollständiger Regression. Historische ADRs/Entscheidungsnachweise bleiben erhalten; ausführbarer oder routbarer Legacy-Code wird nach belegter Nichtnutzung entfernt oder technisch neutralisiert.

## Quellen
- `docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`
- `supabase/functions/hpos-api/index.ts`
- `supabase/migrations/`
- `docs/app-factory/07-security-datenschutz/SECURITY_PRIVACY_BASELINE.md`
- `docs/app-factory/09-deployment-betrieb/FINAL_LEGACY_CLEANUP_GATE.md`

## Gate-Hinweis
Parqet, Search und Quotes sind über Supabase real nachgewiesen. Das Release-Gate bleibt offen, bis der kanonische `app/`-Pfad, Watchlist-Persistenz, Fehlerfälle, Security, Rollback und Final-Cleanup tatsächlich geprüft wurden.