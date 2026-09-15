# HPOS v8.7.68 – Produktions-Smoke-Test

Stand: 2026-09-15

## Ergebnis

Arbeitspaket 1 ist bestanden. Der nach Merge von Pull Request #77 veröffentlichte GitHub-Pages-Stand entspricht den freigegebenen Dateien und der neue Supabase-Dienst ist mit den vorgesehenen Sicherheitsgrenzen erreichbar.

## Produktive Dateien

Folgende Dateien wurden direkt von `https://vbgatgh.github.io/hpos-app/app/` geladen und per SHA-256 mit dem Repository-Stand verglichen:

| Datei | SHA-256 | Ergebnis |
|---|---|---|
| `index.html` | `f7a8d06a630dd0864452a57449dcaddc31d2a2ac3a1c1fbb1ada48066e2e6b58` | identisch |
| `runtime-config.js` | `36d4584a00eda2924b3752cd557e25b03284eda806813dd25ce16b215469985b` | identisch |
| `halal-research.js` | `0c648c32beca3be9dfe97dc45ebf0f1684484d4fac6b53ab7dc4fff4fdab2e7e` | identisch |
| `app.js` | `9b1ccc8824a074daddf87913c9039b2318b58b697fdd0508b021c3ec5523ae16` | identisch |
| `styles.css` | `fb5a361be6df2fe8814cd59eb42ddd1a0ef68ff701abc5a82dbeb6eecb422257` | identisch |

Die produktive HTML-Datei zeigt `Portfolio Intelligence · v8.7.68` und referenziert `halal-research.js` sowie `app.js` mit dem Cache-Key `20260915-genericresearch1`. Die Runtime-Konfiguration verweist auf die produktive Supabase-Funktion `hpos-screen`.

## Live-Verhalten

- Der öffentliche Browseraufruf erreichte die App und wurde ohne vorhandene HPOS-Sitzung erwartungsgemäß zum Parqet-Login weitergeleitet.
- `GET /hpos-screen/health` mit erlaubtem Origin: HTTP 200 und Dienstversion `1.2.0`.
- `POST /hpos-screen/identity` ohne Sitzung: HTTP 401 `not_authenticated`.
- `GET /hpos-screen/health` mit fremdem Origin: HTTP 403 `origin_not_allowed`.
- Es wurden keine Portfolio-, Watchlist-, Evidenz- oder Sitzungsdaten verändert.

## Abgrenzung

Der authentifizierte Gate-1-Nutzerfluss wurde bereits beim Backend-Rollout geprüft. Dieser Smoke-Test bestätigt gezielt nur die Veröffentlichung, statische Integrität, Weiterleitung ohne Sitzung und öffentlichen Sicherheitsgrenzen. Ein erneuter realer Parqet-Login war für dieses Arbeitspaket nicht erforderlich.
