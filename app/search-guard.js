(()=>{'use strict';
const API=(window.HPOS_RUNTIME?.integration?.baseUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api';
const OPENFIGI='https://api.openfigi.com/v3/mapping';
const WATCH_KEY='hpos_watchlist_v1';
const VALID_KEY='hpos_parqet_validated';
const RESTORE_KEY='hpos_search_restore_v1';
const $=s=>document.querySelector(s);
let catalog=[];
function norm(v){return String(v||'').trim()}
function up(v){return norm(v).toUpperCase()}
function validTicker(v){v=up(v);return /^[A-Z0-9.^=\-]{1,24}$/.test(v)&&!/^\d+$/.test(v)}
function validIsinSyntax(v){v=up(v);return /^[A-Z]{2}[A-Z0-9]{9}\d$/.test(v)}
function validIsin(v){v=up(v);if(!validIsinSyntax(v))return false;let s='';for(const c of v)s+=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;let sum=0,alt=false;for(let i=s.length-1;i>=0;i--){let n=Number(s[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return sum%10===0}
function readWatch(){try{const a=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function writeWatch(a){localStorage.setItem(WATCH_KEY,JSON.stringify(a))}
function identityKey(a){const isin=up(a?.isin);if(validIsin(isin))return `I:${isin}`;const ticker=up(a?.ticker||a?.symbol);return ticker?`T:${ticker}`:''}
function inWatch(a){const k=identityKey(a);return !!k&&readWatch().some(x=>identityKey(x)===k)}
function readDepotIsins(){try{const p=JSON.parse(localStorage.getItem(VALID_KEY)||'null'),a=Array.isArray(p?.holdings)?p.holdings:[];return new Set(a.map(x=>up(x?.isin)).filter(validIsin))}catch{return new Set()}}
function inDepot(a){const isin=up(a?.isin);return validIsin(isin)&&readDepotIsins().has(isin)}
function canonical(a,source='VERIFIED_SEARCH'){return{name:norm(a.name||a.shortname||a.longname||a.symbol||a.ticker||a.isin),isin:up(a.isin),ticker:up(a.ticker||a.symbol),source,verified:validIsin(a.isin),identityStatus:validIsin(a.isin)?'VERIFIED':'DISCOVERY',quoteType:up(a.quoteType),exchange:norm(a.exchange||a.exchDisp),sector:norm(a.sector||a.sectorDisp),industry:norm(a.industry||a.industryDisp),addedAt:new Date().toISOString()}}
function migrateWatch(){const before=readWatch(),seen=new Set(),after=[];for(const x of before){const isin=up(x.isin),ticker=up(x.ticker);if(validIsin(isin)&&inDepot({isin}))continue;if(!validIsin(isin)&&!validTicker(ticker))continue;const k=validIsin(isin)?`I:${isin}`:`T:${ticker}`;if(seen.has(k))continue;seen.add(k);after.push({...x,isin:validIsin(isin)?isin:'',ticker,verified:x.verified===true&&validIsin(isin),identityStatus:validIsin(isin)?'VERIFIED':'DISCOVERY'})}if(JSON.stringify(before)!==JSON.stringify(after))writeWatch(after)}
async function loadCatalog(){try{const r=await fetch('../config/market_sources.json',{cache:'no-store'});if(r.ok){const d=await r.json();catalog=(d.assets||[]).filter(x=>x.enabled!==false&&validIsin(x.isin)).map(x=>canonical({name:x.name,isin:x.isin,ticker:x.symbol},'MARKET_CONFIG'))}}catch{catalog=[]}}
function localSearch(q){q=up(q);if(!q)return[];return catalog.filter(x=>[x.name,x.isin,x.ticker].some(v=>up(v).includes(q))).slice(0,12)}
function allowedType(v){v=up(v);return !v||['EQUITY','ETF','MUTUALFUND'].includes(v)}
function parseYahoo(d){const q=Array.isArray(d?.quotes)?d.quotes:Array.isArray(d?.results)?d.results:Array.isArray(d)?d:[],out=[];for(const x of q){const ticker=up(x.symbol||x.ticker),isin=up(x.isin),name=norm(x.longname||x.shortname||x.name||ticker),quoteType=up(x.quoteType);if(!name||!validTicker(ticker)||!allowedType(quoteType))continue;if(validIsin(isin)){out.push(canonical({...x,name,isin,ticker,quoteType},'YAHOO_ISIN'));continue}const local=catalog.find(c=>up(c.ticker)===ticker);if(local){out.push({...local,source:'MARKET_CONFIG_MATCH'});continue}out.push(canonical({...x,name,ticker,quoteType,isin:''},'YAHOO_DISCOVERY'))}return out}
async function externalSearch(q){if(norm(q).length<2)return[];for(const mode of ['search','yahoo-search']){try{const r=await fetch(`${API}?s=${mode}&q=${encodeURIComponent(q)}`,{cache:'no-store'});if(!r.ok)continue;const a=parseYahoo(await r.json());if(a.length)return a.slice(0,15)}catch{}}return[]}
async function verifyOpenFigiIsin(isin){try{const r=await fetch(OPENFIGI,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify([{idType:'ID_ISIN',idValue:isin}]),cache:'no-store'});if(!r.ok)return[];const d=await r.json();const rows=Array.isArray(d?.[0]?.data)?d[0].data:[];const seen=new Set(),out=[];for(const x of rows){const ticker=up(x.ticker),name=norm(x.name||x.securityDescription||ticker);if(!name||!validTicker(ticker))continue;const k=`${isin}|${ticker}`;if(seen.has(k))continue;seen.add(k);out.push(canonical({name,isin,ticker},'OPENFIGI_ISIN'))}return out.slice(0,8)}catch{return[]}}
function merge(...lists){const out=[],seen=new Set();for(const a of lists.flat()){const k=identityKey(a);if(!k||seen.has(k))continue;seen.add(k);out.push(a)}return out}
function addWatch(a){if(inDepot(a)||inWatch(a))return false;const c=canonical(a,a.source||'GLOBAL_DISCOVERY');if(!c.verified&&!validTicker(c.ticker))return false;const w=readWatch();w.push(c);writeWatch(w);return true}
function esc(v){return String(v||'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function resultRow(a){const verified=validIsin(a?.isin);const meta=verified?[a.isin,a.ticker].filter(Boolean).join(' · '):[a.ticker,a.exchange].filter(Boolean).join(' · ');const state=verified?'ISIN verifiziert':'Beobachtung · Identität noch offen';if(inDepot(a))return `<div class="guardResult"><div><strong>${esc(a.name)}</strong><small>${esc(meta)} · ${state}</small></div><span class="guardDepot">Im Depot</span></div>`;if(inWatch(a))return `<div class="guardResult"><div><strong>${esc(a.name)}</strong><small>${esc(meta)} · ${state}</small></div><span class="guardDepot">✓ Watchlist</span></div>`;const id=encodeURIComponent(JSON.stringify(a));return `<div class="guardResult"><div><strong>${esc(a.name)}</strong><small>${esc(meta)} · ${state}</small></div><button class="guardAdd" data-security="${id}">+ Watchlist</button></div>`}
function statusBox(text,kind='info'){let box=$('#verifiedResults');if(!box){box=document.createElement('div');box.id='verifiedResults';box.className='verifiedResults';$('#searchResults')?.insertAdjacentElement('afterend',box)}box.innerHTML=`<div class="manualVerifyStatus ${kind==='ok'?'ok':''}">${esc(text)}</div>`;return box}
function renderExternal(list,label='Globale Treffer'){let box=$('#verifiedResults');if(!box){box=document.createElement('div');box.id='verifiedResults';box.className='verifiedResults';$('#searchResults')?.insertAdjacentElement('afterend',box)}box.innerHTML=list.length?`<div class="guardHeader"><div class="eye guardEye">${esc(label)}</div><strong class="guardCount">${list.length}</strong></div>${list.map(resultRow).join('')}`:'';box.querySelectorAll('.guardAdd').forEach(b=>b.onclick=()=>{const a=JSON.parse(decodeURIComponent(b.dataset.security));if(addWatch(a)){b.textContent='✓ Watchlist';try{sessionStorage.setItem(RESTORE_KEY,JSON.stringify({q:$('#securityQuery')?.value||a.isin||a.ticker,at:Date.now()}))}catch{}setTimeout(()=>location.reload(),250)}else if(inDepot(a)){b.textContent='Im Depot'}else if(inWatch(a)){b.textContent='✓ Watchlist'}})}
async function verifyExactIsin(isin){isin=up(isin);if(!validIsin(isin)){statusBox('ISIN ungültig. Format oder Prüfziffer stimmt nicht.');return[]}
const local=catalog.find(x=>up(x.isin)===isin);if(local)return[local];
statusBox('ISIN wird exakt verifiziert …');
const figi=await verifyOpenFigiIsin(isin);if(figi.length)return figi;
const ext=await externalSearch(isin);const exact=ext.filter(x=>up(x.isin)===isin);if(exact.length)return exact;
statusBox('ISIN formal gültig, aber aktuell nicht eindeutig durch eine externe Quelle bestätigt. Es wurde nichts übernommen.');return[]}
async function search(q){q=norm(q);if(!q){renderExternal([]);return[]}
if(q.length===12&&/^[A-Za-z]{2}/.test(q)){const hits=await verifyExactIsin(q);if(hits.length)renderExternal(hits,'Exakt verifizierte ISIN');return hits}
const local=localSearch(q),external=await externalSearch(q),all=merge(external,local);renderExternal(all,all.length?'Globale Treffer':'');if(!all.length)statusBox('Kein passender börsennotierter Treffer gefunden. Name, Ticker oder ISIN prüfen.');return all}
function restoreSearch(){let saved=null;try{saved=JSON.parse(sessionStorage.getItem(RESTORE_KEY)||'null');sessionStorage.removeItem(RESTORE_KEY)}catch{}if(!saved||Date.now()-Number(saved.at||0)>10000)return;setTimeout(()=>{const d=$('#searchDialog'),q=$('#securityQuery');if(!d||!q)return;if(!d.open)d.showModal();q.value=String(saved.q||'');if(q.value)search(q.value)},40)}
function wire(){migrateWatch();const q=$('#securityQuery');if(q){let t;q.addEventListener('input',()=>{clearTimeout(t);t=setTimeout(()=>search(q.value),320)});q.addEventListener('keydown',e=>{if(e.key==='Enter'){e.preventDefault();clearTimeout(t);search(q.value)}})}restoreSearch()}
loadCatalog().finally(()=>{if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',wire,{once:true});else wire()});
})();
