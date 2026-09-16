import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";
import { SEC_TICKERS } from "./sec-tickers.ts";

const APP_ORIGIN = "https://vbgatgh.github.io";
const YAHOO = "https://query1.finance.yahoo.com";
const SEC = "https://data.sec.gov";
const OPENFIGI = "https://api.openfigi.com/v3/mapping";
const GLEIF = "https://api.gleif.org/api/v1/lei-records";
const ESEF = "https://filings.xbrl.org";
const SESSION_TTL = 12 * 60 * 60 * 1000;
const RESULT_TTL = 7 * 24 * 60 * 60 * 1000;
const DOCUMENT_DISCOVERY_TTL = 7 * 24 * 60 * 60 * 1000;
const SEC_AGENT = "HPOS Portfolio Intelligence contact@vbgatgh.github.io";
const RULES = Object.freeze({ impureIncomeMax: .05, interestAssetsMax: .30, interestDebtMax: .30 });

type IdentityInput = { isin?: string; ticker?: string; symbol?: string; exchange?: string; name?: string; source?: string };
type EvidenceItem = { metric: string; value: number | string; unit: string; period: string; sourceName: string; sourceUrl: string; accession?: string; tag?: string; method?: string; location?: string; quality: "OFFICIAL" | "MARKET" | "DISCOVERY" };
type Criterion = { rule: string; state: "PASS" | "FAIL" | "OPEN"; value: number | string | null; limit: number | null; source: string };

let secTickersCache: { at: number; rows: any[] } | null = null;

Deno.serve(async (req: Request) => {
  const origin = req.headers.get("Origin") || "";
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: cors(origin) });
  try {
    allowOrigin(origin);
    const url = new URL(req.url), path = route(url.pathname);
    if (path === "/health") return json({ ok: true, service: "hpos-screen", version: "1.6.0", identity: "GENERIC_ALIAS_AWARE", evidence: "SEC_AND_ESEF_XBRL_CACHE", marketValueBasis: "MARKET_CAP_AT_CHECK", failClosed: true, auditLog: true, secTickerSnapshot: true, regulatoryDocumentCache: true, canonicalDegradationGuard: true }, 200, origin);
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
  if (secCompany) return attachMarketValueAtCheck(await acquireSecEvidence(identity, secCompany), identity);
  const cached = await readCachedRegulatoryEvidence(identity);
  if (cached?.fresh) return attachMarketValueAtCheck(cached.acquired, identity);
  try {
    const esef = await acquireEsefEvidence(identity);
    if (esef) return attachMarketValueAtCheck(esef, identity);
  } catch (error) {
    console.error("hpos-screen-esef", String((error as any)?.message || error));
  }
  if (cached?.acquired) return attachMarketValueAtCheck({ ...cached.acquired, source: "ESEF_XBRL_CACHE_STALE" }, identity);
  const profile = await yahooProfile(ticker);
  const evidence: EvidenceItem[] = [];
  if (profile?.industry) evidence.push(item("businessProfile", `${profile.sector || ""} · ${profile.industry}`.replace(/^ · | · $/g, ""), "text", "current", "Yahoo Finance discovery profile", `${YAHOO}/v10/finance/quoteSummary/${encodeURIComponent(ticker)}`, "DISCOVERY"));
  return { source: "GENERIC_DISCOVERY_ONLY", official: false, identity, business: { state: "OPEN", description: profile?.industry || "", sic: "" }, financial: {}, evidence };
}

async function acquireEsefEvidence(identity: any) {
  const lei = await resolveLei(identity);
  if (!lei) return null;
  const filingsUrl = `${ESEF}/api/filings?filter%5Bentity.identifier%5D=${encodeURIComponent(lei.lei)}&page%5Bsize%5D=8&sort=-period_end`;
  const index = await fetchJson(filingsUrl, { "User-Agent": "HPOS/1.0" });
  const filings = Array.isArray(index?.data) ? index.data : [];
  for (const filing of filings.slice(0, 4)) {
    const attributes = filing?.attributes || {}, jsonUrl = absoluteUrl(ESEF, attributes.json_url);
    if (!jsonUrl) continue;
    const cached = await readRegulatoryDocumentByFiling("ESEF_XBRL", String(attributes.fxo_id || filing.id || ""));
    if (cached) return cached;
    const report = await fetchJson(jsonUrl, { "User-Agent": "HPOS/1.0" });
    const parsed = parseEsefAnnual(report, attributes, jsonUrl);
    if (!parsed) continue;
    const acquired = {
      source: "ESEF_XBRL_REGULATORY_CACHE", official: true, identity: { ...identity, lei: lei.lei, legalName: lei.legalName },
      business: { state: prohibitedBusinessText(parsed.businessDescription) ? "FAIL" : "OPEN", description: parsed.businessDescription, sic: "", sourceUrl: parsed.reportUrl, filingUrl: parsed.reportUrl },
      financial: parsed.financial, evidence: parsed.evidence
    };
    await saveRegulatoryEvidence(identity, lei, filing, parsed, acquired);
    return acquired;
  }
  return null;
}

async function resolveLei(identity: any) {
  const name = text(identity?.name, 180);
  if (!name) return null;
  const queryName = companyKey(name);
  const url = `${GLEIF}?filter%5Bentity.legalName%5D=${encodeURIComponent(queryName)}&page%5Bsize%5D=20`;
  const body = await fetchJson(url, { "User-Agent": "HPOS/1.0" });
  const country = upper(identity?.isin).slice(0, 2), wanted = companyKey(name);
  const rows = (Array.isArray(body?.data) ? body.data : []).map((x: any) => {
    const entity = x?.attributes?.entity || {}, legalName = text(entity?.legalName?.name, 180), status = upper(entity?.status), jurisdiction = upper(entity?.jurisdiction);
    const score = (companyKey(legalName) === wanted ? 100 : 0) + (country && jurisdiction === country ? 20 : 0) + (status === "ACTIVE" ? 5 : 0);
    return { lei: upper(x?.attributes?.lei || x?.id), legalName, jurisdiction, status, score };
  }).filter((x: any) => /^[A-Z0-9]{20}$/.test(x.lei)).sort((a: any, b: any) => b.score - a.score);
  return rows[0]?.score >= 120 && (!rows[1] || rows[0].score > rows[1].score) ? rows[0] : null;
}

function parseEsefAnnual(report: any, attributes: any, jsonUrl: string) {
  const rows = xbrlRows(report), revenue = selectXbrlDuration(rows, ["Revenue", "RevenueFromContractsWithCustomers"]);
  if (!revenue || days(revenue.start, revenue.end) < 250) return null;
  const reportEnd = revenue.end, interestIncome = selectXbrlDuration(rows, ["InterestIncome", "FinanceIncome"], reportEnd);
  const debt = sumXbrlPointGroups(rows, [["CurrentBorrowingsAndCurrentPortionOfNoncurrentBorrowings", "CurrentBorrowings", "ShorttermBorrowings"], ["LongtermBorrowings", "NoncurrentBorrowings"]], reportEnd);
  const cash = selectXbrlPoint(rows, ["CashAndCashEquivalents"], reportEnd), financialAssets = selectXbrlPoint(rows, ["CurrentFinancialAssets"], reportEnd);
  const interestAssets = financialAssets ? sumXbrlSelected([cash, financialAssets]) : sumXbrlPointGroups(rows, [["CashAndCashEquivalents"], ["CurrentFinancialAssetsAtFairValueThroughProfitOrLoss"], ["CurrentDerivativeFinancialAssets"]], reportEnd);
  const description = selectXbrlText(rows, ["DescriptionOfNatureOfEntitysOperationsAndPrincipalActivities"], reportEnd);
  const reportUrl = absoluteUrl(ESEF, attributes?.report_url) || jsonUrl;
  const evidence: EvidenceItem[] = [];
  if (description) evidence.push(xbrlItem("businessProfile", description, reportUrl));
  evidence.push(xbrlItem("revenue", revenue, jsonUrl));
  if (interestIncome) evidence.push(xbrlItem("interestIncome", interestIncome, jsonUrl));
  if (debt) evidence.push(xbrlCompositeItem("totalDebt", debt, jsonUrl));
  if (interestAssets) evidence.push(xbrlCompositeItem("interestBearingAssetsUpperBound", interestAssets, jsonUrl));
  return {
    reportStart: revenue.start, reportEnd, reportUrl, jsonUrl, packageUrl: absoluteUrl(ESEF, attributes?.package_url), viewerUrl: absoluteUrl(ESEF, attributes?.viewer_url),
    businessDescription: description?.text || "", evidence,
    financial: {
      revenue: revenue.value, interestIncome: interestIncome?.value ?? null, interestIncomeMethod: interestIncome?.local === "InterestIncome" ? "LOWER_BOUND" : interestIncome ? "FINANCE_INCOME_UPPER_BOUND" : "MISSING", totalDebt: debt?.value ?? null,
      interestBearingAssetsUpperBound: interestAssets?.value ?? null, marketValueAtCheck: null, marketValueAsOf: "",
      currency: currencyUnit(revenue.unit || debt?.unit || interestAssets?.unit), period: reportEnd,
      marketValueMethod: "UNAVAILABLE", marketCurrencyCompatible: false,
      debtDirect: !!debt, interestAssetsUpperBound: true
    }
  };
}

function xbrlRows(report: any) {
  return Object.entries(report?.facts || {}).map(([factId, raw]: [string, any]) => {
    const dimensions = raw?.dimensions || {}, concept = String(dimensions.concept || ""), p = xbrlPeriod(dimensions.period), unit = String(dimensions.unit || ""), value = Number(raw?.value);
    const extraDimensions = Object.keys(dimensions).filter(k => !["concept", "entity", "period", "unit", "language"].includes(k));
    return { factId, concept, local: concept.split(":").at(-1) || concept, value: Number.isFinite(value) ? value : null, text: text(raw?.value, 3000), unit, start: p.start, end: p.end, duration: p.duration, extraDimensions };
  }).filter((x: any) => x.concept && x.end && x.extraDimensions.length === 0);
}

function xbrlPeriod(raw: any) {
  const value = String(raw || ""), parts = value.split("/");
  if (parts.length === 2) {
    const start = dateOnly(parts[0]), exclusiveEnd = dateOnly(parts[1]), end = shiftDate(exclusiveEnd, -1);
    return { start, end, duration: start && end ? days(start, end) + 1 : 0 };
  }
  const instant = shiftDate(dateOnly(value), -1);
  return { start: "", end: instant, duration: 0 };
}

function selectXbrlDuration(rows: any[], concepts: string[], preferredEnd = "") {
  const candidates = rows.filter(x => concepts.includes(x.local) && x.value != null && x.value >= 0 && x.duration >= 250 && x.duration <= 440 && (!preferredEnd || x.end === preferredEnd));
  return candidates.sort((a, b) => String(b.end).localeCompare(String(a.end)) || b.duration - a.duration)[0] || null;
}

function selectXbrlText(rows: any[], concepts: string[], end: string) {
  return rows.filter(x => concepts.includes(x.local) && x.text && (!end || x.end === end)).sort((a, b) => b.text.length - a.text.length)[0] || null;
}

function selectXbrlPoint(rows: any[], concepts: string[], end: string) {
  for (const concept of concepts) {
    const fact = rows.filter(x => x.local === concept && x.value != null && x.value >= 0 && x.end === end && !x.start).sort((a, b) => b.value - a.value)[0];
    if (fact) return fact;
  }
  return null;
}

function sumXbrlPointGroups(rows: any[], groups: string[][], end: string) {
  return sumXbrlSelected(groups.map(group => selectXbrlPoint(rows, group, end)));
}

function sumXbrlSelected(selectedRaw: any[]) {
  const selected = selectedRaw.filter(Boolean);
  if (!selected.length) return null;
  const unique = uniqueBy(selected, x => x.factId), unit = unique[0].unit;
  if (!unit || !unique.every(x => x.unit === unit)) return null;
  return { value: unique.reduce((n, x) => n + x.value, 0), unit, end, components: unique };
}

function xbrlItem(metric: string, x: any, url: string): EvidenceItem {
  return { metric, value: x.value ?? x.text, unit: currencyUnit(x.unit) || (x.value == null ? "text" : x.unit), period: x.start ? `${x.start} to ${x.end}` : x.end, sourceName: `ESEF filed XBRL · ${x.concept}`, sourceUrl: url, tag: x.concept, location: `fact:${x.factId}`, quality: "OFFICIAL" };
}

function xbrlCompositeItem(metric: string, x: any, url: string): EvidenceItem {
  return { metric, value: x.value, unit: currencyUnit(x.unit) || x.unit, period: x.end, sourceName: `ESEF filed XBRL · ${x.components.map((v: any) => v.concept).join(" + ")}`, sourceUrl: url, tag: x.components.map((v: any) => v.concept).join(" + "), location: x.components.map((v: any) => `fact:${v.factId}`).join(" + "), method: "SUM_OF_REPORTED_COMPONENTS", quality: "OFFICIAL" };
}

async function readCachedRegulatoryEvidence(identity: any) {
  const { data: document, error } = await db().from("hpos_regulatory_documents").select("*").eq("isin", identity.isin).eq("status", "EXTRACTED").order("period_end", { ascending: false }).limit(1).maybeSingle();
  if (error || !document) return null;
  const acquired = await regulatoryDocumentToEvidence(identity, document);
  return acquired ? { acquired, fresh: Date.now() - Date.parse(document.discovered_at) < DOCUMENT_DISCOVERY_TTL } : null;
}

async function readRegulatoryDocumentByFiling(sourceType: string, filingId: string) {
  if (!filingId) return null;
  const { data: document, error } = await db().from("hpos_regulatory_documents").select("*").eq("source_type", sourceType).eq("filing_id", filingId).eq("status", "EXTRACTED").maybeSingle();
  return error || !document ? null : regulatoryDocumentToEvidence({ isin: document.isin, ticker: document.symbol, name: document.legal_name }, document);
}

async function regulatoryDocumentToEvidence(identity: any, document: any) {
  const { data: facts, error } = await db().from("hpos_regulatory_facts").select("*").eq("document_id", document.id);
  if (error || !Array.isArray(facts) || !facts.length) return null;
  const evidence: EvidenceItem[] = facts.map((x: any) => ({ metric: x.metric, value: x.value_numeric ?? x.value_text ?? "", unit: x.unit || "", period: x.period_start ? `${x.period_start} to ${x.period_end}` : x.period_end || "", sourceName: x.source_name, sourceUrl: x.source_url, tag: x.concept, location: x.location, method: x.method || undefined, quality: x.quality }));
  const value = (metric: string) => facts.find((x: any) => x.metric === metric)?.value_numeric ?? null;
  const business = facts.find((x: any) => x.metric === "businessProfile")?.value_text || "";
  const interestFact = facts.find((x: any) => x.metric === "interestIncome");
  return { source: "ESEF_XBRL_CACHE", official: true, identity: { ...identity, lei: document.lei, legalName: document.legal_name }, business: { state: prohibitedBusinessText(business) ? "FAIL" : "OPEN", description: business, sic: "", sourceUrl: document.report_url, filingUrl: document.report_url }, financial: { revenue: value("revenue"), interestIncome: value("interestIncome"), interestIncomeMethod: String(interestFact?.concept || "").endsWith(":InterestIncome") ? "LOWER_BOUND" : interestFact ? "FINANCE_INCOME_UPPER_BOUND" : "MISSING", totalDebt: value("totalDebt"), interestBearingAssetsUpperBound: value("interestBearingAssetsUpperBound"), marketValueAtCheck: null, marketValueAsOf: "", currency: document.currency || "", period: document.period_end || "", marketValueMethod: "UNAVAILABLE", marketCurrencyCompatible: false, debtDirect: value("totalDebt") != null, interestAssetsUpperBound: true }, evidence };
}

async function saveRegulatoryEvidence(identity: any, lei: any, filing: any, parsed: any, acquired: any) {
  const attributes = filing?.attributes || {}, filingId = String(attributes.fxo_id || filing.id || "");
  const document = { isin: identity.isin, symbol: identity.ticker || null, lei: lei.lei, legal_name: lei.legalName, source_type: "ESEF_XBRL", source_name: "XBRL International filings repository · source package from OAM", source_url: `${ESEF}/api/filings/${filing.id}`, filing_id: filingId, document_type: "ESEF_ANNUAL_REPORT", period_start: parsed.reportStart, period_end: parsed.reportEnd, filing_date: attributes.date_added ? String(attributes.date_added).slice(0, 10) : null, report_url: parsed.reportUrl, package_url: parsed.packageUrl, json_url: parsed.jsonUrl, viewer_url: parsed.viewerUrl, sha256: attributes.sha256 || null, currency: parsed.financial.currency || null, status: "EXTRACTED", quality: "OFFICIAL_FILED_PACKAGE_COPY", raw_metadata: attributes, discovered_at: new Date().toISOString(), fetched_at: new Date().toISOString(), updated_at: new Date().toISOString() };
  const { data: saved, error } = await db().from("hpos_regulatory_documents").upsert(document, { onConflict: "source_type,filing_id" }).select("id").single();
  if (error || !saved?.id) throw httpError(500, "regulatory_document_store_failed");
  const facts = (acquired.evidence || []).map((x: EvidenceItem) => ({ document_id: saved.id, isin: identity.isin, metric: x.metric, value_numeric: typeof x.value === "number" ? x.value : null, value_text: typeof x.value === "string" ? x.value : null, unit: x.unit || null, period_start: x.period.includes(" to ") ? x.period.split(" to ")[0] : null, period_end: x.period.includes(" to ") ? x.period.split(" to ")[1] : x.period || null, concept: x.tag || null, location: x.location || null, source_name: x.sourceName, source_url: x.sourceUrl, quality: x.quality, method: x.method || "REPORTED_FACT" }));
  const s = db(), { error: deleteError } = await s.from("hpos_regulatory_facts").delete().eq("document_id", saved.id);
  if (deleteError) throw httpError(500, "regulatory_fact_replace_failed");
  if (facts.length) { const { error: factError } = await s.from("hpos_regulatory_facts").insert(facts); if (factError) throw httpError(500, "regulatory_fact_store_failed"); }
}

async function acquireSecEvidence(identity: any, company: any) {
  const cik = String(company.cik_str).padStart(10, "0"), companyFactsUrl = `${SEC}/api/xbrl/companyfacts/CIK${cik}.json`, submissionsUrl = `${SEC}/submissions/CIK${cik}.json`;
  const [factsResponse, submissionsResponse] = await Promise.all([
    optionalJson(companyFactsUrl, { "User-Agent": SEC_AGENT }),
    optionalJson(submissionsUrl, { "User-Agent": SEC_AGENT })
  ]);
  const facts = factsResponse?.facts || {}, submissions = submissionsResponse || {};
  const annualForms = new Set(["10-K", "10-K/A", "20-F", "20-F/A", "40-F", "40-F/A"]);
  const revenue = selectDurationFact(facts, ["RevenueFromContractWithCustomerExcludingAssessedTax", "Revenues", "SalesRevenueNet", "Revenue", "RevenueFromContractsWithCustomers"], annualForms);
  const interestIncome = selectDurationFact(facts, ["InterestIncomeExpenseNonoperating", "InterestAndDividendIncomeOperating", "InterestIncomeBank", "InterestIncome"], annualForms, revenue?.end);
  const reportEnd = revenue?.end || newestFactEnd(facts);
  const totalDebt = debtFact(facts, reportEnd);
  const interestAssets = interestAssetFact(facts, reportEnd);
  const financialCurrency = upper(revenue?.unit || totalDebt?.unit || interestAssets?.unit);
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
  return {
    source: "SEC_XBRL_GENERIC", official: true, identity: { ...identity, cik, legalName: submissions.name || company.title },
    business: { state: prohibitedSic(sic, sicDescription) ? "FAIL" : "OPEN", description: sicDescription, sic, sourceUrl: submissionsUrl, filingUrl },
    financial: {
      revenue: revenue?.value ?? null, interestIncome: interestIncome?.value ?? null, interestIncomeMethod: interestIncome ? "LOWER_BOUND" : "MISSING", totalDebt: totalDebt?.value ?? null,
      interestBearingAssetsUpperBound: interestAssets?.value ?? null, marketValueAtCheck: null, marketValueAsOf: "",
      currency: financialCurrency || "", period: reportEnd || "", marketValueMethod: "UNAVAILABLE", marketCurrencyCompatible: false,
      debtDirect: totalDebt?.direct === true, interestAssetsUpperBound: true
    }, evidence
  };
}

function evaluate(acquired: any) {
  const f = acquired.financial || {}, b = acquired.business || {};
  const ratio = (a: any, d: any) => Number.isFinite(Number(a)) && Number(a) >= 0 && Number(d) > 0 ? Number(a) / Number(d) : null;
  const impureExact = ratio(f.nonPermissibleIncome, f.revenue), impureLowerBound = ratio(f.interestIncome, f.revenue), assets = ratio(f.interestBearingAssetsUpperBound, f.marketValueAtCheck), debt = ratio(f.totalDebt, f.marketValueAtCheck);
  const impureProxySource = f.interestIncomeMethod === "LOWER_BOUND" ? "OFFICIAL_INTEREST_INCOME_LOWER_BOUND" : f.interestIncomeMethod === "FINANCE_INCOME_UPPER_BOUND" ? "ESEF_FINANCE_INCOME_UPPER_BOUND" : "MISSING";
  const marketOk = Number(f.marketValueAtCheck) > 0 && f.marketCurrencyCompatible === true;
  const criteria: Record<string, Criterion> = {
    business: { rule: "Zulässiges Kerngeschäft", state: b.state === "FAIL" ? "FAIL" : "OPEN", value: b.sic || b.description || null, limit: null, source: b.state === "FAIL" ? "OFFICIAL_BUSINESS_EXCLUSION" : acquired.official ? "OFFICIAL_BUSINESS_DESCRIPTION_UNCLASSIFIED" : "UNVERIFIED_DISCOVERY" },
    impureIncome: { rule: "Nicht-zulässige Einnahmen / Gesamtumsatz", state: impureExact == null ? (impureLowerBound != null && f.interestIncomeMethod === "LOWER_BOUND" && impureLowerBound > RULES.impureIncomeMax ? "FAIL" : "OPEN") : impureExact <= RULES.impureIncomeMax ? "PASS" : "FAIL", value: impureExact ?? impureLowerBound, limit: RULES.impureIncomeMax, source: impureExact != null ? "OFFICIAL_NON_PERMISSIBLE_INCOME" : impureLowerBound != null ? impureProxySource : "MISSING" },
    interestAssets: { rule: "Zinstragende Vermögenswerte / Marktwert am Prüftag", state: !marketOk || assets == null ? "OPEN" : assets <= RULES.interestAssetsMax ? "PASS" : "OPEN", value: assets, limit: RULES.interestAssetsMax, source: assets == null ? "MISSING" : "OFFICIAL_FINANCIALS_AND_MARKET_CAP" },
    interestDebt: { rule: "Zinstragende Schulden / Marktwert am Prüftag", state: !marketOk || debt == null ? "OPEN" : debt <= RULES.interestDebtMax ? "PASS" : f.debtDirect ? "FAIL" : "OPEN", value: debt, limit: RULES.interestDebtMax, source: debt == null ? "MISSING" : "OFFICIAL_FINANCIALS_AND_MARKET_CAP" }
  };
  const entries = Object.values(criteria);
  const failed = entries.filter(x => x.state === "FAIL");
  const missingCriteria = entries.filter(x => x.state === "OPEN").map(x => x.rule);
  if (failed.length) return { state: "FAIL", standard: "AAOIFI SS21", criteria, missingCriteria: [], reason: `Nicht halalkonform: ${failed.map(x => x.rule).join("; ")} überschreitet das freigegebene Kriterium oder fällt unter ein ausgeschlossenes Kerngeschäft.` };
  if (entries.every(x => x.state === "PASS")) return { state: "PASS", standard: "AAOIFI SS21", criteria, missingCriteria: [], reason: "Halalkonform: Kerngeschäft und alle drei AAOIFI-Finanzkriterien sind mit nachvollziehbarer Evidenz bestanden." };
  return { state: "OPEN_REVIEW", standard: "AAOIFI SS21", criteria, missingCriteria, reason: `Prüfung offen. Fehlende oder nicht hinreichend belastbare Kriterien: ${missingCriteria.join("; ")}.` };
}

async function persistRun(result: any, startedAt: string, completedAt: string) {
  const s = db(), run = { id: result.runId, isin: result.identity.isin, symbol: result.identity.ticker || null, state: result.state, methodology: "AAOIFI SS21 · Marktwert am Prüftag · HPOS generic evidence service v1.2", reason: result.reason, missing_criteria: result.missingCriteria, criteria: result.criteria, evidence: result.evidence, started_at: startedAt, completed_at: completedAt };
  const { error: runError } = await s.from("hpos_halal_runs").insert(run);
  if (runError) throw httpError(500, "run_store_failed");
  const { data: old } = await s.from("hpos_halal_evidence").select("source_type,state,expires_at").eq("isin", result.identity.isin).maybeSingle();
  if (old?.source_type === "CURATED_ISIN") return;
  const oldFresh = !old?.expires_at || Date.parse(old.expires_at) > Date.now(), oldDecisive = ["PASS", "FAIL"].includes(String(old?.state || ""));
  if (result.state === "OPEN_REVIEW" && oldDecisive && oldFresh) return;
  const evidence = (result.evidence || []).slice(0, 20).map((x: any) => ({ provider: x.sourceName, status: x.metric, note: `${x.period || ""}${x.value !== undefined ? ` · ${x.value} ${x.unit || ""}` : ""}${x.location ? ` · ${x.location}` : ""}`.slice(0, 500), sourceUrl: x.sourceUrl }));
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

async function attachMarketValueAtCheck(acquired: any, identity: any) {
  const market = await yahooMarketValueAtCheck(upper(identity?.ticker));
  const financial = { ...(acquired?.financial || {}) };
  const financialCurrency = upper(financial.currency), marketCurrency = upper(market.currency);
  const compatible = market.value > 0 && !!financialCurrency && financialCurrency === marketCurrency;
  financial.marketValueAtCheck = compatible ? market.value : null;
  financial.marketValueAsOf = market.asOf;
  financial.marketValueMethod = compatible ? market.method : market.value > 0 ? "CURRENCY_MISMATCH" : "UNAVAILABLE";
  financial.marketCurrencyCompatible = compatible;
  const evidence = [...(acquired?.evidence || [])];
  for (const support of market.supportingEvidence || []) evidence.push(support);
  if (market.value > 0) evidence.push({ metric: "marketValueAtCheck", value: market.value, unit: market.currency, period: market.asOf, sourceName: market.method === "YAHOO_REPORTED_MARKET_CAP_AT_CHECK" ? "Yahoo Finance reported market capitalization" : "Calculated from current price and latest reported ordinary shares", sourceUrl: market.sourceUrl, method: market.method, quality: "MARKET" });
  return { ...acquired, financial, evidence };
}

async function yahooMarketValueAtCheck(symbol: string) {
  const quoteUrl = `${YAHOO}/v10/finance/quoteSummary/${encodeURIComponent(symbol)}?modules=price`;
  if (!symbol) return { value: 0, currency: "", asOf: "", method: "UNAVAILABLE", sourceUrl: quoteUrl, supportingEvidence: [] };
  try {
    const d = await fetchJson(quoteUrl, { "User-Agent": "Mozilla/5.0 HPOS/1.0" }), price = d?.quoteSummary?.result?.[0]?.price || {};
    const value = number(price?.marketCap?.raw ?? price?.marketCap), timestamp = number(price?.regularMarketTime?.raw ?? price?.regularMarketTime);
    if (value > 0) return { value, currency: upper(price?.currency), asOf: timestamp > 0 ? new Date(timestamp * 1000).toISOString() : new Date().toISOString(), method: "YAHOO_REPORTED_MARKET_CAP_AT_CHECK", sourceUrl: quoteUrl, supportingEvidence: [] };
  } catch {}
  const chartUrl = `${YAHOO}/v8/finance/chart/${encodeURIComponent(symbol)}?range=5d&interval=1d`;
  const period2 = Math.floor(Date.now() / 1000) + 86400, period1 = period2 - 5 * 366 * 86400;
  const shareTypes = "quarterlyOrdinarySharesNumber,annualOrdinarySharesNumber";
  const sharesUrl = `${YAHOO}/ws/fundamentals-timeseries/v1/finance/timeseries/${encodeURIComponent(symbol)}?symbol=${encodeURIComponent(symbol)}&type=${shareTypes}&period1=${period1}&period2=${period2}`;
  try {
    const [chart, series] = await Promise.all([fetchJson(chartUrl, { "User-Agent": "Mozilla/5.0 HPOS/1.0" }), fetchJson(sharesUrl, { "User-Agent": "Mozilla/5.0 HPOS/1.0" })]);
    const x = chart?.chart?.result?.[0] || {}, meta = x?.meta || {}, closes = x?.indicators?.quote?.[0]?.close || [];
    const price = number(meta?.regularMarketPrice) || [...closes].reverse().map(number).find((v: number) => v > 0) || 0;
    const shareRows = (Array.isArray(series?.timeseries?.result) ? series.timeseries.result : []).flatMap((row: any) => {
      const type = Array.isArray(row?.meta?.type) ? row.meta.type[0] : "";
      return Array.isArray(row?.[type]) ? row[type] : [];
    }).map((row: any) => ({ value: number(row?.reportedValue?.raw), period: dateOnly(row?.asOfDate || "") })).filter((row: any) => row.value > 0 && row.period).sort((a: any, b: any) => b.period.localeCompare(a.period));
    const shares = shareRows[0] || null, timestamp = number(meta?.regularMarketTime), asOf = timestamp > 0 ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();
    if (price > 0 && shares) return {
      value: price * shares.value, currency: upper(meta?.currency), asOf, method: "CURRENT_PRICE_X_LATEST_REPORTED_ORDINARY_SHARES", sourceUrl: chartUrl,
      supportingEvidence: [
        { metric: "marketPriceAtCheck", value: price, unit: upper(meta?.currency), period: asOf, sourceName: "Yahoo Finance current market price", sourceUrl: chartUrl, method: "LATEST_MARKET_PRICE", quality: "MARKET" },
        { metric: "ordinarySharesLatestReported", value: shares.value, unit: "shares", period: shares.period, sourceName: "Yahoo Finance fundamentals time series", sourceUrl: sharesUrl, method: "LATEST_REPORTED_ORDINARY_SHARES", quality: "MARKET" }
      ]
    };
  } catch {}
  return { value: 0, currency: "", asOf: "", method: "UNAVAILABLE", sourceUrl: quoteUrl, supportingEvidence: [] };
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

function prohibitedSic(sicRaw: string, description: string) {
  const sic = Number(sicRaw), d = upper(description);
  if ((sic >= 2082 && sic <= 2085) || (sic >= 2100 && sic <= 2199) || (sic >= 3480 && sic <= 3489) || (sic >= 3760 && sic <= 3769) || (sic >= 6020 && sic <= 6799) || sic === 7993) return true;
  return /(CASINO|GAMBLING|BREWER|DISTILL|TOBACCO|FIREARMS|AMMUNITION|DEFENSE CONTRACTOR|MORTGAGE BANK|COMMERCIAL BANK)/.test(d);
}

function prohibitedBusinessText(description: string) {
  return /\b(CASINO|GAMBLING|BREWER(?:Y|IES)?|DISTILL(?:ERY|ER|ING)?|TOBACCO|FIREARMS?|AMMUNITION|COMMERCIAL BANK|CONVENTIONAL BANKING|PORK PROCESSING)\b/i.test(description || "");
}

function companyKey(value: string) {
  return upper(value).replace(/&/g, " AND ").replace(/\b(A\/S|AG|SE|PLC|INC|INCORPORATED|CORP|CORPORATION|LTD|LIMITED|NV|N\.V|SA|S\.A|SPA|S\.P\.A|OYJ|AB)(?:[- ]+[A-Z])?\b/g, " ").replace(/[^A-Z0-9]+/g, " ").trim();
}

function currencyUnit(value: string) { const x = String(value || ""); return x.includes(":") ? upper(x.split(":").at(-1)) : upper(x); }
function absoluteUrl(base: string, path: any) { const x = String(path || "").trim(); if (!x) return ""; try { return new URL(x, base).toString(); } catch { return ""; } }
function dateOnly(value: string) { const m = String(value || "").match(/^\d{4}-\d{2}-\d{2}/); return m?.[0] || ""; }
function shiftDate(value: string, amount: number) { if (!value) return ""; const d = new Date(`${value}T00:00:00Z`); if (!Number.isFinite(d.getTime())) return ""; d.setUTCDate(d.getUTCDate() + amount); return d.toISOString().slice(0, 10); }

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
