(()=>{'use strict';
const PROFILE_API='https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-profile';
const KEY='hpos_halal_prescreen_v2',TTL=7*24*60*60*1000;
const RULES=Object.freeze({impureIncomeMax:0.05,interestAssetsMax:0.30,interestDebtMax:0.30,standard:'AAOIFI SS21',marketValueBasis:'TRAILING_36M_AVG_REQUIRED'});
const HARD=[
 {cat:'Zinsbasierte Finanzgeschäfte',re:/\b(banks?\s*-|banks?\b|credit services|mortgage finance|consumer finance|financial conglomerates?)\b/i},
 {cat:'Glücksspiel',re:/\b(gambling|casinos?|betting|lotter(y|ies)|gaming activities)\b/i},
 {cat:'Alkohol',re:/\b(brewers?|wineries|distilleries|alcoholic beverages?)\b/i},
 {cat:'Tabak',re:/\b(tobacco|cigarettes?)\b/i},
 {cat:'Nicht-halale Lebensmittel',re:/\b(pork|hog production|meat products.*pork)\b/i},
 {cat:'Adult Entertainment',re:/\b(adult entertainment|pornograph)\b/i},
 {cat:'Freizeit-Cannabis',re:/\b(recreational cannabis|marijuana)\b/i}
];
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(x){try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}}
function symbolOf(a){return String(a?.ticker||a?.symbol||'').trim().toUpperCase()}
function keyOf(a){return String(a?.isin||symbolOf(a)||a?.name||'').toUpperCase()}
async function profile(symbol){if(!symbol)return null;try{const r=await fetch(PROFILE_API+'?symbol='+encodeURIComponent(symbol),{cache:'no-store'});if(!r.ok)return null;const p=await r.json();return p&&!p.error?p:null}catch{return null}}
function classifyBusiness(p){
 const hay=[p?.industry,p?.sector,p?.businessSummary].filter(Boolean).join(' | ');
 for(const x of HARD)if(x.re.test(hay))return{state:'FAIL',category:x.cat,detail:'Geschäftsprofil enthält einen eindeutigen Treffer in einer ausgeschlossenen Geschäftskategorie.'};
 return{state:'PASS_PARTIAL',category:null,detail:hay?'Kein eindeutiger Treffer in den automatisch prüfbaren ausgeschlossenen Kerngeschäften.':'Geschäftsprofil fehlt.'}
}
function financial(p){
 const cap=Number(p?.marketCap)||0,debt=Number(p?.totalDebt)||0,cash=Number(p?.totalCash)||0;
 const debtRatio=cap>0&&debt>=0?debt/cap:null,cashRatio=cap>0&&cash>=0?cash/cap:null;
 return{
   debtRatio,cashRatio,
   debtCheck:debtRatio==null?'UNAVAILABLE':debtRatio<=RULES.interestDebtMax?'PROXY_PASS':'PROXY_FAIL',
   interestAssetsCheck:'UNAVAILABLE',
   incomeCheck:'UNAVAILABLE',
   marketCapSnapshot:cap||null,totalDebt:debt||null,totalCash:cash||null,
   caveat:'Kostenlose Quelle liefert Snapshot-Marktkapitalisierung und Gesamtschulden; AAOIFI verlangt für die maßgebliche Berechnung den durchschnittlichen Marktwert der letzten 36 Monate und nur zinstragende Positionen.'
 };
}
function derive(p){
 const b=classifyBusiness(p),f=financial(p);
 const criteria={
   business:{rule:'Zulässiges Kerngeschäft',limit:null,state:b.state==='FAIL'?'FAIL':b.state==='PASS_PARTIAL'?'PASS':'OPEN',value:b.category||null,source:p?.profileSource||p?.source||'FREE_PROFILE'},
   impureIncome:{rule:'Nicht-zulässige Einnahmen / Gesamtumsatz',limit:RULES.impureIncomeMax,state:'OPEN',value:null,source:'FEHLT'},
   interestAssets:{rule:'Zinstragende Vermögenswerte / 36M Ø Marktwert',limit:RULES.interestAssetsMax,state:'OPEN',value:null,source:'FEHLT'},
   interestDebt:{rule:'Zinstragende Schulden / 36M Ø Marktwert',limit:RULES.interestDebtMax,state:f.debtCheck==='PROXY_FAIL'?'OPEN':f.debtCheck==='PROXY_PASS'?'OPEN':'OPEN',value:f.debtRatio,source:f.debtRatio==null?'FEHLT':'PROXY_SNAPSHOT'}
 };
 if(b.state==='FAIL')return{state:'FAIL',screen:'HPOS_AAOIFI_RULE_ENGINE_V1',standard:RULES.standard,criteria,business:b,financial:f,reason:'Geschäftsmodell verletzt den automatischen AAOIFI-Ausschlussfilter: '+b.category+'.'};
 const missing=Object.entries(criteria).filter(([k,x])=>x.state==='OPEN').map(([k,x])=>x.rule);
 return{state:'OPEN_REVIEW',screen:'HPOS_AAOIFI_RULE_ENGINE_V1',standard:RULES.standard,criteria,business:b,financial:f,reason:'AAOIFI-Prüfung noch nicht vollständig. Offene Kriterien: '+missing.join('; ')+'. Ein Snapshot-Proxy darf Gate 1 nicht freigeben.'};
}
async function screen(a,force=false){
 const k=keyOf(a),all=read(),cached=all[k],age=cached?.checkedAt?Date.now()-Date.parse(cached.checkedAt):Infinity;
 if(!force&&cached&&age<TTL)return cached;
 const symbol=symbolOf(a);
 if(!symbol){const x={state:'OPEN_REVIEW',screen:'HPOS_FREE_PRESCREEN',reason:'Kein verlässliches Marktsymbol für die automatische kostenlose Vorprüfung.',checkedAt:new Date().toISOString(),isin:String(a?.isin||'')};all[k]=x;write(all);return x}
 const p=await profile(symbol);
 const x=p?derive(p):{state:'OPEN_REVIEW',screen:'HPOS_FREE_PRESCREEN',reason:'Kostenlose Fundamentaldaten aktuell nicht verfügbar.',business:{state:'UNKNOWN'},financial:{},checkedAt:new Date().toISOString()};
 x.checkedAt=new Date().toISOString();x.isin=String(a?.isin||'').toUpperCase();x.symbol=symbol;x.profileSource=p?.source||'';all[k]=x;write(all);return x
}
async function batch(list,{force=false,onItem}={}){
 const uniq=[...new Map((list||[]).map(a=>[keyOf(a),a]).filter(x=>x[0])).values()];
 let idx=0;const workers=Array.from({length:Math.min(2,uniq.length)},async()=>{while(idx<uniq.length){const a=uniq[idx++],r=await screen(a,force);try{onItem?.(a,r)}catch{}}});await Promise.all(workers);return uniq.length
}
function cached(a){return read()[keyOf(a)]||null}
function label(r){if(!r)return'UNGEPRÜFT';if(r.state==='FAIL')return'NICHT HALALKONFORM';return'PRÜFUNG OFFEN'}
window.HPOS_HALAL_AUTOSCREEN=Object.freeze({screen,batch,cached,label,rules:RULES,methodology:'HPOS AAOIFI Rule Engine v1 · SS21 · fail-closed'});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch([...(s.holdings||[]),...(s.watchlist||[])],{onItem:()=>document.dispatchEvent(new CustomEvent('hpos:halal-prescreen'))})},3500);
})();
