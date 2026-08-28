import importlib.util, unittest
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]

def mod():
    spec=importlib.util.spec_from_file_location('ir',ROOT/'scripts/fetch_ir_fundamentals.py')
    m=importlib.util.module_from_spec(spec); spec.loader.exec_module(m); return m

class IRAdapterTests(unittest.TestCase):
    def test_category_mapping(self):
        m=mod()
        self.assertEqual(m.category('Q2 2026 Financial Results'),'EARNINGS')
        self.assertEqual(m.category('Dividend announcement'),'DIVIDEND')
        self.assertEqual(m.category('Guidance update'),'GUIDANCE')
    def test_link_parser(self):
        m=mod(); p=m.P(); p.feed('<a href="/investors/q2-results">Q2 2026 results</a>')
        self.assertEqual(p.rows,[('Q2 2026 results','/investors/q2-results')])
