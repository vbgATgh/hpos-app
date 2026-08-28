import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(path):
    return json.loads((ROOT / path).read_text(encoding='utf-8'))


def test_constitution_has_required_hard_gates():
    c = load('config/hpos_constitution.json')
    assert c['halal']['H0'] == 'VETO_EXIT_REVIEW'
    assert c['halal']['H2'] == 'FREEZE_REVIEW'
    assert c['halal']['UNKNOWN'] == 'NO_NEW_BUY_OR_ADD'
    assert c['portfolioRules']['cash']['targetPct'] == 3
    assert c['portfolioRules']['cash']['relativeHardMinimumPct'] == 2
    assert c['portfolioRules']['cash']['absoluteHardFloorEur'] == 150
    assert c['portfolioRules']['healthcare']['hardCapPct'] == 30
    assert c['portfolioRules']['minimumEconomicPositionEur'] == 300
    assert c['portfolioRules']['t90Days'] == 90


def test_current_state_is_schema_only_and_private_by_design():
    schema = load('config/current_state.schema.json')
    assert 'Real portfolio state stays local/private' in schema['description']
    forbidden = [
        ROOT / 'data/current_state.json',
        ROOT / 'config/current_state.json',
        ROOT / 'data/portfolio/current_state.json',
    ]
    assert not any(p.exists() for p in forbidden)


def test_thesis_registry_is_separate_from_constitution():
    c = load('config/hpos_constitution.json')
    r = load('data/thesis_registry.json')
    assert 'assets' in r and len(r['assets']) >= 10
    dumped = json.dumps(c).upper()
    for asset in ['CRANEWARE', 'ABBOTT', 'FREQUENTIS', 'IVU_TRAFFIC']:
        assert asset not in dumped


def test_rotation_is_two_stage():
    c = load('config/hpos_constitution.json')
    r = c['rotation']
    assert set(['HALAL_H1','CAPS_OK','TRADEABLE','PORTFOLIO_ROLE_CLEAR','NET_EFFECT_ECONOMICALLY_SENSIBLE']).issubset(r['mandatoryEligibility'])
    assert r['requiresMeaningfulAdvantage'] is True
    assert r['neverBecauseOfRecentPricePerformanceAlone'] is True


def test_decision_order_preserves_hard_gate_priority():
    order = load('config/hpos_constitution.json')['decisionOrder']
    assert order[0] == 'HALAL_GATE'
    assert order.index('PORTFOLIO_FIT') < order.index('MARKET_TIMING')
    assert order.index('THESIS') < order.index('NEWS_EVIDENCE')
