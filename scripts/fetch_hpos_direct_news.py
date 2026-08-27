#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, email.utils, hashlib, html, json, re, urllib.parse, urllib.request, xml.etree.ElementTree as ET
from html.parser import HTMLParser
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]; FEED=ROOT/'data'/'news'/'news_feed.json'; CFG=ROOT/'config'/'news_sources.json'
UA='HPOS-PersonalResearch/1.0 (+https://github.com/vbgATgh/hpos-app)'; TIMEOUT=10
JNJ_RSS='https://www.jnj.com/rss-feed/all'
RIO_PAGE='https://www.riotinto.com/en/invest'

def znow(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def clean(v): return re.sub(r'\s+',' ',re.sub(r'<[^>]+>',' ',html.unescape(v or ''))).strip()
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'application/rss+xml, text/html, application/xml, text/xml, */*','Accept-Language':'en-US,en;q=0.8'})
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:return r.read()
def pdate(v):
    if not v:return None
    try:
        d=email.utils.parsedate_to_datetime(v);return d if d.tzinfo else d.replace(tzinfo=dt.timezone.utc)
    except Exception:return None
def iso(d):return d.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z') if d else None
def nid(key,title,url):return 'news_'+hashlib.sha256(f'{key}|{title}|{url}'.encode()).hexdigest()[:24]
def rss(payload):
    root=ET.fromstring(payload);out=[]
    for i in root.findall('.//item'):
        out.append((clean(i.findtext('title')),clean(i.findtext('description')),clean(i.findtext('link')),pdate(clean(i.findtext('pubDate')))))
    return out
class Links(HTMLParser):
    def __init__(self):super().__init__();self.href=None;self.buf=[];self.rows=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.href=dict(attrs).get('href');self.buf=[]
    def handle_data(self,data):
        if self.href is not None:self.buf.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href is not None:
            text=clean(' '.join(self.buf));href=self.href
            if text and ('/news/releases/' in href or 'businesswire.com/news/' in href):self.rows.append((text,href))
            self.href=None;self.buf=[]
def rio_rows(payload):
    p=Links();p.feed(payload.decode('utf-8','ignore'));out=[];seen=set()
    for text,href in p.rows:
        title=re.sub(r'^\d{1,2}\s+[A-Za-z]+\s+20\d{2}\s+','',text).strip()
        if len(title)<18:continue
        url=urllib.parse.urljoin(RIO_PAGE,href)
        if url in seen:continue
        seen.add(url);out.append((title,url))
    return out

def main():
    cfg=json.loads(CFG.read_text(encoding='utf-8'));feed=json.loads(FEED.read_text(encoding='utf-8')) if FEED.exists() else {'schemaVersion':1,'items':[],'assetIndex':{}}
    items=list(feed.get('items',[]));new=[];results=[];cutoff=dt.datetime.now(dt.timezone.utc)-dt.timedelta(days=int(cfg.get('lookbackDays',14)))
    try:
        rows=rss(get(JNJ_RSS));n=0
        for title,summary,url,d in rows:
            if d and d<cutoff:continue
            new.append({'newsId':nid('JNJ',title,url),'assetKey':'JNJ','title':title,'source':'Johnson & Johnson','sourceUrl':'https://www.jnj.com/','url':url,'publishedAt':iso(d),'sourceTier':'PRIMARY','primarySource':True,'provider':'JNJ_OFFICIAL_RSS'});n+=1
        results.append({'source':'Johnson & Johnson RSS','ok':True,'items':n});print(f'[OK] JNJ official RSS: {n}')
    except Exception as e:results.append({'source':'Johnson & Johnson RSS','ok':False,'error':str(e)});print(f'[WARN] JNJ RSS: {e}')
    try:
        rows=rio_rows(get(RIO_PAGE));n=0
        for title,url in rows[:20]:
            new.append({'newsId':nid('RIO_TINTO',title,url),'assetKey':'RIO_TINTO','title':title,'source':'Rio Tinto','sourceUrl':RIO_PAGE,'url':url,'publishedAt':None,'sourceTier':'PRIMARY','primarySource':True,'provider':'RIO_TINTO_OFFICIAL'});n+=1
        results.append({'source':'Rio Tinto Invest','ok':True,'items':n});print(f'[OK] Rio Tinto official: {n}')
    except Exception as e:results.append({'source':'Rio Tinto Invest','ok':False,'error':str(e)});print(f'[WARN] Rio Tinto: {e}')
    for x in items:
        if 'sourceTier' not in x:x['sourceTier']='PRIMARY' if x.get('primarySource') else 'DISCOVERY'
    rank={'PRIMARY':0,'PROFESSIONAL':1,'RESEARCH':2,'DISCOVERY':3};merged=new+items;seen=set();out=[]
    merged.sort(key=lambda x:str(x.get('publishedAt') or ''),reverse=True);merged.sort(key=lambda x:rank.get(x.get('sourceTier','DISCOVERY'),9))
    for x in merged:
        key=x.get('url') or (x.get('assetKey'),re.sub(r'\W+','',str(x.get('title','')).lower()))
        if key in seen:continue
        seen.add(key);out.append(x)
    maxn=int(cfg.get('maxStoredItems',250));feed['generatedAt']=znow();feed['count']=min(len(out),maxn);feed['items']=out[:maxn];feed['directSources']=results
    FEED.write_text(json.dumps(feed,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    return 0 if any(r.get('ok') for r in results) else 1
if __name__=='__main__':raise SystemExit(main())
