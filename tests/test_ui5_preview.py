from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'ui5' / 'index.html').read_text()

def test_ui5_has_five_primary_navigation_items():
    for label in ['Home','Portfolio','Analyse','Income','Mehr']:
        assert f'<span>{label}</span>' in HTML

def test_ui5_reads_local_state_and_has_no_hardcoded_portfolio_values():
    assert "localStorage.getItem" in HTML
    assert "hposStateV3" in HTML
    assert "9.938,88" not in HTML
    assert "Novo Nordisk" not in HTML

def test_ui5_keeps_decision_engine_separate():
    assert "UI v5 zeigt Ergebnisse" in HTML
    assert "erzeugt keine eigenen BUY/SELL-Signale" in HTML

def test_ui5_has_portfolio_and_asset_views():
    assert 'id="v-portfolio"' in HTML
    assert 'id="v-asset"' in HTML
    assert 'function openAsset' in HTML

def test_ui5_semantic_palette_exists():
    for token in ['--blue:#5b9cff','--green:#35c98a','--amber:#e9b44c','--red:#eb6a6a']:
        assert token in HTML
