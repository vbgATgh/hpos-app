# ADR-001 – HPOS Integrationsschicht

Stand: 2026-08-31
Status: ACCEPTED – Architektur, Provider noch offen

## Entscheidung
HPOS bleibt im Frontend eine statische/local-first Web-App. Externe Datenquellen werden in zwei Klassen getrennt:

1. **Öffentliche Quellen ohne Secret** dürfen direkt aus dem Browser angesprochen werden, sofern CORS/Nutzungsbedingungen dies erlauben und Fehler sauber behandelt werden.
2. **Quellen mit geheimem Token/API-Key** werden ausschließlich über eine kleine private Integrationsschicht angesprochen. Secrets dürfen nicht im öffentlichen Repository, Browser-JavaScript oder localStorage liegen.

Die Integrationsschicht ist ein Transport-/Normalisierungsdienst. Sie trifft keine Investmententscheidungen.

## Gründe
- Parqet-Sync benötigt im aktuellen Prototyp einen Token.
- DivvyDiary besitzt einen persönlichen API-Key mit Schreibrechten.
- GitHub Pages kann Secrets nicht schützen.
- Der bisherige Cloudflare Worker stammt aus einer älteren HPOS-Generation und wird nicht automatisch als Zielarchitektur übernommen.

## Aktive Legacy-Abhängigkeiten
Der alte Worker `hpos-proxy.vbginbox.workers.dev` wird aktuell noch für drei Pfade verwendet:
- Parqet-Sync
- Yahoo-Kursproxy
- Yahoo-/Wertpapiersuche

`quote-policy.js` war zusätzlich direkt auf diesen Host zugeschnitten.

## Übergangsmaßnahme v8.7.4
Die Zieladresse externer Integrationsaufrufe wird über `app/runtime-config.js` zentralisiert. `quote-policy.js` routet bestehende Legacy-Aufrufe durch diese Konfiguration. Damit bleibt die aktuelle App funktionsfähig, während ein späterer Backend-Wechsel nur noch an einer zentralen Stelle erfolgen soll.

`LEGACY_TRANSITION` bedeutet ausdrücklich nicht, dass der alte Worker für neue Integrationen freigegeben ist.

## Direkte Browser-Quellen
Aktuell zulässig bzw. separat zu verifizieren:
- Frankfurter für FX
- OpenFIGI für Instrumentidentität/ISIN-Mapping

Keine Quelle darf ungeprüft Portfolio-State überschreiben.

## Private Integrationsschicht – Anforderungen
MUSS:
- Secrets serverseitig halten
- nur definierte Provider-Endpunkte zulassen
- CORS auf HPOS-Origin begrenzen, soweit praktikabel
- Timeouts und Rate-Limits behandeln
- Antworten normalisieren
- keine Secrets an den Client zurückgeben
- Fehler als strukturierte Fehler liefern
- keinerlei Orderausführung durchführen

SOLL:
- Provider austauschbar halten
- Health-Status liefern
- minimale Logs ohne sensible Portfolioinhalte führen
- Cache nur dort einsetzen, wo fachlich vertretbar

## Providerentscheidung
Noch NICHT festgelegt. Cloudflare Workers, Vercel Functions oder vergleichbare kostenlose Serverless-Lösungen sind technisch möglich. Ein bestehender Legacy-Worker ist kein Auswahlkriterium.

Die Providerwahl erfolgt nach:
1. keine zusätzlichen laufenden Kosten
2. sichere Secret-Verwaltung
3. geringe Komplexität
4. gute Performance aus Deutschland/EU
5. einfache Wartbarkeit
6. keine unnötige Weitergabe persönlicher Daten

## Datenrollen
- Parqet: Portfolio-/Bestandsquelle, sofern die tatsächliche Schnittstelle stabil verifiziert ist
- DivvyDiary: ergänzende Dividenden-/Income-Daten, sofern API-Nutzung verifiziert ist
- Marktdaten: separater Provider-Layer
- Halal: separater Compliance-Layer
- Research: getrennt von operativen Bestandsdaten

## Offene technische Verifikation
Vor Implementierung neuer Provider-Endpunkte:
- tatsächlichen Parqet-Zugriffsweg und Authentifizierung dokumentieren
- tatsächliche DivvyDiary-API dokumentieren
- Datenfelder und Fehlercodes anhand echter Antworten verifizieren
- erst danach Serverless-Implementierung erstellen

## Konsequenz
AP-ARCH-03 ist architektonisch entschieden: Für Secret-basierte Provider ist eine private Integrationsschicht erforderlich. Welcher Serverless-Provider genutzt wird, bleibt bis zur Providerbewertung offen.
