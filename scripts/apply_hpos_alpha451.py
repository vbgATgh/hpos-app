#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('alpha41/index.html'); t=p.read_text(encoding='utf-8'); changed=False
m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
if not m: raise SystemExit('APP_VERSION fehlt')
version=tuple(int(x or 0) for x in m.groups())
if version < (4,5,1):
    old=m.group(0); t=t.replace(old,"const APP_VERSION='1.3.0-alpha.4.5.1';",1); changed=True
    t=t.replace('ALPHA 4.5 · State & Ledger Foundation','ALPHA 4.5.1 · Tax + Halal Intelligence')
    t=t.replace('<title>HPOS Alpha 4.5 · State & Ledger Foundation</title>','<title>HPOS Alpha 4.5.1 · Tax + Halal Intelligence</title>')
marker='<script src="./alpha45.js"></script>'
ins=marker+'\n<script src="./alpha451.js"></script>'
if 'alpha451.js' not in t:
    if marker not in t: raise SystemExit('alpha45.js fehlt')
    t=t.replace(marker,ins,1); changed=True
if t.count('alpha451.js')!=1: raise SystemExit('alpha451.js muss exakt einmal geladen werden')
if t.index('alpha45.js')>t.index('alpha451.js'): raise SystemExit('alpha451 muss nach alpha45 laden')
if changed: p.write_text(t,encoding='utf-8'); print('Alpha 4.5.1 integriert.')
else: print('Alpha 4.5.1 bereits integriert oder neuer.')
