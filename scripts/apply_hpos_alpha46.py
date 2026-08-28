#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('alpha41/index.html'); t=p.read_text(encoding='utf-8'); changed=False
m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
if not m: raise SystemExit('APP_VERSION fehlt')
version=tuple(int(x or 0) for x in m.groups())
if version < (4,6,0):
    t=t.replace(m.group(0),"const APP_VERSION='1.3.0-alpha.4.6';",1); changed=True
    t=t.replace('ALPHA 4.5.1 · Tax + Halal Intelligence','ALPHA 4.6 · Fundamental Data Adapters')
    t=t.replace('ALPHA 4.5 · State & Ledger Foundation','ALPHA 4.6 · Fundamental Data Adapters')
    t=re.sub(r'<title>HPOS Alpha 4\.5(?:\.1)? · [^<]+</title>','<title>HPOS Alpha 4.6 · Fundamental Data Adapters</title>',t,count=1)
marker='<script src="./alpha451.js"></script>' if '<script src="./alpha451.js"></script>' in t else '<script src="./alpha45.js"></script>'
ins=marker+'\n<script src="./alpha46.js"></script>'
if 'alpha46.js' not in t:
    if marker not in t: raise SystemExit('alpha45/alpha451 marker fehlt')
    t=t.replace(marker,ins,1); changed=True
if t.count('alpha46.js')!=1: raise SystemExit('alpha46.js muss exakt einmal geladen werden')
if 'alpha451.js' in t and t.index('alpha451.js')>t.index('alpha46.js'): raise SystemExit('alpha46 muss nach alpha451 laden')
if changed: p.write_text(t,encoding='utf-8'); print('Alpha 4.6 integriert.')
else: print('Alpha 4.6 bereits integriert oder neuer.')
