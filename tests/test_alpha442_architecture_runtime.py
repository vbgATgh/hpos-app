from pathlib import Path
import json, shutil, subprocess, tempfile, unittest

ROOT=Path(__file__).resolve().parents[1]

class ArchitectureRuntimeTests(unittest.TestCase):
    def test_architecture_sources_exist_and_are_valid(self):
        c=json.loads((ROOT/'config/hpos_constitution.json').read_text())
        r=json.loads((ROOT/'data/thesis_registry.json').read_text())
        self.assertEqual(c['portfolioRules']['cash'],{'targetPct':3,'relativeHardMinimumPct':2,'absoluteHardFloorEur':150})
        self.assertEqual(c['portfolioRules']['healthcare']['hardCapPct'],30)
        self.assertEqual(c['halal']['H0'],'VETO_EXIT_REVIEW')
        self.assertEqual(c['halal']['UNKNOWN'],'NO_NEW_BUY_OR_ADD')
        self.assertIn('ABBOTT',r['assets'])
        self.assertTrue(r['assets']['ABBOTT']['falsification'])

    def test_runtime_loads_sources_and_is_fail_closed(self):
        s=(ROOT/'alpha41/alpha442.js').read_text()
        for token in ['config/hpos_constitution.json','data/thesis_registry.json','Keine Kauf-/Aufstockungsfreigabe im Degraded Mode','Healthcare-Cap','Einzelpositions-Cap','Source of Truth: Thesis Registry','window.HPOSArchitecture442']:
            self.assertIn(token,s)

    def test_patcher_is_idempotent(self):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
            shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
            shutil.copy(ROOT/'scripts/apply_hpos_alpha442.py',td/'scripts/apply_hpos_alpha442.py')
            for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha442.py'],cwd=td,check=True)
            t=(td/'alpha41/index.html').read_text()
            self.assertEqual(t.count('alpha442.js'),1)
            self.assertIn("1.3.0-alpha.4.4.2",t)
            self.assertIn('ALPHA 4.4.2 · Architecture Runtime',t)

if __name__=='__main__': unittest.main()
