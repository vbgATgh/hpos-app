#!/usr/bin/env python3
from pathlib import Path
p=Path('alpha41/ux-42-core.js')
t=p.read_text(encoding='utf-8')
old="const pts=series(d,per,a.assetId),svg=svg42(pts,p,a.assetId);"
new="const sameCurrency=String(a.currency||'EUR').toUpperCase()===String(d.currency||'').toUpperCase(),pts=series(d,per,a.assetId),svg=svg42(pts,sameCurrency?p:null,a.assetId);"
if old in t:
    t=t.replace(old,new,1)
old_note="<div class=\"rule-source\">Orange = Ø Einstand · Punkte = Kauf/Verkauf/Dividende · Quelle ${esc(d.provider||'extern')}.</div>"
new_note="<div class=\"rule-source\">${sameCurrency?'Orange = Ø Einstand · ':`Ø Einstand nicht im Chart: Depotwährung ${esc(a.currency||'EUR')} ≠ Kurswährung ${esc(d.currency||'unbekannt')} · `}Punkte = Kauf/Verkauf/Dividende · Quelle ${esc(d.provider||'extern')}.</div>"
if old_note in t:
    t=t.replace(old_note,new_note,1)
if old not in t and new not in t:
    raise SystemExit('Abbruch: erwartete chart42-Stelle nicht gefunden.')
p.write_text(t,encoding='utf-8')
print('Alpha 4.2 Chart-Währungsprüfung aktiv.')
