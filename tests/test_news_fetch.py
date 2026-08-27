import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / "scripts" / "fetch_hpos_news.py"
spec = importlib.util.spec_from_file_location("fetch_hpos_news", SCRIPT)
news = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = news
spec.loader.exec_module(news)

SAMPLE = b'''<?xml version="1.0"?><rss><channel>
<item><title>Rio Tinto posts update</title><link>https://news.google.com/rss/articles/abc</link><pubDate>Wed, 27 Aug 2026 06:00:00 GMT</pubDate><source url="https://www.riotinto.com">Rio Tinto</source></item>
<item><title>Independent Rio Tinto story</title><link>https://news.google.com/rss/articles/def</link><pubDate>Wed, 27 Aug 2026 05:00:00 GMT</pubDate><source url="https://example.com">Example News</source></item>
</channel></rss>'''

ASSET = {"assetKey":"RIO_TINTO","name":"Rio Tinto","ticker":"RIO","scope":"PORTFOLIO","primaryDomains":["riotinto.com"]}

class NewsTests(unittest.TestCase):
    def test_parser_preserves_source_and_primary_flag(self):
        rows = news.parse_google_rss(SAMPLE, ASSET, "2026-08-27T07:00:00Z", 3650, 20)
        self.assertEqual(len(rows), 2)
        self.assertTrue(rows[0]["primarySource"])
        self.assertEqual(rows[0]["sourceType"], "PRIMARY")
        self.assertFalse(rows[1]["primarySource"])

    def test_dedupe_same_asset_title(self):
        row = {"newsId":"a","assetKey":"RIO_TINTO","title":"Same title","publishedAt":"2026-08-27T06:00:00Z"}
        row2 = {"newsId":"b","assetKey":"RIO_TINTO","title":"Same title","publishedAt":"2026-08-27T05:00:00Z"}
        self.assertEqual(len(news.dedupe([row,row2])), 1)

    def test_asset_index_contains_aliases(self):
        idx = news.asset_index({"assets":[{"assetKey":"SUKUK","name":"Fund","aliases":["Sukuk"],"enabled":True}]})
        self.assertEqual(idx["SUKUK"]["aliases"], ["Sukuk"])
        self.assertTrue(idx["SUKUK"]["enabled"])

if __name__ == '__main__':
    unittest.main()
