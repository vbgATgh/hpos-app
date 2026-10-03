const MAX_HTML_BYTES = 1_500_000;
const MAX_PDF_BYTES = 14_000_000;
const MAX_CRAWL_PAGES = 5;
const MAX_PDF_PAGES = 90;

export async function acquireIssuerReportEvidence(identity, profile) {
  const website = publicHttps(profile?.website || "");
  if (!website) return null;
  const discovered = await discoverReport(website);
  if (!discovered?.url) return null;
  const extracted = await extractPdf(discovered.url);
  if (!extracted?.text) return null;
  const parsed = extractOfficialReportText(extracted.text, {
    identity,
    reportUrl: extracted.url,
    sourcePageUrl: discovered.sourcePageUrl,
    pageCount: extracted.pageCount
  });
  if (!parsed || !Object.keys(parsed.financial).some(key => parsed.financial[key] != null)) return null;
  return parsed;
}

async function discoverReport(website) {
  const origin = new URL(website);
  const queue = [origin.toString()];
  const seen = new Set();
  const reports = [];
  while (queue.length && seen.size < MAX_CRAWL_PAGES) {
    const pageUrl = queue.shift();
    if (!pageUrl || seen.has(pageUrl)) continue;
    seen.add(pageUrl);
    const html = await fetchLimitedText(pageUrl, "text/html,application/xhtml+xml");
    if (!html) continue;
    for (const link of linksFromHtml(html, pageUrl)) {
      if (!trustedLink(origin, link.url)) continue;
      if (link.isPdf && link.reportScore >= 8) reports.push({ ...link, sourcePageUrl: pageUrl });
      else if (!link.isPdf && link.pageScore >= 5 && !seen.has(link.url) && queue.length < MAX_CRAWL_PAGES * 2) queue.push(link.url);
    }
  }
  return reports.sort((a, b) => b.reportScore - a.reportScore || b.year - a.year)[0] || null;
}

function linksFromHtml(html, base) {
  const out = [];
  const re = /<a\b[^>]*href\s*=\s*["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  for (const match of html.matchAll(re)) {
    let url = "";
    try { url = new URL(decodeHtml(match[1]), base).toString(); } catch { continue; }
    if (!publicHttps(url)) continue;
    const label = stripHtml(match[2]);
    const hay = `${label} ${url}`.toLowerCase();
    const year = Math.max(...[...hay.matchAll(/\b(20\d{2})\b/g)].map(x => Number(x[1])), 0);
    const isPdf = /\.pdf(?:$|[?#])/i.test(url) || /(?:pdf|download|resource\/dm)/i.test(url);
    const annual = /(annual report|annual financial|audited financial|year[- ]end|geschäftsbericht|jahresbericht|rapport annuel)/i.test(hay);
    const financial = /(financial statements|results|reports?\b|investor)/i.test(hay);
    const currentYear = new Date().getUTCFullYear();
    const recency = year ? Math.max(0, 5 - Math.abs(currentYear - year)) : 0;
    out.push({ url, label, year, isPdf, reportScore: (annual ? 10 : 0) + (financial ? 4 : 0) + recency + (isPdf ? 2 : 0), pageScore: (/(investor|financial|reports?|results|publications)/i.test(hay) ? 6 : 0) + recency });
  }
  return unique(out, x => x.url);
}

async function extractPdf(url) {
  try {
    const response = await fetch(url, { headers: { Accept: "application/pdf", "User-Agent": "HPOS/1.0 official-report-research" }, redirect: "follow", signal: AbortSignal.timeout(20000) });
    const finalUrl = publicHttps(response.url) || "";
    const length = Number(response.headers.get("content-length") || 0);
    if (!response.ok || !finalUrl || (length && length > MAX_PDF_BYTES)) return null;
    const bytes = new Uint8Array(await response.arrayBuffer());
    if (bytes.byteLength < 500 || bytes.byteLength > MAX_PDF_BYTES || String.fromCharCode(...bytes.slice(0, 4)) !== "%PDF") return null;
    const pdfjs = await import("npm:pdfjs-dist@4.10.38/legacy/build/pdf.mjs");
    const pdf = await pdfjs.getDocument({ data: bytes, disableWorker: true, isEvalSupported: false, useSystemFonts: true }).promise;
    if (!pdf?.numPages || pdf.numPages > MAX_PDF_PAGES) return null;
    const pages = [];
    for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber++) {
      const page = await pdf.getPage(pageNumber);
      const content = await page.getTextContent();
      pages.push(content.items.map(item => String(item?.str || "")).join(" "));
    }
    return { url: finalUrl, pageCount: pdf.numPages, text: pages.map((page, i) => `\n[PAGE ${i + 1}]\n${page}`).join("\n") };
  } catch { return null; }
}

export function extractOfficialReportText(rawText, meta = {}) {
  const text = normalizeText(rawText);
  if (text.length < 1000) return null;
  const identity = meta.identity || {};
  if (!companyTextMatches(text, identity?.name)) return null;
  const unit = detectUnit(text), currency = unit.currency, multiplier = unit.multiplier;
  const periodEnd = detectPeriodEnd(text);
  if (!currency || !periodEnd) return null;
  const reportUrl = publicHttps(meta.reportUrl || "");
  if (!reportUrl) return null;
  const sourceName = `${String(identity?.name || "Issuer").trim()} official annual report`;
  const amount = "(\\d{1,3}(?:[,.]\\d{3})+|\\d+)";
  const revenue = metric(text, [new RegExp(`\\b(?:total\\s+)?revenue(?:s)?\\s+\\$?\\s*\\(?${amount}\\)?`, "i"), new RegExp(`\\bnet sales\\s+\\$?\\s*\\(?${amount}\\)?`, "i")], multiplier);
  const totalDebt = metric(text, [new RegExp(`\\btotal debt\\*?\\s+\\$?\\s*\\(?${amount}\\)?`, "i"), new RegExp(`\\bborrowings and lease liabilities\\s+\\$?\\s*\\(?${amount}\\)?`, "i")], multiplier);
  const currentAssets = metric(text, [new RegExp(`\\btotal current assets\\s+\\$?\\s*\\(?${amount}\\)?`, "i")], multiplier);
  const interestIncome = metric(text, [new RegExp(`\\binterest income\\s+\\$?\\s*\\(?${amount}\\)?`, "i"), new RegExp(`\\bfinance income\\s+\\$?\\s*\\(?${amount}\\)?`, "i")], multiplier);
  const financial = {
    revenue: revenue?.value ?? null,
    interestIncome: interestIncome?.value ?? null,
    interestIncomeMethod: interestIncome ? "LOWER_BOUND" : "MISSING",
    nonPermissibleIncome: null,
    totalDebt: totalDebt?.value ?? null,
    interestBearingAssetsUpperBound: currentAssets?.value ?? null,
    marketValueAtCheck: null,
    marketValueAsOf: "",
    currency,
    period: periodEnd,
    marketValueMethod: "UNAVAILABLE",
    marketCurrencyCompatible: false,
    debtDirect: false,
    interestAssetsUpperBound: !!currentAssets
  };
  const specs = [
    ["revenue", revenue, "Reported revenue"],
    ["totalDebt", totalDebt, "Reported total debt"],
    ["interestBearingAssetsUpperBound", currentAssets, "Total current assets; conservative upper bound"],
    ["interestIncome", interestIncome, "Reported interest or finance income; lower bound"]
  ];
  const evidence = specs.filter(([, value]) => value).map(([metricName, value, label]) => ({
    metric: metricName,
    value: value.value,
    unit: currency,
    period: periodEnd,
    sourceName,
    sourceUrl: reportUrl,
    location: `page:${value.page}`,
    method: label,
    quality: "OFFICIAL"
  }));
  const description = businessDescription(text, identity?.name);
  if (description) evidence.unshift({ metric: "businessProfile", value: description, unit: "text", period: periodEnd, sourceName, sourceUrl: reportUrl, location: "official-report", method: "ISSUER_REPORT_TEXT", quality: "OFFICIAL" });
  return { source: "ISSUER_REPORT_GENERIC", official: true, identity, businessDescription: description, reportUrl, financial, evidence, extraction: { sourcePageUrl: meta.sourcePageUrl || "", pageCount: Number(meta.pageCount || 0), parser: "PDFJS_STRICT_LABELS_V1" } };
}

function metric(text, patterns, multiplier) {
  for (const pattern of patterns) {
    const match = pattern.exec(text);
    if (!match) continue;
    const value = parseAmount(match[1]) * multiplier;
    if (!Number.isFinite(value) || value < 0) continue;
    const page = pageAt(text, match.index);
    return { value, page };
  }
  return null;
}

function detectUnit(text) {
  const head = text.slice(0, Math.min(text.length, 160000));
  const currency = /(?:thousands|millions)?\s+of\s+canadian dollars|\bCAD\b/i.test(head) ? "CAD" : /(?:thousands|millions)?\s+of\s+(?:u\.s\.?|us) dollars|\bUSD\b/i.test(head) ? "USD" : /(?:thousands|millions)?\s+of\s+euros?|\bEUR\b/i.test(head) ? "EUR" : /pounds sterling|\bGBP\b/i.test(head) ? "GBP" : "";
  const multiplier = /(?:amounts|figures|tabular amounts)?[^.\n]{0,80}\bin millions\b|\(\s*in millions/i.test(head) ? 1_000_000 : /(?:amounts|figures|tabular amounts)?[^.\n]{0,80}\bin thousands\b|\(\s*in thousands/i.test(head) ? 1_000 : 1;
  return { currency, multiplier };
}

function detectPeriodEnd(text) {
  const candidates = [...text.slice(0, 220000).matchAll(/(?:year|fiscal year|twelve months)\s+ended\s+(?:on\s+)?(january|february|march|april|may|june|july|august|september|october|november|december)\s+(\d{1,2}),\s+(20\d{2})/gi)]
    .map(x => `${x[3]}-${String(monthNumber(x[1])).padStart(2, "0")}-${String(Number(x[2])).padStart(2, "0")}`)
    .filter(x => Date.parse(x) <= Date.now() + 31 * 86400000)
    .sort().reverse();
  return candidates[0] || "";
}

function businessDescription(text, name) {
  const clean = text.replace(/\[PAGE \d+\]/g, " ");
  const patterns = [/(?:we|the company|the corporation)\s+(?:is|are)\s+(.{40,700}?)(?:\n|\.{1,2}\s+[A-Z])/i, /(?:nature of (?:the )?business|business overview)\s+(.{40,700}?)(?:\n\s*\n|\[PAGE)/i];
  for (const pattern of patterns) { const match = pattern.exec(clean); if (match) return `${String(name || "").trim()} ${match[1]}`.replace(/\s+/g, " ").trim().slice(0, 1200); }
  return "";
}

function companyTextMatches(text, name) {
  const wanted = companyWords(name);
  if (!wanted.length) return false;
  const head = text.slice(0, 50000).toUpperCase();
  return wanted.filter(word => head.includes(word)).length >= Math.min(2, wanted.length);
}

function companyWords(value) { return String(value || "").toUpperCase().replace(/&/g, " AND ").split(/[^A-Z0-9]+/).filter(x => x.length >= 4 && !["CORPORATION", "COMPANY", "LIMITED", "HOLDINGS", "GROUP", "INCORPORATED"].includes(x)); }
function pageAt(text, index) { const matches = [...text.slice(0, index).matchAll(/\[PAGE (\d+)\]/g)]; return Number(matches.at(-1)?.[1] || 1); }
function parseAmount(value) {
  const clean = String(value || "").replace(/\s/g, "").replace(/[^0-9,.-]/g, "");
  const commas = (clean.match(/,/g) || []).length, dots = (clean.match(/\./g) || []).length;
  if (commas && dots) {
    const decimal = clean.lastIndexOf(",") > clean.lastIndexOf(".") ? "," : ".";
    const thousands = decimal === "," ? /\./g : /,/g;
    return Number(clean.replace(thousands, "").replace(decimal, "."));
  }
  const separator = commas ? "," : dots ? "." : "";
  if (!separator) return Number(clean);
  const parts = clean.split(separator);
  if (parts.length > 2 || parts.at(-1)?.length === 3) return Number(parts.join(""));
  return Number(parts.join("."));
}
function monthNumber(value) { return ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"].indexOf(String(value).toLowerCase()) + 1; }
function normalizeText(value) { return String(value || "").replace(/\u00a0/g, " ").replace(/[ \t]+/g, " ").replace(/\r/g, "").replace(/\n{3,}/g, "\n\n"); }
function stripHtml(value) { return decodeHtml(String(value || "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim(); }
function decodeHtml(value) { return String(value || "").replace(/&amp;/gi, "&").replace(/&quot;/gi, '"').replace(/&#39;|&apos;/gi, "'").replace(/&lt;/gi, "<").replace(/&gt;/gi, ">"); }
function rootDomain(host) { const parts = String(host || "").toLowerCase().split(".").filter(Boolean); return parts.slice(-2).join("."); }
function trustedLink(origin, value) { try { const url = new URL(value); return !!publicHttps(url.toString()) && (rootDomain(url.hostname) === rootDomain(origin.hostname) || /\.pdf(?:$|[?#])/i.test(url.toString())); } catch { return false; } }
function publicHttps(value) { try { const url = new URL(String(value || "")); const host = url.hostname.toLowerCase(); if (url.protocol !== "https:" || url.username || url.password || host === "localhost" || host.endsWith(".local") || /^127\.|^10\.|^192\.168\.|^169\.254\.|^172\.(1[6-9]|2\d|3[01])\./.test(host)) return ""; return url.toString(); } catch { return ""; } }
function unique(items, key) { const seen = new Set(); return items.filter(item => { const value = key(item); if (!value || seen.has(value)) return false; seen.add(value); return true; }); }
async function fetchLimitedText(url, accept) { try { const response = await fetch(url, { headers: { Accept: accept, "User-Agent": "Mozilla/5.0 HPOS/1.0 official-report-research" }, redirect: "follow", signal: AbortSignal.timeout(10000) }); const length = Number(response.headers.get("content-length") || 0); if (!response.ok || !publicHttps(response.url) || (length && length > MAX_HTML_BYTES)) return ""; const text = await response.text(); return text.length <= MAX_HTML_BYTES ? text : ""; } catch { return ""; } }
