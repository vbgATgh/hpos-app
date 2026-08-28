import importlib.util,json,subprocess,unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
spec=importlib.util.spec_from_file_location('eng',ROOT/'scripts/build_thesis_signals.py');eng=importlib.util.module_from_spec(spec);spec.loader.exec_module(eng)
class ThesisEvidenceEngineTests(unittest.TestCase):
    def test_positive_metric_is_evidence_not_buy(self):
        state,change,reason=eng.metric_signal({'value':105,'changePct':8,'falsificationCandidate':False},{'value':100},{'positivePct':5,'negativePct':-5})
        self.assertEqual(state,'STRENGTHENING');self.assertEqual(change,8)
    def test_missing_comparison_is_insufficient(self):
        state,change,reason=eng.metric_signal({'value':105,'falsificationCandidate':False},None,{'positivePct':5,'negativePct':-5})
        self.assertEqual(state,'INSUFFICIENT');self.assertIsNone(change)
    def test_broken_requires_explicit_s3_negative_falsification(self):
        base={'value':1,'changePct':-99,'direction':'NEGATIVE','materiality':'S3'}
        a=dict(base,falsificationCandidate=False);b=dict(base,falsificationCandidate=True)
        self.assertNotEqual(eng.metric_signal(a,None,{'positivePct':5,'negativePct':-5})[0],'BROKEN')
        self.assertEqual(eng.metric_signal(b,None,{'positivePct':5,'negativePct':-5})[0],'BROKEN')
    def test_generated_output_never_changes_buy_status(self):
        subprocess.run(['python','scripts/build_thesis_signals.py'],cwd=ROOT,check=True)
        x=json.loads((ROOT/'data/fundamental/thesis_signals.json').read_text())
        self.assertTrue(all(a['autoBuyStatusChange'] is False and a['decisionImpact']=='EVIDENCE_ONLY' for a in x['assets']))
if __name__=='__main__':unittest.main()
