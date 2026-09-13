from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "app/index.html").read_text()
APP = (ROOT / "app/app.js").read_text()
CASE = (ROOT / "app/investment-case.js").read_text()
HALAL = (ROOT / "app/halal-evidence.js").read_text()
INTELLIGENCE = (ROOT / "app/asset-intelligence.js").read_text()
CSS = (ROOT / "app/asset-cockpit.css").read_text()


def test_asset_header_is_compact_and_identity_centered():
    assert 'class="assetHero"' in HTML
    assert 'id="assetMark"' in HTML
    assert 'id="assetHeroStatus"' in HTML
    assert "$('#assetMark').textContent=initials(source.name)" in APP
    assert "$('#assetHeroStatus').className='assetHeroStatus '+halalClass" in APP
    assert "#asset #assetName" in CSS


def test_halal_status_stays_synchronized_across_the_asset_view():
    assert "function syncHeroHalal(state)" in HALAL
    assert "syncHeroHalal(e.state)" in HALAL
    assert "halalLabel==='HALALKONFORM'?'pos'" in APP
    assert "halalLabel==='NICHT HALALKONFORM'?'neg':'warn'" in APP


def test_gate_progress_is_derived_from_the_eight_real_states():
    assert "function progressVisual(c)" in CASE
    assert "pending=['OPEN_REVIEW','LOCKED','UNKNOWN','NOT_EVALUATED']" in CASE
    assert "for(const g of gates)" in CASE
    assert "if(!g||pending.includes(g.state))break" in CASE
    assert "8 von 8 Gates ausgewertet" in CASE
    assert CASE.count("${progressVisual(c)}") == 2


def test_long_asset_sections_use_progressive_disclosure():
    assert HTML.count('class="section assetDisclosure"') >= 3
    assert "document.createElement('details')" in HALAL
    assert "document.createElement('details')" in INTELLIGENCE
    assert ".assetDisclosure>summary" in CSS


def test_status_colors_have_one_consistent_meaning():
    assert ".caseDecision.pos" in CSS
    assert ".caseDecision.warn" in CSS
    assert ".caseDecision.neg" in CSS
    assert ".caseVisual>span.pos" in CSS
    assert ".caseVisual>span.warn" in CSS
    assert ".caseVisual>span.neg" in CSS
