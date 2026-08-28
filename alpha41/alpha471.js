/* HPOS Alpha 4.7.1 – Data Integrity + Asset UX Cleanup */
(()=>{'use strict';
const VERSION='1.3.0-alpha.4.7.1';
function css(){if(document.getElementById('alpha471css'))return;const s=document.createElement('style');s.id='alpha471css';s.textContent=`
:root{--hpos-space:14px}
#asset441.a441{gap:10px}
#asset441 .card{box-shadow:none}
#asset441 .a441-hero{border-color:transparent;background:transparent;padding:6px 2px 2px}
#asset441 .a441-value{font-size:28px}
#asset441 .a441-decision{padding:13px 14px}
#asset441 .a441-chart{padding:12px 14px}
#asset441 .a441-chart svg{height:150px}
#asset441 .a441-thesisrow{background:transparent;border-color:rgba(145,164,186,.18)}
#asset441 .rule-source{display:none}
#asset441 .a441-method{margin-top:0}
#asset441 .a441-actions{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px}
#asset441 .a441-actions .btn{padding:9px 6px;font-size:12px}
[data-asset-tab].a471-hidden,.a471-hidden{display:none!important}
#asset441[data-a471-mode="overview"] #alpha47Allocation,
#asset441[data-a471-mode="overview"] .a471-analysis-only{display:none!important}
#asset441[data-a471-mode="analysis"] .a471-overview-only{display:none!important}
.a471-kicker{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.a471-mini{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.a471-mini span{font-size:11px;color:var(--muted)}
.a471-home-check{width:auto!important;min-width:0!important;padding:9px 12px!important;border-radius:12px!important;font-size:13px!important}
.a471-home-strip{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:10px 0 4px}
.a471-home-kpi{padding:10px 11px;border:1px solid var(--line);border-radius:12px;background:rgba(255,255,255,.018)}
.a471-home-kpi small{display:block;color:var(--muted);font-size:10px;line-height:1.2}.a471-home-kpi strong{display:block;margin-top:4px;font-size:14px}
.a471-home-clean .card{box-shadow:none}
.a471-home-clean h1{letter-spacing:-.02em}
@media(max-width:420px){#asset441 .a441-actions{grid-template-columns:repeat(2,minmax(0,1fr))}.a471-home-strip{grid-template-columns:repeat(3,minmax(0,1fr))}.a471-home-kpi{padding:9px 8px}.a471-home-kpi strong{font-size:13px}}
`;document.head.appendChild(s)}
function canonicalHolding(h){if(!h)return h;const entry=Number(h.avgEntryPrice??h.avgCost??h.purchasePrice??(Number(h.purchaseValue)>0&&Number(h.shares)>0?Number(h.purchaseValue)/Number(h.shares):0));if(Number.isFinite(entry)&&entry>0){h.avgEntryPrice=entry;h.avgCost=entry;h.purchasePrice=entry;}return h}
function patchProjection(){const base=window.HPOSLocalProjection433;if(typeof base!=='function'||base.__a471)return;const wrapped=function(){const p=base();(p?.holdings||[]).forEach(canonicalHolding);return p};wrapped.__a471=true;window.HPOSLocalProjection433=wrapped}
function mode(){try{return String(window.currentAssetTab||'overview')}catch{return'overview'}}
function hideTabs(){document.querySelectorAll('[data-asset-tab]').forEach(b=>{const t=b.dataset.assetTab;if(['halal','news'].includes(t))b.classList.add('a471-hidden');if(t==='activities')b.textContent='Historie';if(t==='hpos')b.textContent='Analyse';if(t==='overview')b.textContent='Übersicht';})}
function simplifyAsset(){const host=document.getElementById('asset441');if(!host)return;const m=mode()==='hpos'?'analysis':mode()==='activities'?'history':'overview';host.dataset.a471Mode=m;
const cards=[...host.children];for(const c of cards){const title=(c.querySelector('h3')?.textContent||'').trim();if(title==='Investmentthese'||title==='Analyse')c.classList.add('a471-analysis-only');if(title==='Was hat sich verändert?'||c.classList.contains('a441-chart')||c.classList.contains('a441-decision')||c.classList.contains('a441-hero'))c.classList.add('a471-overview-only');}
const alloc=host.querySelector('#alpha47Allocation');if(alloc)alloc.classList.add('a471-analysis-only');
const method=host.querySelector('.a441-method');if(method)method.classList.add('a471-analysis-only');
}
function eur(v){try{return new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(Number(v||0))}catch{return `${Number(v||0).toFixed(2)} €`}}
function isHome(){return [...document.querySelectorAll('h1,h2')].some(x=>(x.textContent||'').trim()==='Gesamtdepot')&&!document.getElementById('asset441')}
function closestCardByText(label){const el=[...document.querySelectorAll('div,span,p,strong,small')].find(x=>(x.textContent||'').trim()===label);return el?.closest?.('.card')||null}
function simplifyHome(){if(!isHome())return;document.body.classList.add('a471-home-clean');
  const navLabels=['Übersicht','Depots','Mover','Daten'];
  const buttons=[...document.querySelectorAll('button')].filter(b=>navLabels.includes((b.textContent||'').trim()));
  if(buttons.length>=3){const p=buttons[0].parentElement;if(p&&buttons.every(b=>b.parentElement===p))p.classList.add('a471-hidden');else buttons.forEach(b=>b.classList.add('a471-hidden'));}
  ['IZF / XIRR','Realisierte Gewinne netto','Dividenden netto gesamt','Watchlist-Marker'].forEach(t=>closestCardByText(t)?.classList.add('a471-hidden'));
  const check=[...document.querySelectorAll('button')].find(b=>(b.textContent||'').replace(/\s+/g,' ').trim()==='HPOS prüfen');if(check)check.classList.add('a471-home-check');
  const sub=[...document.querySelectorAll('p,div')].find(x=>/^Reales Depot · Parqet Snapshot/.test((x.textContent||'').trim())&&x.children.length===0);if(sub)sub.textContent=(sub.textContent||'').replace('Reales Depot · Parqet Snapshot','Reales Depot · Stand');
  const hero=closestCardByText('Depotwert inkl. zugeordnetem Cash');if(hero&&!document.getElementById('a471HomeStrip')){try{const p=window.HPOSLocalProjection433?.(),holdings=p?.holdings||[],cash=(p?.cash||[]).reduce((s,x)=>s+Number(x.value||0),0),divs=(p?.dividends||[]),year=new Date().getFullYear(),divYtd=divs.filter(d=>String(d.date||'').startsWith(String(year))).reduce((s,d)=>s+Number(d.net||0),0);const strip=document.createElement('div');strip.id='a471HomeStrip';strip.className='a471-home-strip';strip.innerHTML=`<div class="a471-home-kpi"><small>Positionen</small><strong>${holdings.length}</strong></div><div class="a471-home-kpi"><small>Dividenden YTD</small><strong>${eur(divYtd)}</strong></div><div class="a471-home-kpi"><small>Cash</small><strong>${eur(cash)}</strong></div>`;hero.insertAdjacentElement('afterend',strip);}catch{}}
}
function badge(){document.querySelectorAll('.version-badge,.badge').forEach(x=>{if(/ALPHA 4\.7\b/.test(x.textContent||''))x.textContent='HPOS · Portfolio'});document.querySelectorAll('div,p,small,span').forEach(x=>{if(x.children.length===0&&(x.textContent||'').trim()==='ALPHA 4.7 · Capital Allocation')x.textContent='HPOS · Portfolio';})}
function run(){patchProjection();hideTabs();simplifyAsset();simplifyHome();badge()}
let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,25)}).observe(document.body,{childList:true,subtree:true});css();run();
window.HPOSUX471={version:VERSION,canonicalHolding,run,simplifyHome};})();
