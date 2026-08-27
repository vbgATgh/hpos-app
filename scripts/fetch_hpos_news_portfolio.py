#!/usr/bin/env python3
"""Erweitert HPOS Discovery-News um ein öffentliches, neutrales Asset-Universum.

Privacy Boundary Alpha 4.3.3:
- keine reale Depot-/Watchlist-Datei im öffentlichen Repository
- keine Broker-, Stückzahl-, Einstands-, Strategie- oder Halal-Daten im CI-Lauf
- öffentliche Quellen-/Asset-Metadaten werden neutral als UNIVERSE geladen
- Depot/Watchlist/Account-Scope wird ausschließlich im Browser aus lokalem HPOS-State abgeleitet

Der Dateiname bleibt vorerst aus Kompatibilitätsgründen bestehen; fachlich ist dies
kein Portfolio-Sync mehr.
"""
from __future__ import annotations
import importlib.util
import json
import sys
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
BASE=ROOT/'config'/'news_sources.json'
ASSET_SOURCES=ROOT/'config'/'asset_sources.json'
RUNTIME=ROOT/'config'/'news_sources.runtime.json'
STATUS=ROOT/'data'/'news'/'news_status.json'
MODULE=ROOT/'scripts'/'fetch_hpos_news.py'


def load(path):
    return json.loads(path.read_text(encoding='utf-8'))


def dump(path,obj):
    path.write_text(json.dumps(obj,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')


def key(isin):
    return 'PUB_'+''.join(ch for ch in str(isin or '') if ch.isalnum()).upper()


def quoted(name):
    return f'"{str(name).replace(chr(34), "").strip()}"'


def public_registry():
    data=load(ASSET_SOURCES)
    return [dict(a) for a in data.get('assets',[]) if a.get('isin') and a.get('name')]


def expand(config,registry=None):
    """Merge generic public source metadata into discovery config.

    No caller may pass or derive private portfolio state here. Existing public assets
    are normalized to UNIVERSE, except explicit TEST rows.
    """
    universe=config.get('assetUniverse') or {}
    assets=[dict(a) for a in config.get('assets',[])]
    if not universe.get('enabled',True):
        return config,{'universe':sum(1 for a in assets if a.get('enabled')),'registryAssets':0,'primaryMapped':0}

    registry=public_registry() if registry is None else [dict(a) for a in registry]
    by_isin={str(a.get('isin') or '').upper():a for a in assets if a.get('isin')}

    # Public config must never encode whether an asset is held or watched locally.
    for a in assets:
        if a.get('scope')!='TEST':
            a['scope']='UNIVERSE'

    added=0
    primary_mapped=0
    for src in registry:
        isin=str(src.get('isin') or '').upper()
        if not isin:
            continue
        domain=src.get('domain')
        if domain:
            primary_mapped+=1
        if isin in by_isin:
            a=by_isin[isin]
            a['scope']='UNIVERSE'
            a['enabled']=bool(a.get('enabled',True))
            if domain:
                a['primaryDomains']=list(dict.fromkeys([*(a.get('primaryDomains') or []),domain]))
            continue
        name=src.get('name') or isin
        a={
            'assetKey':key(isin),
            'name':name,
            'isin':isin,
            'aliases':[name,isin],
            'enabled':True,
            'scope':'UNIVERSE',
            'queries':[quoted(name)],
            'primaryDomains':[domain] if domain else [],
            'generatedFrom':'PUBLIC_ASSET_SOURCE_REGISTRY'
        }
        assets.append(a)
        by_isin[isin]=a
        added+=1

    config=dict(config)
    config['assets']=assets
    meta={
        'universe':sum(1 for a in assets if a.get('enabled') and a.get('scope')=='UNIVERSE'),
        'registryAssets':len(registry),
        'registryAdded':added,
        'primaryMapped':primary_mapped,
    }
    return config,meta


def main():
    config=load(BASE)
    runtime,meta=expand(config)
    dump(RUNTIME,runtime)
    spec=importlib.util.spec_from_file_location('hpos_news_base',MODULE)
    mod=importlib.util.module_from_spec(spec)
    sys.modules[spec.name]=mod
    spec.loader.exec_module(mod)
    mod.CONFIG_PATH=RUNTIME
    try:
        rc=mod.main()
    finally:
        try:
            RUNTIME.unlink()
        except FileNotFoundError:
            pass

    try:
        st=load(STATUS)
        # Remove legacy fields that disclosed private portfolio composition.
        for legacy in ('portfolioAssetsConfigured','portfolioPrimarySourcesMapped','watchlistAssetsConfigured','watchlistAssetsFetchedThisRun','watchlistRotationHours'):
            st.pop(legacy,None)
        st['publicUniverseAssetsConfigured']=meta['universe']
        st['publicPrimarySourcesMapped']=meta['primaryMapped']
        st['privacyBoundary']='LOCAL_SCOPE_ONLY'
        st['message']=f"{st.get('message','')} Öffentliches Asset-Universum: {meta['universe']} Titel; Primärquellen-Registry: {meta['primaryMapped']}/{meta['registryAssets']}. Depot-/Watchlist-Scope bleibt lokal."
        dump(STATUS,st)
    except Exception as exc:
        print(f'[WARN] Status-Erweiterung: {exc}',file=sys.stderr)

    print(f"[PUBLIC_UNIVERSE] {meta['universe']} Titel · Primärquellen {meta['primaryMapped']}/{meta['registryAssets']} · keine privaten Portfolio-Scope-Daten")
    return rc


if __name__=='__main__':
    raise SystemExit(main())
