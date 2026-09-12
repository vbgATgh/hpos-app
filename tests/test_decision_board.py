from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
HTML = (ROOT / "app" / "index.html").read_text()
BOARD = (ROOT / "app" / "decision-board.js").read_text()
HARDENING = (ROOT / "app" / "mvp-hardening.js").read_text()
RUNTIME = (ROOT / "app" / "runtime-config.js").read_text()


def test_decision_board_is_mounted_and_versioned():
    assert 'id="decisionBoardSection"' in HTML
    assert 'id="decisionBoardSummary"' in HTML
    assert 'id="decisionBoardFilters"' in HTML
    assert 'id="decisionBoard"' in HTML
    assert 'decision-board.css?v=20260911-board2' in HTML
    assert 'decision-board.js?v=20260911-board2' in HTML
    assert "Portfolio Intelligence · v8.7.55" in HTML
    assert "version:'8.7.55'" in RUNTIME


def test_gate_order_is_fail_closed():
    fail = BOARD.index("if(FAIL.has(hs))")
    unknown = BOARD.index("if(!PASS.has(hs))")
    review = BOARD.index("if(value<300)")
    assert fail < unknown < review
    assert "Das Halal-Veto hat höchste Priorität." in BOARD
    assert "Halal steht vor Rendite, Kurs und Dividende." in BOARD


def test_board_explains_each_template_without_trade_instruction():
    for label in ["Gewinnende Regel", "Blockierende Regel", "Kleinster nächster Schritt"]:
        assert label in BOARD
    for status in ["OPEN_REVIEW", "FREEZE", "REVIEW", "EXIT_REVIEW"]:
        assert status in BOARD
    assert "BUY" not in BOARD
    assert "SELL" not in BOARD
    assert "Keine automatische Order." in BOARD


def test_gate_two_is_not_misrepresented_as_released():
    assert "Halalkonform · Gate 2 freigegeben" not in HARDENING
    assert "Gate 1 bestanden · Gate 2 prüfbar" in HARDENING


def test_mobile_board_defaults_to_top_five_and_keeps_details_optional():
    assert "filtered.slice(0,5)" in BOARD
    assert "Nächste Entscheidungen" in BOARD
    assert "weitere Werte anzeigen" in BOARD
    assert "Auf Top 5 reduzieren" in BOARD
    assert '<details class="decisionDetails">' in BOARD
    assert "Investment-Akte öffnen" in BOARD


def test_completed_case_is_used_before_generic_small_position_review():
    assert "data/investment_cases/index.json" in BOARD
    assert "if(investmentCase)return" in BOARD
    assert BOARD.index("if(investmentCase)return") < BOARD.index("if(value<300)")
    assert "Gate 2 geprüft · keine Aufstockungsfreigabe" in BOARD
