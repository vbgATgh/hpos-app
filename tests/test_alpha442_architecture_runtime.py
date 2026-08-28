from pathlib import Path
import json

ROOT=Path(__file__).resolve().parents[1]

def test_architecture_sources_exist_and_are_valid():
    c=json.loads((ROOT/'config/hpos_constitution.json').read_text())
    r=json.loads((ROOT/'data/thesis_registry.json').read_text())
    assert c['portfolioRules']['cash']=={'targetPct':3,'relativeHardMinimumPct':2,'absoluteHardFloorEur':150}
    assert c['portfolioRules']['healthcare']['hardCapPct']==30
    assert c['halal']['H0']=='VETO_EXIT_REVIEW'
    assert c['halal']['UNKNOWN']=='NO_NEW_BUY_OR_ADD'
    assert 'ABBOTT' in r['assets'] and r['assets']['ABBOTT']['falsification']

def test_runtime_loads_sources_and_is_fail_closed():
    s=(ROOT/'alpha41/alpha442.js').read_text()
    assert "config/hpos_constitution.json" in s
    assert "data/thesis_registry.json" in s
    assert "Keine Kauf-/Aufstockungsfreigabe im Degraded Mode" in s
    assert "Healthcare-Cap" in s
    assert "Einzelpositions-Cap" in s
    assert "Source of Truth: Thesis Registry" in s
    assert "window.HPOSArchitecture442" in s

def test_patcher_is_idempotent():
    import shutil, subprocess, tempfile
    with tempfile.TemporaryDirectory() as td:
        td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
        shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
        shutil.copy(ROOT/'scripts/apply_hpos_alpha442.py',td/'scripts/apply_hpos_alpha442.py')
        for _ in range(2):
            subprocess.run(['python','scripts/apply_hpos_alpha442.py'],cwd=td,check=True)
        t=(td/'alpha41/index.html').read_text()
        assert t.count('alpha442.js')==1
        assert "1.3.0-alpha.4.4.2" in t
        assert "ALPHA 4.4.2 · Architecture Runtime" in t
