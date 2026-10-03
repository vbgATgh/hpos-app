from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
JS = (ROOT / "app/investment-case.js").read_text()
CSS = (ROOT / "app/investment-case.css").read_text()


def test_every_valid_isin_gets_the_new_case_shell():
    assert "reconcileCanonicalHalal(genericCase(id),id)" in JS
    assert "active=c;applyGates(c);renderGenericCase(c)" in JS
    assert "if(!id){clearCase();return}" in JS
    assert "$('#investmentCaseSection')?.remove();" not in JS


def test_generic_case_keeps_missing_evidence_open_or_locked():
    assert "function halalState()" in JS
    assert "PORTFOLIO FIT OFFEN" in JS
    assert "WARTET AUF HALAL" in JS
    assert JS.count("NOCH NICHT BEWERTET") >= 5
    assert "NUR EXTERN BEIM BROKER" in JS
    assert "Fehlende Daten erzeugen keine automatische Freigabe" in JS


def test_generic_case_uses_the_same_three_view_tabs():
    assert "function renderGenericCase(c)" in JS
    assert JS.count('data-case-tab="overview"') >= 2
    assert JS.count('data-case-tab="analysis"') >= 2
    assert JS.count('data-case-tab="evidence"') >= 2
    assert "caseProgressTrack" in JS
    assert ".casePendingList" in CSS


def test_generic_case_separates_complete_halal_sources_from_incomplete_investment_case():
    assert "function halalPrimarySources(evidence)" in JS
    assert "Halal-Primärquellen" in JS
    assert "Gate 1 ist separat dokumentiert; die Investment-Akte für Gates 2 bis 7 ist noch nicht vollständig." in JS
    assert "Noch zu ergänzen" in JS
    assert "Nur verifizierte Quellen und vollständige Pflichtdaten" in JS
    assert "HPOS führt keine Order aus" in JS


def test_halal_sources_do_not_mark_the_whole_investment_case_complete():
    assert "data-source-kind" in JS
    assert '.caseSources[data-source-kind="investment"]' in JS
    assert "sources(halalSources,'halal')" in JS


def test_switching_assets_reuses_only_the_matching_case():
    assert "active?.isin===id&&$('#investmentCaseSection')" in JS
    assert "function applyGates(c)" in JS
    assert "function clearCase()" in JS
