#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
if not m: raise SystemExit('APP_VERSION nicht gefunden')
version=tuple(int(x or 0) for x in m.groups())
if version>(4,4,1):
    print(f'Neuerer Stand {version} erkannt; Alpha 4.4.1 übersprungen.')
    raise SystemExit(0)
pairs=[
("const APP_VERSION='1.3.0-alpha.4.4';","const APP_VERSION='1.3.0-alpha.4.4.1';"),
('ALPHA 4.4 · Decision Engine','ALPHA 4.4.1 · UX + Thesis Intelligence'),
('<title>HPOS Alpha 4.4 · Decision Engine</title>','<title>HPOS Alpha 4.4.1 · UX + Thesis Intelligence</title>')]
for old,new in pairs:
    if old in t:
        t=t.replace(old,new,1);changed=True
    elif new not in t:
        raise SystemExit(f'Integrationsanker fehlt: {old}')
marker='<script src="./alpha44.js"></script>'
ins=marker+'\n<script src="./alpha441.js"></script>'
if 'alpha441.js' not in t:
    if marker not in t: raise SystemExit('alpha44.js fehlt')
    t=t.replace(marker,ins,1);changed=True
if t.count('alpha441.js')!=1: raise SystemExit('alpha441.js muss exakt einmal geladen werden')
if t.index('alpha44.js')>t.index('alpha441.js'): raise SystemExit('alpha441 muss nach alpha44 laden')
if changed:
    p.write_text(t,encoding='utf-8');print('Alpha 4.4.1 integriert.')
else: print('Alpha 4.4.1 bereits korrekt integriert.')
