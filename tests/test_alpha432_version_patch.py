import tempfile
import unittest
from pathlib import Path
import subprocess

ROOT=Path(__file__).resolve().parents[1]
P431=ROOT/'scripts'/'apply_hpos_alpha431.py'
P432=ROOT/'scripts'/'apply_hpos_alpha432.py'

class VersionPatchTests(unittest.TestCase):
    def run_case(self, version):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);(d/'alpha41').mkdir()
            (d/'alpha41'/'index.html').write_text(
                f"<title>HPOS Alpha 4.3.1 · Usability</title>\nALPHA 4.3.1 · Usability\nconst APP_VERSION='{version}';\n<script src=\"./alpha43.js\"></script>\n<script src=\"./alpha431.js\"></script>\n",
                encoding='utf-8')
            subprocess.run(['python',str(P431)],cwd=d,check=True)
            subprocess.run(['python',str(P432)],cwd=d,check=True)
            first=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
            subprocess.run(['python',str(P431)],cwd=d,check=True)
            subprocess.run(['python',str(P432)],cwd=d,check=True)
            second=(d/'alpha41'/'index.html').read_text(encoding='utf-8')
            self.assertEqual(first,second)
            self.assertIn("const APP_VERSION='1.3.0-alpha.4.3.2';",second)
            self.assertNotIn("1.3.0-alpha.4.3.1.2",second)
            self.assertEqual(second.count('alpha432.js'),1)

    def test_clean_431(self): self.run_case('1.3.0-alpha.4.3.1')
    def test_known_bad_4312(self): self.run_case('1.3.0-alpha.4.3.1.2')

    def test_newer_433_is_never_downgraded(self):
        with tempfile.TemporaryDirectory() as d:
            d=Path(d);(d/'alpha41').mkdir()
            original=(
                "<title>HPOS Alpha 4.3.3 · Privacy Boundary</title>\n"
                "ALPHA 4.3.3 · Privacy Boundary\n"
                "const APP_VERSION='1.3.0-alpha.4.3.3';\n"
                "<script src=\"./alpha43.js\"></script>\n"
                "<script src=\"./alpha431.js\"></script>\n"
                "<script src=\"./alpha432.js\"></script>\n"
                "<script src=\"./alpha433.js\"></script>\n"
            )
            path=d/'alpha41'/'index.html';path.write_text(original,encoding='utf-8')
            subprocess.run(['python',str(P432)],cwd=d,check=True)
            once=path.read_text(encoding='utf-8')
            subprocess.run(['python',str(P432)],cwd=d,check=True)
            twice=path.read_text(encoding='utf-8')
            self.assertEqual(original,once)
            self.assertEqual(once,twice)
            self.assertIn("const APP_VERSION='1.3.0-alpha.4.3.3';",twice)
            self.assertIn('ALPHA 4.3.3 · Privacy Boundary',twice)
            self.assertEqual(twice.count('alpha432.js'),1)

if __name__=='__main__': unittest.main()
