# Privacy Boundary – P0 / Alpha 4.3.3

## Zielzustand im aktuellen Tree

Alpha 4.3.3 trennt öffentliche und private HPOS-Daten technisch:

- **öffentlich:** App-Code, allgemeine Markt-/News-Snapshots, generische Asset-/Quellenmetadaten
- **privat/lokal:** Stückzahlen, Einstand, Cash, Transaktionen, Dividenden, Brokerzuordnung, persönliche Strategie, Halal-Historie, Watchlist-Zuordnung und Notizen
- `data/portfolio/parqet_snapshot.json` ist aus dem aktuellen öffentlichen Tree entfernt und per `.gitignore` gegen erneutes Einchecken blockiert.
- Die News-Pipeline liest keinen realen Portfolio-Snapshot mehr. Sie arbeitet mit einem neutralen öffentlichen `UNIVERSE`; `Mein Depot`, Broker und Watchlist werden erst im Browser aus dem lokalen HPOS-State abgeleitet.
- Standard-Backups werden clientseitig mit PBKDF2-SHA256 und AES-256-GCM verschlüsselt. Die Passphrase wird weder gespeichert noch übertragen.
- Der ChatGPT-Handoff bleibt bewusst manuell und weist vor Erzeugung des kopierbaren Analyseauftrags auf die mögliche Übergabe privater Daten hin.

## Sicherheitsinvarianten

`tests/test_alpha433_privacy.py` und der Workflow `HPOS Alpha 4.3.3 Privacy Boundary CI` blockieren insbesondere:

- Rückkehr des realen öffentlichen Depot-Snapshots
- öffentliche `PORTFOLIO`-/`WATCHLIST`-Scopes in der News-Konfiguration
- erneute Snapshot-Abhängigkeit der News-Pipeline
- Verlust der clientseitigen Backup-Verschlüsselung
- nicht deterministische Alpha-4.3.3-Versionierung

## Wichtige Restgrenze: Git-Historie

Das Löschen der Datei aus dem aktuellen Branch entfernt frühere Versionen **nicht** aus bereits veröffentlichten Git-Commits. Frühere reale Depot-Snapshots sind deshalb über die öffentliche Repository-Historie weiterhin grundsätzlich rekonstruierbar, solange diese Historie nicht bereinigt oder das öffentliche Repository durch eine bereinigte Historie ersetzt wurde.

**Folge:** Die Runtime-/Current-Tree-Privacy-Boundary ist mit Alpha 4.3.3 umgesetzt. Die vollständige P0-Freigabe für ein dauerhaft öffentliches Produktions-Repository setzt zusätzlich einen History-Purge bzw. einen sauberen Public-Rebuild voraus.

Ein History-Purge darf erst nach extern gesichertem Backup und anschließender Prüfung erfolgen, weil er destruktiv für veröffentlichte Git-Historie ist.
