/** HPOS fail-closed evidence preflight. Pure function; cannot grant PASS. */
const required=["revenue","totalDebt","interestBearingAssetsUpperBound","interestIncome","marketValueAtCheck"];
export function validIsin(raw){const s=String(raw??"").trim().toUpperCase();if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(s))return false;let d="";for(const c of s)d+=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;let sum=0,alt=false;for(let i=d.length-1;i>=0;i--){let n=Number(d[i]);if(alt){n*=2;if(n>9)n-=9;}sum+=n;alt=!alt;}return sum%10===0;}
function dateMs(s){if(typeof s!=="string"||!/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/.test(s))return NaN;const n=Date.parse(s+"T00:00:00Z");return Number.isFinite(n)&&new Date(n).toISOString().slice(0,10)===s?n:NaN;}
function sourceUrl(s){try{const u=new URL(s);return u.protocol==="https:"&&!u.username&&!u.password&&u.hostname.includes(".")&&!u.hostname.endsWith(".local")&&!["localhost","127.0.0.1"].includes(u.hostname);}catch{return false;}}
export function validateEvidence(input,now=Date.now()){
 const blockers=[],isin=String(input?.isin??"").trim().toUpperCase();
 if(!validIsin(isin))blockers.push("IDENTITY_INVALID_ISIN");
 if(input?.identity?.isin!==isin||input?.identity?.status!=="VERIFIED")blockers.push("IDENTITY_NOT_VERIFIED");
 if(input?.identity?.quoteType!=="EQUITY")blockers.push("UNSUPPORTED_SECURITY_TYPE");
 if(input?.acquisition?.mode!=="SERVER"||input?.acquisition?.verified!==true)blockers.push("SOURCE_NOT_SERVER_VERIFIED");
 if(!Number.isFinite(now))blockers.push("INVALID_CHECK_TIME");
 const facts=Array.isArray(input?.facts)?input.facts:[],selected={};
 for(const metric of required){const m=facts.filter(x=>x?.metric===metric);
  if(m.length!==1){blockers.push((m.length?"AMBIGUOUS_":"MISSING_")+metric);continue;}
  const f=m[0];selected[metric]=f;
  if(f.isin!==isin)blockers.push("FACT_IDENTITY_MISMATCH_"+metric);
  if(typeof f.value!=="number"||!Number.isFinite(f.value)||f.value<0)blockers.push("INVALID_VALUE_"+metric);
  if(!/^[A-Z]{3}$/.test(String(f.currency??"")))blockers.push("INVALID_CURRENCY_"+metric);
  if(!sourceUrl(f.sourceUrl)||typeof f.sourceName!=="string"||!f.sourceName.trim())blockers.push("SOURCE_UNVERIFIABLE_"+metric);
  if(f.sourceVerified!==true||!["OFFICIAL","MARKET"].includes(f.quality))blockers.push("SOURCE_NOT_VALIDATED_"+metric);
  const end=dateMs(f.periodEnd);
  if(!Number.isFinite(end)||end>now||now-end>550*86400000)blockers.push("PERIOD_INVALID_OR_STALE_"+metric);
  if(metric==="marketValueAtCheck"&&(!Number.isFinite(end)||now-end>14*86400000))blockers.push("MARKET_VALUE_STALE");
 }
 if(new Set(Object.values(selected).map(x=>x.currency).filter(Boolean)).size>1)blockers.push("CURRENCY_MISMATCH_REQUIRES_CONVERSION");
 if(selected.revenue?.value===0)blockers.push("ZERO_REVENUE_REQUIRES_REVIEW");
 if(selected.marketValueAtCheck?.value===0)blockers.push("ZERO_MARKET_VALUE");
 if(!input?.business||input.business.isin!==isin||input.business.sourceVerified!==true||!sourceUrl(input.business.sourceUrl)||!["PASS","FAIL"].includes(input.business.state))blockers.push("BUSINESS_UNVERIFIED");
 const reasons=[...new Set(blockers)];
 return Object.freeze({isin,ready:reasons.length===0,state:"OPEN_REVIEW",blockers:reasons,validatedMetrics:required.filter(x=>selected[x]&&!reasons.some(b=>b.endsWith("_"+x)))});
}
export async function evidenceFingerprint(input){const bytes=new TextEncoder().encode(JSON.stringify(input));const digest=await crypto.subtle.digest("SHA-256",bytes);return [...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,"0")).join("");}
