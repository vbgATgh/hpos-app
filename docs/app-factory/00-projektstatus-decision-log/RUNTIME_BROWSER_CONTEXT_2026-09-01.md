# HPOS Runtime Browser Context – 2026-09-01

## Beobachtung
Beim Parqet-OAuth-Test wurde der Flow in Safari gestartet. Nach der Parqet-Autorisierung öffnete der Rücksprung HPOS in Microsoft Edge. Dadurch existierten zwei getrennte Browser-Kontexte mit getrenntem `localStorage`.

Nachweis im Browser:
- Safari zeigte weiterhin den alten validierten Fallback-State und lokale Watchlist = 1.
- Edge erhielt die neue HPOS-Session und zeigte `PARQET LIVE SYNC`, 19 Positionen, 246,73 EUR Cash und aktuellen Bestandszeitpunkt; lokale Watchlist = 0.

Nachweis im Supabase-Log:
- OAuth Callback: HTTP 302 erfolgreich.
- `/api/parqet/normalized`: HTTP 200 auf Edge Function Version 16.

## Schlussfolgerung
Der Parqet-Livepfad ist technisch erfolgreich. Die abweichende Anzeige zwischen Safari und Edge ist kein Depot-/Parqet-Fehler, sondern Folge browserlokaler Zustände.

Aktuell browserlokal:
- HPOS Session-ID
- validierter Portfolio-Cache
- Watchlist
- weitere lokale UI-/Preference-Zustände

Diese Daten werden von Safari und Edge nicht geteilt.

## Risiko
Mehrere Browser können unterschiedliche lokale HPOS-Zustände anzeigen. Insbesondere Watchlist und gecachter validierter State können auseinanderlaufen, obwohl Parqet serverseitig korrekt synchronisiert wurde.

## MVP-Empfehlung
Für v9 RC zunächst genau einen primären Browser-/PWA-Kontext für HPOS verwenden und OAuth aus demselben Kontext starten. Keine zusätzliche Supabase-Auth nur zur Cross-Browser-Synchronisation einführen, solange dies nicht als Produktanforderung beschlossen wurde.

Falls Cross-Browser-/Cross-Device-Persistenz künftig erforderlich wird, muss die Watchlist und weitere persönliche HPOS-Zustände serverseitig an eine stabile HPOS-Identität gebunden werden. Das wäre eine neue Produkt-/Architekturentscheidung und nicht nur ein Bugfix.
