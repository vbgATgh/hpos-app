#!/usr/bin/env python3
from pathlib import Path

p=Path(__file__).resolve().parents[1]/'alpha41'/'index.html'
t=p.read_text(encoding='utf-8')
if "1.3.0-alpha.4.1.4" in t and 'news-414.js' in t:
    print('Alpha 4.1.4 bereits integriert; keine Änderung.')
    raise SystemExit(0)

expected="const APP_VERSION='1.3.0-alpha.4.1.3-fix2';"
if expected not in t:
    raise SystemExit('Abbruch: erwarteter Alpha-4.1.3-fix2-Ausgangsstand nicht gefunden.')

t=t.replace('<title>HPOS Alpha 4.1.3-fix1 Safari-Test</title>','<title>HPOS Alpha 4.1.4 Safari-Test</title>',1)
t=t.replace('ALPHA 4.1.3-fix2 · Safari-Test · kein Produktiv-Release','ALPHA 4.1.4 · Safari-Test · News-Automation',1)
t=t.replace(expected,"const APP_VERSION='1.3.0-alpha.4.1.4';",1)
t=t.replace('</body>','<script src="./news-414.js"></script>\n</body>',1)
p.write_text(t,encoding='utf-8')
print('Alpha 4.1.4 News-Erweiterung in alpha41/index.html eingebunden.')
