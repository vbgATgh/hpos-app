import json
import unittest
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

class Alpha433PrivacyBoundaryTest(unittest.TestCase):
    def test_private_snapshot_is_not_tracked(self):
        self.assertFalse((ROOT/'data/portfolio/parqet_snapshot.json').exists())

    def test_ignore_rules_block_private_artifacts(self):
        text=(ROOT/'.gitignore').read_text(encoding='utf-8')
        for required in ('data/portfolio/parqet_snapshot*.json','data/private/','*.hpos-backup.enc.json'):
            self.assertIn(required,text)

    def test_public_news_config_contains_no_personal_scope(self):
        cfg=json.loads((ROOT/'config/news_sources.json').read_text(encoding='utf-8'))
        self.assertNotIn('parqetSync',cfg)
        self.assertEqual('UNIVERSE',cfg['assetUniverse']['scope'])
        scopes={a.get('scope') for a in cfg.get('assets',[]) if a.get('scope')!='TEST'}
        self.assertEqual({'UNIVERSE'},scopes)

    def test_news_pipeline_has_no_private_snapshot_dependency(self):
        text=(ROOT/'scripts/fetch_hpos_news_portfolio.py').read_text(encoding='utf-8')
        forbidden=('parqet_snapshot','snapshot.get(\'holdings\'','snapshot.get("holdings"','snapshot.get(\'watchlist\'','snapshot.get("watchlist"')
        self.assertFalse(any(x in text for x in forbidden),forbidden)
        self.assertIn("'scope':'UNIVERSE'",text)

    def test_privacy_ui_uses_client_side_encryption(self):
        text=(ROOT/'alpha41/alpha433.js').read_text(encoding='utf-8')
        for required in ('AES-GCM','PBKDF2','250000','HPOS_ENCRYPTED_BACKUP_V1','crypto.subtle.encrypt','crypto.subtle.decrypt'):
            self.assertIn(required,text)
        self.assertIn('HPOS sendet nichts automatisch',text)

    def test_patcher_is_idempotent_and_version_safe(self):
        script=(ROOT/'scripts/apply_hpos_alpha433.py').read_text(encoding='utf-8')
        self.assertIn("1.3.0-alpha.4.3.2",script)
        self.assertIn("1.3.0-alpha.4.3.3",script)
        self.assertIn("t.count('alpha433.js')!=1",script)

if __name__=='__main__': unittest.main()
