#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/index.html');t=p.read_text(encoding='utf-8')
changed=False
for old,new in [
    ('HPOS Alpha 4.1.4 Safari-Test','HPOS Alpha 4.2.1 Decision UX'),
    ('HPOS Alpha 4.2 UX & Analytics','HPOS Alpha 4.2.1 Decision UX'),
    ('1.3.0-alpha.4.1.4','1.3.0-alpha.4.2.1'),
    ('1.3.0-alpha.4.2','1.3.0-alpha.4.2.1'),
    ('ALPHA 4.1.4 · Safari-Test · News-Automation','ALPHA 4.2.1 · Decision UX'),
    ('ALPHA 4.2 · UX & Analytics','ALPHA 4.2.1 · Decision UX')
]:
    if old in t:t=t.replace(old,new);changed=True
base='<script src="./ux-42-core.js"></script>\n<script src="./news-42.js"></script>\n'
if 'ux-42-core.js' not in t:
    t=t.replace('</body>',base+'</body>');changed=True
if 'ux-421.js' not in t:
    t=t.replace('</body>','<script src="./ux-421.js"></script>\n</body>');changed=True
if changed:
    p.write_text(t,encoding='utf-8');print('Alpha 4.2.1 integriert.')
else: print('Alpha 4.2.1 bereits integriert; keine Änderung.')
