#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, hashlib, html, json, re, urllib.parse, urllib.request
from html.parser import HTMLParser
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
ASSETS=ROOT/'config'/'asset_sources.json'; OUT=ROOT/'data'/'fundamental'/'evidence.json'
UA='HPOS-PersonalResearch/1.0 (+https://github.com/vbgATgh/hpos-app)'; TIMEOUT=15
KEYWORDS=('results','earnings','quarter','annual report','interim','trading update','guidance','dividend','financial results','full year','half year','q1','q2','q3','q4')

def now():return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def clean(v):return re.sub(r'\s+',' ',html.unescape(v or '')).strip()
def eid(asset,title,url):return 'ev_'+hashlib.sha256(f'IR|{asset}|{title}|{url}'.encode()).hexdigest()[:24]
def category(title):
    t=title.lower()
    if 'dividend' in t:return 'DIVIDEND'
    if 'guidance' in t:return 'GUIDANCE'
    if any(k in t for k in ('results','earnings','quarter','annual report','interim','full year','half year','q1','q2','q3','q4')):return 'EARNINGS'
    return 'OTHER'
class P(HTMLParser):
    def __init__(self):super().__init__();self.href=None;self.buf=[];self.rows=[]
    def handle_starttag(self,tag,attrs):
        if tag=='a':self.href=dict(attrs).get('href');self.buf=[]
    def handle_data(self,data):
        if self.href is not None:self.buf.append(data)
    def handle_endtag(self,tag):
        if tag=='a' and self.href is not None:
            text=clean(' '.join(self.buf));href=self.href
            if text and href:self.rows.append((text,href))
            self.href=None;self.buf=[]
def get(url):
    req=urllib.request.Request(url,headers={'User-Agent':UA,'Accept':'text/html,application/xhtml+xml','Accept-Language':'en-US,en;q=0.8'})
    with urllib.request.urlopen(req,timeout=TIMEOUT) as r:return r.read().decode('utf-8','ignore')
def main():
    assets=json.loads(ASSETS.read_text(encoding='utf-8'))['assets']; old={}
    if OUT.exists():
        try:old=json.loads(OUT.read_text(encoding='utf-8'))
        except:old={}
    existing={x.get('evidenceId'):x for x in old.get('items',[])}; new=[];status=[];seen=set()
    for a in assets:
        key=re.sub(r'[^A-Z0-9]','_',str(a.get('name') or a.get('isin')).upper()).strip('_')[:60]
        url=a.get('url'); n=0
        if not url:continue
        try:
            p=P();p.feed(get(url))
            for text,href in p.rows:
                low=text.lower()
                if not any(k in low for k in KEYWORDS):continue
                full=urllib.parse.urljoin(url,href)
                if urllib.parse.urlparse(full).netloc and urllib.parse.urlparse(full).netloc.lower()!=urllib.parse.urlparse(url).netloc.lower():continue
                ident=eid(key,text,full)
                if ident in seen:continue
                seen.add(ident);prev=existing.get(ident,{})
                new.append({'evidenceId':ident,'assetKey':key,'isin':a.get('isin'),'category':category(text),'metric':None,'value':None,'unit':None,'period':None,'direction':'NEUTRAL','materiality':'S2','sourceTier':'PRIMARY','sourceName':a.get('sourceName'),'sourceUrl':full,'publishedAt':None,'observedAt':now(),'firstSeenAt':prev.get('firstSeenAt') or now(),'thesisDriver':None,'falsificationCandidate':False,'corroboration':[],'notes':text[:240]});n+=1
                if n>=6:break
            status.append({'asset':a.get('name'),'source':'IR','ok':True,'items':n})
        except Exception as ex:status.append({'asset':a.get('name'),'source':'IR','ok':False,'error':str(ex)})
    preserved=[x for x in old.get('items',[]) if x.get('sourceTier')!='PRIMARY' or x.get('sourceName')=='SEC EDGAR Companyfacts']
    payload={'schemaVersion':1,'generatedAt':now(),'items':new+preserved,'adapterStatus':(old.get('adapterStatus') or [])+status}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,separators=(',',':'))+'\n',encoding='utf-8')
    print(f'Official IR evidence: {len(new)} items across {sum(1 for x in status if x.get("ok"))} reachable sources')
    return 0 if any(x.get('ok') for x in status) else 1
if __name__=='__main__':raise SystemExit(main())
