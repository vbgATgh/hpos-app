import json, subprocess, tempfile, shutil, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
class SourceCoverageTests(unittest.TestCase):
    def test_all_thesis_assets_map_to_primary_source(self):
        subprocess.run(['python','scripts/build_fundamental_coverage.py'],cwd=ROOT,check=True)
        x=json.loads((ROOT/'data/fundamental/coverage.json').read_text())
        missing=[a['assetKey'] for a in x['assets'] if not a['sourceMapped']]
        self.assertEqual(missing,[],f'Missing primary sources: {missing}')
        self.assertEqual(len(x['assets']),16)
    def test_source_registry_stays_public_generic(self):
        x=json.loads((ROOT/'config/asset_sources.json').read_text())
        text=json.dumps(x)
        for k in ['currentValue','avgEntryPrice','cashEur','openOrders','taxProfile']:
            self.assertNotIn(k,text)
