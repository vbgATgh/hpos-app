#!/usr/bin/env python3
from __future__ import annotations
import json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
CAT=ROOT/'data'/'asset_catalog.json'; THESIS=ROOT/'data'/'thesis_registry.json'; POLICY=ROOT/'config'/'asset_interchangeability.json'; OUT=ROOT/'data'/'architecture'/'replacement_universe.json'

def main():
    cat=json.loads(CAT.read_text(encoding='utf-8')); thesis=json.loads(THESIS.read_text(encoding='utf-8')); pol=json.loads(POLICY.read_text(encoding='utf-8'))
    assets=[]
    for key,t in thesis.get('assets',{}).items():
        c=cat.get('assets',{}).get(key,{})
        assets.append({'assetKey':key,'name':c.get('name',key),'isin':c.get('isin'),'role':t.get('role') or c.get('role'),'family':c.get('family'),'thesisDefined':bool(t.get('thesis')),'falsificationDefined':bool(t.get('falsification'))})
    keys=[a['assetKey'] for a in assets]
    rows=[]
    for src in assets:
        direct=[]; global_comp=[]
        for dst in assets:
            if dst['assetKey']==src['assetKey']: continue
            global_comp.append(dst['assetKey'])
            if src.get('family') and dst.get('family')==src.get('family'): direct.append(dst['assetKey'])
        rows.append({'source':src['assetKey'],'directRoleCandidates':sorted(direct),'globalCapitalCompetitors':sorted(global_comp)})
    payload={'schemaVersion':1,'principle':pol['principle'],'allEligibleEquitiesCompeteGlobally':pol['capitalCompetition']['allEligibleEquitiesCompeteGlobally'],'assetCount':len(assets),'assets':assets,'replacementMap':rows,'guardrails':pol['outputGuardrails']}
    OUT.parent.mkdir(parents=True,exist_ok=True);OUT.write_text(json.dumps(payload,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(f'Replacement universe: {len(assets)} assets, each with {len(keys)-1} global competitors')
if __name__=='__main__': main()
