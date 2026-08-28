import json, pathlib, unittest
ROOT=pathlib.Path(__file__).resolve().parents[1]
class InterchangeabilityTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.policy=json.loads((ROOT/'config/asset_interchangeability.json').read_text())
        cls.roles=json.loads((ROOT/'config/role_taxonomy.json').read_text())
        cls.catalog=json.loads((ROOT/'data/asset_catalog.json').read_text())
        cls.thesis=json.loads((ROOT/'data/thesis_registry.json').read_text())
    def test_global_competition_is_binding(self):
        self.assertTrue(self.policy['capitalCompetition']['allEligibleEquitiesCompeteGlobally'])
        self.assertTrue(self.policy['capitalCompetition']['ownedAssetsHaveNoIncumbencyBonus'])
        self.assertTrue(self.policy['capitalCompetition']['watchlistAssetsMayBeatOwnedAssets'])
    def test_all_thesis_assets_are_catalog_records(self):
        self.assertEqual(set(self.thesis['assets']),set(self.catalog['assets']))
    def test_roles_are_data_not_asset_specific_rules(self):
        known={r for f in self.roles['families'].values() for r in f['roles']}
        for k,a in self.catalog['assets'].items(): self.assertIn(a['role'],known,k)
    def test_runtime_has_no_stock_specific_alias_maps(self):
        js=(ROOT/'alpha41/alpha442.js').read_text()
        for token in ['NOVONORDISK:\'NOVO_NORDISK\'','MERCKCO:\'MERCK\'','ABBOTT:\'ABBOTT\'']:
            self.assertNotIn(token,js)
        self.assertIn('data/asset_catalog.json',js)
    def test_policy_forbids_asset_specific_engine_bias(self):
        g=self.policy['outputGuardrails']
        self.assertTrue(g['noPermanentFavorite']);self.assertTrue(g['noAssetSpecificHardcodedBuyRule']);self.assertTrue(g['noAssetSpecificHardcodedScoreBoost'])
if __name__=='__main__':unittest.main()
