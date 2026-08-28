from pathlib import Path
import json, subprocess, tempfile, shutil, unittest
ROOT=Path(__file__).resolve().parents[1]

class Alpha451TaxHalalTests(unittest.TestCase):
    def test_configs_valid(self):
        tax=json.loads((ROOT/'config/tax_profile.schema.json').read_text())
        halal=json.loads((ROOT/'config/halal_sources.json').read_text())
        self.assertIn('brokers', tax['properties'])
        self.assertIs(halal['policy']['purificationSeparateFromZakat'], True)
        keys={x['key'] for x in halal['sources']}
        self.assertTrue({'AAOIFI','MUSAFFA','ZOYA','ISLAMICLY'} <= keys)

    def test_runtime_contract(self):
        t=(ROOT/'alpha41/alpha451.js').read_text()
        for token in ['saleSimulation','maxSharesWithinAllowance','allowanceRemainingAfter','estimatedCapitalGainsTax','purification','zakat','LONG_TERM_30PCT_PROXY']:
            self.assertIn(token,t)

    def test_patcher_twice(self):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
            shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
            shutil.copy(ROOT/'scripts/apply_hpos_alpha451.py',td/'scripts/apply_hpos_alpha451.py')
            for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha451.py'],cwd=td,check=True)
            t=(td/'alpha41/index.html').read_text()
            self.assertEqual(t.count('alpha451.js'),1)
            self.assertIn('1.3.0-alpha.4.5.1',t)
            self.assertLess(t.index('alpha45.js'),t.index('alpha451.js'))

if __name__=='__main__': unittest.main()
