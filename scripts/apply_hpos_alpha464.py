#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('alpha41/index.html');t=p.read_text(encoding='utf-8');changed=False
m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
if not m: raise SystemExit('APP_VERSION fehlt')
version=tuple(int(x or 0) for x in m.groups())
if version < (4,6,4):
    t=t.replace(m.group(0),"const APP_VERSION='1.3.0-alpha.4.6.4';",1);changed=True
    t=t.replace('ALPHA 4.6 · Fundamental Data Adapters','ALPHA 4.6.4 · Interchangeable Assets')
    t=re.sub(r'<title>HPOS Alpha 4\.6(?:\.\d+)? · [^<]+</title>','<title>HPOS Alpha 4.6.4 · Interchangeable Assets</title>',t,count=1)
marker='<script src="./alpha46.js"></script>'
ins=marker+'\n<script src="./alpha464.js"></script>'
if 'alpha464.js' not in t:
    if marker not in t: raise SystemExit('alpha46 marker fehlt')
    t=t.replace(marker,ins,1);changed=True
if t.count('alpha464.js')!=1: raise SystemExit('alpha464.js muss exakt einmal geladen werden')
if t.index('alpha46.js')>t.index('alpha464.js'): raise SystemExit('alpha464 muss nach alpha46 laden')
if changed:p.write_text(t,encoding='utf-8');print('Alpha 4.6.4 integriert.')
else:print('Alpha 4.6.4 bereits integriert oder neuer.')
