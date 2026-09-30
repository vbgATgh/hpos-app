(()=>{'use strict';
const GATE_DEFINITIONS=Object.freeze([
  Object.freeze({number:1,key:'gate1',name:'Halal',type:'HARD'}),
  Object.freeze({number:2,key:'gate2',name:'Portfolio Fit',type:'HARD'}),
  Object.freeze({number:3,key:'gate3',name:'Investmentthese',type:'REVIEW'}),
  Object.freeze({number:4,key:'gate4',name:'Fundamentaldaten',type:'REVIEW'}),
  Object.freeze({number:5,key:'gate5',name:'Bewertung',type:'REVIEW'}),
  Object.freeze({number:6,key:'gate6',name:'Timing',type:'REVIEW'}),
  Object.freeze({number:7,key:'gate7',name:'News-Evidenz',type:'REVIEW'}),
  Object.freeze({number:8,key:'gate8',name:'Ausführung',type:'EXECUTION'})
]);
const PASS=new Set(['PASS','SUPPORTED','STRENGTHENING','CURRENT','NEUTRAL','HALAL','COMPLIANT','SHARIA_COMPLIANT']);
const FAIL=new Set(['FAIL','BROKEN','HARAM','NON_COMPLIANT','NOT_HALAL']);
const OPEN=new Set(['OPEN','OPEN_REVIEW','UNKNOWN','NOT_EVALUATED','INSUFFICIENT','MISSING']);
const REVIEW=new Set(['REVIEW','FREEZE','HOLD_REVIEW','FAIR_TO_DEMANDING','WEAKENING']);
const WAIT=new Set(['WAIT','WAIT_TRIGGER','WAIT_FOR_TRIGGER']);
const LOCKED=new Set(['LOCKED','BLOCKED_UPSTREAM']);
const EXECUTION=new Set(['EXTERNAL_ONLY']);
const TERMINAL=new Set(['PASS','FAIL','REVIEW','WAIT_TRIGGER','EXTERNAL_ONLY']);
const DECISIONS=Object.freeze({
  HARD_BLOCKED:'HARD_BLOCKED',
  EVIDENCE_REQUIRED:'EVIDENCE_REQUIRED',
  REVIEW_REQUIRED:'REVIEW_REQUIRED',
  WAIT_TRIGGER:'WAIT_TRIGGER',
  READY_FOR_RANKING:'READY_FOR_RANKING'
});
function upper(value){return String(value??'UNKNOWN').trim().toUpperCase().replaceAll(' ','_')}
function rawStates(gate){const listed=Array.isArray(gate?.states)?gate.states:[gate?.state];return [...new Set(listed.map(upper).filter(Boolean))]}
function normalizeState(gate={}){
  const states=rawStates(gate),hasPass=states.some(x=>PASS.has(x)),hasFail=states.some(x=>FAIL.has(x));
  if(hasPass&&hasFail)return{state:'OPEN_REVIEW',conflict:true,reason:'Widersprüchliche PASS-/FAIL-Evidenz muss fachlich geklärt werden.'};
  if(hasFail)return{state:'FAIL',conflict:false,reason:''};
  if(hasPass&&gate.evidenceComplete===false)return{state:'OPEN_REVIEW',conflict:true,reason:'PASS widerspricht unvollständiger Pflichtevidenz.'};
  if(hasPass)return{state:'PASS',conflict:false,reason:''};
  if(states.some(x=>WAIT.has(x)))return{state:'WAIT_TRIGGER',conflict:false,reason:''};
  if(states.some(x=>REVIEW.has(x)))return{state:'REVIEW',conflict:false,reason:''};
  if(states.some(x=>EXECUTION.has(x)))return{state:'EXTERNAL_ONLY',conflict:false,reason:''};
  if(states.some(x=>LOCKED.has(x)))return{state:'LOCKED',conflict:false,reason:''};
  if(states.some(x=>OPEN.has(x)))return{state:'OPEN_REVIEW',conflict:false,reason:''};
  if(states.includes('ERROR'))return{state:'ERROR',conflict:false,reason:''};
  return{state:'OPEN_REVIEW',conflict:false,reason:'Unbekannter Zustand bleibt offen.'};
}
function normalizeGate(definition,gate){
  const normalized=normalizeState(gate||{});
  return Object.freeze({...definition,rawState:upper(gate?.state),state:normalized.state,label:String(gate?.label||normalized.state),reason:String(gate?.reason||gate?.basis||normalized.reason||''),conflict:normalized.conflict});
}
function decisionFor(gates){
  const hardFail=gates.find(g=>g.type==='HARD'&&g.state==='FAIL');
  if(hardFail)return{state:DECISIONS.HARD_BLOCKED,label:'HARD GATE NICHT BESTANDEN',blockingGate:hardFail.number,capitalEligibility:'BLOCKED'};
  const evidenceGap=gates.find(g=>g.type!=='EXECUTION'&&['OPEN_REVIEW','LOCKED','ERROR'].includes(g.state));
  if(evidenceGap)return{state:DECISIONS.EVIDENCE_REQUIRED,label:'EVIDENZ FEHLT',blockingGate:evidenceGap.number,capitalEligibility:'NOT_READY'};
  const review=gates.find(g=>g.state==='REVIEW');
  if(review)return{state:DECISIONS.REVIEW_REQUIRED,label:'FACHLICHE PRÜFUNG NÖTIG',blockingGate:review.number,capitalEligibility:'REVIEW'};
  const wait=gates.find(g=>g.state==='WAIT_TRIGGER');
  if(wait)return{state:DECISIONS.WAIT_TRIGGER,label:'TRIGGER ABWARTEN',blockingGate:wait.number,capitalEligibility:'WAIT_TRIGGER'};
  return{state:DECISIONS.READY_FOR_RANKING,label:'FÜR KAPITALRANKING BEREIT',blockingGate:null,capitalEligibility:'ELIGIBLE'};
}
function evaluate(input={}){
  const source=input.case||input;
  const gates=GATE_DEFINITIONS.map(def=>normalizeGate(def,source?.[def.key]));
  const decision=decisionFor(gates),conflicts=gates.filter(g=>g.conflict).map(g=>({gate:g.number,reason:g.reason}));
  const t90=input.t90||source?.t90||null;
  const reviewFlags=t90?.active?[Object.freeze({type:'T90',label:'T90-Review fällig',reason:String(t90.reason||'Position seit 90 Tagen fachlich überprüfen.'),blocksCapital:false})]:[];
  const evaluated=gates.filter(g=>TERMINAL.has(g.state)).length;
  return Object.freeze({schemaVersion:1,gates:Object.freeze(gates),decision:Object.freeze(decision),conflicts:Object.freeze(conflicts),reviewFlags:Object.freeze(reviewFlags),progress:Object.freeze({evaluated,total:GATE_DEFINITIONS.length,complete:evaluated===GATE_DEFINITIONS.length}),eib:Object.freeze({status:'NOT_CALCULATED',amount:null,reason:'EIB wird erst nach Gate-Freigabe im Kapitalranking und Execution-Rechner berechnet.'})});
}
function state(value){return normalizeState(typeof value==='object'?value:{state:value}).state}
window.HPOS_GATE_ENGINE=Object.freeze({version:'1.0',definitions:GATE_DEFINITIONS,decisions:DECISIONS,state,evaluate});
})();
