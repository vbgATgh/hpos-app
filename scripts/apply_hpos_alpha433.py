#!/usr/bin/env python3
from pathlib import Path

p=Path('alpha41/index.html')
t=p.read_text(encoding='utf-8')
changed=False

# Alpha 4.3.3 darf nur die bekannte direkte Vorversion anheben.
old="const APP_VERSION='1.3.0-alpha.4.3.2';"
new="const APP_VERSION='1.3.0-alpha.4.3.3';"
if old in t:
    t=t.replace(old,new,1);changed=True
elif new not in t:
    raise SystemExit('APP_VERSION ist weder 4.3.2 noch 4.3.3; Abbruch statt Versionskette zu beschädigen')

old_badge='ALPHA 4.3.2 · Halal & News Hardening'
new_badge='ALPHA 4.3.3 · Privacy Boundary'
if old_badge in t:
    t=t.replace(old_badge,new_badge,1);changed=True
elif new_badge not in t:
    raise SystemExit('Alpha-Badge konnte nicht sicher auf 4.3.3 angehoben werden')

old_title='<title>HPOS Alpha 4.3.2 · Halal & News Hardening</title>'
new_title='<title>HPOS Alpha 4.3.3 · Privacy Boundary</title>'
if old_title in t:
    t=t.replace(old_title,new_title,1);changed=True
elif new_title not in t:
    raise SystemExit('HTML-Titel konnte nicht sicher auf 4.3.3 angehoben werden')

# Legacy Alpha 4.3 erwartet historisch einen öffentlichen Parqet-Snapshot. Ab 4.3.3
# wird dieser Request VOR alpha43.js lokal aus dem Browser-State beantwortet.
shim='<script src="./privacy-local43-shim.js"></script>'
alpha43='<script src="./alpha43.js"></script>'
if shim not in t:
    if alpha43 not in t:
        raise SystemExit('alpha43.js Integration fehlt')
    t=t.replace(alpha43,shim+'\n'+alpha43,1);changed=True

if 'alpha433.js' not in t:
    marker='<script src="./alpha432.js"></script>'
    if marker not in t:
        raise SystemExit('alpha432.js Integration fehlt')
    t=t.replace(marker,marker+'\n<script src="./alpha433.js"></script>',1);changed=True

if new not in t:
    raise SystemExit('APP_VERSION konnte nicht auf 4.3.3 normalisiert werden')
if t.count('alpha433.js')!=1:
    raise SystemExit('alpha433.js muss exakt einmal eingebunden sein')
if t.count('privacy-local43-shim.js')!=1:
    raise SystemExit('privacy-local43-shim.js muss exakt einmal eingebunden sein')
if t.index('privacy-local43-shim.js')>t.index('alpha43.js'):
    raise SystemExit('Privacy-Shim muss vor alpha43.js geladen werden')

if changed:
    p.write_text(t,encoding='utf-8')
    print('Alpha 4.3.3 Privacy Boundary inklusive Local-Projection-Shim integriert.')
else:
    print('Alpha 4.3.3 bereits korrekt integriert.')
