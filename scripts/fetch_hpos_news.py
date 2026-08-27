#!/usr/bin/env python3
"""HPOS News Automation 4.1.4.

Standardbibliothek only, kein API-Key. Google News RSS dient als Discovery-Schicht.
Das Skript bewertet Meldungen nicht als Kauf/Verkauf und erzeugt kein Sentiment.
"""
from __future__ import annotations

import datetime as dt
import email.utils
import hashlib
import html
import json
import re
import sys
import urllib.parse
import urllib.request
import xml.etree.ElementTree as ET
from collections import Counter
from pathlib import Path
from typing import Any
from urllib.parse import urlparse

ROOT = Path(__file__).resolve().parents[1]
CONFIG_PATH = ROOT / "config" / "news_sources.json"
FEED_PATH = ROOT / "data" / "news" / "news_feed.json"
STATUS_PATH = ROOT / "data" / "news" / "news_status.json"
USER_AGENT = "HPOS-NewsBot/1.2 (+GitHub Actions; personal portfolio research)"
TIMEOUT = 20


def utc_now() -> dt.datetime:
    return dt.datetime.now(dt.timezone.utc)


def iso_z(value: dt.datetime | None = None) -> str:
    value = value or utc_now()
    return value.astimezone(dt.timezone.utc).replace(microsecond=0).isoformat().replace("+00:00", "Z")


def load_json(path: Path, fallback: Any) -> Any:
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return fallback


def write_json(path: Path, obj: Any, *, compact: bool = False) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    if compact:
        text = json.dumps(obj, ensure_ascii=False, separators=(",", ":")) + "\n"
    else:
        text = json.dumps(obj, ensure_ascii=False, indent=2) + "\n"
    path.write_text(text, encoding="utf-8")


def clean_text(value: str | None) -> str:
    value = html.unescape(value or "")
    value = re.sub(r"<[^>]+>", " ", value)
    return re.sub(r"\s+", " ", value).strip()


def domain_of(url: str | None) -> str:
    if not url:
        return ""
    try:
        host = urlparse(url).netloc.lower()
    except Exception:
        return ""
    return host[4:] if host.startswith("www.") else host


def is_primary(source_url: str | None, domains: list[str]) -> bool:
    host = domain_of(source_url)
    return any(host == d.lower() or host.endswith("." + d.lower()) for d in domains)


def parse_rfc822(value: str | None) -> dt.datetime | None:
    if not value:
        return None
    try:
        parsed = email.utils.parsedate_to_datetime(value)
        if parsed.tzinfo is None:
            parsed = parsed.replace(tzinfo=dt.timezone.utc)
        return parsed.astimezone(dt.timezone.utc)
    except Exception:
        return None


def stable_id(asset_key: str, title: str, link: str, published: str) -> str:
    raw = f"{asset_key}|{title}|{link}|{published}".encode("utf-8")
    return "news_" + hashlib.sha256(raw).hexdigest()[:24]


def request_bytes(url: str) -> bytes:
    req = urllib.request.Request(url, headers={
        "User-Agent": USER_AGENT,
        "Accept": "application/rss+xml, application/xml, text/xml, */*",
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.7",
    })
    with urllib.request.urlopen(req, timeout=TIMEOUT) as response:
        return response.read()


def google_news_url(query: str, lang: str, country: str) -> str:
    params = {"q": query, "hl": f"{lang}-{country}", "gl": country, "ceid": f"{country}:{lang}"}
    return "https://news.google.com/rss/search?" + urllib.parse.urlencode(params)


def parse_google_rss(xml_bytes: bytes, asset: dict[str, Any], fetched_at: str,
                     lookback_days: int, max_items: int) -> list[dict[str, Any]]:
    root = ET.fromstring(xml_bytes)
    cutoff = utc_now() - dt.timedelta(days=lookback_days)
    out: list[dict[str, Any]] = []
    for item in root.findall(".//item")[:max_items]:
        title = clean_text(item.findtext("title"))
        link = clean_text(item.findtext("link"))
        pub_dt = parse_rfc822(clean_text(item.findtext("pubDate")))
        if pub_dt and pub_dt < cutoff:
            continue
        source_node = item.find("source")
        source_name = clean_text(source_node.text if source_node is not None else "")
        source_url = source_node.attrib.get("url") if source_node is not None else None
        published_at = iso_z(pub_dt) if pub_dt else None
        if not title or not link:
            continue
        out.append({
            "newsId": stable_id(asset["assetKey"], title, link, published_at or ""),
            "assetKey": asset["assetKey"],
            "title": title,
            "source": source_name or "Quelle unbekannt",
            "sourceUrl": source_url,
            "url": link,
            "publishedAt": published_at,
            "primarySource": is_primary(source_url, asset.get("primaryDomains", [])),
        })
    return out


def compact_item(item: dict[str, Any]) -> dict[str, Any]:
    return {k: item.get(k) for k in (
        "newsId", "assetKey", "title", "source", "sourceUrl", "url", "publishedAt", "primarySource"
    ) if item.get(k) is not None}


def dedupe(items: list[dict[str, Any]]) -> list[dict[str, Any]]:
    seen_ids: set[str] = set()
    seen_titles: set[tuple[str, str]] = set()
    out: list[dict[str, Any]] = []
    items = sorted(items, key=lambda x: x.get("publishedAt") or "", reverse=True)
    for item in items:
        nid = item.get("newsId", "")
        title_key = (item.get("assetKey", ""), re.sub(r"\W+", "", item.get("title", "").lower()))
        if nid in seen_ids or title_key in seen_titles:
            continue
        if nid:
            seen_ids.add(nid)
        seen_titles.add(title_key)
        out.append(compact_item(item))
    return out


def prune(items: list[dict[str, Any]], retention_days: int) -> list[dict[str, Any]]:
    cutoff = utc_now() - dt.timedelta(days=retention_days)
    out = []
    for item in items:
        stamp = item.get("publishedAt")
        try:
            parsed = dt.datetime.fromisoformat(stamp.replace("Z", "+00:00")) if stamp else None
        except Exception:
            parsed = None
        if parsed is None or parsed >= cutoff:
            out.append(item)
    return out


def asset_index(config: dict[str, Any]) -> dict[str, Any]:
    return {
        a["assetKey"]: {
            "name": a.get("name"), "ticker": a.get("ticker"), "isin": a.get("isin"),
            "aliases": a.get("aliases", []), "scope": a.get("scope", "PORTFOLIO"),
            "enabled": bool(a.get("enabled")),
        }
        for a in config.get("assets", [])
    }


def main() -> int:
    config = load_json(CONFIG_PATH, None)
    if not config:
        print(f"Konfiguration fehlt: {CONFIG_PATH}", file=sys.stderr)
        return 2

    old_feed = load_json(FEED_PATH, {"items": []})
    old_items = old_feed.get("items", []) if isinstance(old_feed, dict) else []
    fetched_at = iso_z()
    all_new: list[dict[str, Any]] = []
    query_results: list[dict[str, Any]] = []

    provider = config.get("providers", {}).get("googleNewsRss", {})
    if not provider.get("enabled", True):
        print("Google News RSS ist deaktiviert.", file=sys.stderr)
        return 2

    lang, country = config.get("language", "de"), config.get("country", "DE")
    lookback_days = int(config.get("lookbackDays", 14))
    retention_days = int(config.get("retentionDays", 45))
    max_items = int(config.get("maxItemsPerQuery", 20))
    max_stored = int(config.get("maxStoredItems", 250))
    enabled_assets = [a for a in config.get("assets", []) if a.get("enabled")]
    index = asset_index(config)

    for asset in enabled_assets:
        for query in asset.get("queries", []):
            url = google_news_url(query, lang, country)
            try:
                payload = request_bytes(url)
                items = parse_google_rss(payload, asset, fetched_at, lookback_days, max_items)
                all_new.extend(items)
                query_results.append({"assetKey": asset["assetKey"], "query": query, "ok": True, "items": len(items)})
                print(f"[OK] {asset['assetKey']}: {query} -> {len(items)}")
            except Exception as exc:
                query_results.append({"assetKey": asset["assetKey"], "query": query, "ok": False, "items": 0,
                                      "error": f"{type(exc).__name__}: {exc}"})
                print(f"[FEHLER] {asset['assetKey']}: {query} -> {exc}", file=sys.stderr)

    ok_count = sum(1 for q in query_results if q["ok"])
    fail_count = len(query_results) - ok_count
    merged = prune(dedupe(all_new + old_items), retention_days)[:max_stored]
    by_asset = Counter(x.get("assetKey") or "UNKNOWN" for x in merged)
    by_scope = Counter((index.get(x.get("assetKey"), {}) or {}).get("scope", "UNKNOWN") for x in merged)

    if ok_count > 0:
        write_json(FEED_PATH, {
            "schemaVersion": 1,
            "generatedAt": fetched_at,
            "provider": "GOOGLE_NEWS_RSS",
            "lookbackDays": lookback_days,
            "retentionDays": retention_days,
            "count": len(merged),
            "assetIndex": index,
            "items": merged,
        }, compact=True)

    if ok_count == 0:
        state, message = "ERROR", "Kein News-Abruf erfolgreich. Letzter vorhandener Feed bleibt unverändert."
    elif fail_count:
        state, message = "STALE", f"News nur teilweise aktualisiert: {ok_count} Abfragen erfolgreich, {fail_count} fehlgeschlagen."
    else:
        state, message = "CURRENT", f"News-Abruf erfolgreich: {ok_count} Abfragen geprüft."

    previous_status = load_json(STATUS_PATH, {})
    write_json(STATUS_PATH, {
        "schemaVersion": 1,
        "state": state,
        "source": "github-actions/google-news-rss",
        "asOf": fetched_at if ok_count else previous_status.get("asOf"),
        "lastAttemptAt": fetched_at,
        "message": message,
        "queriesTotal": len(query_results),
        "queriesOk": ok_count,
        "queriesFailed": fail_count,
        "articlesFetchedThisRun": len(all_new),
        "articlesStored": len(merged) if ok_count else len(old_items),
        "articlesByAsset": dict(sorted(by_asset.items())),
        "articlesByScope": dict(sorted(by_scope.items())),
        "queryResults": query_results,
    })
    return 0 if ok_count else 1


if __name__ == "__main__":
    raise SystemExit(main())
