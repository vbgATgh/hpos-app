#!/usr/bin/env python3
import re
from pathlib import Path

p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False

# Bekannte Vorversionen bzw. die durch den alten 4.3.1-Patcher erzeugte Fehlversion
# werden exakt auf 4.3.2 normalisiert. Neuere Versionen dürfen niemals zurückgestuft
# werden; 4.3.2 muss in der Patcherkette deshalb forward-idempotent sein.
for old in (
    "const APP_VERSION='1.3.0-alpha.4.3';",
    "const APP_VERSION='1.3.0-alpha.4.3.1';",
    "const APP_VERSION='1.3.0-alpha.4.3.1.2';",
):
    if old in t:
        t=t.replace(old,"const APP_VERSION='1.3.0-alpha.4.3.2';",1);changed=True
        break

m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
if not m:
    raise SystemExit('APP_VERSION konnte nicht gelesen werden')
version=tuple(int(x or 0) for x in m.groups())
if version < (4,3,2):
    raise SystemExit(f'APP_VERSION {version} liegt unter 4.3.2 und konnte nicht sicher normalisiert werden')
newer=version > (4,3,2)

# Badge/Titel nur auf der Zielversion normalisieren. Bei neueren Alpha-Versionen bleiben
# deren eigene Kennzeichnung und Semantik unangetastet.
if not newer and 'ALPHA 4.3.2 · Halal & News Hardening' not in t:
    for old in ('ALPHA 4.3.1 · Usability','ALPHA 4.3 · Real Portfolio'):
        if old in t:
            t=t.replace(old,'ALPHA 4.3.2 · Halal & News Hardening',1);changed=True
            break

if not newer and '<title>HPOS Alpha 4.3.2 · Halal & News Hardening</title>' not in t:
    for old in ('<title>HPOS Alpha 4.3.1 · Usability</title>','<title>HPOS Alpha 4.3 · Real Portfolio</title>','<title>HPOS Alpha 4.3 Real Portfolio</title>'):
        if old in t:
            t=t.replace(old,'<title>HPOS Alpha 4.3.2 · Halal & News Hardening</title>',1);changed=True
            break

if 'alpha432.js' not in t:
    marker='<script src="./alpha431.js"></script>'
    if marker not in t:
        raise SystemExit('alpha431.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha432.js"></script>',1);changed=True

if not newer and "const APP_VERSION='1.3.0-alpha.4.3.2';" not in t:
    raise SystemExit('APP_VERSION konnte nicht auf 4.3.2 normalisiert werden')

if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3.2 integriert / Version normalisiert.')
elif newer:
    print(f'Alpha 4.3.2 bereits enthalten; neuere Version {version} bleibt unangetastet.')
else:
    print('Alpha 4.3.2 bereits korrekt integriert.')
