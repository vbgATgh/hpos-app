# ADR-002 – Supabase Private Integration Layer

Stand: 2026-08-31
Status: ACCEPTED
Supersedes: `ADR-001_PRIVATE_INTEGRATION_LAYER.md` for the backend platform decision

## Entscheidung
HPOS behält GitHub Pages als statisches Frontend. Die private Integrationsschicht `hpos-api` wird auf **Supabase Edge Functions** umgesetzt.

Der bestehende alte Worker `hpos-proxy.vbginbox.workers.dev` bleibt ausschließlich Legacy-Übergang und wird nicht erweitert.

Die in ADR-001 festgelegte Cloudflare-Neuentwicklung ist damit verworfen. ADR-001 bleibt als historische Entscheidung erhalten und wird nicht gelöscht.

## Gründe
- Nutzerentscheidung gegen Cloudflare als neue Zielplattform.
- bestehendes und verbundenes Supabase-Projekt `vbgATgh's Project-HPOS App v2` ist verfügbar.
- Edge Functions eignen sich für serverseitige OAuth-/Provideraufrufe.
- Secrets und Parqet OAuth-Tokens müssen nicht im öffentlichen GitHub-Frontend liegen.
- PostgreSQL kann den minimal benötigten OAuth-State und serverseitige Sitzungen persistent speichern.
- keine zusätzliche Datenbanknutzung über den für die private Integration tatsächlich nötigen Session-/OAuth-Speicher hinaus.

## Supabase-Projekt
Project Ref: `moxyhjfbrmsnphikxqje`
Region: `eu-west-1`

## Parqet
Parqet wird ausschließlich über die offizielle Parqet Connect API integriert.

Authentifizierung:
- OAuth 2.0 Authorization Code Flow
- PKCE S256
- Scope `portfolio:read`
- private Parqet-Integration ist für den persönlichen HPOS-Einsatz ausreichend
- kein Parqet Access-/Refresh-Token im öffentlichen Frontend

Geplante/read-only Pfade:
- Portfolios
- Holdings
- Activities
- später Performance/Dividenden, sofern für den MVP erforderlich und verifiziert

## Session-Modell
- OAuth `state` und PKCE `code_verifier` werden kurzzeitig serverseitig gespeichert.
- Access-/Refresh-Tokens werden serverseitig gespeichert.
- der Browser erhält nur eine zufällige, opake HPOS-Sitzungs-ID, nicht die Parqet OAuth-Tokens.
- die opake Sitzung ist zeitlich begrenzt und wird für API-Aufrufe als Bearer-Sitzung verwendet.
- CORS für geschützte API-Pfade wird auf `https://vbgatgh.github.io` begrenzt.

Dieses Modell vermeidet eine Abhängigkeit von Cross-Site-HttpOnly-Cookies, die insbesondere auf Safari/PWA problematisch sein kann.

## Persistenz
Minimale Tabellen:
- `public.hpos_oauth_pending`
- `public.hpos_parqet_sessions`

Beide Tabellen:
- RLS aktiviert
- keine Freigabe für `anon` oder `authenticated`
- Zugriff nur serverseitig über `service_role`

## Security
- keine Provider-Secrets im Repository
- keine Parqet OAuth-Tokens im Frontend oder `localStorage`
- Providerfehler dürfen validierten lokalen Portfolio-State nicht überschreiben
- Edge Function APIs verlangen zusätzlich zur Origin-Prüfung eine gültige opake HPOS-Sitzung
- Supabase Security Advisor muss vor RC ohne offene relevante Findings sein

## Rollout
1. Supabase-Basis und Security prüfen.
2. Session-/OAuth-Store migrieren.
3. `hpos-api` Edge Function deployen.
4. private Parqet-Integration im Developer Hub anlegen.
5. `PARQET_CLIENT_ID` sicher in Supabase konfigurieren.
6. OAuth-Flow mit eigenem Parqet-Konto autorisieren.
7. Portfolios/Holdings gegen Parqet verifizieren.
8. erst danach HPOS-Frontend auf Supabase-Parqet umstellen.
9. anschließend Suche/Quotes separat aus dem Legacy-Worker migrieren.
10. alten Worker erst entfernen, wenn keine aktive Funktion mehr davon abhängt.

## Aktueller Nachweis
Am 2026-08-31 wurden bereits durchgeführt:
- Supabase-Verbindung geprüft
- Security-Warnung an `public.rls_auto_enable()` gehärtet
- Security Advisor danach ohne Findings
- OAuth-/Session-Tabellen per Migration angelegt
- Edge Function `hpos-api` Version 1 deployt

Noch nicht durchgeführt:
- Parqet Client-ID konfiguriert
- OAuth-End-to-End autorisiert
- Portfolio-/Holding-Abgleich gegen den eigenen Parqet-Bestand
- Frontend-Umschaltung

Daher besteht ausdrücklich noch **kein Parqet E2E-PASS**.