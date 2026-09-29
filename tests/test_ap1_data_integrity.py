import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def test_override_policy_is_private_and_covers_craneware():
    policy = json.loads((ROOT / 'config/broker_override_policy.json').read_text())
    assert policy['privacyBoundary'] == 'LOCAL_ONLY'
    assert policy['precedence'][0] == 'BROKER_CONFIRMED'
    craneware = next(x for x in policy['rules'] if x['assetKey'] == 'CRANEWARE')
    assert craneware['isin'] == 'GB00B2425G68'
    assert craneware['neverCommitValues'] is True
    assert 'value' not in craneware


def test_runtime_exposes_override_provenance_and_discrepancy_contract():
    js = (ROOT / 'app/data-integrity.js').read_text()
    for token in [
        'hpos_broker_overrides_v1',
        'hpos_data_discrepancies_v1',
        'SOURCE_NEWER',
        'OVERRIDDEN',
        'appendDiscrepancy',
        'registerCraneware',
        'positionSources',
        'portfolioKpis',
    ]:
        assert token in js


def test_runtime_applies_newer_override_and_expires_it_for_newer_source():
    script = r'''
const fs=require('fs'),vm=require('vm');
const memory=new Map();
global.localStorage={getItem:k=>memory.has(k)?memory.get(k):null,setItem:(k,v)=>memory.set(k,String(v)),removeItem:k=>memory.delete(k)};
global.window={};
vm.runInThisContext(fs.readFileSync('app/data-integrity.js','utf8'));
const api=window.HPOS_DATA_INTEGRITY;
api.setOverride({assetKey:'CRANEWARE',isin:'GB00B2425G68',field:'currentPrice',value:15,confirmedAt:'2026-09-21T19:33:26Z',source:'USER_CONFIRMED',reason:'Broker-Screenshot'});
const base={assetKey:'CRANEWARE',isin:'GB00B2425G68',shares:10,price:20,value:200,avg:18};
const applied=api.applyHolding(base,{source:'PARQET',sourceAsOf:'2026-09-20T12:00:00Z'});
if(applied.price!==15||applied.value!==150||applied.provenance.currentPrice.state!=='OVERRIDDEN')process.exit(2);
if(api.discrepancies().length!==1)process.exit(3);
const newer=api.applyHolding({...base,provenance:{currentPrice:{source:'PARQET',asOf:'2026-09-22T12:00:00Z',state:'CURRENT'}}},{source:'PARQET',sourceAsOf:'2026-09-22T12:00:00Z'});
if(newer.price!==20||newer.provenance.currentPrice.state==='OVERRIDDEN')process.exit(4);
'''
    subprocess.run(['node', '-e', script], cwd=ROOT, check=True)


def test_canonical_app_loads_integrity_before_state_runtime():
    html = (ROOT / 'app/index.html').read_text()
    assert html.count('data-integrity.js') == 1
    assert html.index('data-integrity.js') < html.index('app.js')
    app = (ROOT / 'app/app.js').read_text()
    assert 'HPOS_DATA_INTEGRITY' in app
    assert 'portfolioKpis' in app
    assert 'positionSources' in app
