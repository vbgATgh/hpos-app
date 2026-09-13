from pathlib import Path
import json
import subprocess


ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / "supabase/functions/hpos-api/index.ts").read_text()
ADAPTER = (ROOT / "app/parqet-supabase-adapter.js").read_text()
APP = (ROOT / "app/app.js").read_text()


def run_app_holding(current, previous=None):
    fn = next(line for line in ADAPTER.splitlines() if line.startswith("function appHolding"))
    script = f"{fn};console.log(JSON.stringify(appHolding({json.dumps(current)},{json.dumps(previous)})))"
    return json.loads(subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout)


def test_backend_accepts_parqet_average_and_total_cost_aliases():
    assert "function averageEntryPrice(position:any,shares:number)" in API
    for field in ["purchasePrice", "averagePrice", "averagePurchasePrice", "avgPrice"]:
        assert f"position?.{field}" in API
    for field in ["purchaseValue", "investedCapital", "totalPurchaseValue", "totalCost"]:
        assert f"position?.{field}" in API
    assert "total/shares" in API
    assert 'averagePriceSource:averagePrice>0?"PARQET":"UNAVAILABLE"' in API


def test_frontend_derives_average_from_validated_total_cost():
    row = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415, "investedCapital": 137.08})
    assert abs(row["avg"] - 137.08 / 20.726415) < 1e-10
    assert row["avgSource"] == "PARQET"


def test_frontend_preserves_last_valid_average_only_when_shares_are_unchanged():
    previous = {"isin": "CA14150G4007", "shares": 20.726415, "averagePrice": 6.61}
    stable = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415}, previous)
    changed = run_app_holding({"isin": "CA14150G4007", "shares": 21}, previous)
    assert stable["avg"] == 6.61
    assert stable["avgSource"] == "PREVIOUS_VALIDATED"
    assert changed["avg"] == 0
    assert changed["avgSource"] == "UNAVAILABLE"


def test_entry_source_survives_app_normalization_for_diagnostics():
    assert "avgSource:String(h.avgSource??h.averagePriceSource??'')" in APP
    assert "previousByIsin" in ADAPTER
    assert "payload={version:4" in ADAPTER
