# HPOS – UI & Design System Baseline

Stand: 2026-08-31
Status: IST-DESIGN DOKUMENTIERT / FINALES DESIGN NICHT FREIGEGEBEN

## Zweck
Diese Datei dokumentiert ausschließlich das aktuell im aktiven `app/` implementierte Designsystem und bereits belegte UI-Prinzipien. Sie friert die Gestaltung nicht ein. Farbpalette, Grafiken, Visualisierungen und Informationsdichte dürfen später gezielt nachjustiert werden.

## 1. Aktueller visueller Charakter
- Dark UI
- mobile-first
- violett geprägte Akzentfarbe
- Karten-/Panel-Struktur mit weichen Radien
- kompakte Bottom Navigation
- hohe Kontraste für Portfolio-/Statusinformationen
- Grün/Rot/Amber für positive, negative und Warnzustände

## 2. Aktuelle Design Tokens
Aus `app/styles.css`:
- Background: `#0a0712`
- Surface 1: `#171122`
- Surface 2: `#20172e`
- Border/Line: `#382950`
- Primary Text: `#f7f4fb`
- Muted Text: `#9e95ae`
- Violet Accent: `#9d79ff`
- Cyan Accent: `#5ad9ff`
- Positive: `#4fe0a0`
- Warning: `#f0bc60`
- Negative: `#ff727f`

Schriftstack: Apple System / SF Pro Display / Segoe UI / sans-serif.

## 3. Kernkomponenten
Aktuell implementiert:
- Sticky Header
- HPOS Home-Button `H`
- Icon Buttons für Suche/Refresh
- Bottom Navigation mit fünf Bereichen
- Cards
- Panels
- Listen/Rows
- Chips/Filter
- Statuspunkte
- Progress Bars
- Primary/Secondary Buttons
- Module Grid
- Detail Rows
- Bottom-Sheet/Dialoge
- Toasts
- Range Slider für Income-Ziel
- verifizierte Suchergebnisse / Guard States

## 4. Layoutprinzipien
- Hauptinhalt maximal 760 px breit.
- Mobile Seitenränder aktuell 16 px.
- Safe-Area-Unterstützung für iOS Header und Bottom Navigation.
- Karten überwiegend zweispaltig; kleine Displays werden teilweise angepasst.
- Hauptnavigation bleibt persistent am unteren Bildschirmrand.
- Status-/Datenbereiche sind visuell von Aktionen getrennt.

## 5. Semantische Farben
- Positive Werte / valide Zustände: Grün
- Negative Werte / Fehler: Rot
- Warnung / noch nicht finaler Datenstatus: Amber
- Navigation / Primäraktion / aktive Auswahl: Violett
- Sekundärinformation: Muted Text

## 6. Bereits belegte UI-Entscheidungen
- Das `H` oben links fungiert als Home-Button.
- Hauptnavigation: Home, Portfolio, Analyse, Income, Mehr.
- Watchlist wird als eigener Kontext/Filter sichtbar gemacht.
- Investment-Akte bündelt Position, Entscheidung, Evidenz und Dividenden.
- Income enthält einen Regler für das monatliche Ziel.
- Die finale Farbpalette ist ausdrücklich noch nachjustierbar.
- Weitere Grafiken, Visualisierungen, Daten und Regler können ergänzt werden, ohne die Datenarchitektur erneut aufzubrechen.

## 7. Noch NICHT als final festgelegt
- finale Farbpalette
- endgültige Anlehnung an Referenz-/Store-Farben
- finale Charttypen
- endgültige visuelle Dichte
- finale Iconografie
- endgültige Typografiegrößen
- finale Darstellung von HPOS-Status
- finale Informationsdichte der Investment-Akte
- finale Visualisierung des Dividendenziels und Forecasts
- Desktop-/Tablet-Optimierung

## 8. Design-Risiken
- Zu frühe kosmetische Änderungen können Daten-/Stabilitätsarbeit überdecken.
- Historische UI-Stände dürfen nicht als paralleles Designsystem weiterleben.
- Charts dürfen keine nicht vorhandenen oder unvalidierten Daten visualisieren.
- Farb-/Statussemantik muss konsistent bleiben.

## 9. Vorgehen bis zur finalen UI-Freigabe
1. Datenintegrität und Kernflows stabilisieren.
2. belegbare Datenfelder je Screen festlegen.
3. Visualisierungsbedarf aus den Daten ableiten.
4. Farbpalette/Designsystem gezielt finalisieren.
5. iPhone/PWA-Test.
6. erst danach UI-Gate bzw. Release-Design freigeben.

## Quellenbasis
- `app/styles.css`
- `app/index.html`
- `docs/ROADMAP-v9.md`
- bestehende UX-/Requirements-Baseline

## Gate-Hinweis
Die aktuelle Oberfläche ist real implementiert, aber diese Dokumentation erklärt das Design nicht rückwirkend zum bestandenen UI-Gate.