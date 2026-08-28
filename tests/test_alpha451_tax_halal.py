from pathlib import Path
import json, subprocess, tempfile, shutil
ROOT=Path(__file__).resolve().parents[1]

def test_configs_valid():
    tax=json.loads((ROOT/'config/tax_profile.schema.json').read_text())
    halal=json.loads((ROOT/'config/halal_sources.json').read_text())
    assert 'brokers' in tax['properties']
    assert halal['policy']['purificationSeparateFromZakat'] is True
    keys={x['key'] for x in halal['sources']}
    assert {'AAOIFI','MUSAFFA','ZOYA','ISLAMICLY'} <= keys

def test_runtime_contract():
    t=(ROOT/'alpha41/alpha451.js').read_text()
    for token in ['saleSimulation','maxSharesWithinAllowance','allowanceRemainingAfter','estimatedCapitalGainsTax','purification','zakat','LONG_TERM_30PCT_PROXY']:
        assert token in t

def test_patcher_twice():
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
        shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
        shutil.copy(ROOT/'scripts/apply_hpos_alpha451.py',td/'scripts/apply_hpos_alpha451.py')
        for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha451.py'],cwd=td,check=True)
        t=(td/'alpha41/index.html').read_text()
        assert t.count('alpha451.js')==1
        assert '1.3.0-alpha.4.5.1' in t
        assert t.index('alpha45.js') < t.index('alpha451.js')
