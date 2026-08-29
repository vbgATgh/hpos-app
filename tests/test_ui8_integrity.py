from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / 'ui8' / 'index.html').read_text()


def test_ui8_primary_navigation_and_home_button():
    for label in ['Home','Portfolio','Analyse','Income','Mehr']:
        assert f'<span>{label}</span>' in HTML
    assert 'id="homeMark"' in HTML
    assert "$('#homeMark').onclick=()=>setView('home')" in HTML


def test_ui8_quote_integrity_blocks_implausible_live_values():
    assert 'function plausible' in HTML
    assert "status:'VALIDATED'" in HTML
    assert "status:lv?'LIVE_BLOCKED':'REFERENCE'" in HTML
    assert 'data/market/${key}.json' in HTML
    assert 'HPOS_MARKET' in HTML


def test_ui8_does_not_hardcode_portfolio_totals_or_trade_actions():
    assert '12.709,20' not in HTML
    assert '9.938,88' not in HTML
    assert 'BUY NOW' not in HTML
    assert 'SELL NOW' not in HTML
    assert 'Decision Engine bleibt Autorität' in HTML


def test_ui8_has_adjustable_monthly_income_goal():
    assert 'id="incomeGoal"' in HTML
    assert 'type="range"' in HTML
    assert "localStorage.setItem('hpos_income_goal'" in HTML
    assert 'id="incomeGoalBar"' in HTML
    assert 'id="incomeBars"' in HTML


def test_ui8_has_connected_investment_dossier():
    for label in ['Investmentprofil','Fundament & Thesis','Dividenden','Evidenz & Daten']:
        assert label in HTML
    assert '../data/fundamental/thesis_signals.json' in HTML
    assert '../data/fundamental/evidence.json' in HTML
    assert '../data/fundamental/coverage.json' in HTML
    assert 'function openAsset' in HTML


def test_ui8_more_modules_remain_functional():
    for module in ['halal','news','tax','sources','rules','diag']:
        assert f'data-module="{module}"' in HTML
    assert 'function module(m)' in HTML
