(()=>{'use strict';
const $=s=>document.querySelector(s);
let projection=null,catalog=null,registry=null,loadPromise=null,lastSig='';
function esc(v){return String(v??'').replace(/[&<>\"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;'}[c]))}
async function load(){if(loadPromise)return loadPromise;loadPromise=Promise.all([
 fetch('../data/verification_projection.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
 fetch('../data/asset_catalog.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
 fetch('../data/thesis_registry.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
]).then(([p,c,r])=>{projection=p;catalog=c;registry=r});return loadPromise}
function identity(){const name=$('#assetName')?.textContent?.trim()||'';const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()==='ISIN');return{name,isin:row?.lastElementChild?.textContent?.trim().toUpperCase()||''}}
function keyOf(i){for(const [k,a] of Object.entries(catalog?.assets||{})){if(i.isin&&a?.isin&&String(a.isin).toUpperCase()===i.isin)return k;const names=[a?.name,...(a?.aliases||[])].filter(Boolean).map(x=>String(x).toLowerCase());if(i.name&&names.includes(i.name.toLowerCase()))return k}return null}
const label=s=>({VERIFIED:'Aussage belegt',PARTIALLY_VERIFIED:'Teilweise belegt',REJECTED:'Nicht bestätigt'})[s]||'Noch ungeprüft';
const cls=s=>s==='VERIFIED'?'pos':s==='REJECTED'?'neg':'warn';
const row=(k,v,c='')=>`<div class="drow"><span>${esc(k)}</span><strong${c?` class="${c}"`:''}>${esc(v)}</strong></div>`;
function mount(){let s=$('#verificationExplainSection');if(s)return s;const d=$('#assetDecision')?.closest('.section');if(!d)return null;s=document.createElement('div');s.className='section';s.id='verificationExplainSection';s.innerHTML='<h2>Warum sagt HPOS das?</h2><div id="verificationExplain" class="detail"><div class="empty">Evidenzstatus wird geprüft …</div></div>';d.insertAdjacentElement('afterend',s);return s}
async function render(){if(!$('#asset')?.classList.contains('on'))return;const s=mount();if(!s)return;await load();const i=identity(),sig=i.name+'|'+i.isin;if(sig===lastSig)return;lastSig=sig;const k=keyOf(i),state=k?projection?.assets?.[k]:null,thesis=k?registry?.assets?.[k]:null,box=$('#verificationExplain');if(!box)return;let h='';if(state){h+=row('Evidenzstatus',label(state.verificationStatus),cls(state.verificationStatus));h+=row('Geprüfte Belege',String((state.evidenceIds||[]).length));if(state.sourceAsOf)h+=row('Wissensstand',new Date(state.sourceAsOf).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}));h+='<div class="notice">Bestätigt nur die geprüfte Aussage, nicht Kauf, Verkauf oder Aufstockung.</div>'}else{h+=row('Evidenzstatus','Noch keine explizite Freigabe','warn');h+='<div class="notice">Noch kein freigegebener Evidence-Claim. Daraus folgt keine Investmententscheidung.</div>'}if(thesis?.thesis?.length)h+=row('These',thesis.thesis.slice(0,2).join(' · '));if(thesis?.risks?.length)h+=row('Offene Risiken',thesis.risks.slice(0,2).join(' · '));box.innerHTML=h}
function maybeRender(){if($('#asset')?.classList.contains('on')){lastSig='';requestAnimationFrame(render)}}
// Lightweight: no body-wide MutationObserver. Load data only when an asset view is actually used.
document.addEventListener('click',e=>{if(e.target.closest('[data-view],#portfolioList,#searchResults,#assetBack,#homeBtn'))setTimeout(maybeRender,0)},true);
window.addEventListener('popstate',maybeRender);
setTimeout(maybeRender,0);
})();
