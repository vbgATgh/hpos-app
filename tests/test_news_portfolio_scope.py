import datetime as dt
import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parents[1] / 'scripts' / 'fetch_hpos_news_portfolio.py'
spec = importlib.util.spec_from_file_location('fetch_hpos_news_portfolio', SCRIPT)
mod = importlib.util.module_from_spec(spec)
sys.modules[spec.name] = mod
spec.loader.exec_module(mod)

class PortfolioNewsScopeTests(unittest.TestCase):
    def test_real_holdings_are_always_portfolio(self):
        config={'parqetSync':{'enabled':True,'watchlistBatchSize':2,'watchlistRotationHours':12},'assets':[]}
        snap={'holdings':[{'name':'Real A','isin':'AA1'},{'name':'Real B','isin':'BB2'}],'watchlist':[]}
        out,meta=mod.expand(config,snap,dt.datetime(2026,8,27,tzinfo=dt.timezone.utc))
        port=[a for a in out['assets'] if a.get('scope')=='PORTFOLIO']
        self.assertEqual(len(port),2)
        self.assertTrue(all(a['enabled'] for a in port))
        self.assertEqual(meta['portfolio'],2)

    def test_watchlist_is_rotated_and_not_portfolio(self):
        config={'parqetSync':{'enabled':True,'watchlistBatchSize':2,'watchlistRotationHours':12},'assets':[]}
        snap={'holdings':[],'watchlist':[{'name':f'W{i}','isin':f'W{i}'} for i in range(5)]}
        out,meta=mod.expand(config,snap,dt.datetime(2026,8,27,tzinfo=dt.timezone.utc))
        watch=[a for a in out['assets'] if a.get('scope')=='WATCHLIST']
        self.assertEqual(len(watch),5)
        self.assertEqual(sum(bool(a['enabled']) for a in watch),2)
        self.assertEqual(meta['watchlistFetched'],2)

    def test_existing_watchlist_becomes_portfolio_when_now_held(self):
        config={'parqetSync':{'enabled':True,'watchlistBatchSize':2,'watchlistRotationHours':12},'assets':[{'assetKey':'X','name':'X','isin':'AA1','scope':'WATCHLIST','enabled':False,'queries':['"X"']}]}
        snap={'holdings':[{'name':'X','isin':'AA1'}],'watchlist':[]}
        out,meta=mod.expand(config,snap,dt.datetime(2026,8,27,tzinfo=dt.timezone.utc))
        a=[x for x in out['assets'] if x.get('isin')=='AA1'][0]
        self.assertEqual(a['scope'],'PORTFOLIO')
        self.assertTrue(a['enabled'])

if __name__=='__main__': unittest.main()
