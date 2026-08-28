#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
if "1.3.0-alpha.4.5" in t or "ALPHA 4.5" in t:
    print('Neuerer Stand erkannt; Alpha 4.4.2 übersprungen.')
    raise SystemExit(0)
pairs=[
("const APP_VERSION='1.3.0-alpha.4.4.1';","const APP_VERSION='1.3.0-alpha.4.4.2';"),
('ALPHA 4.4.1 · UX + Thesis Intelligence','ALPHA 4.4.2 · Architecture Runtime'),
('<title>HPOS Alpha 4.4.1 · UX + Thesis Intelligence</title>','<title>HPOS Alpha 4.4.2 · Architecture Runtime</title>')]
for old,new in pairs:
    if old in t:
        t=t.replace(old,new,1);changed=True
    elif new not in t:
        if "1.3.0-alpha.4.4.3" in t or "ALPHA 4.4.3" in t:
            print('Neuerer Stand erkannt; Alpha 4.4.2 übersprungen.')
            raise SystemExit(0)
        raise SystemExit(f'Integrationsanker fehlt: {old}')
marker='<script src="./alpha441.js"></script>'
ins=marker+'\n<script src="./alpha442.js"></script>'
if 'alpha442.js' not in t:
    if marker not in t: raise SystemExit('alpha441.js fehlt')
    t=t.replace(marker,ins,1);changed=True
if t.count('alpha442.js')!=1: raise SystemExit('alpha442.js muss exakt einmal geladen werden')
if t.index('alpha441.js')>t.index('alpha442.js'): raise SystemExit('alpha442 muss nach alpha441 laden')
if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.4.2 Architecture Runtime integriert.')
else:
    print('Alpha 4.4.2 bereits korrekt integriert.')
