import { trustedHttpsUrl, issuerHostMatches } from "./source-trust.mjs";

/** ISO 6166 ISIN check digit, without issuer-specific exceptions. */
export function validIsin(value) {
  const isin = String(value || "").toUpperCase();
  if (!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) return false;
  const digits = [...isin].map(char => /[A-Z]/.test(char) ? String(char.charCodeAt(0) - 55) : char).join("");
  let sum = 0;
  for (let i = digits.length - 1, double = false; i >= 0; i--, double = !double) {
    let n = Number(digits[i]) * (double ? 2 : 1);
    sum += Math.floor(n / 10) + n % 10;
  }
  return sum % 10 === 0;
}

/** Evidence metadata gate: never equate metadata with independently verified financials. */
export function attestReportMetadata({ identity, reportUrl, issuerWebsite, period, currency, pages, sha256 } = {}) {
  const reasons = [];
  if (!validIsin(identity?.isin)) reasons.push("ISIN_MISSING_OR_INVALID");
  if (!String(identity?.name || "").trim()) reasons.push("ISSUER_NAME_MISSING");
  if (!trustedHttpsUrl(reportUrl) || !trustedHttpsUrl(issuerWebsite) || !issuerHostMatches(issuerWebsite, reportUrl)) reasons.push("SOURCE_NOT_ISSUER_SCOPED");
  const periodString = String(period || "");
  const periodDate = new Date(periodString);
  if (!/^20[0-9]{2}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.test(periodString) || Number.isNaN(periodDate.getTime()) || periodDate.toISOString().slice(0, 10) !== periodString || periodDate.getTime() > Date.now()) reasons.push("PERIOD_UNVERIFIED");
  if (!/^[A-Z]{3}$/.test(String(currency || ""))) reasons.push("CURRENCY_UNVERIFIED");
  if (!Number.isInteger(pages) || pages < 1) reasons.push("PAGES_UNVERIFIED");
  if (!/^[a-f0-9]{64}$/i.test(String(sha256 || ""))) reasons.push("DOCUMENT_FINGERPRINT_MISSING");
  return { status: reasons.length ? "UNATTESTED" : "METADATA_CHECKED", reasons };
}
