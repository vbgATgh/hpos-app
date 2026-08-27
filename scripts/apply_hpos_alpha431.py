#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
for old,new in [
    ('ALPHA 4.3 · Real Portfolio','ALPHA 4.3.1 · Usability'),
    ('1.3.0-alpha.4.3','1.3.0-alpha.4.3.1'),
    ('HPOS Alpha 4.3 · Real Portfolio','HPOS Alpha 4.3.1 · Usability')
]:
    if old in t:
        t=t.replace(old,new);changed=True
if 'alpha431.js' not in t:
    marker='<script src="./alpha43.js"></script>'
    if marker not in t:
        raise SystemExit('alpha43.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha431.js"></script>');changed=True
if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3.1 integriert.')
else:
    print('Alpha 4.3.1 bereits integriert.')
