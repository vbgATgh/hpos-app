(()=>{'use strict';
const API=(window.HPOS_RUNTIME?.integration?.screenUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-screen';
const SESSION_KEY='hpos_parqet_session',VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
let lastError='';
function session(){return String(localStorage.getItem(SESSION_KEY)||'')}
function asset(a){return{isin:String(a?.isin||'').trim().toUpperCase(),ticker:String(a?.ticker||a?.symbol||'').trim().toUpperCase(),exchange:String(a?.exchange||'').trim(),name:String(a?.name||'').trim(),source:String(a?.source||'').trim().toUpperCase()}}
function headers(){const token=session();return token?{Accept:'application/json','Content-Type':'application/json',Authorization:'Bearer '+token}:null}
async function post(path,body){const h=headers();if(!h){lastError='not_authenticated';return null}try{const r=await fetch(API+path,{method:'POST',cache:'no-store',headers:h,body:JSON.stringify(body)});const data=await r.json().catch(()=>null);if(!r.ok){lastError=String(data?.error||'research_http_'+r.status);return null}lastError='';return data}catch{lastError='research_unavailable';return null}}
async function get(path){const h=headers();if(!h){lastError='not_authenticated';return null}try{const r=await fetch(API+path,{cache:'no-store',headers:h});const data=await r.json().catch(()=>null);if(!r.ok){lastError=String(data?.error||'research_http_'+r.status);return null}lastError='';return data}catch{lastError='research_unavailable';return null}}
async function resolve(a){const result=await post('/identity',asset(a));return result?.identity&&VALID_ISIN.test(String(result.identity.isin||'').toUpperCase())?result:null}
async function check(a,{force=true}={}){const result=await post('/check',{asset:asset(a),force});if(!result)return null;if(!['PASS','FAIL','OPEN_REVIEW'].includes(String(result.state||'').toUpperCase()))return null;return result}
async function latest(isin){isin=String(isin||'').trim().toUpperCase();return VALID_ISIN.test(isin)?get('/runs/latest?isin='+encodeURIComponent(isin)):null}
async function batch(list,{force=false,onItem}={}){
 const keyOf=a=>String(a?.isin||a?.ticker||a?.symbol||a?.name||'').trim().toUpperCase();
 const uniq=[...new Map((list||[]).map(a=>[keyOf(a),a]).filter(x=>x[0])).values()];
 const summary={total:uniq.length,processed:0,pass:0,fail:0,open:0,errors:0,results:[]};
 let idx=0;const workers=Array.from({length:Math.min(2,uniq.length)},async()=>{while(idx<uniq.length){const a=uniq[idx++];let r=null;try{r=await check(a,{force});if(!r)throw new Error(error()||'research_unavailable');if(r.identity?.isin)await window.HPOS_HALAL_STORE?.get?.({isin:r.identity.isin},{force:true});summary.processed++;if(r.state==='PASS')summary.pass++;else if(r.state==='FAIL')summary.fail++;else summary.open++;summary.results.push({key:keyOf(a),state:r.state,missingCriteria:r.missingCriteria||[],reason:r.reason||''});try{onItem?.(a,r)}catch{}}catch{summary.processed++;summary.open++;summary.errors++;summary.results.push({key:keyOf(a),state:'OPEN_REVIEW',missingCriteria:[],reason:'Prüfung technisch fehlgeschlagen.'});try{onItem?.(a,{state:'OPEN_REVIEW',error:true})}catch{}}}});await Promise.all(workers);return summary
}
function error(){return lastError}
window.HPOS_HALAL_RESEARCH=Object.freeze({resolve,check,batch,latest,error,available:()=>!!session(),endpoint:API});
setTimeout(()=>{const s=window.HPOS_STATE_SNAPSHOT?.();if(s&&session())batch([...(s.holdings||[]),...(s.watchlist||[])],{force:false,onItem:()=>document.dispatchEvent(new CustomEvent('hpos:halal-canonical'))})},3500);
})();
