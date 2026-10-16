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
    return u;
  } catch { return null; }
}
export function issuerHostMatches(issuerWebsite, candidate) {
  const origin = trustedHttpsUrl(issuerWebsite), target = trustedHttpsUrl(candidate);
  if (!origin || !target) return false;
  const a=origin.hostname.toLowerCase(),b=target.hostname.toLowerCase();
  return a===b || b.endsWith('.'+a) || a.endsWith('.'+b);
}
export async function fetchIssuerResource(url, issuerWebsite, options={}) {
  if (!issuerHostMatches(issuerWebsite,url)) return null;
  let current=url;
  for(let hops=0;hops<=3;hops++){
    if(!issuerHostMatches(issuerWebsite,current)) return null;
    const response=await fetch(current,{...options,redirect:'manual'});
    if([301,302,303,307,308].includes(response.status)){
      const location=response.headers.get('location');if(!location)return null;
      current=new URL(location,current).toString();continue;
    }
    return response.ok && issuerHostMatches(issuerWebsite,response.url || current)?response:null;
  }
  return null;
}
