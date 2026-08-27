import unittest, subprocess, tempfile
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
P=ROOT/'scripts'/'apply_hpos_alpha44.py'
class Alpha44Test(unittest.TestCase):
  def test_module_contract(self):
    t=(ROOT/'alpha41'/'alpha44.js').read_text(encoding='utf-8')
    for marker in ['HPOSDecision44','marketStats44','newsEvents44','decision44','letzte 7 Tage','Kurs & Entwicklung','Entscheidungslage']:
      self.assertIn(marker,t)
    self.assertIn('--bg:#08111c',t)
    self.assertNotIn('BUY_SIGNAL',t)
  def test_patcher_idempotent(self):
    with tempfile.TemporaryDirectory() as d:
      d=Path(d);(d/'alpha41').mkdir()
      src=(ROOT/'alpha41'/'index.html').read_text(encoding='utf-8')
      (d/'alpha41'/'index.html').write_text(src,encoding='utf-8')
      subprocess.run(['python',str(P)],cwd=d,check=True)
      a=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
      subprocess.run(['python',str(P)],cwd=d,check=True)
      b=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
      self.assertEqual(a,b)
      self.assertIn("const APP_VERSION='1.3.0-alpha.4.4';",b)
      self.assertEqual(b.count('alpha44.js'),1)
      self.assertIn('ALPHA 4.4 · Decision Engine',b)
if __name__=='__main__': unittest.main()
