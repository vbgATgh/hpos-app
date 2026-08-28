#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, hashlib, json, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/'config'/'fundamental_adapters.json'; OUT=ROOT/'data'/'fundamental'/'evidence.json'

def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def eid(asset,metric,end,form): return 'ev_'+hashlib.sha256(f'{asset}|{metric}|{end}|{form}'.encode()).hexdigest()[:24]
def load_url(url,ua):
    req=urllib.request.Request(url,headers={'User-Agent':ua,'Accept-Encoding':'identity','Accept':'application/json'})
    with urllib.request.urlopen(req,timeout=20) as r: return json.loads(r.read().decode('utf-8'))

def latest_fact(companyfacts,metric,forms):
    facts=companyfacts.get('facts',{}).get('us-gaap',{})
    for concept in metric['concepts']:
        f=facts.get(concept)
        if not f: continue
        units=f.get('units',{})
        candidates=[]
        for unit in metric.get('units',[]):
            for x in units.get(unit,[]):
                if x.get('form') not in forms: continue
                if x.get('val') is None: continue
                candidates.append((x.get('filed') or '',x.get('end') or '',x.get('fy') or 0,x.get('fp') or '',unit,concept,x))
        if candidates:
            candidates.sort(reverse=True,key=lambda z:(z[0],z[1],z[2],z[3]))
            unit,concept,x=candidates[0][4],candidates[0][5],candidates[0][6]
            return {'concept':concept,'unit':unit,**x}
    return None

def direction(metric,val):
    # Raw fundamentals are evidence, not automatic sentiment. Direction remains neutral until thesis logic compares periods/targets.
    return 'NEUTRAL'

def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8')); sec=cfg['sec']; forms=set(sec['forms']); items=[]; status=[]
    for a in sec['assets']:
        url=sec['baseUrl'].format(cik=a['cik'])
        try:
            data=load_url(url,sec['userAgent']); n=0
            for m in sec['metrics']:
                x=latest_fact(data,m,forms)
                if not x: continue
                end=x.get('end') or x.get('filed') or now()
                items.append({
                    'evidenceId':eid(a['assetKey'],m['metric'],end,x.get('form')),
                    'assetKey':a['assetKey'],'isin':a.get('isin'),'category':m['category'],'metric':m['metric'],
                    'value':x.get('val'),'unit':x.get('unit'),'period':x.get('fp') or x.get('fy'),
                    'direction':direction(m,x.get('val')),'materiality':'S2','sourceTier':'REGULATOR','sourceName':'SEC EDGAR Companyfacts',
                    'sourceUrl':url,'publishedAt':x.get('filed'),'observedAt':now(),'thesisDriver':None,
                    'falsificationCandidate':False,'corroboration':[],
                    'notes':f"SEC {x.get('form')} · {x.get('concept')} · period end {x.get('end')}"
                }); n+=1
            status.append({'assetKey':a['assetKey'],'source':'SEC','ok':True,'items':n})
        except Exception as ex:
            status.append({'assetKey':a['assetKey'],'source':'SEC','ok':False,'error':str(ex)})
    OUT.parent.mkdir(parents=True,exist_ok=True)
    old={}
    if OUT.exists():
        try: old=json.loads(OUT.read_text(encoding='utf-8'))
        except Exception: old={}
    # SEC adapter is snapshot-like for its own evidence IDs; preserve non-SEC items from future adapters.
    preserved=[x for x in old.get('items',[]) if x.get('sourceName')!='SEC EDGAR Companyfacts']
    payload={'schemaVersion':1,'generatedAt':now(),'items':items+preserved,'adapterStatus':status}
    OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    ok=sum(1 for x in status if x.get('ok'))
    print(f'SEC fundamental evidence: {len(items)} items / {ok} assets ok')
    return 0 if ok else 1
if __name__=='__main__': raise SystemExit(main())
