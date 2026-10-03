from pathlib import Path
import json
import subprocess


ROOT = Path(__file__).resolve().parents[1]
MODULE = ROOT / "supabase" / "functions" / "hpos-screen" / "issuer-report.js"
SCREEN = (ROOT / "supabase" / "functions" / "hpos-screen" / "index.ts").read_text(encoding="utf-8")


def test_generic_machine_contains_no_per_stock_identity_rules():
    code = MODULE.read_text(encoding="utf-8")
    for forbidden in ["Savaria", "McCormick", "Cardinal Energy", "SIS.TO", "MKC", "CA8051121090"]:
        assert forbidden not in code
    assert "discoverReport(website)" in code
    assert 'import("npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs")' in code
    assert 'source: "ISSUER_REPORT_GENERIC"' in code
    assert 'nonPermissibleIncome: null' in code


def test_strict_extractor_reads_reported_values_and_keeps_missing_data_open():
    filler = "Issuer official financial report audited statements " * 30
    fixture = f"""
    [PAGE 1]
    Example Mobility Corporation Annual Report. Fiscal year ended December 31, 2025.
    All tabular amounts are in thousands of Canadian dollars unless otherwise indicated.
    The corporation is a global accessibility products manufacturer serving people with mobility challenges.
    {filler}
    [PAGE 42]
    Total current assets 296,910 277,100
    [PAGE 43]
    Revenue 913,527 850,000
    [PAGE 67]
    Interest income 497 402
    [PAGE 72]
    Total debt 210,134 205,000
    """
    script = """
      import {extractOfficialReportText} from %s;
      const raw = JSON.parse(process.argv[1]);
      const result = extractOfficialReportText(raw, {
        identity: {name: 'Example Mobility Corporation', isin: 'CA0000000001'},
        reportUrl: 'https://issuer.example/annual-report-2025.pdf',
        sourcePageUrl: 'https://issuer.example/investors/reports',
        pageCount: 72
      });
      console.log(JSON.stringify(result));
    """ % json.dumps(MODULE.as_uri())
    completed = subprocess.run(
        ["node", "--input-type=module", "-e", script, json.dumps(fixture)],
        check=True,
        capture_output=True,
        text=True,
    )
    result = json.loads(completed.stdout)
    assert result["financial"]["revenue"] == 913_527_000
    assert result["financial"]["totalDebt"] == 210_134_000
    assert result["financial"]["interestBearingAssetsUpperBound"] == 296_910_000
    assert result["financial"]["interestIncome"] == 497_000
    assert result["financial"]["nonPermissibleIncome"] is None
    assert {item["location"] for item in result["evidence"] if item["metric"] != "businessProfile"} == {
        "page:42", "page:43", "page:67", "page:72"
    }


def test_null_is_not_zero_and_market_method_conflict_requires_review():
    assert "finiteNonNegative(a) && finitePositive(d)" in SCREEN
    assert 'source: debt == null ? "MISSING" : debt > RULES.interestDebtMax ? "METHOD_REVIEW_CURRENT_MARKET_CAP"' in SCREEN
    assert "Fachliche Prüfung nötig" in SCREEN
    assert 'state: !marketOk || debt == null ? "OPEN" : debt <= RULES.interestDebtMax ? "PASS" : "OPEN"' in SCREEN
