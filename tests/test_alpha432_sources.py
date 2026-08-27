import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class Alpha432SourcesTest(unittest.TestCase):
    def test_all_real_holdings_have_primary_source(self):
        snap=json.loads((ROOT/'data/portfolio/parqet_snapshot.json').read_text(encoding='utf-8'))
        src=json.loads((ROOT/'config/asset_sources.json').read_text(encoding='utf-8'))
        real={str(h['isin']).upper() for h in snap['holdings']}
        mapped={str(a['isin']).upper() for a in src['assets'] if a.get('url') and a.get('domain')}
        self.assertEqual(19,len(real))
        self.assertFalse(real-mapped,sorted(real-mapped))

    def test_news_runtime_maps_primary_domains(self):
        import importlib.util
        mod_path=ROOT/'scripts/fetch_hpos_news_portfolio.py'
        spec=importlib.util.spec_from_file_location('scope432',mod_path)
        mod=importlib.util.module_from_spec(spec);spec.loader.exec_module(mod)
        cfg=json.loads((ROOT/'config/news_sources.json').read_text(encoding='utf-8'))
        snap=json.loads((ROOT/'data/portfolio/parqet_snapshot.json').read_text(encoding='utf-8'))
        runtime,meta=mod.expand(cfg,snap)
        real={str(h['isin']).upper() for h in snap['holdings']}
        rows={str(a.get('isin') or '').upper():a for a in runtime['assets'] if a.get('scope')=='PORTFOLIO'}
        self.assertEqual(19,meta['portfolio'])
        self.assertEqual(19,meta['primaryMapped'])
        self.assertTrue(all(rows[i].get('primaryDomains') for i in real))

if __name__=='__main__': unittest.main()
