#!/usr/bin/env python3
"""Remove obsolete personal portfolio assertions/text from legacy Alpha 4.3 source.

Alpha 4.3 remains as a UI layer for backwards compatibility. From Alpha 4.3.3
its data source is the local-browser projection shim, so public source must not
encode old personal broker mappings or exact private activity counts.
"""
from pathlib import Path

P=Path('alpha41/alpha43.js')
t=P.read_text(encoding='utf-8')
replacements={
    "brokerRule:'Cardinal Energy + Savaria = Trade Republic; übrige reale Positionen = Scalable; <1 € = Watchlist'": "brokerRule:'Lokale Brokerzuordnung; nicht im öffentlichen Code gespeichert.'",
    "Die vollständigen 343 Parqet-Aktivitäten bleiben Quelle für Reconciliation, sind in Alpha 4.3 aber noch nicht vollständig als lokales Journal gespiegelt.": "Eine gegebenenfalls umfangreichere externe Aktivitätshistorie ist nicht vollständig als lokales Journal gespiegelt.",
}
changed=False
for old,new in replacements.items():
    if old in t:
        t=t.replace(old,new)
        changed=True

for forbidden in ('Cardinal Energy + Savaria = Trade Republic','343 Parqet-Aktivitäten'):
    if forbidden in t:
        raise SystemExit(f'Private Legacy-Markierung blieb erhalten: {forbidden}')

if changed:
    P.write_text(t,encoding='utf-8')
    print('Alpha 4.3 Legacy-Privacy bereinigt.')
else:
    print('Alpha 4.3 Legacy-Privacy bereits bereinigt.')
