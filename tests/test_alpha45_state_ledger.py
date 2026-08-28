from pathlib import Path
import json, re, shutil, subprocess, tempfile, unittest
ROOT=Path(__file__).resolve().parents[1]

class StateLedgerTests(unittest.TestCase):
    def test_state_and_ledger_schemas(self):
        s=json.loads((ROOT/'config/current_state.schema.json').read_text())
        l=json.loads((ROOT/'config/transaction_ledger.schema.json').read_text())
        self.assertIn('provenance',s['required'])
        self.assertTrue(s['properties']['portfolio']['properties']['cashCommittedEur'])
        self.assertTrue(l['properties']['entries']['items']['properties']['source']['enum'])

    def test_runtime_contract(self):
        t=(ROOT/'alpha41/alpha45.js').read_text()
        for token in ['HPOSStateLedger45','buildCurrentState','buildLedger','cashCommittedEur','BROKER_PROVENANCE_MISSING','QUOTE_STALE']:
            self.assertIn(token,t)
        self.assertNotIn('parqet_snapshot.json',t)

    def test_patcher_twice_is_forward_safe(self):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
            shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
            shutil.copy(ROOT/'scripts/apply_hpos_alpha45.py',td/'scripts/apply_hpos_alpha45.py')
            before=(td/'alpha41/index.html').read_text()
            for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha45.py'],cwd=td,check=True)
            t=(td/'alpha41/index.html').read_text()
            self.assertEqual(before,t)
            self.assertEqual(t.count('alpha45.js'),1)
            m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",t)
            self.assertIsNotNone(m)
            self.assertGreaterEqual(tuple(int(x or 0) for x in m.groups()),(4,5,0))

if __name__=='__main__': unittest.main()
