from pathlib import Path
import json
import subprocess


ROOT = Path(__file__).resolve().parents[1]
API = (ROOT / "supabase/functions/hpos-api/index.ts").read_text()
ADAPTER = (ROOT / "app/parqet-supabase-adapter.js").read_text()
APP = (ROOT / "app/app.js").read_text()


def run_app_holding(current, previous=None):
    helper = next(line for line in ADAPTER.splitlines() if line.startswith("function moneyNumber"))
    fn = next(line for line in ADAPTER.splitlines() if line.startswith("function appHolding"))
    script = f"{helper};{fn};console.log(JSON.stringify(appHolding({json.dumps(current)},{json.dumps(previous)})))"
    return json.loads(subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout)


def run_activity_entry(root, isin, shares, holding_id=""):
    names = ["n", "money", "activityRows", "activitiesComplete", "activityIsin", "activityKind", "activityQuantity", "activityTotal", "activityUnitPrice", "entryFromActivities"]
    functions = []
    for name in names:
        start = API.index(f"function {name}(")
        opening = API.index("{", start)
        depth = 0
        end = opening
        for end in range(opening, len(API)):
            depth += API[end] == "{"
            depth -= API[end] == "}"
            if depth == 0:
                break
        functions.append(API[start:end + 1].replace("(v:any)", "(v)"))
    script = ";".join(functions) + f";console.log(entryFromActivities({json.dumps(root)},{json.dumps(isin)},{shares},{json.dumps(holding_id)}))"
    return float(subprocess.run(["node", "-e", script], check=True, capture_output=True, text=True).stdout)


def test_backend_accepts_parqet_average_and_total_cost_aliases():
    assert "function averageEntryPrice(position:any,shares:number)" in API
    for field in ["purchasePrice", "averagePrice", "averagePurchasePrice", "avgPrice"]:
        assert f"position?.{field}" in API
    for field in ["purchaseValue", "investedCapital", "totalPurchaseValue", "totalCost"]:
        assert f"position?.{field}" in API
    assert "total/shares" in API
    assert 'averagePriceSource:providerAverage>0?"PARQET_POSITION_PURCHASE_PRICE":activityAverage>0?"PARQET_ACTIVITY_RECONCILED":"UNAVAILABLE"' in API
    assert "purchasePrice:averagePrice" in API
    assert "purchaseValue:averagePrice>0?averagePrice*shares:0" in API


def test_frontend_derives_average_from_validated_total_cost():
    row = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415, "investedCapital": 137.08})
    assert abs(row["avg"] - 137.08 / 20.726415) < 1e-10
    assert row["avgSource"] == "PARQET_POSITION_PURCHASE_PRICE"


def test_frontend_accepts_structured_parqet_money_values():
    direct = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415, "averagePrice": {"value": 6.61, "currency": "CAD"}})
    total = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415, "investedCapital": {"amount": 137.08, "currency": "EUR"}})
    assert direct["avg"] == 6.61
    assert abs(total["avg"] - 137.08 / 20.726415) < 1e-10
    assert direct["avgSource"] == total["avgSource"] == "PARQET_POSITION_PURCHASE_PRICE"


def test_frontend_prefers_official_parqet_purchase_price_contract():
    row = run_app_holding({"isin": "CA14150G4007", "shares": 20.726415, "purchasePrice": 6.61, "purchaseValue": 137.08})
    assert row["avg"] == row["purchasePrice"] == 6.61
    assert abs(row["purchaseValue"] - 6.61 * 20.726415) < 1e-10


def test_backend_extracts_structured_money_values_without_using_market_price():
    assert "function money(v:any)" in API
    for field in ["v?.value", "v?.amount", "v?.price", "v?.numericValue", "v?.raw"]:
        assert field in API
    assert ".map(money).find(v=>v>0)" in API
    assert "currentPrice" not in API.split("function averageEntryPrice", 1)[1].split("function normalizeDividends", 1)[0]


def test_backend_reconstructs_weighted_cost_basis_and_reduces_sells_proportionally():
    root = {"activities": [
        {"type": "buy", "datetime": "2026-01-01", "asset": {"isin": "CA14150G4007"}, "shares": 10, "amount": 60},
        {"type": "buy", "datetime": "2026-02-01", "asset": {"isin": "CA14150G4007"}, "shares": 20, "amount": 150},
        {"type": "sell", "datetime": "2026-03-01", "asset": {"isin": "CA14150G4007"}, "shares": 5, "amount": 50},
    ]}
    assert run_activity_entry(root, "CA14150G4007", 25) == 7


def test_backend_rejects_unreconciled_or_structurally_incomplete_activity_history():
    buy = {"type": "buy", "asset": {"isin": "CA14150G4007"}, "shares": 20.726415, "amount": {"value": 137.08, "currency": "EUR"}}
    assert abs(run_activity_entry({"activities": [buy]}, "CA14150G4007", 20.726415) - 137.08 / 20.726415) < 1e-10
    assert run_activity_entry({"activities": [buy]}, "CA14150G4007", 21) == 0
    assert run_activity_entry({"activities": [buy], "nextCursor": "more"}, "CA14150G4007", 20.726415) == 0
    transfer = {"type": "transfer_in", "asset": {"isin": "CA14150G4007"}, "shares": 20.726415, "amount": 137.08}
    assert run_activity_entry({"activities": [transfer]}, "CA14150G4007", 20.726415) == 0


def test_backend_matches_official_activity_contract_by_holding_id():
    buy = {"type": "buy", "holdingId": "holding-cardinal", "shares": 20.726415, "price": 6.61}
    assert run_activity_entry({"activities": [buy]}, "CA14150G4007", 20.726415, "holding-cardinal") == 6.61


def test_backend_reports_activity_reconciliation_source_and_quality_counts():
    assert 'averagePriceSource:providerAverage>0?"PARQET_POSITION_PURCHASE_PRICE":activityAverage>0?"PARQET_ACTIVITY_RECONCILED":"UNAVAILABLE"' in API
    assert 'entryPricesFromActivities:holdings.filter(x=>x.averagePriceSource==="PARQET_ACTIVITY_RECONCILED").length' in API
    assert 'entryPricesUnavailable:holdings.filter(x=>x.averagePrice<=0).length' in API


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
    assert "function previousHoldings()" in ADAPTER
    assert "holdings:appHoldings(data.holdings)" in ADAPTER
    assert "payload={version:5" in ADAPTER


def test_missing_entry_price_forces_a_repair_sync_on_boot_and_visibility():
    repair_condition = "holdings.some(h=>h.shares>0&&h.avg<=0)"
    assert APP.count(repair_condition) == 2
    assert "appHoldings(data.holdings)" in ADAPTER
    assert "data.holdings.map(appHolding)" not in ADAPTER


def test_entry_quality_is_visible_for_every_holding():
    assert "function entrySourceLabel(v)" in APP
    assert "function entryCoverage()" in APP
    assert "Einstandsquelle" in APP
    assert "Einstandsdaten" in APP
    assert "${entryCoverage()}/${holdings.length} vollständig" in APP
