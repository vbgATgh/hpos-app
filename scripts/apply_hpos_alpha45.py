#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
pairs=[
("const APP_VERSION='1.3.0-alpha.4.4.2';","const APP_VERSION='1.3.0-alpha.4.5';"),
('ALPHA 4.4.2 · Architecture Runtime','ALPHA 4.5 · State & Ledger Foundation'),
('<title>HPOS Alpha 4.4.2 · Architecture Runtime</title>','<title>HPOS Alpha 4.5 · State & Ledger Foundation</title>')]
for old,new in pairs:
    if old in t:
        t=t.replace(old,new,1);changed=True
    elif new not in t:
        if "1.3.0-alpha.4.5" in t or "ALPHA 4.5" in t:
            continue
        raise SystemExit(f'Integrationsanker fehlt: {old}')
marker='<script src="./alpha442.js"></script>'
ins=marker+'\n<script src="./alpha45.js"></script>'
if 'alpha45.js' not in t:
    if marker not in t: raise SystemExit('alpha442.js fehlt')
    t=t.replace(marker,ins,1);changed=True
if t.count('alpha45.js')!=1: raise SystemExit('alpha45.js muss exakt einmal geladen werden')
if t.index('alpha442.js')>t.index('alpha45.js'): raise SystemExit('alpha45 muss nach alpha442 laden')
if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.5 State & Ledger Foundation integriert.')
else:
    print('Alpha 4.5 bereits korrekt integriert.')
