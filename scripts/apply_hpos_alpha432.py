#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
if 'ALPHA 4.3.2 · Halal & News Hardening' not in t:
    if 'ALPHA 4.3.1 · Usability' not in t: raise SystemExit('Alpha 4.3.1 Basis fehlt')
    t=t.replace('ALPHA 4.3.1 · Usability','ALPHA 4.3.2 · Halal & News Hardening');changed=True
if '1.3.0-alpha.4.3.2' not in t:
    if '1.3.0-alpha.4.3.1' not in t: raise SystemExit('4.3.1 Versionsbasis fehlt')
    t=t.replace('1.3.0-alpha.4.3.1','1.3.0-alpha.4.3.2');changed=True
if 'HPOS Alpha 4.3.2 · Halal & News Hardening' not in t:
    t=t.replace('HPOS Alpha 4.3.1 · Usability','HPOS Alpha 4.3.2 · Halal & News Hardening');changed=True
if 'alpha432.js' not in t:
    marker='<script src="./alpha431.js"></script>'
    if marker not in t: raise SystemExit('alpha431.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha432.js"></script>');changed=True
if changed:
    p.write_text(t,encoding='utf-8');print('Alpha 4.3.2 integriert.')
else: print('Alpha 4.3.2 bereits integriert.')
