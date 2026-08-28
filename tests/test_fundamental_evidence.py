from pathlib import Path
import json,subprocess,tempfile,shutil,unittest
ROOT=Path(__file__).resolve().parents[1]

class FundamentalEvidenceTests(unittest.TestCase):
    def test_schema_and_policy(self):
        s=json.loads((ROOT/'config/fundamental_evidence.schema.json').read_text())
        p=json.loads((ROOT/'config/fundamental_source_policy.json').read_text())
        self.assertEqual(s['properties']['schemaVersion']['const'],1)
        self.assertTrue(p['rules']['priceActionIsNotFundamentalEvidence'])
        self.assertTrue(p['rules']['missingEvidenceReducesConfidence'])
        self.assertIn('FREE_CASH_FLOW',p['domains']['healthcare']['requiredEvidence'])
    def test_coverage_builder(self):
        subprocess.run(['python','scripts/build_fundamental_coverage.py'],cwd=ROOT,check=True)
        c=json.loads((ROOT/'data/fundamental/coverage.json').read_text())
        self.assertGreaterEqual(len(c['assets']),10)
        by={x['assetKey']:x for x in c['assets']}
        self.assertIn('ABBOTT',by)
        self.assertTrue(by['ABBOTT']['sourceMapped'])
        self.assertIn('PIPELINE',by['ABBOTT']['requiredEvidence'])
    def test_public_snapshot_has_no_portfolio_fields(self):
        e=(ROOT/'data/fundamental/evidence.json').read_text().lower()
        for token in ['shares','cashbalance','brokeraccount','avgentryprice','portfolioid']:
            self.assertNotIn(token,e)

if __name__=='__main__': unittest.main()
