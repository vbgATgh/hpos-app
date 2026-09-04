(()=>{'use strict';
const PROFILE_API='https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-profile';
const KEY='hpos_halal_prescreen_v1',TTL=7*24*60*60*1000;
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
 const cap=Number(p?.marketCap)||0,debt=Number(p?.totalDebt)||0;
 const ratio=cap>0&&debt>=0?debt/cap:null;
 return{
   debtRatio:ratio,
   debtCheck:ratio==null?'UNAVAILABLE':ratio<=0.30?'PROXY_BELOW_30':'PROXY_ABOVE_30',
   incomeCheck:'UNAVAILABLE',
   interestAssetsCheck:'UNAVAILABLE'
 };
}
function derive(p){
 const b=classifyBusiness(p),f=financial(p);
 if(b.state==='FAIL')return{state:'FAIL',screen:'HPOS_FREE_PRESCREEN',business:b,financial:f,reason:'Automatischer Geschäftsmodell-Check: '+b.category+' erkannt.'};
 const missing=['Nicht-zulässige Einnahmen','verzinsliche Vermögenswerte'];
 if(f.debtCheck==='UNAVAILABLE')missing.push('Schuldenquote');
 const debtNote=f.debtCheck==='PROXY_BELOW_30'?'Gesamtschulden/Marktkapitalisierung liegt im verfügbaren Snapshot ≤30 %. Dies ist nur ein Proxy, nicht die vollständige AAOIFI-Berechnung.':f.debtCheck==='PROXY_ABOVE_30'?'Gesamtschulden/Marktkapitalisierung liegt im verfügbaren Snapshot >30 %. Wegen Proxy-Daten und fehlendem 36-Monats-Marktwert bleibt das Ergebnis offen.':'Schuldendaten fehlen.';
 return{state:'OPEN_REVIEW',screen:'HPOS_FREE_PRESCREEN',business:b,financial:f,reason:'Vorprüfung unauffällig, aber vollständige Halal-Freigabe nicht möglich. Fehlend: '+missing.join(', ')+'. '+debtNote};
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
window.HPOS_HALAL_AUTOSCREEN=Object.freeze({screen,batch,cached,label,methodology:'AAOIFI-inspired free pre-screen; not scholarly certification'});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)batch([...(s.holdings||[]),...(s.watchlist||[])],{onItem:()=>document.dispatchEvent(new CustomEvent('hpos:halal-prescreen'))})},3500);
})();
