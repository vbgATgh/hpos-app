#!/usr/bin/env python3
"""Erweitert HPOS Discovery-News um das reale Parqet-Depot.

Reale Depotpositionen werden bei jedem Lauf gesucht. Sub-Euro-Watchlist-Marker
werden in kleinen rotierenden Batches gesucht, damit GitHub Action, Google RSS
und der mobile Feed performant bleiben. Die eigentliche Parser-/Dedupe-Logik
bleibt in fetch_hpos_news.py.
"""
from __future__ import annotations
import datetime as dt
import importlib.util
import json
import math
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'config'/'news_sources.json'
RUNTIME=ROOT/'config'/'news_sources.runtime.json'
SNAP=ROOT/'data'/'portfolio'/'parqet_snapshot.json'
STATUS=ROOT/'data'/'news'/'news_status.json'
MODULE=ROOT/'scripts'/'fetch_hpos_news.py'

def load(path): return json.loads(path.read_text(encoding='utf-8'))
def dump(path,obj): path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
def key(isin): return 'PQ_'+''.join(ch for ch in str(isin or '') if ch.isalnum()).upper()
def quoted(name): return f'"{str(name).replace(chr(34), "").strip()}"'

def expand(config,snapshot,now=None):
    now=now or dt.datetime.now(dt.timezone.utc)
    sync=config.get('parqetSync') or {}
    if not sync.get('enabled',True): return config,{'portfolio':0,'watchlistTotal':0,'watchlistFetched':0}
    assets=[dict(a) for a in config.get('assets',[])]
    by_isin={str(a.get('isin') or '').upper():a for a in assets if a.get('isin')}
    portfolio_added=0
    for h in snapshot.get('holdings',[]):
        isin=str(h.get('isin') or '').upper()
        if not isin: continue
        if isin in by_isin:
            a=by_isin[isin]
            # Reale Position schlägt eine frühere Watchlist-Klassifizierung.
            a['scope']='PORTFOLIO'
            a['enabled']=True
            continue
        a={'assetKey':key(isin),'name':h.get('name') or isin,'isin':isin,
           'aliases':[h.get('name') or isin,isin],'enabled':True,'scope':'PORTFOLIO',
           'queries':[quoted(h.get('name') or isin)],'primaryDomains':[],'generatedFrom':'PARQET_HOLDING'}
        assets.append(a);by_isin[isin]=a;portfolio_added+=1

    dynamic_watch=[]
    for w in sorted(snapshot.get('watchlist',[]),key=lambda x:str(x.get('isin') or '')):
        isin=str(w.get('isin') or '').upper()
        if not isin or isin in by_isin: continue
        dynamic_watch.append(w)
    batch=max(1,int(sync.get('watchlistBatchSize',15)))
    hours=max(1,int(sync.get('watchlistRotationHours',12)))
    if dynamic_watch:
        slot=int(now.timestamp()//(hours*3600))
        start=(slot*batch)%len(dynamic_watch)
        selected={dynamic_watch[(start+i)%len(dynamic_watch)]['isin'] for i in range(min(batch,len(dynamic_watch)))}
    else:selected=set()
    for w in dynamic_watch:
        isin=str(w.get('isin') or '').upper();name=w.get('name') or isin
        assets.append({'assetKey':key(isin),'name':name,'isin':isin,'aliases':[name,isin],
            'enabled':isin in selected,'scope':'WATCHLIST','queries':[quoted(name)],
            'primaryDomains':[],'generatedFrom':'PARQET_WATCHLIST_ROTATION'})
    config=dict(config);config['assets']=assets
    meta={'portfolio':sum(1 for a in assets if a.get('scope')=='PORTFOLIO' and a.get('enabled')),
          'watchlistTotal':sum(1 for a in assets if a.get('scope')=='WATCHLIST'),
          'watchlistFetched':sum(1 for a in assets if a.get('scope')=='WATCHLIST' and a.get('enabled')),
          'portfolioAdded':portfolio_added,'rotationHours':hours,'batchSize':batch}
    return config,meta

def main():
    config=load(BASE);snapshot=load(SNAP)
    runtime,meta=expand(config,snapshot)
    dump(RUNTIME,runtime)
    spec=importlib.util.spec_from_file_location('hpos_news_base',MODULE)
    mod=importlib.util.module_from_spec(spec);sys.modules[spec.name]=mod;spec.loader.exec_module(mod)
    mod.CONFIG_PATH=RUNTIME
    try: rc=mod.main()
    finally:
        try:RUNTIME.unlink()
        except FileNotFoundError:pass
    try:
        st=load(STATUS);st['portfolioAssetsConfigured']=meta['portfolio'];st['watchlistAssetsConfigured']=meta['watchlistTotal'];st['watchlistAssetsFetchedThisRun']=meta['watchlistFetched'];st['watchlistRotationHours']=meta['rotationHours'];st['message']=f"{st.get('message','')} Depot: {meta['portfolio']} Titel vollständig; Watchlist: {meta['watchlistFetched']}/{meta['watchlistTotal']} Titel in diesem Rotationslauf."
        dump(STATUS,st)
    except Exception as exc: print(f'[WARN] Status-Erweiterung: {exc}',file=sys.stderr)
    print(f"[SCOPE] Portfolio {meta['portfolio']} · Watchlist {meta['watchlistFetched']}/{meta['watchlistTotal']}")
    return rc

if __name__=='__main__': raise SystemExit(main())
