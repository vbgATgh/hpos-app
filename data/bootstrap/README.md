# Bootstrap data

Dieser Ordner darf keine realen Portfolio-, Cash-, Broker-, Token- oder sonstigen privaten Nutzerdaten enthalten.

Die produktive HPOS-App verwendet für echte Bestandsdaten ausschließlich privaten/local-first State oder eine später freigegebene private Integrationsschicht.

Erlaubt sind hier nur:
- anonymisierte Demo-Daten
- Schema-Beispiele
- reproduzierbare Testdaten ohne reale Nutzerwerte

Ein fehlender privater State muss in der App als leerer bzw. noch nicht verbundener Zustand behandelt werden. Es dürfen keine alten realen Fallback-Werte aus dem öffentlichen Repository geladen werden.
