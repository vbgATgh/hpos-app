#!/usr/bin/env python3
from pathlib import Path
import re
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
old="const APP_VERSION='1.3.0-alpha.4.3.3';"
new="const APP_VERSION='1.3.0-alpha.4.4';"
if old in t:
    t=t.replace(old,new,1);changed=True
elif new not in t:
    m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.([0-9.]+)';",t)
    raise SystemExit(f'Unerwartete APP_VERSION: {m.group(1) if m else "nicht gefunden"}')
if 'ALPHA 4.4 · Decision Engine' not in t:
    if 'ALPHA 4.3.3 · Privacy Boundary' not in t: raise SystemExit('4.3.3 Badge fehlt')
    t=t.replace('ALPHA 4.3.3 · Privacy Boundary','ALPHA 4.4 · Decision Engine',1);changed=True
if '<title>HPOS Alpha 4.4 · Decision Engine</title>' not in t:
    if '<title>HPOS Alpha 4.3.3 · Privacy Boundary</title>' not in t: raise SystemExit('4.3.3 Title fehlt')
    t=t.replace('<title>HPOS Alpha 4.3.3 · Privacy Boundary</title>','<title>HPOS Alpha 4.4 · Decision Engine</title>',1);changed=True
if 'alpha44.js' not in t:
    marker='<script src="./alpha433.js"></script>'
    if marker not in t: raise SystemExit('alpha433.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha44.js"></script>',1);changed=True
if changed:
    p.write_text(t,encoding='utf-8');print('Alpha 4.4 integriert.')
else: print('Alpha 4.4 bereits integriert.')
