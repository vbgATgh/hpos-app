# AP 1 – Datenintegrität & Broker-Overrides

Stand: 2026-09-29  
Release-Kandidat: HPOS v8.7.73  
Status: ABNAHMEBEREIT, noch nicht veröffentlicht

## Umgesetzt

- Feldbezogene lokale Overrides für Stückzahl, Kurs, Positionswert, Einstand und Broker.
- Eindeutige Priorität: brokerbestätigt vor nutzerbestätigt vor Parqet vor öffentlicher Marktdatenquelle.
- Jeder Override enthält Quelle, Bestätigungszeitpunkt, optionalen Broker, Belegreferenz, Grund und Ablaufregel.
- Ein Override wird nicht durch einen bloß neueren Portfoliosync oder eine öffentliche Kursquelle verdrängt. Er verfällt nur bei Ablauf oder einem nachweislich neueren Feldstand der maßgeblichen Quelle.
- Craneware besitzt einen eigenen lokalen Erfassungsfluss unter `Mehr → Datenquellen`; private Bestandswerte werden nicht im öffentlichen Repository gespeichert.
- Positionswert, Stückzahl, Einstand und Kurs zeigen Quelle und Stand in der Investment-Akte.
- Depotwert, Positionenzahl, Cash und Einstandsabdeckung zeigen Quelle und Stand unter `Mehr → Datenquellen`.
- Abweichungen zwischen Quellwert und aktivem Override werden dauerhaft lokal protokolliert, dedupliziert und mit Auftretenszahl geführt.
- Parqet-Rohstand bleibt als validierter Basiszustand erhalten; Overrides werden erst in der effektiven Anzeige- und Entscheidungsprojektion angewendet.

## Nachweise

- `tests/test_ap1_data_integrity.py`: vier Tests für Datenschutzgrenze, Runtime-Vertrag, Override/Verfall und produktive Einbindung.
- Vollständiger Testlauf: 238 bestanden; 6 bereits bekannte Legacy-Fehler außerhalb AP 1.
- JavaScript-Syntaxprüfung für `app/data-integrity.js`, `app/app.js` und `app/parqet-supabase-adapter.js` bestanden.

## Noch vor formaler Abnahme

1. v8.7.73 veröffentlichen.
2. Den zuletzt bestätigten Craneware-Stand einmalig im lokalen Datenquellen-Modul erfassen.
3. Nach Refresh prüfen: Override aktiv, KPI korrigiert, Abweichungsprotokoll vorhanden, keine privaten Werte im Repository.
4. Produktions-Smoke auf iPhone/Home-Screen dokumentieren.
