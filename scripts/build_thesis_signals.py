#!/usr/bin/env python3
from __future__ import annotations
import datetime as dt, json, re
from collections import defaultdict
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
EVID=ROOT/'data'/'fundamental'/'evidence.json'; THESIS=ROOT/'data'/'thesis_registry.json'; POLICY=ROOT/'config'/'thesis_evidence_policy.json'; OUT=ROOT/'data'/'fundamental'/'thesis_signals.json'

def now(): return dt.datetime.now(dt.timezone.utc).replace(microsecond=0).isoformat().replace('+00:00','Z')
def period_rank(p):
    s=str(p or '')
    years=[int(x) for x in re.findall(r'20\d{2}',s)]
    year=max(years) if years else 0
    q={'Q1':1,'H1':2,'Q2':2,'Q3':3,'H2':4,'Q4':4}.get(next((k for k in ('Q1','H1','Q2','Q3','H2','Q4') if k in s.upper()),''),0)
    return (year,q,s)
def calc_change(cur,prev):
    try:
        c=float(cur); p=float(prev)
        return None if p==0 else (c-p)/abs(p)*100.0
    except: return None
def metric_signal(item, prior, rule):
    if item.get('falsificationCandidate') is True and item.get('direction')=='NEGATIVE' and item.get('materiality')=='S3':
        return 'BROKEN',None,'explicit_falsification'
    if rule.get('mode')=='REFERENCE_ONLY': return 'INSUFFICIENT',None,'reference_only'
    change=item.get('changePct')
    if change is None and prior is not None: change=calc_change(item.get('value'),prior.get('value'))
    if change is None: return 'INSUFFICIENT',None,'no_comparable_period_or_explicit_change'
    try: change=float(change)
    except: return 'INSUFFICIENT',None,'invalid_change'
    if 'positivePct' in rule:
        if change>=float(rule['positivePct']): return 'STRENGTHENING',change,'pct_change'
        if change<=float(rule['negativePct']): return 'WEAKENING',change,'pct_change'
        return 'NEUTRAL',change,'pct_change'
    if 'positiveAbs' in rule:
        if change>=float(rule['positiveAbs']): return 'STRENGTHENING',change,'absolute_change'
        if change<=float(rule['negativeAbs']): return 'WEAKENING',change,'absolute_change'
        return 'NEUTRAL',change,'absolute_change'
    return 'INSUFFICIENT',change,'no_rule'
def main():
    e=json.loads(EVID.read_text()) if EVID.exists() else {'items':[]}; t=json.loads(THESIS.read_text())['assets']; p=json.loads(POLICY.read_text()); rules=p['metricRules']
    grouped=defaultdict(list)
    for x in e.get('items',[]):
        if x.get('metric') and x.get('assetKey') in t: grouped[(x['assetKey'],x['metric'])].append(x)
    metric_rows=[]; by_asset=defaultdict(list)
    for (asset,metric),rows in grouped.items():
        rows=sorted(rows,key=lambda x:period_rank(x.get('period')))
        cur=rows[-1]; prior=rows[-2] if len(rows)>1 else None; rule=rules.get(metric,{})
        state,change,reason=metric_signal(cur,prior,rule)
        r={'assetKey':asset,'metric':metric,'period':cur.get('period'),'state':state,'change':change,'changeUnit':'PCT','reason':reason,'thesisDriver':cur.get('thesisDriver'),'evidenceId':cur.get('evidenceId'),'sourceUrl':cur.get('sourceUrl'),'decisionImpact':'EVIDENCE_ONLY','autoBuyStatusChange':False}
        metric_rows.append(r);by_asset[asset].append(r)
    assets=[]
    for asset,definition in t.items():
        rows=by_asset.get(asset,[]); states=[x['state'] for x in rows]
        if 'BROKEN' in states: state='BROKEN'
        else:
            comparable=[s for s in states if s!='INSUFFICIENT']
            if not comparable: state='INSUFFICIENT'
            elif comparable.count('WEAKENING')>comparable.count('STRENGTHENING'): state='WEAKENING'
            elif comparable.count('STRENGTHENING')>comparable.count('WEAKENING'): state='STRENGTHENING'
            else: state='NEUTRAL'
        assets.append({'assetKey':asset,'role':definition.get('role'),'state':state,'metricSignals':rows,'broken':state=='BROKEN','decisionImpact':'EVIDENCE_ONLY','autoBuyStatusChange':False})
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps({'schemaVersion':1,'generatedAt':now(),'policyVersion':p['schemaVersion'],'assets':assets},ensure_ascii=False,separators=(',',':'))+'\n')
    print('Thesis signals:',', '.join(f"{x['assetKey']}={x['state']}" for x in assets if x['metricSignals']))
if __name__=='__main__': main()
