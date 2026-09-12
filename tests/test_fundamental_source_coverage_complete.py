import json, subprocess, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class SourceCoverageTests(unittest.TestCase):
    def test_all_thesis_assets_map_to_primary_source(self):
        subprocess.run(['python','scripts/build_fundamental_coverage.py'],cwd=ROOT,check=True)
        x=json.loads((ROOT/'data/fundamental/coverage.json').read_text())
        missing=[a['assetKey'] for a in x['assets'] if not a['sourceMapped']]
        self.assertEqual(missing,[],f'Missing primary sources: {missing}')
        registry=json.loads((ROOT/'data/thesis_registry.json').read_text())
        self.assertEqual(len(x['assets']),len(registry['assets']))
    def test_source_registries_stay_public_generic(self):
        rows=[]
        for p in ['config/asset_sources.json','config/fundamental_asset_sources.json']:
            rows.append(json.loads((ROOT/p).read_text()))
        text=json.dumps(rows)
        for k in ['currentValue','avgEntryPrice','cashEur','openOrders','taxProfile','portfolioValueEur']:
            self.assertNotIn(k,text)
        self.assertEqual(len(rows[1]['assets']),8)
