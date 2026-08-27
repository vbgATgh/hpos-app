#!/usr/bin/env python3
from pathlib import Path

p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False

# Bekannte Vorversionen bzw. die durch den alten 4.3.1-Patcher erzeugte Fehlversion
# werden exakt auf 4.3.2 normalisiert. Zukünftige Versionen bleiben unangetastet.
for old in (
    "const APP_VERSION='1.3.0-alpha.4.3';",
    "const APP_VERSION='1.3.0-alpha.4.3.1';",
    "const APP_VERSION='1.3.0-alpha.4.3.1.2';",
):
    if old in t:
        t=t.replace(old,"const APP_VERSION='1.3.0-alpha.4.3.2';",1);changed=True
        break

if 'ALPHA 4.3.2 · Halal & News Hardening' not in t:
    for old in ('ALPHA 4.3.1 · Usability','ALPHA 4.3 · Real Portfolio'):
        if old in t:
            t=t.replace(old,'ALPHA 4.3.2 · Halal & News Hardening',1);changed=True
            break

if '<title>HPOS Alpha 4.3.2 · Halal & News Hardening</title>' not in t:
    for old in ('<title>HPOS Alpha 4.3.1 · Usability</title>','<title>HPOS Alpha 4.3 · Real Portfolio</title>','<title>HPOS Alpha 4.3 Real Portfolio</title>'):
        if old in t:
            t=t.replace(old,'<title>HPOS Alpha 4.3.2 · Halal & News Hardening</title>',1);changed=True
            break

if 'alpha432.js' not in t:
    marker='<script src="./alpha431.js"></script>'
    if marker not in t:
        raise SystemExit('alpha431.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha432.js"></script>',1);changed=True

if "const APP_VERSION='1.3.0-alpha.4.3.2';" not in t:
    raise SystemExit('APP_VERSION konnte nicht auf 4.3.2 normalisiert werden')

if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3.2 integriert / Version normalisiert.')
else:
    print('Alpha 4.3.2 bereits korrekt integriert.')
