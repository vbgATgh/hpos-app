import json, pathlib, shutil, subprocess, tempfile, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]

class CapitalAllocationTests(unittest.TestCase):
    def test_policy_is_gate_first_and_non_scoring(self):
        p=json.loads((ROOT/'config/capital_competition_policy.json').read_text())
        self.assertEqual(p['principle'],'THE_NEXT_EURO_HAS_NO_LOYALTY')
        self.assertEqual(p['hardBlocks']['halalAllowed'],['H1'])
        self.assertTrue(p['dominance']['unknownDimensionNeverCountsAsAdvantage'])
        self.assertTrue(p['dominance']['ownershipNeverCountsAsAdvantage'])
        self.assertIn('NO_WEIGHTED_PSEUDO_PRECISION',p['guardrails'])

    def test_runtime_has_no_asset_favorites(self):
        s=(ROOT/'alpha41/alpha47.js').read_text()
        for name in ['ABBOTT','NOVARTIS','GSK','FREQUENTIS','IVU_TRAFFIC','LAGERCRANTZ']:
            self.assertNotIn(name,s)
        for token in ['PARETO','TRADEABILITY_UNKNOWN','EVIDENCE_INSUFFICIENT','HALAL_','NET_ECONOMIC_EFFECT','NO_CLEAR_ADVANTAGE','BEST_ROTATION','window.HPOSCapital47']:
            self.assertIn(token,s)
        self.assertNotIn('score',s.lower())

    def test_patcher_is_forward_idempotent(self):
        with tempfile.TemporaryDirectory() as td:
            td=pathlib.Path(td);(td/'alpha41').mkdir();(td/'scripts').mkdir()
            shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
            shutil.copy(ROOT/'scripts/apply_hpos_alpha47.py',td/'scripts/apply_hpos_alpha47.py')
            subprocess.run(['python','scripts/apply_hpos_alpha47.py'],cwd=td,check=True)
            once=(td/'alpha41/index.html').read_text()
            subprocess.run(['python','scripts/apply_hpos_alpha47.py'],cwd=td,check=True)
            twice=(td/'alpha41/index.html').read_text()
            self.assertEqual(once,twice)
            self.assertEqual(twice.count('alpha47.js'),1)
            self.assertIn("1.3.0-alpha.4.7",twice)
            self.assertLess(twice.index('alpha464.js'),twice.index('alpha47.js'))

if __name__=='__main__': unittest.main()
