# ADR-001 – Private Integration Layer

Stand: 2026-08-31
Status: SUPERSEDED
Superseded by: `ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`

## Historische Entscheidung
HPOS sollte GitHub Pages als statisches Frontend behalten und eine neue, getrennte private Integrationsschicht unter dem Arbeitsnamen `hpos-api` erhalten.

Die ursprünglich in dieser ADR festgelegte Zielplattform für diese neue Schicht war ein eigener Cloudflare Worker. Der bereits bestehende Worker `hpos-proxy.vbginbox.workers.dev` war dabei schon als Legacy eingestuft und sollte nicht erweitert werden.

## Ersetzung / Supersession
Diese Plattformentscheidung ist seit 2026-08-31 ausdrücklich ersetzt.

Die neue und aktive Zielentscheidung steht in:
`docs/ADR-002_SUPABASE_PRIVATE_INTEGRATION_LAYER.md`

Aktuell gilt:
- GitHub Pages bleibt vorerst statisches Frontend.
- Supabase Edge Functions sind die Zielplattform für die private Integrationsschicht `hpos-api`.
- der bestehende Cloudflare Worker bzw. `backend/hpos-api/` bleibt ausschließlich Legacy und darf nicht als produktive Zielarchitektur erweitert werden.
- Cloudflare wird erst entfernt, wenn die entsprechenden Funktionen erfolgreich auf Supabase migriert, getestet und ohne aktive Abhängigkeit nachgewiesen wurden.

Damit ist insbesondere die Aussage „die neue Schicht wird als eigener Cloudflare Worker umgesetzt“ nicht mehr gültig.

## Weiterhin gültige Architekturprinzipien aus ADR-001
Folgende Grundsätze bleiben bestehen und wurden in ADR-002 übernommen bzw. präzisiert:
- getrennte private Integrationsschicht hinter dem öffentlichen GitHub-Pages-Frontend
- Parqet ausschließlich über die offizielle Connect API
- OAuth 2.0 Authorization Code Flow mit PKCE S256
- Scope `portfolio:read`
- keine Parqet Access-/Refresh-Tokens im Browser oder öffentlichen Repository
- externe Providerfehler dürfen einen zuletzt validierten State nicht unkontrolliert überschreiben
- Legacy-Abhängigkeiten werden erst nach erfolgreicher Migration und tatsächlichem Test entfernt

## Historischer Migrationsplan
Der ursprüngliche Cloudflare-bezogene Migrationsplan ist nicht mehr ausführbar und nur noch Historie. Der verbindliche Rollout steht in ADR-002 sowie im zentralen Projektstatus/Decision Log.
