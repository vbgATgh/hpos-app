from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]

def test_alpha471_layer_exists_and_is_fail_closed():
    js=(ROOT/'alpha41'/'alpha471.js').read_text()
    assert "Alpha 4.7.1" in js
    assert "purchasePrice" in js
    assert "avgEntryPrice" in js
    assert "avgCost" in js


def test_asset_primary_tabs_are_reduced():
    js=(ROOT/'alpha41'/'alpha471.js').read_text()
    assert "['halal','news']" in js
    assert "Historie" in js
    assert "Analyse" in js
    assert "Übersicht" in js


def test_progressive_disclosure_keeps_allocation_out_of_overview():
    js=(ROOT/'alpha41'/'alpha471.js').read_text()
    assert '#alpha47Allocation' in js
    assert 'a471-analysis-only' in js
    assert 'a471-overview-only' in js


def test_isolated_test_entrypoint_injects_layer():
    html=(ROOT/'alpha471'/'index.html').read_text()
    assert '../alpha41/index.html' in html
    assert 'alpha471.js?v=471' in html
    assert "cache:'no-store'" in html


def test_privacy_projection_exposes_canonical_entry_aliases():
    shim=(ROOT/'alpha41'/'privacy-local43-shim.js').read_text()
    assert 'const averageEntryPrice=' in shim
    assert 'avgEntryPrice:averageEntryPrice' in shim
    assert 'avgCost:averageEntryPrice' in shim
    assert 'purchasePrice:averageEntryPrice' in shim
