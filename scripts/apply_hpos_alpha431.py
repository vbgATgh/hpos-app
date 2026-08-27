#!/usr/bin/env python3
from pathlib import Path

p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False

# Wichtig: Dieser Patcher darf neuere Versionen (z. B. 4.3.2) niemals verändern.
if 'ALPHA 4.3 · Real Portfolio' in t:
    t=t.replace('ALPHA 4.3 · Real Portfolio','ALPHA 4.3.1 · Usability');changed=True

base_version="const APP_VERSION='1.3.0-alpha.4.3';"
v431="const APP_VERSION='1.3.0-alpha.4.3.1';"
if base_version in t:
    t=t.replace(base_version,v431,1);changed=True

if '<title>HPOS Alpha 4.3 · Real Portfolio</title>' in t:
    t=t.replace('<title>HPOS Alpha 4.3 · Real Portfolio</title>','<title>HPOS Alpha 4.3.1 · Usability</title>',1);changed=True

if 'alpha431.js' not in t:
    marker='<script src="./alpha43.js"></script>'
    if marker not in t:
        raise SystemExit('alpha43.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha431.js"></script>',1);changed=True

if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3.1 integriert / Basis sicher normalisiert.')
else:
    print('Alpha 4.3.1 bereits integriert oder neuere Version vorhanden.')
