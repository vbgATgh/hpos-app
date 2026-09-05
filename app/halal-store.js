(()=>{'use strict';
const API=(window.HPOS_RUNTIME?.integration?.baseUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api';
const SESSION_KEY='hpos_parqet_session',CACHE_KEY='hpos_halal_canonical_v1',VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
function read(){try{return JSON.parse(localStorage.getItem(CACHE_KEY)||'{}')||{}}catch{return{}}}
function write(x){try{localStorage.setItem(CACHE_KEY,JSON.stringify(x))}catch{}}
function isinOf(a){const v=String(a?.isin||'').trim().toUpperCase();return VALID_ISIN.test(v)?v:''}
function session(){return String(localStorage.getItem(SESSION_KEY)||'')}
function headers(json=false){const s=session(),h={Accept:'application/json'};if(s)h.Authorization='Bearer '+s;if(json)h['Content-Type']='application/json';return h}
function cached(a){const isin=isinOf(a);return isin?read()[isin]||null:null}
async function get(a,{force=false}={}){
 const isin=isinOf(a);if(!isin)return null;const old=cached(a);if(!force&&old&&!old.stale)return old;if(!session())return old;
 try{const r=await fetch(API+'/api/halal/evidence?isin='+encodeURIComponent(isin),{cache:'no-store',headers:headers()});if(!r.ok)return old;const x=await r.json();if(x?.state){const all=read();all[isin]=x;write(all);return x}return old}catch{return old}
}
async function saveAAOIFI(a,result){
 const isin=isinOf(a);if(!isin||!session()||!result||!['PASS','FAIL','OPEN_REVIEW'].includes(result.state))return null;
 const body={isin,state:result.state,sourceType:'HPOS_AAOIFI',symbol:String(a?.ticker||a?.symbol||result?.symbol||'').toUpperCase(),reason:String(result.reason||'Automatische AAOIFI-Prüfung ohne abschließende Evidenz.'),checkedAt:result.checkedAt||new Date().toISOString(),evidence:[{provider:'HPOS AAOIFI Rule Engine',status:'AUTO_'+result.state,note:String(result.reason||'')}]};
 try{const r=await fetch(API+'/api/halal/evidence',{method:'POST',cache:'no-store',headers:headers(true),body:JSON.stringify(body)});if(!r.ok)return null;const x=await r.json(),all=read();all[isin]=x;write(all);document.dispatchEvent(new CustomEvent('hpos:halal-canonical'));return x}catch{return null}
}
async function loadAll(list,{force=false}={}){const uniq=[...new Map((list||[]).map(a=>[isinOf(a),a]).filter(x=>x[0])).values()];for(const a of uniq)await get(a,{force});document.dispatchEvent(new CustomEvent('hpos:halal-canonical'));return uniq.length}
window.HPOS_HALAL_STORE=Object.freeze({get,saveAAOIFI,loadAll,cached,isinOf});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s)loadAll([...(s.holdings||[]),...(s.watchlist||[])])},2500);
})();