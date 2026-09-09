(()=>{'use strict';
const PROFILE_API='https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-profile';
const CURATED_FINANCIALS='../data/halal_financial_evidence.json';
const KEY='hpos_halal_prescreen_v3',TTL=7*24*60*60*1000;
let curatedFinancials=null,curatedLoading=null;
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
async function curatedFor(a){if(!curatedFinancials){curatedLoading=curatedLoading||fetch(CURATED_FINANCIALS,{cache:'no-store'}).then(r=>r.ok?r.json():{assets:{}}).catch(()=>({assets:{}}));curatedFinancials=await curatedLoading}const isin=String(a?.isin||'').toUpperCase();return curatedFinancials?.assets?.[isin]||null}
function mergeCurated(p,c){if(!c)return p;const out={...(p||{}),dataQuality:{...(p?.dataQuality||{})},metricSources:{...(p?.metricSources||{})}},metrics=c.metrics||{};for(const key of ['revenue','totalDebt','interestBearingAssetsUpperBound','interestIncome','marketValue36mAvg']){const e=metrics[key],period=e?.period||c.period||'';if(!e||typeof e.value!=='number'||!Number.isFinite(e.value)||!e.sourceUrl||!period)continue;if(key==='marketValue36mAvg'&&Number(e.months)<30)continue;out[key]=e.value;out.dataQuality[key==='totalDebt'?'debt':key==='interestBearingAssetsUpperBound'?'interestAssets':key==='marketValue36mAvg'?'marketValue36m':key]=true;out.metricSources[key]={sourceType:'OFFICIAL_REPORT_CURATED',sourceName:e.sourceName||c.sourceName||'',sourceUrl:e.sourceUrl,period,page:e.page||null,label:e.label||''}}if(metrics.marketValue36mAvg&&out.dataQuality.marketValue36m){out.marketValue36mMonths=Number(metrics.marketValue36mAvg.months);out.marketValue36mMethod=metrics.marketValue36mAvg.method||'CURATED_36M_AVG_MARKET_VALUE'}out.evidenceAsOf=c.checkedAt||c.periodEnd||'';out.fundamentalSource='OFFICIAL_REPORT_CURATED';return out}
function classifyBusiness(p){
 const hay=[p?.industry,p?.sector,p?.businessSummary].filter(Boolean).join(' | ');
 if(!hay)return{state:'OPEN',category:null,detail:'Geschäftsprofil fehlt.'};
 for(const x of HARD)if(x.re.test(hay))return{state:'FAIL',category:x.cat,detail:'Geschäftsprofil enthält einen eindeutigen Treffer in einer ausgeschlossenen Geschäftskategorie.'};
 return{state:'PASS_PARTIAL',category:null,detail:'Kein eindeutiger Treffer in den automatisch prüfbaren ausgeschlossenen Kerngeschäften.'}
}
function financial(p){
 const mv=Number(p?.marketValue36mAvg)||0,revenue=Number(p?.revenue)||0,debt=Number(p?.totalDebt)||0,interestAssets=Number(p?.interestBearingAssetsUpperBound)||0,interestIncome=Math.abs(Number(p?.interestIncome)||0),q=p?.dataQuality||{};
 const debtRatio=mv>0&&q.debt?debt/mv:null;
 const interestAssetsRatio=mv>0&&q.interestAssets?interestAssets/mv:null;
 const impureIncomeRatio=revenue>0&&q.interestIncome?interestIncome/revenue:null;
 return{
   marketValue36mAvg:mv||null,marketValue36mMonths:Number(p?.marketValue36mMonths)||0,marketValue36mMethod:p?.marketValue36mMethod||'UNAVAILABLE',
   totalDebt:q.debt?debt:null,interestBearingAssetsUpperBound:q.interestAssets?interestAssets:null,interestIncome:q.interestIncome?interestIncome:null,revenue:q.revenue?revenue:null,
   debtRatio,interestAssetsRatio,impureIncomeRatio,
   dataQuality:q,metricSources:p?.metricSources||{},evidenceAsOf:p?.evidenceAsOf||'',
   caveat:'HPOS nutzt nur kostenlos verfügbare Daten. PASS wird nur erteilt, wenn alle benötigten Kriterien belastbar vorliegen und innerhalb der freigegebenen AAOIFI-Grenzen liegen. Unvollständige oder nur als Obergrenze interpretierbare Daten bleiben offen.'
 };
}
function derive(p){
 const b=classifyBusiness(p),f=financial(p),mvOk=f.marketValue36mMonths>=30&&f.marketValue36mAvg>0;
 const criteria={
   business:{rule:'Zulässiges Kerngeschäft',limit:null,state:b.state==='FAIL'?'FAIL':b.state==='PASS_PARTIAL'?'PASS':'OPEN',value:b.category||null,source:p?.profileSource||p?.source||'FREE_PROFILE'},
   impureIncome:{rule:'Nicht-zulässige Einnahmen / Gesamtumsatz',limit:RULES.impureIncomeMax,state:f.impureIncomeRatio==null?'OPEN':f.impureIncomeRatio<=RULES.impureIncomeMax?'PASS':'FAIL',value:f.impureIncomeRatio,source:f.impureIncomeRatio==null?'FEHLT':'YAHOO_STATEMENT'},
   interestAssets:{rule:'Zinstragende Vermögenswerte / 36M Ø Marktwert',limit:RULES.interestAssetsMax,state:!mvOk||f.interestAssetsRatio==null?'OPEN':f.interestAssetsRatio<=RULES.interestAssetsMax?'PASS':'OPEN',value:f.interestAssetsRatio,source:f.interestAssetsRatio==null?'FEHLT':'CONSERVATIVE_UPPER_BOUND'},
   interestDebt:{rule:'Zinstragende Schulden / 36M Ø Marktwert',limit:RULES.interestDebtMax,state:!mvOk||f.debtRatio==null?'OPEN':f.debtRatio<=RULES.interestDebtMax?'PASS':'OPEN',value:f.debtRatio,source:f.debtRatio==null?'FEHLT':'TOTAL_DEBT_CONSERVATIVE'}
 };
 if(b.state==='FAIL')return{state:'FAIL',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Geschäftsmodell verletzt den automatischen AAOIFI-Ausschlussfilter: '+b.category+'.'};
 if(criteria.impureIncome.state==='FAIL')return{state:'FAIL',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Nicht-zulässige Einnahmen überschreiten die freigegebene 5%-Grenze.'};
 const allPass=Object.values(criteria).every(x=>x.state==='PASS');
 if(allPass)return{state:'PASS',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,reason:'Automatische AAOIFI-Prüfung bestanden: Kerngeschäft zulässig und alle verfügbaren Pflichtkennzahlen liegen innerhalb der freigegebenen Grenzwerte.'};
 const missing=Object.entries(criteria).filter(([,x])=>x.state!=='PASS').map(([,x])=>x.rule);
 return{state:'OPEN_REVIEW',screen:'HPOS_AAOIFI_RULE_ENGINE_V2',standard:RULES.standard,criteria,business:b,financial:f,missingCriteria:missing,reason:'Automatische AAOIFI-Prüfung noch nicht eindeutig. Offene Kriterien: '+missing.join('; ')+'. Fehlende Daten bleiben PRÜFUNG OFFEN.'};
}
async function screen(a,force=false){
 const k=keyOf(a),all=read(),cached=all[k],age=cached?.checkedAt?Date.now()-Date.parse(cached.checkedAt):Infinity;
 if(!force&&cached&&age<TTL){await window.HPOS_HALAL_STORE?.saveAAOIFI?.(a,cached);return cached;}
 const symbol=symbolOf(a);
 if(!symbol){const x={state:'OPEN_REVIEW',screen:'HPOS_FREE_PRESCREEN',missingCriteria:['Verlässliches Marktsymbol'],reason:'Kein verlässliches Marktsymbol für die automatische kostenlose Vorprüfung. Fehlende Daten bleiben PRÜFUNG OFFEN.',checkedAt:new Date().toISOString(),isin:String(a?.isin||'')};all[k]=x;write(all);await window.HPOS_HALAL_STORE?.saveAAOIFI?.(a,x);return x}
 const p=mergeCurated(await profile(symbol),await curatedFor(a));
 const x=p?derive(p):{state:'OPEN_REVIEW',screen:'HPOS_FREE_PRESCREEN',missingCriteria:['Kostenlose Fundamentaldaten'],reason:'Kostenlose Fundamentaldaten aktuell nicht verfügbar. Fehlende Daten bleiben PRÜFUNG OFFEN.',business:{state:'UNKNOWN'},financial:{},checkedAt:new Date().toISOString()};
 x.checkedAt=new Date().toISOString();x.isin=String(a?.isin||'').toUpperCase();x.symbol=symbol;x.profileSource=p?.source||'';all[k]=x;write(all);await window.HPOS_HALAL_STORE?.saveAAOIFI?.(a,x);return x
}
async function batch(list,{force=false,onItem}={}){
 const uniq=[...new Map((list||[]).map(a=>[keyOf(a),a]).filter(x=>x[0])).values()];
 const summary={total:uniq.length,processed:0,pass:0,fail:0,open:0,errors:0,results:[]};
 let idx=0;const workers=Array.from({length:Math.min(2,uniq.length)},async()=>{while(idx<uniq.length){const a=uniq[idx++];try{const r=await screen(a,force);summary.processed++;if(r?.state==='PASS')summary.pass++;else if(r?.state==='FAIL')summary.fail++;else summary.open++;summary.results.push({key:keyOf(a),state:r?.state||'OPEN_REVIEW',missingCriteria:r?.missingCriteria||[],reason:r?.reason||''});try{onItem?.(a,r)}catch{}}catch{summary.processed++;summary.open++;summary.errors++;summary.results.push({key:keyOf(a),state:'OPEN_REVIEW',missingCriteria:[],reason:'Prüfung technisch fehlgeschlagen.'});try{onItem?.(a,{state:'OPEN_REVIEW',error:true})}catch{}}}});await Promise.all(workers);return summary
}
function cached(a){return read()[keyOf(a)]||null}
function label(r){if(!r)return'UNGEPRÜFT';if(r.state==='PASS')return'HALALKONFORM';if(r.state==='FAIL')return'NICHT HALALKONFORM';return'PRÜFUNG OFFEN'}
window.HPOS_HALAL_AUTOSCREEN=Object.freeze({screen,batch,cached,label,rules:RULES,methodology:'HPOS AAOIFI Rule Engine v2 · SS21 · automatic/free · fail-closed'});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch([...(s.holdings||[]),...(s.watchlist||[])],{onItem:()=>document.dispatchEvent(new CustomEvent('hpos:halal-prescreen'))})},3500);
})();
