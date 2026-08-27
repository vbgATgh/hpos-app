#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False
repls=[
('HPOS Alpha 4.2.1 Decision UX','HPOS Alpha 4.3 Real Portfolio'),
('1.3.0-alpha.4.2.1.1','1.3.0-alpha.4.3'),
('1.3.0-alpha.4.2.1','1.3.0-alpha.4.3'),
('ALPHA 4.2.1 · Decision UX','ALPHA 4.3 · Real Portfolio')
]
for old,new in repls:
    if old in t:
        t=t.replace(old,new);changed=True
if 'alpha43.js' not in t:
    t=t.replace('</body>','<script src="./alpha43.js"></script>\n</body>');changed=True
if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3 integriert.')
else:
    print('Alpha 4.3 bereits integriert; keine Änderung.')
