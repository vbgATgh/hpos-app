import unittest, subprocess, tempfile, re
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
  def test_patcher_idempotent_and_forward_safe(self):
    with tempfile.TemporaryDirectory() as d:
      d=Path(d);(d/'alpha41').mkdir()
      src=(ROOT/'alpha41'/'index.html').read_text(encoding='utf-8')
      (d/'alpha41'/'index.html').write_text(src,encoding='utf-8')
      before=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
      subprocess.run(['python',str(P)],cwd=d,check=True)
      a=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
      subprocess.run(['python',str(P)],cwd=d,check=True)
      b=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
      self.assertEqual(a,b)
      self.assertEqual(b.count('alpha44.js'),1)
      m=re.search(r"const APP_VERSION='1\.3\.0-alpha\.(\d+)\.(\d+)(?:\.(\d+))?';",b)
      self.assertIsNotNone(m)
      version=tuple(int(x or 0) for x in m.groups())
      self.assertGreaterEqual(version,(4,4,0))
      if "1.3.0-alpha.4.4.1" in before:
        self.assertIn("const APP_VERSION='1.3.0-alpha.4.4.1';",b)
        self.assertIn('ALPHA 4.4.1 · UX + Thesis Intelligence',b)
if __name__=='__main__': unittest.main()
