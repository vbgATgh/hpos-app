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
def num(s): return float(str(s).replace(',','').replace('−','-').replace('–','-').replace('+',''))
def ev_id(asset,metric,period): return 'ev_'+hashlib.sha256(f'STRUCTURED_IR|{asset}|{metric}|{period}'.encode()).hexdigest()[:24]
def add(out,a,metric,category,value,unit,notes,thesis_driver=None,change_pct=None):
    row={'evidenceId':ev_id(a['assetKey'],metric,a['period']),'assetKey':a['assetKey'],'isin':a.get('isin'),'category':category,'metric':metric,'value':value,'unit':unit,'period':a['period'],'direction':'NEUTRAL','materiality':'S2','sourceTier':'PRIMARY','sourceName':a['sourceName'],'sourceUrl':a['reportUrl'],'publishedAt':a.get('publishedAt'),'observedAt':now(),'thesisDriver':thesis_driver,'falsificationCandidate':False,'corroboration':[],'notes':notes}
    if change_pct is not None: row['changePct']=change_pct
    out.append(row)
def search(pattern,t,flags=re.I):
    m=re.search(pattern,t,flags); return m.groups() if m else None

def frequentis(a,t):
    out=[]
    rules=[
      ('revenue','REVENUE',r'Revenues?\s*([+\-]?[\d.,]+)%?\s*to\s*EUR\s*([\d.,]+)\s*million','structural growth'),
      ('order_intake','ORDER_INTAKE',r'Order intake\s*([+\-]?[\d.,]+)%?\s*to\s*EUR\s*([\d.,]+)\s*million','backlog and order intake')]
    for metric,cat,pat,driver in rules:
        g=search(pat,t)
        if g:add(out,a,metric,cat,num(g[1])*1_000_000,'EUR',f'{metric} parsed from official H1 release',driver,num(g[0]))
    g=search(r'EBIT\s*([+\-]?[\d.,]+)%?\s*(?:to|at)\s*EUR\s*([+\-]?[\d.,]+)\s*million',t)
    if g:add(out,a,'ebit','EARNINGS',num(g[1])*1_000_000,'EUR','ebit parsed from official H1 release','margin and execution',num(g[0]))
    else:
        g=search(r'EBIT\s+(?:rose\s+to|at)\s*EUR\s*\+?(-?[\d.,]+)\s*million',t)
        if g:add(out,a,'ebit','EARNINGS',num(g[0])*1_000_000,'EUR','ebit parsed from official H1 release','margin and execution')
    g=search(r'(?:orders on hand|order backlog|backlog)\s+of\s+EUR\s*([\d.,]+)\s*million',t)
    if g:add(out,a,'backlog','BACKLOG',num(g[0])*1_000_000,'EUR','backlog parsed from official H1 release','backlog and order intake')
    return out

def _ivu_metric(out,a,t,metric,category,label,driver):
    explicit=search(rf'{label}.{{0,120}}?(?:rose|increased|grew)\s+by\s+([+\-]?[\d.,]+)%\s+to\s*€\s*([\d.,]+)\s*thousand',t)
    if explicit:
        add(out,a,metric,category,num(explicit[1])*1_000,'EUR',f'{metric} parsed from official half-year report/news',driver,num(explicit[0]));return
    fallback=search(rf'{label}.{{0,180}}?to\s*€\s*([\d.,]+)\s*thousand',t)
    if fallback:add(out,a,metric,category,num(fallback[0])*1_000,'EUR',f'{metric} parsed from official half-year report/news',driver)

def ivu(a,t):
    out=[]
    _ivu_metric(out,a,t,'revenue','REVENUE','Revenue','recurring software revenue')
    _ivu_metric(out,a,t,'gross_profit','MARGIN','Gross profit','EBIT scalability')
    g=search(r'operating profit(?:\s+(?:rose|increased|grew)\s+by\s+([+\-]?[\d.,]+)%)?.{0,180}?€\s*([\d.,]+)\s*thousand',t)
    if g:add(out,a,'ebit','EARNINGS',num(g[1])*1_000,'EUR','ebit parsed from official half-year report/news','EBIT scalability',num(g[0]) if g[0] else None)
    else:
        g=search(r'At\s*€\s*([\d.,]+)\s*thousand.{0,180}?operating profit',t)
        if g:add(out,a,'ebit','EARNINGS',num(g[0])*1_000,'EUR','ebit parsed from official half-year report/news','EBIT scalability')
    g=search(r'expect.{0,180}?revenue\s+of\s+(?:more than|around)\s*€\s*([\d.,]+)\s*million',t)
    if g:add(out,a,'revenue_guidance','GUIDANCE',num(g[0])*1_000_000,'EUR','revenue guidance parsed from official half-year report/news','international scaling')
    g=search(r'(?:earnings before interest and taxes|EBIT).{0,260}?to\s+around\s*€\s*([\d.,]+)\s*million',t)
    if g:add(out,a,'ebit_guidance','GUIDANCE',num(g[0])*1_000_000,'EUR','EBIT guidance parsed from official half-year report/news','EBIT scalability')
    return out

def lagercrantz(a,t):
    out=[]
    rules=[
      ('revenue','REVENUE',r'Net revenue increased by\s*([\d.,]+)%\s*to MSEK\s*([\d.,]+)','acquisition discipline'),
      ('ebita','EARNINGS',r'Operating profit \(EBITA\) increased by\s*([\d.,]+)%\s*to MSEK\s*([\d.,]+)','EBITA margin')]
    for metric,cat,pat,driver in rules:
        g=search(pat,t)
        if g:add(out,a,metric,cat,num(g[1])*1_000_000,'SEK',f'{metric} parsed from official Q1 report',driver,num(g[0]))
    g=search(r'EBITA margin was\s*([\d.,]+)%',t)
    if g:add(out,a,'ebita_margin','MARGIN',num(g[0]),'PCT','ebita_margin parsed from official Q1 report','EBITA margin')
    g=search(r'Cash flow from operating activities amounted to MSEK\s*([\d.,]+)',t)
    if g:add(out,a,'operating_cash_flow','FREE_CASH_FLOW',num(g[0])*1_000_000,'SEK','operating_cash_flow parsed from official Q1 report','cash conversion')
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
    structured_keys={(x['assetKey'],x['metric']) for x in rows}
    preserved=[x for x in old.get('items',[]) if (x.get('assetKey'),x.get('metric')) not in structured_keys]
    old_status=[x for x in old.get('adapterStatus',[]) if x.get('source')!='STRUCTURED_IR']
    payload={'schemaVersion':1,'generatedAt':now(),'items':rows+preserved,'adapterStatus':old_status+status}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Structured IR metrics: {len(rows)} facts from {sum(1 for x in status if x["ok"])} sources')
    return 0 if rows else 1
if __name__=='__main__': raise SystemExit(main())
