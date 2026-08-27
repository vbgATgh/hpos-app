# Alpha 4.3.2 – Versions-Hotfix

## Ursache
Der ältere Alpha-4.3.1-Patcher prüfte Versionsnummern per Teilstring. Dadurch konnte ein bereits korrektes `1.3.0-alpha.4.3.2` beim planmäßigen Data Refresh zu `1.3.0-alpha.4.3.1.2` verändert werden.

## Korrektur
- Alpha-4.3.1-Patcher ersetzt nur noch die exakte Basisversion 4.3.
- Alpha-4.3.2-Patcher normalisiert nur bekannte Vor-/Fehlversionen und lässt zukünftige Versionen unangetastet.
- Der produktive Data-Refresh führt Alpha 4.3.2 nach 4.3.1 aus und prüft die exakte `APP_VERSION`.
- `alpha432.js` wird im produktiven Syntax-/Startaudit geprüft.

## Abnahme
Separate Hotfix-CI prüft Migration, Idempotenz, JavaScript und Browserstart. Das vollständige Alpha-4.3.2-CI prüft zusätzlich News, Quellen und Halal-Logik.
