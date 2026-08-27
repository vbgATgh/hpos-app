#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, json, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/'config'/'market_sources.json'
OUT=ROOT/'data'/'market'
UA='HPOS-PersonalResearch/1.0 (+https://github.com/vbgATgh/hpos-app)'

def nowz(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def load(p): return json.loads(p.read_text(encoding='utf-8'))
def dump(p,o,compact=False):
    p.parent.mkdir(parents=True,exist_ok=True)
    p.write_text(json.dumps(o,ensure_ascii=False,separators=(',',':') if compact else None,indent=None if compact else 2)+'\n',encoding='utf-8')
def req(url):
    r=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/json'})
    with urllib.request.urlopen(r,timeout=20) as x: return json.loads(x.read().decode('utf-8'))
def chart(symbol,range_,interval):
    q=urllib.parse.quote(symbol,safe='')
    url=f'https://query1.finance.yahoo.com/v8/finance/chart/{q}?range={range_}&interval={interval}&events=div%2Csplits&includeAdjustedClose=true'
    data=req(url); result=((data.get('chart') or {}).get('result') or [None])[0]
    if not result: raise RuntimeError((data.get('chart') or {}).get('error') or 'no result')
    ts=result.get('timestamp') or []; quote=((result.get('indicators') or {}).get('quote') or [{}])[0]; close=quote.get('close') or []
    points=[[int(t),round(float(v),6)] for t,v in zip(ts,close) if v is not None]
    meta=result.get('meta') or {}
    return points,meta

def main():
    cfg=load(CFG); generated=nowz(); summary={'schemaVersion':1,'generatedAt':generated,'provider':cfg.get('provider'),'assetIndex':{},'assets':{},'errors':[]}
    ok=0
    for a in cfg.get('assets',[]):
        key=a['assetKey']; summary['assetIndex'][key]={k:a.get(k) for k in ('name','symbol','isin','aliases') if a.get(k) is not None}
        if not a.get('enabled'): continue
        try:
            daily,meta=chart(a['symbol'],cfg.get('historyRange','5y'),cfg.get('historyInterval','1d'))
            try: intraday,_=chart(a['symbol'],cfg.get('intradayRange','1d'),cfg.get('intradayInterval','5m'))
            except Exception: intraday=[]
            if len(daily)<2: raise RuntimeError('too few daily points')
            currency=meta.get('currency') or 'UNKNOWN'; price=meta.get('regularMarketPrice')
            body={'schemaVersion':1,'state':'CURRENT','assetKey':key,'symbol':a['symbol'],'provider':cfg.get('provider'),'asOf':generated,'currency':currency,'regularMarketPrice':price,'daily':daily,'intraday':intraday}
            dump(OUT/f'{key}.json',body,True)
            tail=daily[-30:]
            summary['assets'][key]={'state':'CURRENT','asOf':generated,'currency':currency,'regularMarketPrice':price,'points':len(daily),'intradayPoints':len(intraday),'sparkline':tail}
            ok+=1; print(f'[OK] {key} {a["symbol"]}: {len(daily)} daily / {len(intraday)} intraday')
        except Exception as e:
            summary['assets'][key]={'state':'ERROR','asOf':generated,'error':f'{type(e).__name__}: {e}'}; summary['errors'].append({'assetKey':key,'error':str(e)}); print(f'[ERROR] {key}: {e}')
    summary['state']='CURRENT' if ok and not summary['errors'] else 'STALE' if ok else 'ERROR'; summary['okAssets']=ok
    dump(OUT/'market_summary.json',summary,True)
    return 0 if ok else 1
if __name__=='__main__': raise SystemExit(main())
