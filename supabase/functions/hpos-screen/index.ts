import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SEC_TICKERS } from "./sec-tickers.ts";

const APP_ORIGIN = "https://vbgatgh.github.io";
const YAHOO = "https://query1.finance.yahoo.com";
const SEC = "https://data.sec.gov";
const OPENFIGI = "https://api.openfigi.com/v3/mapping";
const SESSION_TTL = 12 * 60 * 60 * 1000;
const RESULT_TTL = 7 * 24 * 60 * 60 * 1000;
const SEC_AGENT = "HPOS Portfolio Intelligence contact@vbgatgh.github.io";
const RULES = Object.freeze({ impureIncomeMax: .05, interestAssetsMax: .30, interestDebtMax: .30 });

type IdentityInput = { isin?: string; ticker?: string; symbol?: string; exchange?: string; name?: string; source?: string };
type EvidenceItem = { metric: string; value: number | string; unit: string; period: string; sourceName: string; sourceUrl: string; accession?: string; tag?: string; method?: string; quality: "OFFICIAL" | "MARKET" | "DISCOVERY" };
type Criterion = { rule: string; state: "PASS" | "FAIL" | "OPEN"; value: number | string | null; limit: number | null; source: string };

let secTickersCache: { at: number; rows: any[] } | null = null;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  try {
    allowOrigin(origin);
    const url = new URL(req.url), path = route(url.pathname);
    if (path === "/health") return json({ ok: true, service: "hpos-screen", version: "1.4.0", identity: "GENERIC_ALIAS_AWARE", evidence: "SEC_XBRL_OFFICIAL", failClosed: true, auditLog: true, secTickerSnapshot: true, canonicalDegradationGuard: true }, 200, origin);
    if (path === "/identity" && req.method === "POST") {
      await requireSession(req);
      const input = cleanInput(await req.json().catch(() => ({})));
      const result = await resolveIdentity(input);
      if (result.identity?.isin) await saveIdentity(result.identity, result.candidates || []);
      return json(result, 200, origin);
    }
    if (path === "/check" && req.method === "POST") {
      await requireSession(req);
      const body = await req.json().catch(() => ({}));
      return json(await runCheck(cleanInput(body?.asset || body), body?.force !== false), 200, origin);
    }
    if (path === "/runs/latest" && req.method === "GET") {
      await requireSession(req);
      const isin = upper(url.searchParams.get("isin"));
      if (!validIsin(isin)) throw httpError(400, "isin_invalid");
      return json(await latestRun(isin), 200, origin);
    }
    return json({ error: "not_found" }, 404, origin);
  } catch (error) {
    const status = Number((error as any)?.status) || 500;
    const message = String((error as any)?.message || "screen_failed");
    console.error("hpos-screen", status, message);
    return json({ error: status >= 500 ? "screen_failed" : message }, status, origin);
  }
});

async function runCheck(input: IdentityInput, force: boolean) {
  const startedAt = new Date().toISOString();
  const inputIsin = upper(input.isin);
  const prior = validIsin(inputIsin) ? await readCanonical(inputIsin) : null;
  const resolved = await resolveIdentity(input);
  if (!resolved.identity?.isin) {
    if (isFreshDecisive(prior)) return preservedCanonical(prior, null, {
      state: "OPEN_REVIEW", reason: "Die externe Identität konnte im aktuellen Nachlauf nicht eindeutig bestätigt werden.",
      missingCriteria: ["Eindeutige externe Identitätsbestätigung"], checkedAt: startedAt, source: "IDENTITY_RESOLVER"
    });
    return openResult(resolved, startedAt, ["Eindeutige kanonische ISIN"], "Die Identität konnte nicht eindeutig aufgelöst werden.");
  }
  const identity = resolved.identity;
  await saveIdentity(identity, resolved.candidates || []);

  const existing = prior?.isin === identity.isin ? prior : await readCanonical(identity.isin);
  if (existing?.source_type === "CURATED_ISIN" && ["PASS", "FAIL"].includes(existing.state)) {
    return { runId: null, identity, state: existing.state, reason: existing.reason, missingCriteria: [], criteria: {}, evidence: existing.evidence || [], checkedAt: existing.checked_at, cached: true, source: existing.source_name };
  }
  if (!force && existing && ["PASS", "FAIL"].includes(existing.state) && (!existing.expires_at || Date.parse(existing.expires_at) > Date.now())) {
    return { runId: null, identity, state: existing.state, reason: existing.reason, missingCriteria: [], criteria: {}, evidence: existing.evidence || [], checkedAt: existing.checked_at, cached: true, source: existing.source_name };
  }

  const acquired = await acquireEvidence(identity);
  const evaluated = evaluate(acquired);
  const completedAt = new Date().toISOString();
  const runId = crypto.randomUUID();
  const result = { runId, identity, ...evaluated, evidence: acquired.evidence, financial: acquired.financial, checkedAt: completedAt, source: acquired.source };
  await persistRun(result, startedAt, completedAt);
  if (result.state === "OPEN_REVIEW" && isFreshDecisive(existing)) return preservedCanonical(existing, identity, result);
  return result;
}

function isFreshDecisive(existing: any) {
  return !!existing && ["PASS", "FAIL"].includes(String(existing.state || ""))
    && (!existing.expires_at || Date.parse(existing.expires_at) > Date.now());
}

function preservedCanonical(existing: any, identity: any, research: any) {
  return {
    runId: null, researchRunId: research?.runId || null, identity, state: existing.state, reason: existing.reason,
    missingCriteria: [], criteria: {}, evidence: existing.evidence || [], checkedAt: existing.checked_at,
    cached: true, degraded: true, source: existing.source_name,
    researchState: research?.state || "OPEN_REVIEW", researchReason: research?.reason || "",
    researchMissingCriteria: research?.missingCriteria || []
  };
}

async function resolveIdentity(input: IdentityInput) {
  const isin = upper(input.isin), ticker = upper(input.ticker || input.symbol), name = text(input.name, 180), exchange = upper(input.exchange);
  if (validIsin(isin)) {
    const stored = await readIdentity(isin);
    if (stored) return { identity: { isin, ticker: ticker || stored.symbol || "", name: stored.name || name || isin, exchange: exchange || stored.exchange || "", quoteType: stored.quote_type || "EQUITY", status: "VERIFIED", confidence: Number(stored.confidence || .99), source: stored.source_name || "VERIFIED_IDENTITY_CACHE", sourceUrl: stored.source_url || null, cachedIdentity: true }, candidates: [] };
  }
  const candidates = await yahooCandidates([isin, ticker, name].filter(Boolean));
  if (validIsin(isin)) {
    const exact = candidates.filter(x => x.isin === isin);
    const match = ticker ? exact.find(x => tickerEqual(x.ticker, ticker)) : exact[0];
    const figi = match ? null : await verifyIsinWithOpenFigi(isin, ticker, exchange);
    if (match || figi) return { identity: { isin, ticker: match?.ticker || figi?.ticker || ticker, name: match?.name || figi?.name || name || isin, exchange: match?.exchange || figi?.exchange || exchange, quoteType: match?.quoteType || "EQUITY", status: "VERIFIED", confidence: 1, source: match ? "YAHOO_EXACT_ISIN" : "OPENFIGI_EXACT_ISIN", sourceUrl: match ? `${YAHOO}/v1/finance/search?q=${encodeURIComponent(isin)}` : OPENFIGI }, candidates };
    return { identity: null, status: "UNRESOLVED", candidates, reason: "valid_isin_not_source_verified" };
  }
  const exactTicker = candidates.filter(x => validIsin(x.isin) && (!ticker || x.ticker === ticker));
  const exchangeMatches = exchange ? exactTicker.filter(x => exchangeEqual(x.exchange, exchange)) : exactTicker;
  const pool = exchangeMatches.length ? exchangeMatches : exactTicker;
  const unique = uniqueBy(pool, x => x.isin);
  if (unique.length === 1) return { identity: { ...unique[0], status: "VERIFIED", confidence: .96, source: "YAHOO_UNIQUE_ISIN", sourceUrl: `${YAHOO}/v1/finance/search?q=${encodeURIComponent(ticker || name)}` }, candidates };
  return { identity: null, status: unique.length > 1 ? "AMBIGUOUS" : "UNRESOLVED", candidates };
}

async function acquireEvidence(identity: any) {
  const ticker = upper(identity.ticker);
  let secCompany = null;
  try { secCompany = ticker ? await secCompanyForTicker(ticker) : null; } catch { secCompany = null; }
  if (secCompany) return acquireSecEvidence(identity, secCompany);
  const profile = await yahooProfile(ticker);
  const evidence: EvidenceItem[] = [];
  if (profile?.industry) evidence.push(item("businessProfile", `${profile.sector || ""} · ${profile.industry}`.replace(/^ · | · $/g, ""), "text", "current", "Yahoo Finance discovery profile", `${YAHOO}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}`, "DISCOVERY"));
  return { source: "GENERIC_DISCOVERY_ONLY", official: false, identity, business: { state: "OPEN", description: profile?.industry || "", sic: "" }, financial: {}, evidence };
}

async function acquireSecEvidence(identity: any, company: any) {
  const cik = String(company.cik_str).padStart(10, "0"), companyFactsUrl = `${SEC}/api/xbrl/companyfacts/CIK${cik}.json`, submissionsUrl = `${SEC}/submissions/CIK${cik}.json`;
  const [factsResponse, submissionsResponse, chart] = await Promise.all([
    optionalJson(companyFactsUrl, { "User-Agent": SEC_AGENT }),
    optionalJson(submissionsUrl, { "User-Agent": SEC_AGENT }),
    yahooMonthly(identity.ticker)
  ]);
  const facts = factsResponse?.facts || {}, submissions = submissionsResponse || {};
  const annualForms = new Set(["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"]);
  const revenue = selectDurationFact(facts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet", "Revenue", "RevenueFromContractsWithCustomers"], annualForms);
  const interestIncome = selectDurationFact(facts, ["InterestIncomeExpenseNonoperating", "InterestAndDividendIncomeOperating", "InterestIncomeBank", "InterestIncome"], annualForms, revenue?.end);
  const reportEnd = revenue?.end || newestFactEnd(facts);
  const totalDebt = debtFact(facts, reportEnd);
  const interestAssets = interestAssetFact(facts, reportEnd);
  const shares = shareFacts(facts);
  const financialCurrency = upper(revenue?.unit || totalDebt?.unit || interestAssets?.unit);
  const marketCurrencyCompatible = !!financialCurrency && financialCurrency === upper(chart.currency);
  const mv = marketCurrencyCompatible ? marketValue36m(chart, shares) : { value: 0, months: 0, period: "", method: "CURRENCY_MISMATCH" };
  const recent = submissions?.filings?.recent || {}, annualIndex = Array.isArray(recent.form) ? recent.form.findIndex((x: string) => annualForms.has(x)) : -1;
  const accession = annualIndex >= 0 ? String(recent.accessionNumber?.[annualIndex] || "") : "";
  const primaryDocument = annualIndex >= 0 ? String(recent.primaryDocument?.[annualIndex] || "") : "";
  const filingUrl = accession && primaryDocument ? `https://www.sec.gov/Archives/edgar/data/${Number(cik)}/${accession.replace(/-/g, "")}/${primaryDocument}` : submissionsUrl;
  const evidence: EvidenceItem[] = [];
  const sic = String(submissions.sic || ""), sicDescription = text(submissions.sicDescription || "", 240);
  if (submissionsResponse && (sic || sicDescription)) evidence.push(item("businessProfile", `${sic}${sicDescription ? ` · ${sicDescription}` : ""}`, "SIC", "current", "SEC EDGAR submissions", submissionsUrl, "OFFICIAL"));
  if (revenue) evidence.push(factItem("revenue", revenue, companyFactsUrl));
  if (interestIncome) evidence.push(factItem("interestIncome", interestIncome, companyFactsUrl));
  if (totalDebt) evidence.push(compositeItem("totalDebt", totalDebt, companyFactsUrl));
  if (interestAssets) evidence.push(compositeItem("interestBearingAssetsUpperBound", interestAssets, companyFactsUrl));
  if (mv.value > 0) evidence.push({ metric: "marketValue36mAvg", value: mv.value, unit: chart.currency || revenue?.unit || "", period: mv.period, sourceName: "Yahoo monthly market prices + SEC reported shares", sourceUrl: `${YAHOO}/v8/finance/chart/${encodeURIComponent(identity.ticker)}`, method: "MONTHLY_PRICE_X_LATEST_OFFICIAL_SHARES", quality: "MARKET" });
  return {
    source: "SEC_XBRL_GENERIC", official: true, identity: { ...identity, cik, legalName: submissions.name || company.title },
    business: { state: prohibitedSic(sic, sicDescription) ? "FAIL" : "OPEN", description: sicDescription, sic, sourceUrl: submissionsUrl, filingUrl },
    financial: {
      revenue: revenue?.value ?? null, interestIncome: interestIncome?.value ?? null, totalDebt: totalDebt?.value ?? null,
      interestBearingAssetsUpperBound: interestAssets?.value ?? null, marketValue36mAvg: mv.value || null, marketValue36mMonths: mv.months,
      currency: financialCurrency || chart.currency || "", period: reportEnd || "", marketValueMethod: mv.method, marketCurrencyCompatible,
      debtDirect: totalDebt?.direct === true, interestAssetsUpperBound: true
    }, evidence
  };
}

function evaluate(acquired: any) {
  const f = acquired.financial || {}, b = acquired.business || {};
  const ratio = (a: any, d: any) => Number.isFinite(Number(a)) && Number(a) >= 0 && Number(d) > 0 ? Number(a) / Number(d) : null;
  const impureExact = ratio(f.nonPermissibleIncome, f.revenue), impureLowerBound = ratio(f.interestIncome, f.revenue), assets = ratio(f.interestBearingAssetsUpperBound, f.marketValue36mAvg), debt = ratio(f.totalDebt, f.marketValue36mAvg);
  const marketOk = Number(f.marketValue36mMonths) >= 30;
  const criteria: Record<string, Criterion> = {
    business: { rule: "Zulässiges Kerngeschäft", state: b.state === "FAIL" ? "FAIL" : "OPEN", value: b.sic || b.description || null, limit: null, source: b.state === "FAIL" ? "SEC_OFFICIAL_SIC_EXCLUSION" : acquired.official ? "SEC_OFFICIAL_SIC_UNCLASSIFIED" : "UNVERIFIED_DISCOVERY" },
    impureIncome: { rule: "Nicht-zulässige Einnahmen / Gesamtumsatz", state: impureExact == null ? (impureLowerBound != null && impureLowerBound > RULES.impureIncomeMax ? "FAIL" : "OPEN") : impureExact <= RULES.impureIncomeMax ? "PASS" : "FAIL", value: impureExact ?? impureLowerBound, limit: RULES.impureIncomeMax, source: impureExact != null ? "OFFICIAL_NON_PERMISSIBLE_INCOME" : impureLowerBound != null ? "SEC_XBRL_INTEREST_INCOME_LOWER_BOUND" : "MISSING" },
    interestAssets: { rule: "Zinstragende Vermögenswerte / 36M Ø Marktwert", state: !marketOk || assets == null ? "OPEN" : assets <= RULES.interestAssetsMax ? "PASS" : "OPEN", value: assets, limit: RULES.interestAssetsMax, source: assets == null ? "MISSING" : "SEC_XBRL_UPPER_BOUND" },
    interestDebt: { rule: "Zinstragende Schulden / 36M Ø Marktwert", state: !marketOk || debt == null ? "OPEN" : debt <= RULES.interestDebtMax ? "PASS" : f.debtDirect ? "FAIL" : "OPEN", value: debt, limit: RULES.interestDebtMax, source: debt == null ? "MISSING" : "SEC_XBRL" }
  };
  const entries = Object.values(criteria);
  const failed = entries.filter(x => x.state === "FAIL");
  const missingCriteria = entries.filter(x => x.state === "OPEN").map(x => x.rule);
  if (failed.length) return { state: "FAIL", standard: "AAOIFI SS21", criteria, missingCriteria: [], reason: `Nicht halalkonform: ${failed.map(x => x.rule).join("; ")} überschreitet das freigegebene Kriterium oder fällt unter ein ausgeschlossenes Kerngeschäft.` };
  if (entries.every(x => x.state === "PASS")) return { state: "PASS", standard: "AAOIFI SS21", criteria, missingCriteria: [], reason: "Halalkonform: Kerngeschäft und alle drei AAOIFI-Finanzkriterien sind mit nachvollziehbarer Evidenz bestanden." };
  return { state: "OPEN_REVIEW", standard: "AAOIFI SS21", criteria, missingCriteria, reason: `Prüfung offen. Fehlende oder nicht hinreichend belastbare Kriterien: ${missingCriteria.join("; ")}.` };
}

async function persistRun(result: any, startedAt: string, completedAt: string) {
  const s = db(), run = { id: result.runId, isin: result.identity.isin, symbol: result.identity.ticker || null, state: result.state, methodology: "AAOIFI SS21 · HPOS generic evidence service v1", reason: result.reason, missing_criteria: result.missingCriteria, criteria: result.criteria, evidence: result.evidence, started_at: startedAt, completed_at: completedAt };
  const { error: runError } = await s.from("hpos_halal_runs").insert(run);
  if (runError) throw httpError(500, "run_store_failed");
  const { data: old } = await s.from("hpos_halal_evidence").select("source_type,state,expires_at").eq("isin", result.identity.isin).maybeSingle();
  if (old?.source_type === "CURATED_ISIN") return;
  const oldFresh = !old?.expires_at || Date.parse(old.expires_at) > Date.now(), oldDecisive = ["PASS", "FAIL"].includes(String(old?.state || ""));
  if (result.state === "OPEN_REVIEW" && oldDecisive && oldFresh) return;
  const evidence = (result.evidence || []).slice(0, 20).map((x: any) => ({ provider: x.sourceName, status: x.metric, note: `${x.period || ""}${x.value !== undefined ? ` · ${x.value} ${x.unit || ""}` : ""}`.slice(0, 500), sourceUrl: x.sourceUrl }));
  const row = { isin: result.identity.isin, state: result.state, source_type: "HPOS_AAOIFI", source_name: "HPOS Generic Evidence Service", methodology: "AAOIFI SS21", symbol: result.identity.ticker || null, raw_status: result.state, reason: result.reason, evidence, checked_at: completedAt, expires_at: new Date(Date.parse(completedAt) + RESULT_TTL).toISOString(), updated_at: completedAt };
  const { error } = await s.from("hpos_halal_evidence").upsert(row, { onConflict: "isin" });
  if (error) throw httpError(500, "evidence_store_failed");
}

async function saveIdentity(identity: any, candidates: any[]) {
  const row = { isin: identity.isin, symbol: identity.ticker || null, exchange: identity.exchange || null, name: identity.name || identity.isin, quote_type: identity.quoteType || null, resolution_status: identity.status || "VERIFIED", confidence: Number(identity.confidence || 0), source_name: identity.source || "GENERIC_RESOLVER", source_url: identity.sourceUrl || null, candidates: candidates.slice(0, 12), verified_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { error } = await db().from("hpos_security_identities").upsert(row, { onConflict: "isin" });
  if (error) throw httpError(500, "identity_store_failed");
}

async function readCanonical(isin: string) {
  const { data, error } = await db().from("hpos_halal_evidence").select("*").eq("isin", isin).maybeSingle();
  if (error) throw httpError(500, "canonical_read_failed");
  return data;
}

async function readIdentity(isin: string) {
  const { data, error } = await db().from("hpos_security_identities").select("isin,symbol,exchange,name,quote_type,resolution_status,confidence,source_name,source_url").eq("isin", isin).maybeSingle();
  if (error || data?.resolution_status !== "VERIFIED") return null;
  return data;
}

async function latestRun(isin: string) {
  const { data, error } = await db().from("hpos_halal_runs").select("id,isin,symbol,state,methodology,reason,missing_criteria,criteria,evidence,started_at,completed_at").eq("isin", isin).order("completed_at", { ascending: false }).limit(1).maybeSingle();
  if (error) throw httpError(500, "run_read_failed");
  return data || { isin, state: "OPEN_REVIEW", reason: "no_run", evidence: [], criteria: {}, missing_criteria: [] };
}

function openResult(resolved: any, startedAt: string, missingCriteria: string[], reason: string) { return { runId: null, identity: resolved.identity, candidates: resolved.candidates || [], state: "OPEN_REVIEW", standard: "AAOIFI SS21", criteria: {}, evidence: [], financial: {}, missingCriteria, reason, checkedAt: startedAt, source: "IDENTITY_RESOLVER" }; }

async function secCompanyForTicker(ticker: string) {
  if (!secTickersCache || Date.now() - secTickersCache.at > 6 * 60 * 60 * 1000) {
    let rows: any[] = [];
    try {
      const body = await fetchText("https://www.sec.gov/include/ticker.txt", { "User-Agent": SEC_AGENT }, 10000);
      rows = parseSecTickerText(body);
      if (rows.length < 10000) throw new Error("sec_ticker_index_incomplete");
    } catch {
      try {
        const root = await fetchJson("https://www.sec.gov/files/company_tickers.json", { "User-Agent": SEC_AGENT });
        rows = Object.values(root || {}).filter((x: any) => x && x.ticker && Number.isFinite(Number(x.cik_str)));
        if (rows.length < 10000) throw new Error("sec_company_index_incomplete");
      } catch {
        rows = Object.entries(SEC_TICKERS).map(([ticker, cik_str]) => ({ ticker, cik_str, title: ticker }));
        if (rows.length < 10000) throw new Error("sec_ticker_snapshot_incomplete");
      }
    }
    secTickersCache = { at: Date.now(), rows };
  }
  const base = ticker.replace(/[.\-].*$/, "");
  return secTickersCache.rows.find(x => upper(x?.ticker) === ticker) || secTickersCache.rows.find(x => upper(x?.ticker) === base) || null;
}

function parseSecTickerText(body: string) {
  return body.split(/\r?\n/)
    .map(line => line.trim().split(/\s+/))
    .filter(x => x.length >= 2 && /^\d+$/.test(x[1]))
    .map(x => ({ ticker: upper(x[0]), cik_str: Number(x[1]), title: upper(x[0]) }));
}

async function yahooCandidates(queries: string[]) {
  const lists = await Promise.all(uniqueBy(queries, x => upper(x)).slice(0, 3).map(async q => {
    try { const d = await fetchJson(`${YAHOO}/v1/finance/search?q=${encodeURIComponent(q)}&quotesCount=12&newsCount=0`, { "User-Agent": "Mozilla/5.0 HPOS/1.0" }); return Array.isArray(d?.quotes) ? d.quotes : []; } catch { return []; }
  }));
  const rows = lists.flat().filter(x => ["EQUITY", "ETF", "MUTUALFUND"].includes(upper(x?.quoteType))).map(x => ({ isin: upper(x?.isin), ticker: upper(x?.symbol), name: text(x?.longname || x?.shortname || x?.symbol, 180), exchange: upper(x?.exchange || x?.exchDisp), quoteType: upper(x?.quoteType) })).filter(x => x.ticker);
  return uniqueBy(rows, x => `${x.isin || "-"}|${x.ticker}|${x.exchange}`);
}

async function verifyIsinWithOpenFigi(isin: string, ticker: string, exchange: string) {
  try {
    const r = await fetch(OPENFIGI, { method: "POST", headers: { "Content-Type": "application/json", "User-Agent": "HPOS/1.0" }, body: JSON.stringify([{ idType: "ID_ISIN", idValue: isin }]), signal: AbortSignal.timeout(12000) });
    if (!r.ok) return null; const d = await r.json(), rows = Array.isArray(d?.[0]?.data) ? d[0].data : [];
    const scored = rows.filter((v: any) => v?.ticker || v?.name || v?.securityDescription).map((v: any) => ({ v, score: (tickerEqual(v?.ticker, ticker) ? 100 : 0) + (exchange && exchangeEqual(v?.exchCode, exchange) ? 20 : 0) + (upper(v?.marketSector) === "EQUITY" ? 5 : 0) })).sort((a: any, b: any) => b.score - a.score);
    const x = scored[0]?.v || null;
    return x ? { ticker: ticker || upper(x.ticker), verifiedTicker: upper(x.ticker), name: text(x.name || x.securityDescription, 180), exchange: exchange || upper(x.exchCode) } : null;
  } catch { return null; }
}

async function yahooProfile(symbol: string) {
  if (!symbol) return null;
  try { const d = await fetchJson(`${YAHOO}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=assetProfile`, { "User-Agent": "Mozilla/5.0 HPOS/1.0" }); return d?.quoteSummary?.result?.[0]?.assetProfile || null; } catch { return null; }
}

async function yahooMonthly(symbol: string) {
  if (!symbol) return { rows: [], currency: "" };
  try {
    const d = await fetchJson(`${YAHOO}/v8/finance/chart/${encodeURIComponent(symbol)}?range=3y&interval=1mo&events=history`, { "User-Agent": "Mozilla/5.0 HPOS/1.0" }), x = d?.chart?.result?.[0];
    const ts = Array.isArray(x?.timestamp) ? x.timestamp : [], values = x?.indicators?.adjclose?.[0]?.adjclose || x?.indicators?.quote?.[0]?.close || [];
    const rows = ts.map((t: number, i: number) => ({ date: new Date(t * 1000).toISOString().slice(0, 10), price: number(values[i]) })).filter((x: any) => x.price > 0).slice(-36);
    return { rows, currency: upper(x?.meta?.currency) };
  } catch { return { rows: [], currency: "" }; }
}

function factRows(facts: any, tags: string[]) {
  const out: any[] = [];
  for (const taxonomy of ["us-gaap", "ifrs-full", "dei"]) for (const tag of tags) {
    const units = facts?.[taxonomy]?.[tag]?.units || {};
    for (const [unit, rows] of Object.entries(units)) for (const x of (Array.isArray(rows) ? rows : [])) {
      const value = number((x as any)?.val); if (!Number.isFinite(value)) continue;
      out.push({ ...x, value, unit, tag, taxonomy, sourceLabel: facts?.[taxonomy]?.[tag]?.label || tag });
    }
  }
  return out;
}

function selectDurationFact(facts: any, tags: string[], forms: Set<string>, preferredEnd = "") {
  const rows = factRows(facts, tags).filter(x => forms.has(String(x.form)) && x.start && x.end && days(x.start, x.end) >= 250 && days(x.start, x.end) <= 440 && x.value >= 0);
  const preferred = preferredEnd ? rows.filter(x => x.end === preferredEnd) : rows;
  return (preferred.length ? preferred : rows).sort(compareFactsNewest)[0] || null;
}

function selectPointFact(facts: any, tags: string[], end = "") {
  const rows = factRows(facts, tags).filter(x => x.end && !x.start && x.value >= 0 && (!end || Math.abs(days(x.end, end)) <= 120));
  return rows.sort(compareFactsNewest)[0] || null;
}

function debtFact(facts: any, end: string) {
  const direct = selectPointFact(facts, ["LongTermDebtAndFinanceLeaseObligations", "LongTermDebt", "DebtAndFinanceLeaseObligations"], end);
  if (direct) return { ...direct, direct: !String(direct.tag).includes("FinanceLease"), components: [direct] };
  const current = selectPointFact(facts, ["LongTermDebtAndFinanceLeaseObligationsCurrent", "LongTermDebtCurrent", "ShortTermBorrowings", "DebtCurrent"], end);
  const noncurrent = selectPointFact(facts, ["LongTermDebtAndFinanceLeaseObligationsNoncurrent", "LongTermDebtNoncurrent", "DebtNoncurrent", "NoncurrentBorrowings"], end);
  if (!current && !noncurrent) return null;
  const components = [current, noncurrent].filter(Boolean), unit = components[0].unit;
  if (!components.every(x => x.unit === unit)) return null;
  return { value: components.reduce((n, x) => n + x.value, 0), unit, end: components[0].end, direct: !components.some(x => String(x.tag).includes("FinanceLease")), components };
}

function interestAssetFact(facts: any, end: string) {
  const cash = selectPointFact(facts, ["CashAndCashEquivalentsAtCarryingValue", "CashCashEquivalentsRestrictedCashAndRestrictedCashEquivalents", "CashAndCashEquivalents"], end);
  const investments = selectPointFact(facts, ["ShortTermInvestments", "MarketableSecuritiesCurrent", "OtherCurrentFinancialAssets", "AvailableForSaleSecuritiesCurrent"], end);
  if (!cash && !investments) return null;
  const components = [cash, investments].filter(Boolean), unit = components[0].unit;
  if (!components.every(x => x.unit === unit)) return null;
  return { value: components.reduce((n, x) => n + x.value, 0), unit, end: components[0].end, direct: false, components };
}

function shareFacts(facts: any) {
  return factRows(facts, ["EntityCommonStockSharesOutstanding", "CommonStockSharesOutstanding", "WeightedAverageNumberOfSharesOutstandingBasic"]).filter(x => x.value > 0 && x.end).sort((a, b) => String(a.end).localeCompare(String(b.end)));
}

function marketValue36m(chart: any, shares: any[]) {
  const observations = (chart.rows || []).map((p: any) => {
    const eligible = shares.filter(x => String(x.end) <= p.date && Math.abs(days(x.end, p.date)) <= 550);
    const s = eligible.at(-1) || null;
    return s ? { ...p, shares: s.value, value: p.price * s.value, sharesEnd: s.end } : null;
  }).filter(Boolean).slice(-36);
  const value = observations.length ? observations.reduce((n: number, x: any) => n + x.value, 0) / observations.length : 0;
  return { value, months: observations.length, period: observations.length ? `${observations[0].date.slice(0, 7)} to ${observations.at(-1).date.slice(0, 7)}` : "", method: "MONTHLY_PRICE_X_LATEST_OFFICIAL_SHARES" };
}

function prohibitedSic(sicRaw: string, description: string) {
  const sic = Number(sicRaw), d = upper(description);
  if ((sic >= 2082 && sic <= 2085) || (sic >= 2100 && sic <= 2199) || (sic >= 3480 && sic <= 3489) || (sic >= 3760 && sic <= 3769) || (sic >= 6020 && sic <= 6799) || sic === 7993) return true;
  return /(CASINO|GAMBLING|BREWER|DISTILL|TOBACCO|FIREARMS|AMMUNITION|DEFENSE CONTRACTOR|MORTGAGE BANK|COMMERCIAL BANK)/.test(d);
}

function newestFactEnd(facts: any) { const rows = factRows(facts, ["Assets", "AssetsCurrent", "StockholdersEquity"]); return rows.map(x => String(x.end || "")).sort().at(-1) || ""; }
function factItem(metric: string, x: any, url: string): EvidenceItem { return { metric, value: x.value, unit: x.unit, period: `${x.start} to ${x.end}`, sourceName: `SEC EDGAR XBRL · ${x.sourceLabel}`, sourceUrl: url, accession: x.accn, tag: `${x.taxonomy}:${x.tag}`, quality: "OFFICIAL" }; }
function compositeItem(metric: string, x: any, url: string): EvidenceItem { return { metric, value: x.value, unit: x.unit, period: x.end || "", sourceName: `SEC EDGAR XBRL · ${x.components.map((v: any) => v.sourceLabel).join(" + ")}`, sourceUrl: url, accession: x.components[0]?.accn, tag: x.components.map((v: any) => `${v.taxonomy}:${v.tag}`).join(" + "), quality: "OFFICIAL" }; }
function item(metric: string, value: number | string, unit: string, period: string, sourceName: string, sourceUrl: string, quality: EvidenceItem["quality"]): EvidenceItem { return { metric, value, unit, period, sourceName, sourceUrl, quality }; }

async function requireSession(req: Request) {
  const token = (req.headers.get("Authorization") || "").match(/^Bearer\s+([A-Za-z0-9_-]{20,})$/i)?.[1];
  if (!token) throw httpError(401, "not_authenticated");
  const { data, error } = await db().from("hpos_parqet_sessions").select("created_at,expires_at").eq("session_id", token).maybeSingle();
  if (error || !data || Date.now() - Date.parse(data.created_at) > SESSION_TTL) throw httpError(401, "session_expired");
}

function db() { const url = Deno.env.get("SUPABASE_URL"), key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY"); if (!url || !key) throw httpError(500, "supabase_config_missing"); return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } }); }
async function fetchJson(url: string, headers: Record<string, string>) { const r = await fetch(url, { headers: { Accept: "application/json", ...headers }, signal: AbortSignal.timeout(20000) }); if (!r.ok) throw httpError(502, `source_http_${r.status}`); return r.json(); }
async function fetchText(url: string, headers: Record<string, string>, timeout = 20000) { const r = await fetch(url, { headers: { Accept: "text/plain", ...headers }, signal: AbortSignal.timeout(timeout) }); if (!r.ok) throw httpError(502, `source_http_${r.status}`); return r.text(); }
async function optionalJson(url: string, headers: Record<string, string>) { try { return await fetchJson(url, headers); } catch { return null; } }
function cleanInput(x: any): IdentityInput { return { isin: upper(x?.isin), ticker: upper(x?.ticker || x?.symbol), exchange: upper(x?.exchange), name: text(x?.name, 180), source: upper(x?.source) }; }
function validIsin(v: string) { if (!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(v)) return false; let s = ""; for (const c of v) s += /[A-Z]/.test(c) ? String(c.charCodeAt(0) - 55) : c; let sum = 0, alt = false; for (let i = s.length - 1; i >= 0; i--) { let n = Number(s[i]); if (alt) { n *= 2; if (n > 9) n -= 9; } sum += n; alt = !alt; } return sum % 10 === 0; }
function tickerKey(v: string) { return upper(v).split(".")[0].replace(/[^A-Z0-9]/g, ""); }
function tickerEqual(a: string, b: string) { const x = tickerKey(a), y = tickerKey(b); return !!x && !!y && x === y; }
function exchangeEqual(a: string, b: string) { a = upper(a); b = upper(b); return a === b || a.includes(b) || b.includes(a); }
function compareFactsNewest(a: any, b: any) { const end = String(b.end || "").localeCompare(String(a.end || "")); if (end) return end; const filed = String(b.filed || "").localeCompare(String(a.filed || "")); if (filed) return filed; return /A$/.test(String(a.form)) ? 1 : /A$/.test(String(b.form)) ? -1 : 0; }
function days(a: string, b: string) { return Math.round(Math.abs(Date.parse(b) - Date.parse(a)) / 86400000); }
function uniqueBy<T>(xs: T[], key: (x: T) => string) { const seen = new Set<string>(); return xs.filter(x => { const k = key(x); if (!k || seen.has(k)) return false; seen.add(k); return true; }); }
function number(v: any) { const n = Number(v); return Number.isFinite(n) ? n : NaN; }
function upper(v: any) { return String(v || "").trim().toUpperCase().slice(0, 40); }
function text(v: any, max = 500) { return String(v || "").replace(/\s+/g, " ").trim().slice(0, max); }
function allowOrigin(origin: string) { if (origin !== APP_ORIGIN) throw httpError(403, "origin_not_allowed"); }
function route(path: string) { const marker = "/hpos-screen", i = path.indexOf(marker); return i >= 0 ? (path.slice(i + marker.length) || "/") : path; }
function cors(origin: string) { return { "Access-Control-Allow-Origin": origin === APP_ORIGIN ? APP_ORIGIN : "", "Access-Control-Allow-Headers": "Authorization, Content-Type", "Access-Control-Allow-Methods": "GET,POST,OPTIONS", "Cache-Control": "no-store", Vary: "Origin" }; }
function json(data: unknown, status: number, origin: string) { return new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json; charset=utf-8", ...cors(origin) } }); }
function httpError(status: number, message: string) { const e: any = new Error(message); e.status = status; return e; }
