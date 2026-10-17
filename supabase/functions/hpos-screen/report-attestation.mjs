/** Evidence metadata gate: no report is attested from a URL alone. */
export function attestReportMetadata({identity,reportUrl,issuerWebsite,period,currency,pages,sha256}={}) {
  const reasons=[];
  const isin=String(identity?.isin||'').toUpperCase();
  if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)) reasons.push('ISIN_MISSING_OR_INVALID');
  if(!String(identity?.name||'').trim()) reasons.push('ISSUER_NAME_MISSING');
  try {const u=new URL(reportUrl);const site=new URL(issuerWebsite);if(u.protocol!=='https:'||site.protocol!=='https:'||!(u.hostname===site.hostname||u.hostname.endsWith('.'+site.hostname))) reasons.push('SOURCE_NOT_ISSUER_SCOPED')}catch{reasons.push('SOURCE_URL_INVALID')}
  if(!/^20[0-9]{2}-(0[1-9]|1[0-2])-([0-2][0-9]|3[01])$/.test(String(period||''))||Date.parse(period)>Date.now()) reasons.push('PERIOD_UNVERIFIED');
  if(!/^[A-Z]{3}$/.test(String(currency||''))) reasons.push('CURRENCY_UNVERIFIED');
  if(!Number.isInteger(pages)||pages<1) reasons.push('PAGES_UNVERIFIED');
  if(!/^[a-f0-9]{64}$/i.test(String(sha256||''))) reasons.push('DOCUMENT_FINGERPRINT_MISSING');
  return {status:reasons.length?'UNATTESTED':'METADATA_CHECKED',reasons};
}
