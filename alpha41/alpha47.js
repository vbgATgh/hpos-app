/* HPOS Alpha 4.7 – Capital Allocation Engine */
(()=>{'use strict';
const VERSION='1.3.0-alpha.4.7',BASE='../';let cache=null;
const norm=v=>String(v??'').toUpperCase().replace(/[^A-Z0-9]/g,'');
const esc=v=>typeof window.esc==='function'?window.esc(v):String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function j(p){let r=await fetch(BASE+p+'?v=47',{cache:'no-store'});if(!r.ok)throw new Error(p+': HTTP '+r.status);return r.json()}
async function load(){if(cache)return cache;const [policy,catalog,signals,constitution]=await Promise.all([j('config/capital_competition_policy.json'),j('data/asset_catalog.json'),j('data/fundamental/thesis_signals.json').catch(()=>({signals:[]})),j('config/hpos_constitution.json')]);cache={policy,catalog,signals,constitution};return cache}
function localState(){try{return window.state||{}}catch{return {}}}
function current(){try{return window.HPOSStateLedger45?.buildCurrentState?.()||null}catch{return null}}
function resolveAsset(asset,catalog){if(window.HPOSInterchangeability464?.resolve)return window.HPOSInterchangeability464.resolve(asset,catalog);const isin=norm(asset?.isin);if(isin)for(const[k,v]of Object.entries(catalog?.assets||{}))if(norm(v.isin)===isin)return k;return null}
function signal(key,d){return(d.signals?.signals||[]).find(x=>x.assetKey===key)||null}
function localAsset(key,d){const s=localState();return(s.assets||[]).find(a=>resolveAsset(a,d.catalog)===key)||null}
function holdingByKey(key,d){const c=current();if(!c)return null;return(c.positions||[]).find(p=>resolveAsset(p,d.catalog)===key)||null}
function totalHealthcarePct(d){const c=current(),total=Number(c?.portfolio?.portfolioValueEur||0);if(!total)return null;let v=0;for(const p of c.positions||[]){const k=resolveAsset(p,d.catalog),a=d.catalog.assets?.[k];if(a?.family==='HEALTHCARE')v+=Number(p.currentValue||0)}return v/total*100}
function dataTradeable(a){const x=String(a?.tradeability||a?.brokerAvailability||a?.tradable||'').toUpperCase();if(['YES','TRUE','TRADEABLE','AVAILABLE','CONFIRMED'].includes(x))return true;if(['NO','FALSE','UNAVAILABLE','BLOCKED'].includes(x))return false;return null}
async function halalOf(a){if(!a)return'UNKNOWN';try{const b=await window.HPOSDecision44?.bundle?.(a);return b?.decision?.halal?.status||'UNKNOWN'}catch{return'UNKNOWN'}}
function evidenceState(key,d){return signal(key,d)?.state||'INSUFFICIENT'}
function evidenceRank(s){return({BROKEN:0,WEAKENING:1,INSUFFICIENT:2,NEUTRAL:3,STRENGTHENING:4}[s]??2)}
async function evaluate(key,d){const cat=d.catalog.assets[key],a=localAsset(key,d),h=holdingByKey(key,d),halal=await halalOf(a),ev=evidenceState(key,d),blocks=[],notes=[];const hc=totalHealthcarePct(d),hcCap=Number(d.constitution.portfolioRules?.healthcare?.hardCapPct||30),singleCap=Number(d.constitution.portfolioRules?.singleStock?.hardCapPct||25),cs=current(),total=Number(cs?.portfolio?.portfolioValueEur||0),weight=h&&total?Number(h.currentValue||0)/total*100:0,trade=dataTradeable(a);
if(halal!=='H1')blocks.push(`HALAL_${halal}`);
if(ev==='BROKEN')blocks.push('THESIS_BROKEN');else if(ev==='WEAKENING')blocks.push('THESIS_WEAKENING_REVIEW');else if(ev==='INSUFFICIENT')blocks.push('EVIDENCE_INSUFFICIENT');
if(cat?.family==='HEALTHCARE'&&hc!=null&&hc>hcCap)blocks.push('HEALTHCARE_CAP');
if(weight>=singleCap)blocks.push('SINGLE_STOCK_CAP');
if(trade===false)blocks.push('NOT_TRADEABLE');else if(trade===null)notes.push('Tradeability nicht bestätigt');
if(!a)notes.push('Kein lokales Asset/Watchlist-Objekt');
const eligible=blocks.length===0&&trade===true;
return{assetKey:key,name:cat?.name||key,role:cat?.role||null,family:cat?.family||null,owned:!!h,positionWeightPct:weight,halal,evidenceState:ev,evidenceRank:evidenceRank(ev),tradeability:trade===true?'CONFIRMED':trade===false?'NO':'UNKNOWN',eligible,blocks,notes};}
function dominates(a,b){if(!a.eligible||!b.eligible)return false;if(a.evidenceRank<b.evidenceRank)return false;let advantage=0,disadvantage=0;if(a.evidenceRank>b.evidenceRank)advantage++;if(a.family!==b.family){}if(a.positionWeightPct<b.positionWeightPct)advantage++;else if(a.positionWeightPct>b.positionWeightPct+5)disadvantage++;return disadvantage===0&&advantage>0}
function choose(rows){const eligible=rows.filter(x=>x.eligible);if(!eligible.length)return{outcome:'WAIT',best:null,reason:'Kein Titel passiert aktuell alle bekannten Gates.'};const undominated=eligible.filter(a=>!eligible.some(b=>b.assetKey!==a.assetKey&&dominates(b,a)));if(undominated.length===1)return{outcome:'BEST_NEW_MONEY_DESTINATION',best:undominated[0],reason:'Ein Kandidat ist auf den bekannten, belastbaren Dimensionen klar nicht unterlegen und besitzt mindestens einen materiellen Vorteil.'};return{outcome:'NO_CLEAR_ADVANTAGE',best:null,candidates:undominated.map(x=>x.assetKey),reason:'Mehrere Kandidaten bleiben ohne belastbaren dominanten Vorteil. Warten statt Scheingenauigkeit.'}}
async function run(){const d=await load(),keys=Object.keys(d.catalog.assets||{}),rows=[];for(const k of keys)rows.push(await evaluate(k,d));const cash=window.HPOSStateLedger45?.snapshot?await window.HPOSStateLedger45.snapshot():null,choice=choose(rows);if(cash?.cash?.status==='RED'){choice.outcome='BLOCKED';choice.best=null;choice.reason='Cash-Hard-Limit blockiert reguläre Neuallokation.'}return{version:VERSION,asOf:new Date().toISOString(),rows,choice,cash:cash?.cash||null,policy:d.policy}}
function compact(r){const b=r.choice.best;return`<div class="card" id="alpha47Allocation"><div class="row441"><div><h3>Nächster Euro</h3><p>Alle zulässigen Aktien konkurrieren</p></div><span class="badge ${b?'good':'warn'}">${esc(r.choice.outcome)}</span></div>${b?`<div style="margin-top:10px"><strong style="font-size:18px">${esc(b.name)}</strong><p>${esc(r.choice.reason)}</p><div class="chips441"><span class="chip441 good">☪ H1</span><span class="chip441 info">These ${esc(b.evidenceState)}</span><span class="chip441">${b.owned?'Bestand':'Kandidat'}</span><span class="chip441">Gewicht ${b.positionWeightPct.toFixed(1)} %</span></div></div>`:`<div class="notice warn" style="margin-top:10px">${esc(r.choice.reason)}</div>`}<details class="detail441" style="margin-top:10px"><summary>Warum kein klassischer Score?</summary><p>HPOS nutzt Gates und Dominanz statt künstlicher Punktgenauigkeit. Unbekannte Bewertung, Handelbarkeit oder Evidenz zählt nie als Vorteil. Besitz und Kursmomentum erzeugen keinen Bonus.</p></details></div>`}
async function inject(){const h=document.getElementById('a441host');if(!h||h.querySelector('#alpha47Allocation'))return;const r=await run();h.insertAdjacentHTML('afterbegin',compact(r))}
new MutationObserver(()=>inject().catch(()=>{})).observe(document.body,{childList:true,subtree:true});setTimeout(()=>inject().catch(()=>{}),1000);
function badge(){document.querySelectorAll('.version-badge,.badge').forEach(x=>{if(/ALPHA 4\.6\.4\b/.test(x.textContent||''))x.textContent='ALPHA 4.7 · Capital Allocation'})}new MutationObserver(badge).observe(document.body,{childList:true,subtree:true});badge();
window.HPOSCapital47={version:VERSION,load,evaluate,run,dominates,choose};
})();
