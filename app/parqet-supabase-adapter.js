(()=>{'use strict';
const API=(window.HPOS_RUNTIME?.integration?.parqetBaseUrl)||(window.HPOS_RUNTIME?.integration?.baseUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api';
const LEGACY_HOST='hpos-proxy.vbginbox.workers.dev';
const SESSION_KEY='hpos_parqet_session';
const SESSION_EXP_KEY='hpos_parqet_session_expires';
const COMPAT_KEY='hpos_parqet_token';
const VALID_KEY='hpos_parqet_validated';
const PREV_KEY='hpos_parqet_previous';
const SYNC_KEY='hpos_parqet_last_sync';
const REAUTH_GUARD='hpos_parqet_reauth_guard';
const originalFetch=window.fetch.bind(window);

function clearSession(){localStorage.removeItem(SESSION_KEY);localStorage.removeItem(SESSION_EXP_KEY);localStorage.removeItem(COMPAT_KEY)}
function captureOAuthSession(){const hash=new URLSearchParams(location.hash.replace(/^#/,''));if(hash.get('parqet')!=='connected')return false;const s=String(hash.get('session')||''),e=String(hash.get('sessionExpires')||'');if(!/^[A-Za-z0-9_-]{20,}$/.test(s))return false;localStorage.setItem(SESSION_KEY,s);if(e)localStorage.setItem(SESSION_EXP_KEY,e);localStorage.setItem(COMPAT_KEY,'SUPABASE_ADAPTER');history.replaceState(null,'',location.pathname+location.search);return true}
function session(){const id=localStorage.getItem(SESSION_KEY)||'',exp=Date.parse(localStorage.getItem(SESSION_EXP_KEY)||'');if(exp&&Date.now()>exp){clearSession();return''}return id}
function reconnect(reason='reauth'){if(sessionStorage.getItem(REAUTH_GUARD)==='redirecting')return;sessionStorage.setItem(REAUTH_GUARD,'redirecting');localStorage.setItem(REAUTH_GUARD,reason);location.href=API+'/auth/parqet/start'}
function parsed(input){try{return new URL(typeof input==='string'?input:input.url,location.href)}catch{return null}}
function authLike(status,code){return status===401||status===403||/^(session_|refresh_|not_authenticated|oauth_)/.test(String(code||''))}
function validateNormalized(data){if(!Array.isArray(data?.holdings))throw new Error('normalisierter Bestand fehlt');const hs=data.holdings;if(hs.length<1||hs.length>200)throw new Error(`normalisierter Bestand unplausibel (${hs.length})`);const ids=new Set();for(const h of hs){const isin=String(h?.isin||'').toUpperCase(),shares=Number(h?.shares),value=Number(h?.currentValue??h?.value);if(!/^[A-Z]{2}[A-Z0-9]{9}[0-9]$/.test(isin)||!Number.isFinite(shares)||shares<=0||!Number.isFinite(value)||value<=0)throw new Error('normalisierte Position unplausibel');if(ids.has(isin))throw new Error('doppelte ISIN im normalisierten Bestand');ids.add(isin)}const c=Number(data?.cash);if(!Number.isFinite(c)||c<-100000||c>10000000)throw new Error('Cash unplausibel');return data}
async function normalizedPortfolio(){const id=session();if(!id){const e=new Error('Parqet-Verbindung erforderlich');e.code='REAUTH';throw e}const r=await originalFetch(API+'/api/parqet/normalized',{cache:'no-store',headers:{Authorization:`Bearer ${id}`,Accept:'application/json'}});if(!r.ok){let d='';try{d=String((await r.json())?.error||'')}catch{}if(authLike(r.status,d)){clearSession();const e=new Error('Parqet-Verbindung abgelaufen');e.code='REAUTH';throw e}const e=new Error(`Supabase/Parqet HTTP ${r.status}${d?' · '+d:''}`);e.status=r.status;e.serverCode=d;throw e}const data=validateNormalized(await r.json());localStorage.removeItem(REAUTH_GUARD);sessionStorage.removeItem(REAUTH_GUARD);return data}
function appHolding(h){const avg=Number(h?.averagePrice??h?.avgPrice??h?.avg??0);return{name:String(h?.name||h?.isin||'Unbekannt'),isin:String(h?.isin||'').toUpperCase(),ticker:String(h?.ticker||'').toUpperCase(),broker:String(h?.broker||''),shares:Number(h?.shares||0),price:Number(h?.currentPrice||h?.price||0),value:Number(h?.currentValue||h?.value||0),avg,avgPrice:avg,averagePrice:avg,halal:String(h?.halalStatus||'UNKNOWN').toUpperCase()}}
function applyNormalized(data){const now=new Date().toISOString(),old=localStorage.getItem(VALID_KEY);if(old)localStorage.setItem(PREV_KEY,old);const payload={version:3,savedAt:now,source:'PARQET_LIVE_SYNC',cash:Number(data?.cash||0),holdings:data.holdings.map(appHolding),dividends:[]};localStorage.setItem(VALID_KEY,JSON.stringify(payload));localStorage.setItem(SYNC_KEY,now);localStorage.setItem('hpos_parqet_reconciliation',JSON.stringify({savedAt:now,...(data.reconciliation||{}),watchCandidates:Array.isArray(data?.watchCandidates)?data.watchCandidates.length:Number(data?.reconciliation?.watchCandidates||0)}));return payload}
function installRefreshHook(){/* canonical3+: app.js owns refresh timing/UI; this adapter owns Parqet transport */}
async function refreshAfterOAuth(){try{applyNormalized(await normalizedPortfolio());location.reload()}catch(e){if(e?.code==='REAUTH')return;console.warn('HPOS OAuth refresh',String(e?.message||e))}}

const JUST_CONNECTED=captureOAuthSession();
if(!localStorage.getItem(COMPAT_KEY))localStorage.setItem(COMPAT_KEY,'SUPABASE_ADAPTER');
window.fetch=async function(input,init){const u=parsed(input);if(u&&u.hostname===LEGACY_HOST&&u.searchParams.get('s')==='parqet'){try{const data=await normalizedPortfolio();return new Response(JSON.stringify({holdings:data.holdings.map(appHolding),cash:Number(data?.cash||0),dividends:[],source:'PARQET_LIVE_SYNC'}),{status:200,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}catch(e){if(e?.code==='REAUTH'){setTimeout(()=>reconnect('refresh_401'),0);return new Response(JSON.stringify({error:'parqet_reauth_required',message:String(e?.message||e)}),{status:401,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}return new Response(JSON.stringify({error:'parqet_supabase_unavailable',message:String(e?.message||e)}),{status:502,headers:{'Content-Type':'application/json','Cache-Control':'no-store'}})}}return originalFetch(input,init)};
function ready(){installRefreshHook();if(JUST_CONNECTED)refreshAfterOAuth()}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',ready,{once:true});else ready();
})();
