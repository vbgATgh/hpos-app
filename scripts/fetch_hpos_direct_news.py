#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, email.utils, hashlib, html, json, re, urllib.request, xml.etree.ElementTree as ET
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; FEED=ROOT/'data'/'news'/'news_feed.json'; CFG=ROOT/'config'/'news_sources.json'
UA='HPOS-PersonalResearch/1.0 (+https://github.com/vbgATgh/hpos-app)'
NASDAQ=[('Nasdaq Stocks','https://www.nasdaq.com/feed/rssoutbound?category=Stocks'),('Nasdaq Earnings','https://www.nasdaq.com/feed/rssoutbound?category=Earnings'),('Nasdaq ETFs','https://www.nasdaq.com/feed/rssoutbound?category=ETFs')]
SEC_JNJ='https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=0000200406&owner=include&count=40&output=atom'

def znow(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def clean(v): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(v or ''))).strip()
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/rss+xml, application/atom+xml, application/xml, text/xml, */*'})
    with urllib.request.urlopen(req,timeout=25) as r:return r.read()
def parse_date(v):
    if not v:return None
    try:
        d=email.utils.parsedate_to_datetime(v); return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except Exception:
        try:return dt.datetime.fromisoformat(v.replace('Z','+00:00'))
        except Exception:return None
def is_match(text,a):
    t=' '+re.sub(r'[^A-Z0-9]+',' ',text.upper())+' '
    vals=[a.get('name'),a.get('ticker'),a.get('isin'),*(a.get('aliases') or [])]
    for v in vals:
        if not v:continue
        n=re.sub(r'[^A-Z0-9]+',' ',str(v).upper()).strip()
        if len(n)>=3 and (' '+n+' ') in t:return True
    return False
def nid(key,title,url):return 'news_'+hashlib.sha256(f'{key}|{title}|{url}'.encode()).hexdigest()[:24]
def rss_items(payload):
    root=ET.fromstring(payload); out=[]
    for item in root.findall('.//item'):
        out.append((clean(item.findtext('title')),clean(item.findtext('description')),clean(item.findtext('link')),parse_date(clean(item.findtext('pubDate')))))
    return out
def atom_items(payload):
    root=ET.fromstring(payload); ns={'a':'http://www.w3.org/2005/Atom'}; out=[]
    for e in root.findall('.//a:entry',ns):
        title=clean(e.findtext('a:title','',ns)); summary=clean(e.findtext('a:summary','',ns)); link=e.find('a:link',ns); url=link.attrib.get('href','') if link is not None else ''; d=parse_date(clean(e.findtext('a:updated','',ns) or e.findtext('a:published','',ns))); out.append((title,summary,url,d))
    return out
def iso(d):return d.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z') if d else None

def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8')); assets=[a for a in cfg.get('assets',[]) if a.get('enabled')]
    feed=json.loads(FEED.read_text(encoding='utf-8')) if FEED.exists() else {'schemaVersion':1,'items':[],'assetIndex':{}}
    items=list(feed.get('items',[])); results=[]; new=[]; cutoff=dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=int(cfg.get('lookbackDays',14)))
    for label,url in NASDAQ:
        try:
            rows=rss_items(get(url)); matched=0
            for title,summary,link,d in rows:
                if d and d<cutoff:continue
                for a in assets:
                    if is_match(title+' '+summary,a):
                        new.append({'newsId':nid(a['assetKey'],title,link),'assetKey':a['assetKey'],'title':title,'source':'Nasdaq','sourceUrl':'https://www.nasdaq.com/','url':link,'publishedAt':iso(d),'sourceTier':'PROFESSIONAL','provider':'NASDAQ_RSS'}); matched+=1; break
            results.append({'source':label,'ok':True,'items':matched})
            print(f'[OK] {label}: {matched}')
        except Exception as e: results.append({'source':label,'ok':False,'error':str(e)}); print(f'[WARN] {label}: {e}')
    try:
        rows=atom_items(get(SEC_JNJ)); matched=0
        for title,summary,link,d in rows:
            if d and d<cutoff:continue
            new.append({'newsId':nid('JNJ',title,link),'assetKey':'JNJ','title':title,'source':'SEC EDGAR','sourceUrl':'https://www.sec.gov/edgar','url':link,'publishedAt':iso(d),'sourceTier':'PRIMARY','primarySource':True,'provider':'SEC_EDGAR_ATOM'}); matched+=1
        results.append({'source':'SEC EDGAR · JNJ','ok':True,'items':matched}); print(f'[OK] SEC JNJ: {matched}')
    except Exception as e: results.append({'source':'SEC EDGAR · JNJ','ok':False,'error':str(e)}); print(f'[WARN] SEC JNJ: {e}')
    rank={'PRIMARY':0,'PROFESSIONAL':1,'RESEARCH':2,'DISCOVERY':3}
    for x in items:
        if 'sourceTier' not in x:x['sourceTier']='PRIMARY' if x.get('primarySource') else 'DISCOVERY'
    merged=new+items; seen=set(); out=[]
    merged.sort(key=lambda x:(str(x.get('publishedAt') or ''),-rank.get(x.get('sourceTier','DISCOVERY'),9)),reverse=True)
    for x in merged:
        key=x.get('url') or (x.get('assetKey'),re.sub(r'\W+','',str(x.get('title','')).lower()))
        if key in seen:continue
        seen.add(key);out.append(x)
    feed['generatedAt']=znow();feed['count']=min(len(out),int(cfg.get('maxStoredItems',250)));feed['items']=out[:int(cfg.get('maxStoredItems',250))];feed['directSources']=results
    FEED.write_text(json.dumps(feed,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    ok=sum(1 for r in results if r.get('ok'));return 0 if ok else 1
if __name__=='__main__':raise SystemExit(main())
