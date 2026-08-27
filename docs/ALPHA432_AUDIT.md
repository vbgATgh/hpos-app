# HPOS Alpha 4.3.2 – Halal & News Hardening Audit

## Ergebnis
- Halal-Resolver: grün
- News-/Quellenlogik: grün
- JavaScript/Syntax/Startinvarianten: grün
- Discovery Live-Test: grün
- Direktquellen Live-Test: grün
- Browser Smoke News: grün
- Browser Smoke Halal: grün

## Behobener Halal-Fehler
Die bisherige Effektivlogik sortierte manuelle Prüfungen derselben Quelle primär nur nach `checkedAt` (Datum). Zwei Musaffa-Prüfungen am selben Tag konnten dadurch in einer nicht fachlich eindeutigen Reihenfolge landen. Das konnte z. B. einen älteren H0/VETO trotz später dokumentiertem H1 effektiv halten.

Alpha 4.3.2 trennt deshalb:
- unveränderliche vollständige Historie
- genau ein aktuelles Urteil je Quelle
- Sortierung nach Prüftag und anschließend Erfassungszeitpunkt
- bei exakt unauflösbarem widersprüchlichem Gleichstand: H2 / manuelle Klärung, niemals zufälliges H0 oder H1
- H1 und H0 benötigen bei neuen manuellen Prüfungen einen Beleg/eine Referenz

## News-Fehler und Korrektur
In Alpha 4.3.1 wurde der Scope-Filter erst auf bereits gerenderte/paginierte Karten angewendet. Dadurch konnte `Mein Depot` auf der ersten Seite nahezu nur Rio Tinto zeigen, obwohl im vollständigen Feed viele weitere Depotwerte vorhanden waren. Zusätzlich konnten alte Rio-Direktmeldungen kumulieren.

Alpha 4.3.2:
- filtert Depot/Watchlist, Qualitätsstufe und Suchtext vor der Pagination
- begrenzt verwaltete Direktadapter auf maximal 5 Meldungen je Asset
- ersetzt alte Adapter-Snapshots statt sie zu kumulieren
- behält 20er-Pagination für mobile Performance

## Quellenabdeckung
- reale Depotpositionen: 19
- offizielle Primärquellen-Referenzen: 19/19
- automatische Direktadapter bleiben nur dort aktiv, wo ein stabiler zulässiger Abruf belastbar implementiert ist
- übrige offizielle Unternehmens-/Fondsseiten sind als Primärquellen-Referenz hinterlegt und werden nicht fälschlich als automatischer RSS/API-Abruf bezeichnet
- Discovery-News: 19 Depotwerte vollständig je Lauf; Watchlist rotierend zur Lastbegrenzung

## Bewusste Grenzen
- keine automatische Halal-Einstufung ohne belastbare Musaffa/Zoya/Muslim-Xchange-Schnittstelle
- Primärquellen-Referenz bedeutet nicht automatisch Direktfeed
- echte Depotdaten befinden sich derzeit noch im öffentlichen Repository; Privacy Boundary ist P0 im Gesamtfahrplan
