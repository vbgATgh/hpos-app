/** Fail-closed URL and issuer-host controls for HPOS report discovery. */
export function trustedHttpsUrl(value) {
  try {
    const u = new URL(String(value || ''));
    const h = u.hostname.toLowerCase();
    if (u.protocol !== 'https:' || u.username || u.password || u.port && u.port !== '443') return null;
    if (!h || h === 'localhost' || h.endsWith('.localhost') || h.endsWith('.local') || h.endsWith('.internal') || h.endsWith('.test') || h.endsWith('.invalid') || h.endsWith('.onion')) return null;
    if (h.includes('%') || h.includes('..') || h.startsWith('.') || h.endsWith('.')) return null;
    if (/^[0-9.]+$/.test(h) || h.includes(':') || /^\d+$/.test(h)) return null;
    if (!/^[a-z0-9.-]+$/.test(h) || !h.includes('.')) return null;
    if (h.split('.').some(label => !label || label.length > 63 || label.startsWith('-') || label.endsWith('-'))) return null;
    return u;
  } catch { return null; }
}
export function issuerHostMatches(issuerWebsite, candidate) {
  const origin = trustedHttpsUrl(issuerWebsite), target = trustedHttpsUrl(candidate);
  if (!origin || !target) return false;
  const a=origin.hostname.toLowerCase(),b=target.hostname.toLowerCase();
  return a===b || b.endsWith('.'+a) || a.endsWith('.'+b);
}
export async function fetchIssuerResource(url, issuerWebsite, options={}, dependencies={}) {
  const resolvePublicDns = dependencies.resolvePublicDns || hasPublicDns;
  const httpFetch = dependencies.fetch || fetch;
  if (!issuerHostMatches(issuerWebsite,url)) return null;
  let current=url;
  for(let hops=0;hops<=3;hops++){
    if(!issuerHostMatches(issuerWebsite,current)) return null;
    // DNS pinning is not supported by the Edge fetch API. Reject hostnames
    // resolving to non-public addresses before each request (best effort).
    if (!await resolvePublicDns(current)) return null;
    const response=await httpFetch(current,{...options,redirect:'manual'});
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.get('location');if(!location)return null;
      current=new URL(location,current).toString();continue;
    }
    return response.ok && issuerHostMatches(issuerWebsite,response.url || current)?response:null;
  }
  return null;
}

export function isPublicIp(ip) {
  const v=String(ip||'').trim();
  if (!/^[0-9]{1,3}(?:[.][0-9]{1,3}){3}$/.test(v)) return false;
  const p=v.split('.').map(Number);
  if(p.some(n=>n>255)) return false;
  const [a,b]=p;
  return !(a===0||a===10||a===127||a>=224||a===169&&b===254||a===172&&b>=16&&b<=31||a===192&&b===168||a===100&&b>=64&&b<=127||a===192&&b===0||a===192&&b===88||a===198&&(b===18||b===19)||a===198&&b===51||a===203&&b===0||a>=240);
}
async function hasPublicDns(url) {
  const host=trustedHttpsUrl(url)?.hostname;
  if(!host)return false;
  try {
    const lookup=await Promise.all(['A','AAAA'].map(type=>fetch('https://cloudflare-dns.com/dns-query?name='+encodeURIComponent(host)+'&type='+type,{headers:{Accept:'application/dns-json'},redirect:'error',signal:AbortSignal.timeout(3500)}).then(async r=>r.ok?await r.json():null).catch(()=>null)));
    const a=lookup[0],aaaa=lookup[1];
    if(!a||!aaaa||a.Status!==0&&a.Status!==3||aaaa.Status!==0&&aaaa.Status!==3)return false;
    const records=[...(a.Answer||[]),...(aaaa.Answer||[])].filter(x=>x.type===1||x.type===28);
    // IPv6 is rejected until complete public-address classification is available.
    return records.length>0 && records.every(x=>x.type===1&&isPublicIp(x.data));
  }catch{return false}
}
