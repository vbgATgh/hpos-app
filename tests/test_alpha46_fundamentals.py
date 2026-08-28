import importlib.util, json, subprocess, tempfile, shutil, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def mod():
    spec=importlib.util.spec_from_file_location('sec',ROOT/'scripts/fetch_sec_fundamentals.py'); m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

class Alpha46FundamentalTests(unittest.TestCase):
    def test_adapter_config_and_sec_assets(self):
        c=json.loads((ROOT/'config/fundamental_adapters.json').read_text())
        self.assertTrue(c['policy']['publicDataOnly'])
        self.assertTrue(c['sec']['enabled'])
        keys={x['assetKey'] for x in c['sec']['assets']}
        self.assertTrue({'ABBOTT','MEDTRONIC','MERCK'} <= keys)

    def test_latest_fact_prefers_latest_filing(self):
        m=mod(); metric={'concepts':['Revenues'],'units':['USD']}; data={'facts':{'us-gaap':{'Revenues':{'units':{'USD':[
          {'val':90,'form':'10-Q','filed':'2025-01-01','end':'2024-12-31','fy':2024,'fp':'Q4'},
          {'val':100,'form':'10-Q','filed':'2026-07-20','end':'2026-06-30','fy':2026,'fp':'Q2'}]}}}}}
        x=m.latest_fact(data,metric,{'10-Q'}); self.assertEqual(x['val'],100); self.assertEqual(x['end'],'2026-06-30')

    def test_runtime_contract(self):
        t=(ROOT/'alpha41/alpha46.js').read_text()
        for token in ['Fundamentale Evidenz','missing','PRIMARY/REGULATOR','HPOSFundamental46','coveragePct']:
            self.assertIn(token,t)

    def test_patcher_twice(self):
        with tempfile.TemporaryDirectory() as td:
            td=Path(td); (td/'alpha41').mkdir(); (td/'scripts').mkdir()
            shutil.copy(ROOT/'alpha41/index.html',td/'alpha41/index.html')
            shutil.copy(ROOT/'scripts/apply_hpos_alpha46.py',td/'scripts/apply_hpos_alpha46.py')
            for _ in range(2): subprocess.run(['python','scripts/apply_hpos_alpha46.py'],cwd=td,check=True)
            t=(td/'alpha41/index.html').read_text()
            self.assertEqual(t.count('alpha46.js'),1)
            self.assertIn("const APP_VERSION='1.3.0-alpha.4.6';",t)
            self.assertLess(t.index('alpha45.js'),t.index('alpha46.js'))
