import unittest
from pathlib import Path

class Alpha441Tests(unittest.TestCase):
    def test_thesis_layer_contract(self):
        t=Path('alpha41/alpha441.js').read_text(encoding='utf-8')
        for token in ['Investmentthese','Invalidierung','Konfidenz','Portfolio-Fit','Was hat sich verändert?','HPOSThesis441']:
            self.assertIn(token,t)
        self.assertIn("hal==='H0'",t)
        self.assertIn("hal==='H2'",t)
        self.assertIn("UNKNOWN ist keine Kauf-/Aufstockungsfreigabe",t)
        self.assertNotIn('automatisches Kaufsignal', t.lower().replace('kein automatisches kaufsignal',''))

    def test_methodology_is_explicit(self):
        t=Path('docs/alpha441-thesis-methodology.md').read_text(encoding='utf-8')
        self.assertIn('These → Evidenz → Risiken → Katalysatoren → Invalidierung',t)
        self.assertIn('Harte Gates',t)
        self.assertIn('keine nicht belegten Agentenregeln erfunden',t)

    def test_patcher_contract(self):
        t=Path('scripts/apply_hpos_alpha441.py').read_text(encoding='utf-8')
        self.assertIn("1.3.0-alpha.4.4.1",t)
        self.assertIn('alpha441.js',t)
        self.assertIn('exakt einmal',t)

if __name__=='__main__': unittest.main()
