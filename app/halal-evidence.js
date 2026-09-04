(()=>{'use strict';
const $=s=>document.querySelector(s);
const REGISTRY_URL='../data/halal_evidence_registry.json';
let registry=null,loadPromise=null,lastSig='';
const VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(){if(loadPromise)return loadPromise;loadPromise=fetch(REGISTRY_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(x=>registry=x);return loadPromise}
function detail(label){const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()===label);return row?.lastElementChild?.textContent?.trim()||''}
function identity(){const raw=detail('ISIN').toUpperCase();return{isin:VALID_ISIN.test(raw)?raw:'',rawIsin:raw,name:$('#assetName')?.textContent?.trim()||''}}
function evaluate(id){
 if(!id.isin)return{state:'OPEN_REVIEW',reason:'Identität noch nicht über eine verifizierte ISIN kanonisiert.',source:null};
 const e=registry?.assets?.[id.isin];
 if(!e)return{state:'OPEN_REVIEW',reason:'Für diese ISIN liegt noch keine freigegebene Halal-Evidenz vor.',source:null};
 const state=['PASS','FAIL','OPEN_REVIEW'].includes(String(e.state||'').toUpperCase())?String(e.state).toUpperCase():'OPEN_REVIEW';
 return{state,reason:e.reason||'',source:e.source||null,reviewedAt:e.reviewedAt||null};
}
function label(s){return s==='PASS'?'PASS · Halal belegt':s==='FAIL'?'FAIL · Nicht halal':'OPEN REVIEW · Prüfung offen'}
function cls(s){return s==='PASS'?'pos':s==='FAIL'?'neg':'warn'}
function mount(){
 let sec=$('#halalEvidenceSection');if(sec)return sec;
 const decision=$('#assetDecision')?.closest('.section');if(!decision)return null;
 sec=document.createElement('div');sec.id='halalEvidenceSection';sec.className='section';
 sec.innerHTML='<h2>Halal-Evidenz</h2><div id="halalEvidenceBox" class="detail"></div>';
 decision.insertAdjacentElement('afterend',sec);return sec;
}
function gateLock(state){
 const rows=[...document.querySelectorAll('#assetGateRows .drow')];
 rows.forEach((r,i)=>{const v=r.lastElementChild;if(!v)return;
   if(i===0){v.textContent=state==='PASS'?'Halal belegt':state==='FAIL'?'Nicht halal':'Prüfung offen';v.className=cls(state);return}
   if(state==='PASS')return;
   v.textContent=state==='FAIL'?'Gesperrt · Halal FAIL':'Wartet auf Halal-Prüfung';v.className=state==='FAIL'?'neg':'warn';
 });
}
async function render(){
 if(!$('#asset')?.classList.contains('on'))return;await load();const id=identity(),sig=id.name+'|'+id.rawIsin;if(sig===lastSig&&$('#halalEvidenceBox'))return;lastSig=sig;
 const sec=mount();if(!sec)return;const e=evaluate(id),box=$('#halalEvidenceBox');if(!box)return;
 let html='<div class="drow"><span>Gate 1</span><strong class="'+cls(e.state)+'">'+esc(label(e.state))+'</strong></div>';
 html+='<div class="drow"><span>Kanonische Identität</span><strong>'+esc(id.isin||'nicht verifiziert')+'</strong></div>';
 html+='<div class="profileText"><span>Begründung</span><p>'+esc(e.reason)+'</p></div>';
 if(e.source)html+='<div class="drow"><span>Quelle</span><strong>'+esc(e.source)+'</strong></div>';
 if(e.reviewedAt)html+='<div class="drow"><span>Geprüft am</span><strong>'+esc(new Date(e.reviewedAt).toLocaleString('de-DE'))+'</strong></div>';
 html+='<div class="notice">Nur PASS öffnet Gate 2. OPEN REVIEW bleibt neutral und gesperrt; FAIL beendet die Investment-Pipeline für dieses Instrument.</div>';
 box.innerHTML=html;gateLock(e.state);
}
function schedule(){lastSig='';setTimeout(render,60)}
document.addEventListener('click',schedule,true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()});
setTimeout(schedule,500);
window.HPOS_HALAL_EVIDENCE=Object.freeze({evaluateIsin:async isin=>{await load();return evaluate({isin:VALID_ISIN.test(String(isin||'').toUpperCase())?String(isin).toUpperCase():'',rawIsin:String(isin||'').toUpperCase()})}});
})();
