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
[data-asset-tab].a471-hidden{display:none!important}
#asset441[data-a471-mode="overview"] #alpha47Allocation,
#asset441[data-a471-mode="overview"] .a471-analysis-only{display:none!important}
#asset441[data-a471-mode="analysis"] .a471-overview-only{display:none!important}
.a471-kicker{color:var(--muted);font-size:11px;text-transform:uppercase;letter-spacing:.05em;margin-bottom:3px}
.a471-mini{display:flex;gap:7px;flex-wrap:wrap;margin-top:8px}
.a471-mini span{font-size:11px;color:var(--muted)}
@media(max-width:420px){#asset441 .a441-actions{grid-template-columns:repeat(2,minmax(0,1fr))}}
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
function badge(){document.querySelectorAll('.version-badge,.badge').forEach(x=>{if(/ALPHA 4\.7\b/.test(x.textContent||''))x.textContent='ALPHA 4.7.1 · Clean UX'})}
function run(){patchProjection();hideTabs();simplifyAsset();badge()}
let timer=null;new MutationObserver(()=>{clearTimeout(timer);timer=setTimeout(run,25)}).observe(document.body,{childList:true,subtree:true});css();run();
window.HPOSUX471={version:VERSION,canonicalHolding,run};})();
