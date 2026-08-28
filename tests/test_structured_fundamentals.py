import importlib.util, json, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def mod():
    s=importlib.util.spec_from_file_location('sf',ROOT/'scripts/fetch_structured_ir_metrics.py');m=importlib.util.module_from_spec(s);s.loader.exec_module(m);return m

class StructuredFundamentalTests(unittest.TestCase):
    def test_source_config_has_three_primary_adapters(self):
        c=json.loads((ROOT/'config/structured_fundamental_sources.json').read_text())
        self.assertEqual({x['assetKey'] for x in c['assets']},{'FREQUENTIS','IVU_TRAFFIC','LAGERCRANTZ'})
        self.assertTrue(c['policy']['noInferenceFromMissingMetric'])
    def test_frequentis_parser(self):
        m=mod();a={'assetKey':'FREQUENTIS','period':'H1 2026','sourceName':'Frequentis','reportUrl':'https://example','publishedAt':'2026-08-11'}
        t='Revenues +44.8% to EUR 342.9 million Order intake +17.0% to EUR 361.7 million EBIT rose to EUR 15.6 million. With orders on hand of EUR 835 million.'
        x={e['metric']:e for e in m.frequentis(a,t)}
        self.assertEqual(x['revenue']['value'],342900000);self.assertEqual(x['revenue']['changePct'],44.8)
        self.assertEqual(x['order_intake']['value'],361700000);self.assertEqual(x['order_intake']['changePct'],17.0)
        self.assertEqual(x['ebit']['value'],15600000);self.assertEqual(x['backlog']['value'],835000000)
    def test_ivu_parser(self):
        m=mod();a={'assetKey':'IVU_TRAFFIC','period':'H1 2026','sourceName':'IVU','reportUrl':'https://example','publishedAt':None}
        t='Revenue in the first half rose by 12.7% to €72,072 thousand. Gross profit increased by 14.7% to €59,171 thousand. operating profit (Earnings before interest and taxes - EBIT) is €3,304 thousand. We continue to expect consolidated revenue of more than €160 million and EBIT around €22 million.'
        x={e['metric']:e for e in m.ivu(a,t)}
        self.assertEqual(x['revenue']['value'],72072000);self.assertEqual(x['revenue']['changePct'],12.7)
        self.assertEqual(x['gross_profit']['value'],59171000);self.assertEqual(x['gross_profit']['changePct'],14.7)
        self.assertEqual(x['ebit']['value'],3304000)
    def test_lagercrantz_parser(self):
        m=mod();a={'assetKey':'LAGERCRANTZ','period':'Q1 2026/27','sourceName':'Lagercrantz','reportUrl':'https://example','publishedAt':'2026-07-17'}
        t='Net revenue increased by 18% to MSEK 2,907. Operating profit (EBITA) increased by 15% to MSEK 498 and the EBITA margin was 17.1%. Cash flow from operating activities amounted to MSEK 279.'
        x={e['metric']:e for e in m.lagercrantz(a,t)}
        self.assertEqual(x['revenue']['value'],2907000000);self.assertEqual(x['revenue']['changePct'],18)
        self.assertEqual(x['ebita']['value'],498000000);self.assertEqual(x['ebita']['changePct'],15)
        self.assertEqual(x['ebita_margin']['value'],17.1);self.assertEqual(x['operating_cash_flow']['value'],279000000)
