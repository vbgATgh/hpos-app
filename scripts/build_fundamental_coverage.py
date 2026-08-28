#!/usr/bin/env python3
from pathlib import Path
import json,re,datetime as dt
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'config'/'asset_sources.json'; FUND_ASSETS=ROOT/'config'/'fundamental_asset_sources.json'; THESIS=ROOT/'data'/'thesis_registry.json'; POLICY=ROOT/'config'/'fundamental_source_policy.json'; OUT=ROOT/'data'/'fundamental'/'coverage.json'
def norm(v): return re.sub(r'[^A-Z0-9]','',str(v or '').upper())
def group(role):
    r=str(role or '').upper()
    if 'HEALTHCARE' in r:return 'healthcare'
    if 'ENGPASS' in r:return 'engpass_alpha'
    if 'COMPOUNDER' in r:return 'compounder'
    if 'ENERGY' in r or 'COMMOD' in r:return 'commodity_energy'
    if 'ETF' in r or 'SUKUK' in r:return 'etf_sukuk'
    return 'industrial_quality'
def load_sources():
    rows=list(json.loads(ASSETS.read_text())['assets'])
    if FUND_ASSETS.exists():rows.extend(json.loads(FUND_ASSETS.read_text())['assets'])
    return rows
def match_source(key,t,assets):
    names=[norm(key)]+[norm(x) for x in t.get('thesis',[])[:1]]
    for a in assets:
        n=norm(a.get('name'))
        if any(k and (k in n or n in k) for k in names):return a
    aliases={'NOVONORDISK':'DK0062498333','ABBOTT':'US0028241000','NOVARTIS':'CH0012005267','CRANEWARE':'GB00B2425G68','RELX':'GB00B2B0DG97','BUREAUVERITAS':'FR0006174348','MEDTRONIC':'IE00BTN1Y115','MERCK':'US58933Y1055'}
    target=aliases.get(norm(key))
    if target:return next((a for a in assets if a.get('isin')==target),None)
    return None
def main():
    assets=load_sources(); reg=json.loads(THESIS.read_text())['assets']; pol=json.loads(POLICY.read_text()); rows=[]
    for key,t in reg.items():
        g=group(t.get('role')); src=match_source(key,t,assets); req=pol['domains'][g]['requiredEvidence']
        rows.append({'assetKey':key,'role':t.get('role'),'evidenceProfile':g,'requiredEvidence':req,'primarySource':None if not src else {'name':src.get('sourceName'),'url':src.get('url'),'domain':src.get('domain'),'registry':src.get('registry'),'automationMode':src.get('automationMode')},'sourceMapped':bool(src)})
    OUT.parent.mkdir(parents=True,exist_ok=True); OUT.write_text(json.dumps({'schemaVersion':1,'generatedAt':dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z'),'assets':rows},ensure_ascii=False,separators=(',',':'))+'\n')
    mapped=sum(x['sourceMapped'] for x in rows);print(f'Fundamental coverage: {mapped}/{len(rows)} registry assets have a mapped primary source')
if __name__=='__main__': main()
