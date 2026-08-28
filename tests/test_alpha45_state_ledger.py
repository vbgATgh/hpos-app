from pathlib import Path
import json, shutil, subprocess, tempfile
ROOT=Path(__file__).resolve().parents[1]

def test_state_and_ledger_schemas():
    s=json.loads((ROOT/'config/current_state.schema.json').read_text())
    l=json.loads((ROOT/'config/transaction_ledger.schema.json').read_text())
    assert 'provenance' in s['required']
    assert s['properties']['portfolio']['properties']['cashCommittedEur']
    assert l['properties']['entries']['items']['properties']['source']['enum']

def test_runtime_contract():
    t=(ROOT/'alpha41/alpha45.js').read_text()
    for token in ['HPOSStateLedger45','buildCurrentState','buildLedger','cashCommittedEur','BROKER_PROVENANCE_MISSING','QUOTE_STALE']:
        assert token in t
    assert 'parqet_snapshot.json' not in t

def test_patcher_twice():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
        shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
        shutil.copy(ROOT/'scripts/apply_hpos_alpha45.py',td/'scripts/apply_hpos_alpha45.py')
        for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha45.py'],cwd=td,check=True)
        t=(td/'alpha41/index.html').read_text()
        assert t.count('alpha45.js')==1
        assert "1.3.0-alpha.4.5" in t
        assert 'ALPHA 4.5 · State & Ledger Foundation' in t
