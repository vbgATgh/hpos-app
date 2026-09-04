(()=>{'use strict';
const $=s=>document.querySelector(s);
const POLICY_URL='../data/portfolio_fit_policy.json';
let policy=null,loadPromise=null,lastSig='';
const VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
async function load(){if(loadPromise)return loadPromise;loadPromise=fetch(POLICY_URL,{cache:'no-store'}).then(r=>r.ok?r.json():null).catch(()=>null).then(x=>policy=x);return loadPromise}
function detail(label){const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()===label);return row?.lastElementChild?.textContent?.trim()||''}
function identity(){const raw=detail('ISIN').toUpperCase();return{isin:VALID_ISIN.test(raw)?raw:'',name:$('#assetName')?.textContent?.trim()||''}}
function parsePct(txt){const m=String(txt||'').replace(',','.').match(/([0-9]+(?:\.[0-9]+)?)\s*%/);return m?Number(m[1]):null}
function currentAllocation(){const out={};[...document.querySelectorAll('#allocation .barrow')].forEach(r=>{const k=r.firstElementChild?.textContent?.trim(),v=parsePct(r.lastElementChild?.textContent);if(k&&v!=null)out[k]=v});return out}
async function gate1(isin){if(!window.HPOS_HALAL_EVIDENCE?.evaluateIsin)return{state:'OPEN_REVIEW'};try{return await window.HPOS_HALAL_EVIDENCE.evaluateIsin(isin)}catch{return{state:'OPEN_REVIEW'}}}
function mount(){let sec=$('#portfolioFitSection');if(sec)return sec;const h=$('#halalEvidenceSection');if(!h)return null;sec=document.createElement('div');sec.id='portfolioFitSection';sec.className='section';sec.innerHTML='<h2>Portfolio Fit</h2><div id="portfolioFitBox" class="detail"></div>';h.insertAdjacentElement('afterend',sec);return sec}
function stateLabel(s){return s==='PASS'?'PASS · Portfolio Fit':s==='FAIL'?'FAIL · Kein Portfolio Fit':s==='LOCKED'?'LOCKED · Gate 1 erforderlich':'OPEN REVIEW · Regeln unvollständig'}
function cls(s){return s==='PASS'?'pos':s==='FAIL'?'neg':'warn'}
function gateRow(state){const rows=[...document.querySelectorAll('#assetGateRows .drow')],r=rows[1],v=r?.lastElementChild;if(!v)return;if(state==='LOCKED'){v.textContent='Wartet auf Halal-Prüfung';v.className='warn'}else if(state==='OPEN_REVIEW'){v.textContent='Portfolio Fit offen';v.className='warn'}else if(state==='PASS'){v.textContent='Portfolio Fit belegt';v.className='pos'}else{v.textContent='Portfolio Fit FAIL';v.className='neg'}}
async function evaluate(id){
 const g1=await gate1(id.isin);
 if(g1.state!=='PASS')return{state:'LOCKED',bucket:null,reason:'Gate 1 ist nicht PASS. Portfolio Fit wird deshalb nicht bewertet.'};
 if(!policy)return{state:'OPEN_REVIEW',bucket:null,reason:'Portfolio-Fit-Regelwerk ist nicht verfügbar.'};
 const c=policy.assetClassifications?.[id.isin];
 if(!c)return{state:'OPEN_REVIEW',bucket:null,reason:'Für diese ISIN ist noch keine freigegebene Core/Turbo/Sukuk-Klassifikation hinterlegt.'};
 const a=currentAllocation(),target=policy.policy?.allocationTargets?.[c.bucket];
 if(target==null&&c.bucket!=='Sukuk')return{state:'OPEN_REVIEW',bucket:c.bucket,reason:'Für den Portfolio-Bucket fehlt ein freigegebenes Ziel.'};
 return{state:'OPEN_REVIEW',bucket:c.bucket,reason:'Strategischer Bucket ist klassifiziert. Eine automatische PASS/FAIL-Entscheidung bleibt gesperrt, bis Toleranzband und Konzentrationsgrenze ausdrücklich freigegeben sind.',allocation:a,target:target==null?policy.policy?.sukukTarget:target};
}
async function render(){
 if(!$('#asset')?.classList.contains('on'))return;await load();const id=identity(),sig=id.name+'|'+id.isin;if(sig===lastSig&&$('#portfolioFitBox'))return;lastSig=sig;const sec=mount();if(!sec)return;
 const e=await evaluate(id),box=$('#portfolioFitBox');if(!box)return;
 let html='<div class="drow"><span>Gate 2</span><strong class="'+cls(e.state)+'">'+esc(stateLabel(e.state))+'</strong></div>';
 html+='<div class="drow"><span>Strategischer Bucket</span><strong>'+esc(e.bucket||'—')+'</strong></div>';
 if(e.bucket&&e.target!=null)html+='<div class="drow"><span>Zielrahmen</span><strong>'+esc(e.bucket)+' '+(e.target*100).toFixed(0)+' %</strong></div>';
 if(e.bucket&&e.allocation?.[e.bucket]!=null)html+='<div class="drow"><span>Aktueller Anteil</span><strong>'+Number(e.allocation[e.bucket]).toFixed(1)+' %</strong></div>';
 html+='<div class="profileText"><span>Begründung</span><p>'+esc(e.reason)+'</p></div>';
 html+='<div class="notice">Freigegebener Rahmen: Core/Turbo 70/30, Sukuk 15 %, Cash-Reserve 3 %. HPOS erfindet keine Toleranzbänder oder Konzentrationsgrenzen. Bis diese Regeln beschlossen sind, kann Gate 2 nach Gate-1-PASS höchstens OPEN REVIEW erreichen.</div>';
 box.innerHTML=html;gateRow(e.state);
}
function schedule(){lastSig='';setTimeout(render,120)}
document.addEventListener('click',schedule,true);document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')schedule()});setTimeout(schedule,700);
window.HPOS_PORTFOLIO_FIT=Object.freeze({evaluateIsin:async isin=>{await load();return evaluate({isin:String(isin||'').toUpperCase()})}});
})();
