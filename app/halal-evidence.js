(()=>{'use strict';
const $=s=>document.querySelector(s);
const REGISTRY_URL='../data/halal_evidence_registry.json';
let registry=null,loadPromise=null,lastSig='';
const VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(){if(loadPromise)return loadPromise;loadPromise=fetch(REGISTRY_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(x=>registry=x);return loadPromise}
function detail(label){const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()===label);return row?.lastElementChild?.textContent?.trim()||''}
function identity(){const raw=detail('ISIN').toUpperCase(),ticker=detail('Ticker').toUpperCase();return{isin:VALID_ISIN.test(raw)?raw:'',rawIsin:raw,ticker:ticker&&ticker!=='—'?ticker:'',name:$('#assetName')?.textContent?.trim()||''}}
function evaluate(id){
 if(!id.isin)return{state:'OPEN_REVIEW',reason:'Identität noch nicht über eine verifizierte ISIN kanonisiert.',source:null};
 const e=registry?.assets?.[id.isin];
 if(!e)return{state:'OPEN_REVIEW',reason:'Für diese ISIN liegt noch keine freigegebene Halal-Evidenz vor.',source:null};
 const state=['PASS','FAIL','OPEN_REVIEW'].includes(String(e.state||'').toUpperCase())?String(e.state).toUpperCase():'OPEN_REVIEW';
 return{state,reason:e.reason||'',source:e.source||null,reviewedAt:e.reviewedAt||null,evidence:Array.isArray(e.evidence)?e.evidence:[]};
}
function label(s){return s==='PASS'?'HALALKONFORM':s==='FAIL'?'NICHT HALALKONFORM':'PRÜFUNG OFFEN'}
function cls(s){return s==='PASS'?'pos':s==='FAIL'?'neg':'warn'}
function mount(){
 let sec=$('#halalEvidenceSection');if(sec)return sec;
 const decision=$('#assetDecision')?.closest('.section');if(!decision)return null;
 sec=document.createElement('div');sec.id='halalEvidenceSection';sec.className='section';
 sec.innerHTML='<h2>Halal-Evidenz</h2><div id="halalEvidenceBox" class="detail"></div>';
 decision.insertAdjacentElement('afterend',sec);return sec;
}
function syncPositionHalal(state){const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()==='Halal');const v=row?.lastElementChild;if(!v)return;v.textContent=state==='PASS'?'HALALKONFORM':state==='FAIL'?'NICHT HALALKONFORM':'PRÜFUNG OFFEN';v.className=cls(state)}
function syncDecisionHalal(state){const p=$('#assetDecision p');if(!p)return;const who=p.textContent.includes('Depotposition')?'Depotposition':'Beobachtung';p.innerHTML=who+' · Halal: <b class="'+cls(state)+'">'+(state==='PASS'?'HALALKONFORM':state==='FAIL'?'NICHT HALALKONFORM':'PRÜFUNG OFFEN')+'</b>'}
function gateLock(state){
 const rows=[...document.querySelectorAll('#assetGateRows .drow')];
 rows.forEach((r,i)=>{const v=r.lastElementChild;if(!v)return;
   if(i===0){v.textContent=state==='PASS'?'Halalkonform':state==='FAIL'?'Nicht halalkonform':'Prüfung offen';v.className=cls(state);return}
   if(state==='PASS')return;
   v.textContent=state==='FAIL'?'Gesperrt · Halal FAIL':'Wartet auf Halal-Prüfung';v.className=state==='FAIL'?'neg':'warn';
 });
}
async function render(){
 if(!$('#asset')?.classList.contains('on'))return;await load();const id=identity(),sig=id.name+'|'+id.rawIsin;if(sig===lastSig&&$('#halalEvidenceBox'))return;lastSig=sig;
 const sec=mount();if(!sec)return;let e=evaluate(id),box=$('#halalEvidenceBox');if(!box)return;let pre=null,provider=null,manual=null;
 // Priority: curated exact-ISIN evidence > HPOS AAOIFI Rule Engine > free external provider > manual external evidence.
 if(e.state==='OPEN_REVIEW'&&!registry?.assets?.[id.isin]&&window.HPOS_HALAL_AUTOSCREEN){
   pre=await window.HPOS_HALAL_AUTOSCREEN.screen(id);
   if(pre?.state==='FAIL')e={state:'FAIL',reason:pre.reason,source:'HPOS AAOIFI Rule Engine v1',reviewedAt:pre.checkedAt,evidence:[{provider:'HPOS AAOIFI Rule Engine',status:'BUSINESS_SCREEN_FAIL',note:pre.reason}]};
 }
 const autoComplete=pre&&pre.state!=='OPEN_REVIEW';
 // External providers are fallback only. They are not called while the internal AAOIFI chain is merely waiting for required source data.
 if(e.state==='OPEN_REVIEW'&&!registry?.assets?.[id.isin]&&id.isin&&window.HPOS_HALAL_PROVIDER&&autoComplete){
   provider=await window.HPOS_HALAL_PROVIDER.screen(id);
   if(provider?.verdict==='COMPLIANT')e={state:'PASS',reason:'Kostenlose externe Gegenprüfung bestätigt das bereits automatisch entscheidbare Ergebnis für '+id.isin+'.',source:'Halal Terminal Free',reviewedAt:provider.checkedAt,evidence:[{provider:'Halal Terminal',status:'COMPLIANT',note:'Fallback-Gegenprüfung'}]};
   else if(provider?.verdict==='NON_COMPLIANT')e={state:'FAIL',reason:'Kostenlose externe Gegenprüfung widerspricht bzw. meldet nicht Shariah-compliant. Gate 1 bleibt fail-closed.',source:'Halal Terminal Free',reviewedAt:provider.checkedAt,evidence:[{provider:'Halal Terminal',status:'NON_COMPLIANT',note:'Fallback-Gegenprüfung'}]};
 }
 if(e.state==='OPEN_REVIEW'&&!registry?.assets?.[id.isin]&&window.HPOS_HALAL_MANUAL){
   manual=window.HPOS_HALAL_MANUAL.record();
   if(manual?.identityConfirmed&&(manual?.standard==='AAOIFI'||manual?.standard==='PROVIDER_VERDICT')){
     if(manual.state==='PASS')e={state:'PASS',reason:'Manuell bestätigte externe Evidenz von '+manual.provider+' wurde der verifizierten ISIN '+id.isin+' zugeordnet.',source:manual.provider+' · Copy-Paste',reviewedAt:manual.createdAt,evidence:[{provider:manual.provider,status:'MANUAL_PASS',note:'Vom Nutzer bestätigte externe Evidenz'}]};
     else if(manual.state==='FAIL')e={state:'FAIL',reason:'Manuell bestätigte externe AAOIFI-Evidenz von '+manual.provider+' meldet FAIL.',source:manual.provider+' · Copy-Paste',reviewedAt:manual.createdAt,evidence:[{provider:manual.provider,status:'MANUAL_FAIL',note:'Vom Nutzer bestätigte externe Evidenz'}]};
   }
 } const providerHtml=e.evidence?.length?'<ul class="infoList">'+e.evidence.map(x=>'<li><strong>'+esc(x.provider)+'</strong>: '+esc(x.status)+(x.note?' · '+esc(x.note):'')+'</li>').join('')+'</ul>':'<div>Keine Provider-Evidenz hinterlegt.</div>';
 const criteriaHtml=pre?.criteria?'<ul class="infoList">'+Object.values(pre.criteria).map(x=>'<li><strong>'+esc(x.rule)+'</strong>: '+esc(x.state)+(x.value!=null?' · '+esc((Number(x.value)*100).toFixed(1)+' %'):'')+(x.limit!=null?' / Grenze '+esc((Number(x.limit)*100).toFixed(0)+' %'):'')+'</li>').join('')+'</ul>':'';
 let html='<div class="drow"><span class="labelWithInfo">Gate 1<button type="button" class="infoBtn" data-info-eye="Gate 1" data-info-title="Halal-Regel" data-info-html="Nur <strong>PASS</strong> öffnet Gate 2. <strong>OPEN REVIEW</strong> bleibt neutral und gesperrt; <strong>FAIL</strong> beendet die Investment-Pipeline für dieses Instrument." aria-label="Gate-1-Regel anzeigen">i</button></span><strong class="'+cls(e.state)+'">'+esc(label(e.state))+'</strong></div>';
 html+='<div class="drow"><span>Kanonische Identität</span><strong>'+esc(id.isin||'nicht verifiziert')+'</strong></div>';
 html+='<div class="drow"><span>AAOIFI-Methode</span><strong>SS21</strong></div>';
 const evidenceInfo='<strong>Begründung</strong><br>'+esc(e.reason)+(provider&&provider.verdict==='UNRATED'?'<br><br><strong>Halal Terminal</strong><br>'+esc(provider.reason||'Kein verwertbares Free-Tier-Ergebnis.'):'')+(pre?'<br><br><strong>HPOS AAOIFI Rule Engine</strong><br>'+esc(pre.reason)+criteriaHtml:'')+(e.reviewedAt?'<br><br><strong>Geprüft am</strong><br>'+esc(new Date(e.reviewedAt).toLocaleString('de-DE')):'')+(e.source?'<br><br><strong>Quelle</strong><br>'+esc(e.source):'')+'<br><br><strong>Provider</strong>'+providerHtml; html+='<div class="drow"><span class="labelWithInfo">Evidenz<button type="button" class="infoBtn" data-info-eye="Gate 1" data-info-title="Halal-Evidenz" data-info-html="'+esc(evidenceInfo)+'" aria-label="Evidenzdetails anzeigen">i</button></span><strong>'+esc(e.evidence?.length?e.evidence.length+' Quellen':'offen')+'</strong></div>';
 if(e.state==='OPEN_REVIEW'&&pre?.state==='OPEN_REVIEW')html+='<div class="notice">Automatische Basisprüfung abgeschlossen. Für ein vollständiges AAOIFI-Urteil fehlen noch belastbare Quelldaten. Externe Evidenz ist nur der Fallback für diesen unklaren Restfall.</div>';if(e.state==='OPEN_REVIEW')html+='<button id="addManualHalalEvidence" class="secondary full">Unklaren Fall extern klären</button>';box.innerHTML=html;gateLock(e.state);syncPositionHalal(e.state);syncDecisionHalal(e.state);
}
function schedule(){lastSig='';setTimeout(render,60)}
document.addEventListener('click',schedule,true);
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()});document.addEventListener('hpos:halal-manual-evidence',schedule);
setTimeout(schedule,500);
window.HPOS_HALAL_EVIDENCE=Object.freeze({evaluateIsin:async isin=>{await load();return evaluate({isin:VALID_ISIN.test(String(isin||'').toUpperCase())?String(isin).toUpperCase():'',rawIsin:String(isin||'').toUpperCase()})}});
})();
