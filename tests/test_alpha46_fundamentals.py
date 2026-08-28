import importlib.util, json, subprocess, tempfile, shutil
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def mod():
    spec=importlib.util.spec_from_file_location('sec',ROOT/'scripts/fetch_sec_fundamentals.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

def test_adapter_config_and_sec_assets():
    c=json.loads((ROOT/'config/fundamental_adapters.json').read_text())
    assert c['policy']['publicDataOnly'] is True
    assert c['sec']['enabled'] is True
    keys={x['assetKey'] for x in c['sec']['assets']}
    assert {'ABBOTT','MEDTRONIC','MERCK'} <= keys

def test_latest_fact_prefers_latest_filing():
    m=mod(); metric={'concepts':['Revenues'],'units':['USD']}; data={'facts':{'us-gaap':{'Revenues':{'units':{'USD':[
      {'val':90,'form':'10-Q','filed':'2025-01-01','end':'2024-12-31','fy':2024,'fp':'Q4'},
      {'val':100,'form':'10-Q','filed':'2026-07-20','end':'2026-06-30','fy':2026,'fp':'Q2'}]}}}}}
    x=m.latest_fact(data,metric,{'10-Q'}); assert x['val']==100 and x['end']=='2026-06-30'

def test_runtime_contract():
    t=(ROOT/'alpha41/alpha46.js').read_text()
    for token in ['Fundamentale Evidenz','missingEvidence' if False else 'missing','PRIMARY/REGULATOR','HPOSFundamental46','coveragePct']:
        assert token in t

def test_patcher_twice():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
        shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
        shutil.copy(ROOT/'scripts/apply_hpos_alpha46.py',td/'scripts/apply_hpos_alpha46.py')
        for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha46.py'],cwd=td,check=True)
        t=(td/'alpha41/index.html').read_text()
        assert t.count('alpha46.js')==1
        assert "const APP_VERSION='1.3.0-alpha.4.6';" in t
        assert t.index('alpha45.js') < t.index('alpha46.js')
