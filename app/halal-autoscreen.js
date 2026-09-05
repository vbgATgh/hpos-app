(()=>{'use strict';
const PROFILE_API='https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-profile';
const KEY='hpos_halal_prescreen_v2',TTL=7*24*60*60*1000;
const RULES=Object.freeze({impureIncomeMax:0.05,interestAssetsMax:0.30,interestDebtMax:0.30,autoPassSafetyMax:0.27,standard:'AAOIFI SS21',marketValueBasis:'TRAILING_36M_AVG_MARKET_VALUE'});
const HARD=[
 {cat:'Zinsbasierte Finanzgeschäfte',re:/\b(banks?\s*-|banks?\b|credit services|mortgage finance|consumer finance|financial conglomerates?)\b/i},
 {cat:'Glücksspiel',re:/\b(gambling|casinos?|betting|lotter(y|ies)|gaming activities)\b/i},
 {cat:'Alkohol',re:/\b(brewers?|wineries|distilleries|alcoholic beverages?)\b/i},
 {cat:'Tabak',re:/\b(tobacco|cigarettes?)\b/i},
 {cat:'Nicht-halale Lebensmittel',re:/\b(pork|hog production|meat products.*pork)\b/i},
 {cat:'Adult Entertainment',re:/\b(adult entertainment|pornograph)\b/i},
 {cat:'Freizeit-Cannabis',re:/\b(recreational cannabis|marijuana)\b/i},
 {cat:'Waffen/Rüstung',re:/\b(weapons?|arms manufacturer|defen[cs]e contractor|missiles?|ammunition|firearms?)\b/i},
 {cat:'Menschliches Klonen',re:/\b(human cloning|reproductive cloning)\b/i}
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
 const q=p?.dataQuality||{},mv=Number(p?.marketValue36mAvg)||0,revenue=Number(p?.revenue)||0;
 const debt=Number(p?.totalDebt)||0,assets=Number(p?.interestBearingAssetsUpperBound)||0,interestIncome=Math.abs(Number(p?.interestIncome)||0);
 const debtRatio=mv>0&&q.debt?debt/mv:null,assetRatio=mv>0&&q.interestAssets?assets/mv:null,incomeRatio=revenue>0&&q.interestIncome?interestIncome/revenue:null;
 return{
   debtRatio,assetRatio,incomeRatio,marketValue36mAvg:mv,marketValue36mMonths:Number(p?.marketValue36mMonths)||0,
   totalDebt:debt,interestBearingAssetsUpperBound:assets,interestIncome,revenue,
   debtCheck:debtRatio==null?'UNAVAILABLE':debtRatio<RULES.interestDebtMax?'PASS':'FAIL',
   interestAssetsCheck:assetRatio==null?'UNAVAILABLE':assetRatio<RULES.interestAssetsMax?'PASS':'FAIL',
   incomeCheck:incomeRatio==null?'UNAVAILABLE':incomeRatio<RULES.impureIncomeMax?'PASS':'FAIL',
   dataQuality:q,
   caveat:'Marktwertbasis wird aus bis zu 36 Monatskursen × aktuell verfügbare Aktienzahl approximiert. Für automatische PASS-Freigaben nutzt HPOS deshalb einen Sicherheitsabstand von 27 % bei den 30-%-Quoten.'
 };
}
function derive(p){
 const b=classifyBusiness(p),f=financial(p),q=p?.dataQuality||{};
 const criteria={
   business:{rule:'Zulässiges Kerngeschäft',limit:null,state:b.state==='FAIL'?'FAIL':q.profile?'PASS':'OPEN',value:b.category||null,source:p?.profileSource||p?.source||'FREE_PROFILE'},
   impureIncome:{rule:'Nicht-zulässige Einnahmen / Gesamtumsatz',limit:RULES.impureIncomeMax,state:f.incomeCheck==='FAIL'?'FAIL':f.incomeRatio!=null?'PASS':'OPEN',value:f.incomeRatio,source:f.incomeRatio==null?'FEHLT':'YAHOO_FINANCIAL_STATEMENT'},
   interestAssets:{rule:'Zinstragende Vermögenswerte / 36M Ø Marktwert',limit:RULES.interestAssetsMax,state:f.interestAssetsCheck==='FAIL'?'FAIL':f.assetRatio!=null?'PASS':'OPEN',value:f.assetRatio,source:f.assetRatio==null?'FEHLT':'YAHOO_BALANCE_SHEET_UPPER_BOUND'},
   interestDebt:{rule:'Zinstragende Schulden / 36M Ø Marktwert',limit:RULES.interestDebtMax,state:f.debtCheck==='FAIL'?'FAIL':f.debtRatio!=null?'PASS':'OPEN',value:f.debtRatio,source:f.debtRatio==null?'FEHLT':'YAHOO_TOTAL_DEBT_UPPER_BOUND'}
 };
 if(Object.values(criteria).some(x=>x.state==='FAIL'))return{state:'FAIL',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Mindestens ein AAOIFI-Kriterium überschreitet den freigegebenen Grenzwert oder das Kerngeschäft ist ausgeschlossen.'};
 const open=Object.entries(criteria).filter(([,x])=>x.state==='OPEN').map(([,x])=>x.rule);
 if(open.length)return{state:'OPEN_REVIEW',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Automatische Prüfung konnte nicht alle Pflichtkriterien belastbar berechnen. Offen: '+open.join('; ')+'.'};
 const buffered=(f.debtRatio??1)<RULES.autoPassSafetyMax&&(f.assetRatio??1)<RULES.autoPassSafetyMax&&(f.incomeRatio??1)<RULES.impureIncomeMax;
 if(!buffered)return{state:'OPEN_REVIEW',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Alle Kriterien sind unter den AAOIFI-Grenzwerten, mindestens eine 30-%-Quote liegt jedoch im 27–30-%-Sicherheitskorridor. Externe Bestätigung erforderlich.'};
 return{state:'PASS',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Automatische AAOIFI-Prüfung bestanden. Kerngeschäft unauffällig; nicht-zulässige Einnahmen <5 %; Vermögens- und Schuldenquote jeweils mit Sicherheitsabstand unter 30 %.'};
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
function label(r){if(!r)return'UNGEPRÜFT';if(r.state==='PASS')return'HALALKONFORM';if(r.state==='FAIL')return'NICHT HALALKONFORM';return'PRÜFUNG OFFEN'}
window.HPOS_HALAL_AUTOSCREEN=Object.freeze({screen,batch,cached,label,rules:RULES,methodology:'HPOS AAOIFI Rule Engine v2 · SS21 · automatic/free · fail-closed'});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch([...(s.holdings||[]),...(s.watchlist||[])],{onItem:()=>document.dispatchEvent(new CustomEvent('hpos:halal-prescreen'))})},3500);
})();
