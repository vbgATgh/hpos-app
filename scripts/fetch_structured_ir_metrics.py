#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, hashlib, html, json, re, urllib.request
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CFG=ROOT/'config'/'structured_fundamental_sources.json'; OUT=ROOT/'data'/'fundamental'/'evidence.json'
UA='HPOS-PersonalResearch/1.0 (+https://github.com/vbgATgh/hpos-app)'; TIMEOUT=20

def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def text(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml','Accept-Language':'en-US,en;q=0.9'})
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r: raw=r.read().decode('utf-8','ignore')
    raw=re.sub(r'<script\b[^>]*>.*?</script>',' ',raw,flags=re.I|re.S); raw=re.sub(r'<style\b[^>]*>.*?</style>',' ',raw,flags=re.I|re.S)
    return re.sub(r'\s+',' ',html.unescape(re.sub(r'<[^>]+>',' ',raw))).strip()
def num(s): return float(str(s).replace(',','').replace('−','-').replace('–','-'))
def ev_id(asset,metric,period): return 'ev_'+hashlib.sha256(f'STRUCTURED_IR|{asset}|{metric}|{period}'.encode()).hexdigest()[:24]
def add(out,a,metric,category,value,unit,notes,thesis_driver=None):
    out.append({'evidenceId':ev_id(a['assetKey'],metric,a['period']),'assetKey':a['assetKey'],'isin':a.get('isin'),'category':category,'metric':metric,'value':value,'unit':unit,'period':a['period'],'direction':'NEUTRAL','materiality':'S2','sourceTier':'PRIMARY','sourceName':a['sourceName'],'sourceUrl':a['reportUrl'],'publishedAt':a.get('publishedAt'),'observedAt':now(),'thesisDriver':thesis_driver,'falsificationCandidate':False,'corroboration':[],'notes':notes})
def search(pattern,t,flags=re.I):
    m=re.search(pattern,t,flags); return m.groups() if m else None

def frequentis(a,t):
    out=[]
    for metric,cat,pat,driver in [
      ('revenue','REVENUE',r'Revenues?\s*\+?[\d.,]+%?\s*to\s*EUR\s*([\d.,]+)\s*million','structural growth'),
      ('order_intake','ORDER_INTAKE',r'Order intake\s*\+?[\d.,]+%?\s*to\s*EUR\s*([\d.,]+)\s*million','backlog and order intake'),
      ('ebit','EARNINGS',r'EBIT\s+(?:rose\s+to|at)\s*EUR\s*\+?(-?[\d.,]+)\s*million','margin and execution'),
      ('backlog','BACKLOG',r'(?:orders on hand|order backlog|backlog)\s+of\s+EUR\s*([\d.,]+)\s*million','backlog and order intake')]:
        g=search(pat,t)
        if g:add(out,a,metric,cat,num(g[0])*1_000_000,'EUR',f'{metric} parsed from official H1 release',driver)
    return out

def ivu(a,t):
    out=[]
    rules=[
      ('revenue','REVENUE',r'Revenue[^.]{0,120}?to\s*€\s*([\d.,]+)\s*thousand','recurring software revenue'),
      ('gross_profit','MARGIN',r'Gross profit[^.]{0,120}?to\s*€\s*([\d.,]+)\s*thousand','EBIT scalability'),
      ('ebit','EARNINGS',r'(?:operating profit|EBIT)[^€]{0,80}?€\s*([\d.,]+)\s*thousand','EBIT scalability'),
      ('revenue_guidance','GUIDANCE',r'(?:expect|expected|expecting)[^.]{0,100}?revenue\s+of\s+(?:more than|around)\s*€\s*([\d.,]+)\s*million','international scaling'),
      ('ebit_guidance','GUIDANCE',r'(?:EBIT|earnings before interest and taxes)[^.]{0,100}?(?:around|to)\s*€\s*([\d.,]+)\s*million','EBIT scalability')]
    for metric,cat,pat,driver in rules:
        g=search(pat,t)
        if g:
            scale=1_000_000 if 'guidance' in metric else 1_000
            add(out,a,metric,cat,num(g[0])*scale,'EUR',f'{metric} parsed from official half-year report/news',driver)
    return out

def lagercrantz(a,t):
    out=[]
    rules=[
      ('revenue','REVENUE',r'Net revenue increased by\s*[\d.,]+%\s*to MSEK\s*([\d.,]+)','acquisition discipline'),
      ('ebita','EARNINGS',r'Operating profit \(EBITA\) increased by\s*[\d.,]+%\s*to MSEK\s*([\d.,]+)','EBITA margin'),
      ('ebita_margin','MARGIN',r'EBITA margin was\s*([\d.,]+)%','EBITA margin'),
      ('operating_cash_flow','FREE_CASH_FLOW',r'Cash flow from operating activities amounted to MSEK\s*([\d.,]+)','cash conversion')]
    for metric,cat,pat,driver in rules:
        g=search(pat,t)
        if g:
            value=num(g[0]) if metric=='ebita_margin' else num(g[0])*1_000_000
            unit='PCT' if metric=='ebita_margin' else 'SEK'
            add(out,a,metric,cat,value,unit,f'{metric} parsed from official Q1 report',driver)
    return out
PARSERS={'FREQUENTIS':frequentis,'IVU_TRAFFIC':ivu,'LAGERCRANTZ':lagercrantz}

def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8')); old=json.loads(OUT.read_text(encoding='utf-8')) if OUT.exists() else {'schemaVersion':1,'items':[],'adapterStatus':[]}
    rows=[]; status=[]
    for a in cfg['assets']:
        try:
            t=text(a['reportUrl']); got=PARSERS[a['assetKey']](a,t); rows.extend(got)
            status.append({'assetKey':a['assetKey'],'source':'STRUCTURED_IR','ok':True,'items':len(got),'url':a['reportUrl']})
        except Exception as ex:status.append({'assetKey':a['assetKey'],'source':'STRUCTURED_IR','ok':False,'error':str(ex),'url':a['reportUrl']})
    preserved=[x for x in old.get('items',[]) if not str(x.get('evidenceId','')).startswith('ev_') or x.get('sourceName') not in {a['sourceName'] for a in cfg['assets']} or x.get('metric') is None]
    # replace prior structured facts for these exact source/metric combinations; keep generic primary links
    structured_keys={(x['assetKey'],x['metric']) for x in rows}
    preserved=[x for x in preserved if (x.get('assetKey'),x.get('metric')) not in structured_keys]
    old_status=[x for x in old.get('adapterStatus',[]) if x.get('source')!='STRUCTURED_IR']
    payload={'schemaVersion':1,'generatedAt':now(),'items':rows+preserved,'adapterStatus':old_status+status}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Structured IR metrics: {len(rows)} facts from {sum(1 for x in status if x["ok"])} sources')
    return 0 if rows else 1
if __name__=='__main__': raise SystemExit(main())
