#!/usr/bin/env python3
"""Build auditable 36-month average market values without accounts or API keys."""

from __future__ import annotations

import datetime as dt
import json
import re
import time
import urllib.request
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
FINANCIAL_EVIDENCE = ROOT / "data" / "halal_financial_evidence.json"
MARKET_EVIDENCE = ROOT / "data" / "halal_market_value_36m.json"
START = dt.date(2023, 9, 1)
END = dt.date(2026, 8, 31)
ASSETS = {
    "US0028241000": {"symbol": "ABT", "cik": "0000001800", "name": "Abbott Laboratories"},
    "US5797802064": {"symbol": "MKC", "cik": "0000063754", "name": "McCormick & Company"},
    "IE00BTN1Y115": {"symbol": "MDT", "cik": "0001613103", "name": "Medtronic plc"},
    "US58933Y1055": {"symbol": "MRK", "cik": "0000310158", "name": "Merck & Co., Inc."},
    "US94106L1098": {"symbol": "WM", "cik": "0000823768", "name": "Waste Management, Inc."},
    "US4781601046": {"symbol": "JNJ", "cik": "0000200406", "name": "Johnson & Johnson"},
}
NASDAQ_HEADERS = {
    "User-Agent": "Mozilla/5.0",
    "Accept": "application/json, text/plain, */*",
    "Origin": "https://www.nasdaq.com",
    "Referer": "https://www.nasdaq.com/",
}
SEC_HEADERS = {"User-Agent": "HPOS research vbgATgh GitHub", "Accept": "application/json,text/html"}


def fetch(url: str, headers: dict[str, str]) -> bytes:
    error = None
    for attempt in range(3):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=headers), timeout=45) as response:
                return response.read()
        except Exception as exc:  # pragma: no cover - network recovery
            error = exc
            time.sleep(2 * (attempt + 1))
    raise RuntimeError(f"Failed to fetch {url}: {error}")


def nasdaq_month_ends(symbol: str) -> tuple[str, list[dict]]:
    url = (
        f"https://api.nasdaq.com/api/quote/{symbol}/historical"
        f"?assetclass=stocks&fromdate=2023-08-01&limit=5000"
    )
    payload = json.loads(fetch(url, NASDAQ_HEADERS))
    rows = ((payload.get("data") or {}).get("tradesTable") or {}).get("rows") or []
    months: dict[str, dict] = {}
    for row in rows:
        date = dt.datetime.strptime(row["date"], "%m/%d/%Y").date()
        if not START <= date <= END:
            continue
        month = date.strftime("%Y-%m")
        close = float(row["close"].replace("$", "").replace(",", ""))
        if month not in months or date > dt.date.fromisoformat(months[month]["date"]):
            months[month] = {"month": month, "date": date.isoformat(), "closeUsd": close}
    result = [months[key] for key in sorted(months)]
    if len(result) != 36:
        raise ValueError(f"{symbol}: expected 36 complete months, found {len(result)}")
    return url, result


def companyfacts_shares(cik: str) -> tuple[str, list[dict]]:
    url = f"https://data.sec.gov/api/xbrl/companyfacts/CIK{cik}.json"
    payload = json.loads(fetch(url, SEC_HEADERS))
    facts = payload["facts"]["dei"]["EntityCommonStockSharesOutstanding"]["units"]["shares"]
    points: dict[str, dict] = {}
    for fact in facts:
        if fact.get("form") not in {"10-K", "10-Q", "20-F"}:
            continue
        date = fact["end"]
        candidate = {
            "date": date,
            "shares": int(fact["val"]),
            "filed": fact.get("filed", ""),
            "accession": fact.get("accn", ""),
            "sourceUrl": url,
        }
        if date not in points or candidate["filed"] > points[date]["filed"]:
            points[date] = candidate
    return url, [points[key] for key in sorted(points)]


def parse_attributes(raw: str) -> dict[str, str]:
    return {key.lower(): value for key, _, value in re.findall(r"([\w:.-]+)\s*=\s*([\"'])(.*?)\2", raw)}


def mkc_filing_shares() -> tuple[str, list[dict]]:
    submissions_url = "https://data.sec.gov/submissions/CIK0000063754.json"
    payload = json.loads(fetch(submissions_url, SEC_HEADERS))
    recent = payload["filings"]["recent"]
    points: dict[str, dict] = {}
    for index, form in enumerate(recent["form"]):
        filed = recent["filingDate"][index]
        if form not in {"10-K", "10-Q"} or not "2023-01-01" <= filed <= "2026-09-01":
            continue
        accession = recent["accessionNumber"][index]
        accession_path = accession.replace("-", "")
        document = recent["primaryDocument"][index]
        filing_url = f"https://www.sec.gov/Archives/edgar/data/63754/{accession_path}/{document}"
        raw = fetch(filing_url, SEC_HEADERS).decode("utf-8", "ignore")
        contexts = {}
        for match in re.finditer(r"<xbrli:context\b([^>]*)>(.*?)</xbrli:context>", raw, re.I | re.S):
            attrs = parse_attributes(match.group(1))
            instant = re.search(r"<xbrli:instant>(\d{4}-\d{2}-\d{2})</xbrli:instant>", match.group(2), re.I)
            if attrs.get("id") and instant:
                contexts[attrs["id"]] = instant.group(1)
        totals: dict[str, int] = {}
        for match in re.finditer(r"<ix:nonfraction\b([^>]*)>([^<]+)</ix:nonfraction>", raw, re.I):
            attrs = parse_attributes(match.group(1))
            if attrs.get("name", "").lower() != "dei:entitycommonstocksharesoutstanding":
                continue
            date = contexts.get(attrs.get("contextref", ""))
            if not date:
                continue
            value = float(re.sub(r"[^0-9.-]", "", match.group(2))) * (10 ** int(attrs.get("scale", "0")))
            totals[date] = totals.get(date, 0) + int(round(value))
        for date, shares in totals.items():
            candidate = {
                "date": date,
                "shares": shares,
                "filed": filed,
                "accession": accession,
                "sourceUrl": filing_url,
            }
            if date not in points or candidate["filed"] > points[date]["filed"]:
                points[date] = candidate
    result = [points[key] for key in sorted(points)]
    if not result:
        raise ValueError("MKC: no class-aggregated cover-page share facts found")
    return submissions_url, result


def latest_prior(points: list[dict], date: str) -> dict:
    eligible = [point for point in points if point["date"] <= date]
    if not eligible:
        raise ValueError(f"No reported shares available on or before {date}")
    return eligible[-1]


def main() -> None:
    result = {
        "schemaVersion": 1,
        "generatedAt": "2026-09-10",
        "period": {"start": START.isoformat(), "end": END.isoformat(), "months": 36},
        "method": "LAST_TRADING_DAY_EACH_FULL_MONTH_X_LATEST_PRIOR_REPORTED_SHARES",
        "policy": {
            "accountsRequired": False,
            "priceSource": "NASDAQ_OFFICIAL_HISTORICAL",
            "sharesSource": "SEC_EDGAR_FILINGS",
            "note": "McCormick includes both reported common-stock classes. Values are historical market-value approximations because reported shares are carried forward between filing dates.",
        },
        "assets": {},
    }
    financials = json.loads(FINANCIAL_EVIDENCE.read_text())
    financials["updatedAt"] = "2026-09-10"
    for isin, asset in ASSETS.items():
        price_url, prices = nasdaq_month_ends(asset["symbol"])
        shares_url, share_points = mkc_filing_shares() if asset["symbol"] == "MKC" else companyfacts_shares(asset["cik"])
        observations = []
        for price in prices:
            shares = latest_prior(share_points, price["date"])
            observations.append(
                {
                    **price,
                    "sharesDate": shares["date"],
                    "sharesOutstanding": shares["shares"],
                    "sharesSourceUrl": shares["sourceUrl"],
                    "marketValueUsd": round(price["closeUsd"] * shares["shares"], 2),
                }
            )
        average = round(sum(item["marketValueUsd"] for item in observations) / 36, 2)
        result["assets"][isin] = {
            "name": asset["name"],
            "symbol": asset["symbol"],
            "averageMarketValueUsd": average,
            "priceSourceUrl": price_url,
            "sharesIndexUrl": shares_url,
            "observations": observations,
        }
        financials["assets"][isin]["metrics"]["marketValue36mAvg"] = {
            "value": average,
            "unit": "USD",
            "period": "2023-09 to 2026-08",
            "months": 36,
            "method": result["method"],
            "sourceName": "Nasdaq historical prices plus SEC EDGAR reported shares",
            "sourceUrl": price_url,
            "supportingSources": [{"name": "SEC EDGAR shares", "url": shares_url}],
            "label": "36 full-month average market value; month-end close multiplied by latest prior reported shares",
        }
    MARKET_EVIDENCE.write_text(json.dumps(result, indent=2, ensure_ascii=False) + "\n")
    FINANCIAL_EVIDENCE.write_text(json.dumps(financials, indent=2, ensure_ascii=False) + "\n")


if __name__ == "__main__":
    main()
