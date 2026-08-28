# HPOS Architecture v1

## Ziel
HPOS wird nicht mehr durch einen einzelnen Mega-Prompt gesteuert. Die operative Wahrheit wird in vier klar getrennte Schichten zerlegt.

## 1. Constitution
Datei: `config/hpos_constitution.json`

Enthält nur langlebige, verbindliche Systemregeln: Halal-Gates, Portfolio-Caps, Cash-Floors, T90-Grundsatz, Rotation-Gates, Datenhierarchie und Governance.

Die Constitution enthält **keine aktuellen Depotwerte, Kurse, Brokerbestände, temporären Overrides oder taktischen Kaufzonen**.

## 2. Current State
Schema: `config/current_state.schema.json`

Der echte Zustand ist privat und local-first. Er enthält Portfolio, Cash, Positionen, offene Orders, Sparpläne, Overrides und den letzten Controller-Zustand.

**Privacy Boundary:** Es wird absichtlich keine reale Current-State-Datei im öffentlichen Repository geführt. Broker-/Parqet-/Nutzerdaten bleiben im Browser bzw. in einem privaten Backend.

Overrides werden als datierte Fakten modelliert und nicht in Prompts fest verdrahtet. Ein Override verfällt, sobald eine plausiblere, jüngere Quelle den Konflikt auflöst.

## 3. Thesis Registry
Datei: `data/thesis_registry.json`

Enthält die versionierbaren Investmentthesen je Asset: Rolle, These, Risiken, Katalysatoren/Proof Points und Falsification.

Unternehmensspezifische Guidance, Targets oder Schwellen gehören hierher und müssen datiert/reviewbar sein. Sie gehören nicht in die Constitution.

## 4. Operative Agents

### Portfolio Controller
Frage: **Was ist nach den Regeln heute zulässig bzw. erforderlich?**

Zuständig für Cash, Caps, T90, EIB, offene Orders, Kaufzonen und Controller-Entscheidung. Er konsumiert Thesis-Ergebnisse, ersetzt aber keine tiefe Fundamentalanalyse.

### News / Thesis Agent
Frage: **Was hat sich fundamental verändert und verdient Kapital eine andere Verwendung?**

Zuständig für Evidenz, Thesis Health, Falsification, Missing Evidence, Opportunity Cost und Rotation. News sind nur Input für die These, kein Selbstzweck.

### Capital Allocator
Frage: **Wo arbeitet der nächste zulässige Euro am besten?**

Er darf nur Kandidaten vergleichen, die Constitution- und Controller-Gates bestanden haben. Ergebnis: Ranking für Next EUR 100/250/500 und EIB-Vorschlag.

### Governance / Audit
Frage: **Sind Regeln, Quellen oder Zustände widersprüchlich bzw. veraltet?**

Er darf keine neue Investmentregel aus einem Einzelfall erfinden. Er meldet Konflikte und schlägt Regeländerungen separat vor.

## Harte Entscheidungsreihenfolge
`HALAL -> PORTFOLIO FIT -> THESIS -> FUNDAMENTALS -> VALUATION -> TIMING -> NEWS EVIDENCE -> EXECUTION`

Ein späterer Layer darf einen früheren Hard Gate nicht überstimmen.

## Rotation
Rotation ist zweistufig:

1. **Eligibility Gate:** H1, Caps okay, handelbar, Portfoliofunktion klar, Nettoeffekt wirtschaftlich sinnvoll.
2. **Relative Hurdle:** Zielinvestment muss gegenüber der Quelle einen materiellen Vorteil bei These, Qualität, Wachstum, FCF, Diversifikation, Catalyst oder Risiko/Rendite bieten.

Preisperformance allein ist kein Rotationsgrund.

## THS
Thesis Health ist Diagnose, keine Trade-Freigabe. Änderungen benötigen thesis-relevante Evidenz. Keine tägliche Punktbewegung durch normale Headlines. Wo numerisch verwendet, vorzugsweise 0,5er Schritte und immer mit Begründung.

## Source of Truth
Bei Widersprüchen gilt:
1. jüngste ausdrückliche Nutzerentscheidung
2. Constitution / neueste verbindliche HPOS-Regel
3. Current State mit Zeitstempel
4. Thesis Registry mit Review-Stand
5. historische Masterfiles/Snapshots

Die App darf fehlende Daten nicht mit alten Werten oder Scheingenauigkeit füllen.