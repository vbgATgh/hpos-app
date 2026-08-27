#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, json, urllib.parse, urllib.request
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/'config'/'market_sources.json'
OUT=ROOT/'data'/'market'
UA='HPOS-PersonalResearch/1.1 (+https://github.com/vbgATgh/hpos-app)'
FX_API='https://api.frankfurter.dev/v2/rate'

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

def normalize_currency(points, price, currency):
    if currency == 'GBp':
        return [[t,round(v/100.0,6)] for t,v in points], (round(float(price)/100.0,6) if price is not None else None), 'GBP'
    return points, price, currency

def fx_to_eur(currency, cache):
    currency=(currency or '').upper()
    if currency=='EUR': return {'rate':1.0,'date':dt.date.today().isoformat(),'provider':'NATIVE_EUR'}
    if not currency or currency=='UNKNOWN': return None
    if currency in cache: return cache[currency]
    try:
        q=urllib.parse.urlencode({'providers':'ECB'})
        data=req(f'{FX_API}/{urllib.parse.quote(currency,safe="")}/EUR?{q}')
        rate=float(data['rate'])
        out={'rate':rate,'date':data.get('date'),'provider':'FRANKFURTER_ECB'}
        cache[currency]=out
        return out
    except Exception as e:
        print(f'[FX-WARN] {currency}/EUR: {e}')
        cache[currency]=None
        return None

def main():
    cfg=load(CFG); generated=nowz(); summary={'schemaVersion':2,'generatedAt':generated,'provider':cfg.get('provider'),'fxProvider':cfg.get('fxProvider','FRANKFURTER_ECB'),'assetIndex':{},'assets':{},'errors':[]}
    ok=0; fx_cache={}
    for a in cfg.get('assets',[]):
        key=a['assetKey']; summary['assetIndex'][key]={k:a.get(k) for k in ('name','symbol','isin','aliases','note') if a.get(k) is not None}
        if not a.get('enabled'):
            summary['assets'][key]={'state':'DISABLED','asOf':generated,'note':a.get('note') or 'Marktdatenquelle deaktiviert.'}
            continue
        try:
            daily,meta=chart(a['symbol'],cfg.get('historyRange','5y'),cfg.get('historyInterval','1d'))
            try: intraday,_=chart(a['symbol'],cfg.get('intradayRange','1d'),cfg.get('intradayInterval','5m'))
            except Exception: intraday=[]
            if len(daily)<2: raise RuntimeError('too few daily points')
            currency=meta.get('currency') or 'UNKNOWN'; price=meta.get('regularMarketPrice')
            daily,price,currency=normalize_currency(daily,price,currency)
            if intraday:
                intraday,_,_=normalize_currency(intraday,None,meta.get('currency') or 'UNKNOWN')
            fx=fx_to_eur(currency,fx_cache)
            eur_price=round(float(price)*float(fx['rate']),6) if price is not None and fx else None
            body={'schemaVersion':2,'state':'CURRENT','assetKey':key,'symbol':a['symbol'],'provider':cfg.get('provider'),'asOf':generated,'currency':currency,'regularMarketPrice':price,'regularMarketPriceEur':eur_price,'fxToEur':fx['rate'] if fx else None,'fxAsOf':fx.get('date') if fx else None,'fxProvider':fx.get('provider') if fx else None,'daily':daily,'intraday':intraday}
            dump(OUT/f'{key}.json',body,True)
            tail=daily[-30:]
            summary['assets'][key]={'state':'CURRENT','asOf':generated,'currency':currency,'regularMarketPrice':price,'regularMarketPriceEur':eur_price,'fxToEur':fx['rate'] if fx else None,'fxAsOf':fx.get('date') if fx else None,'fxProvider':fx.get('provider') if fx else None,'points':len(daily),'intradayPoints':len(intraday),'sparkline':tail}
            ok+=1; print(f'[OK] {key} {a["symbol"]}: {len(daily)} daily / {len(intraday)} intraday / EUR {eur_price}')
        except Exception as e:
            summary['assets'][key]={'state':'ERROR','asOf':generated,'error':f'{type(e).__name__}: {e}'}; summary['errors'].append({'assetKey':key,'error':str(e)}); print(f'[ERROR] {key}: {e}')
    summary['state']='CURRENT' if ok and not summary['errors'] else 'STALE' if ok else 'ERROR'; summary['okAssets']=ok
    dump(OUT/'market_summary.json',summary,True)
    return 0 if ok else 1
if __name__=='__main__': raise SystemExit(main())
