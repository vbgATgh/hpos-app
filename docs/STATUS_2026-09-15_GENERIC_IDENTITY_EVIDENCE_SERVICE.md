# HPOS v8.7.68 – generischer Identitäts- und Evidenzdienst

Stand: 2026-09-15

## Ergebnis

Der erste generische Backend-Block für Gate 1 ist implementiert und produktiv als Supabase Edge Function `hpos-screen` Version 10 aktiv. Die Einzelprüfung versucht nun vor dem lokalen Prescreen:

1. Name, Ticker, Börsenplatz und ISIN eindeutig zusammenzuführen,
2. offizielle SEC-XBRL-Daten und regulatorische Einreichungen zu beschaffen,
3. 36 abgeschlossene Monatswerte mit zeitlich passenden gemeldeten Aktienzahlen zu kombinieren,
4. die drei AAOIFI-Finanzquoten und das Kerngeschäft fail-closed auszuwerten,
5. jeden abgeschlossenen Lauf unveränderlich mit Kriterien und Evidenz zu protokollieren.

Der bestehende kuratierte Evidenzbestand behält Vorrang. Ein neuer offener Lauf überschreibt kein frisches, bereits entscheidendes `PASS`- oder `FAIL`-Ergebnis. Parqet-Bestände, Brokerzuordnung, Einstandsdaten, Rollback, Validierung und Quarantäne werden vom neuen Dienst nicht verändert.

Die generische Auswertung bleibt bewusst konservativ: Eine SEC-SIC-Zuordnung und ein einzelner Zinsertragswert können einen klaren Ausschluss stützen, beweisen allein aber weder ein zulässiges Kerngeschäft noch die Vollständigkeit sämtlicher nicht zulässiger Einnahmen. Schulden-Tags, die Finanzierungsleasing einschließen, gelten als Obergrenze. Solche Werte führen unterhalb der Grenze zu einer sicheren Entlastung, oberhalb der Grenze aber ohne genauere Zerlegung nicht automatisch zu `FAIL`.

## Identität

- Eine formal gültige ISIN allein gilt nicht als externe Verifikation.
- Yahoo oder OpenFIGI müssen die ISIN eindeutig bestätigen; bei einem mitgelieferten Ticker muss auch dieser exakt passen.
- Auch eine aus dem Depotkontext gelieferte ISIN benötigt eine unabhängige exakte Bestätigung durch Yahoo oder OpenFIGI; die vom Browser gesetzte Quellenbezeichnung wird nicht als Verifikationsbeleg vertraut.
- Kein Treffer oder widersprüchliche Treffer führen zu `OPEN_REVIEW`, nicht zu einer geratenen Zuordnung.
- Ein aus der offiziellen SEC-Datei erzeugter Snapshot mit mehr als 12.000 Ticker-/CIK-Zuordnungen ist als lokaler Backend-Fallback gebündelt. Er wird nur verwendet, wenn beide offiziellen Live-Indizes fehlen oder inhaltlich unvollständig sind.

## Datenhaltung und Zugriff

- `hpos_security_identities` speichert die verifizierte kanonische Identität und die geprüften Kandidaten.
- `hpos_halal_runs` speichert jeden abgeschlossenen Lauf mit Methodik, Kriterien, Fundstellen und Zeitpunkten.
- Beide Tabellen haben RLS aktiviert und keine Policies oder Rechte für `anon` beziehungsweise `authenticated`; ausschließlich der serverseitige Dienst greift mit `service_role` zu.
- `/identity`, `/check` und `/runs/latest` benötigen die vorhandene opake HPOS-/Parqet-Sitzung. `/health` und CORS-Preflight bleiben öffentlich.

## Verifikation

- Aktiver App-CI-Satz: 52 Tests bestanden.
- JavaScript-Syntaxprüfung für `app.js`, `search-guard.js` und `halal-research.js`: bestanden.
- Supabase `hpos-screen` Version 10: `ACTIVE`.
- Live: `/health` antwortet mit HTTP 200.
- Live: `/identity` ohne Sitzung antwortet mit HTTP 401.
- Live: nicht erlaubter Origin antwortet mit HTTP 403.
- Live: `/runs/latest` lieferte den vollständig gespeicherten letzten Testlauf.
- Live: widersprüchliche Kombination `US5949181045`/`AAPL` blieb `UNRESOLVED`.
- Live: Dieselbe widersprüchliche Kombination blieb auch mit einer vom Browser behaupteten Quelle `PARQET` offen; Client-Metadaten können die Identitätsprüfung nicht umgehen.
- Temporäre Testsitzung und alle während des Live-Tests erzeugten Lauf-/Evidenzdaten wurden anschließend entfernt.

## Offene Grenze

Die Supabase-Edge-Runtime konnte beim Live-Test den offiziellen SEC-Tickerindex nicht zuverlässig abrufen. Der gebündelte Snapshot löste Microsoft danach korrekt zum SEC-CIK auf und der Lauf wechselte von `GENERIC_DISCOVERY_ONLY` auf `SEC_XBRL_GENERIC`. Die offiziellen Companyfacts und Submissions waren aus der Edge-Runtime im selben Test weiterhin nicht verfügbar. Der Dienst stürzte nicht ab, sondern lieferte korrekt `OPEN_REVIEW` mit den vier offenen Kriterien. Damit sind Orchestrierung, Sicherheitsgrenzen, Emittentenauflösung und Prüfprotokoll produktiv, die automatische offizielle Finanzabdeckung ist aber noch nicht vollständig belastbar.

Der nächste Backend-Block ist deshalb ein regelmäßig aktualisierter Cache für offizielle regulatorische Dokumente und XBRL-Fakten. Erst danach kann die generische Pipeline unabhängig von der Erreichbarkeit einzelner Upstream-Endpunkte zuverlässig weitere Aktien abschließen.
