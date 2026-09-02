(()=>{'use strict';
const $=s=>document.querySelector(s);
let projection=null,catalog=null,registry=null,loadPromise=null,token=0;
function esc(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
async function load(){if(loadPromise)return loadPromise;loadPromise=Promise.all([
  fetch('../data/verification_projection.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
  fetch('../data/asset_catalog.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null),
  fetch('../data/thesis_registry.json',{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null)
]).then(([p,c,r])=>{projection=p;catalog=c;registry=r;return true});return loadPromise}
function activeIdentity(){const name=$('#assetName')?.textContent?.trim()||'';const rows=[...document.querySelectorAll('#assetDetails .drow')];const isin=rows.find(r=>r.firstElementChild?.textContent?.trim()==='ISIN')?.lastElementChild?.textContent?.trim().toUpperCase()||'';return{name,isin}}
function canonicalKey(identity){const assets=catalog?.assets||{};for(const [key,a] of Object.entries(assets)){if(identity.isin&&a?.isin&&String(a.isin).toUpperCase()===identity.isin)return key;const names=[a?.name,...(a?.aliases||[])].filter(Boolean).map(x=>String(x).toLowerCase());if(identity.name&&names.includes(identity.name.toLowerCase()))return key}return null}
function label(status){return({VERIFIED:'Aussage belegt',PARTIALLY_VERIFIED:'Teilweise belegt',REJECTED:'Nicht bestätigt'})[status]||'Noch ungeprüft'}
function cls(status){return status==='VERIFIED'?'pos':status==='REJECTED'?'neg':'warn'}
function mount(){let s=$('#verificationExplainSection');if(s)return s;const decision=$('#assetDecision')?.closest('.section');if(!decision)return null;s=document.createElement('div');s.className='section';s.id='verificationExplainSection';s.innerHTML='<h2>Warum sagt HPOS das?</h2><div id="verificationExplain" class="detail"><div class="empty">Evidenzstatus wird geprüft …</div></div>';decision.insertAdjacentElement('afterend',s);return s}
function row(k,v,c=''){return `<div class="drow"><span>${esc(k)}</span><strong${c?` class="${c}"`:''}>${esc(v)}</strong></div>`}
async function render(){if(!$('#asset')?.classList.contains('on'))return;const my=++token,section=mount();if(!section)return;await load();if(my!==token)return;const box=$('#verificationExplain');if(!box)return;const id=activeIdentity(),key=canonicalKey(id),state=key?projection?.assets?.[key]:null,thesis=key?registry?.assets?.[key]:null;
let html='';if(state){html+=row('Evidenzstatus',label(state.verificationStatus),cls(state.verificationStatus));html+=row('Geprüfte Belege',String((state.evidenceIds||[]).length));if(state.sourceAsOf)html+=row('Wissensstand',new Date(state.sourceAsOf).toLocaleString('de-DE',{day:'2-digit',month:'2-digit',year:'numeric',hour:'2-digit',minute:'2-digit'}));html+='<div class="notice">Dieser Status bestätigt nur die geprüfte Aussage. Er ist keine Kauf-, Verkaufs- oder Aufstockungsempfehlung.</div>'}else{html+=row('Evidenzstatus','Noch keine explizite Freigabe','warn');html+='<div class="notice">HPOS hat für dieses Wertpapier noch keinen aktuellen Evidence-Claim explizit freigegeben. Daraus folgt weder positiv noch negativ eine Investmententscheidung.</div>'}
if(thesis?.thesis?.length){html+='<div class="drow"><span>These</span><strong>'+esc(thesis.thesis.slice(0,2).join(' · '))+'</strong></div>'}if(thesis?.risks?.length){html+='<div class="drow"><span>Offene Risiken</span><strong>'+esc(thesis.risks.slice(0,2).join(' · '))+'</strong></div>'}
box.innerHTML=html||'<div class="empty">Für dieses Instrument liegt noch keine HPOS-Evidenzprojektion vor.</div>'}
const observer=new MutationObserver(()=>{if($('#asset')?.classList.contains('on'))setTimeout(render,0)});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});document.addEventListener('click',()=>setTimeout(render,100),true);setTimeout(render,800);
})();
