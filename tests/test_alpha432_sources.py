import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class Alpha432SourcesTest(unittest.TestCase):
    def test_public_registry_keeps_primary_source_coverage(self):
        src=json.loads((ROOT/'config/asset_sources.json').read_text(encoding='utf-8'))
        rows=src.get('assets',[])
        self.assertGreaterEqual(len(rows),19)
        self.assertTrue(all(a.get('isin') and a.get('url') and a.get('domain') for a in rows))
        self.assertEqual('PUBLIC_GENERIC_ONLY',src.get('policy',{}).get('privacyBoundary'))

    def test_news_runtime_maps_registry_without_private_scope(self):
        import importlib.util
        mod_path=ROOT/'scripts/fetch_hpos_news_portfolio.py'
        spec=importlib.util.spec_from_file_location('scope432',mod_path)
        mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
        cfg=json.loads((ROOT/'config/news_sources.json').read_text(encoding='utf-8'))
        src=json.loads((ROOT/'config/asset_sources.json').read_text(encoding='utf-8'))
        runtime,meta=mod.expand(cfg,src['assets'])
        rows=[a for a in runtime['assets'] if a.get('scope')!='TEST']
        self.assertGreaterEqual(meta['registryAssets'],19)
        self.assertEqual(meta['registryAssets'],meta['primaryMapped'])
        self.assertTrue(rows)
        self.assertTrue(all(a.get('scope')=='UNIVERSE' for a in rows))
        self.assertFalse(any(a.get('scope') in {'PORTFOLIO','WATCHLIST'} for a in rows))

if __name__=='__main__': unittest.main()
