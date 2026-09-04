(()=>{'use strict';
const API=(window.HPOS_RUNTIME?.integration?.baseUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api';
const KEY='hpos_halal_provider_cache_v1',TTL=30*24*60*60*1000;
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(x){try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}}
function k(a){return String(a?.isin||a?.ticker||a?.symbol||a?.name||'').toUpperCase()}
function symbol(a){return String(a?.ticker||a?.symbol||'').trim().toUpperCase()}
async function status(){try{const r=await fetch(API+'/api/halal/provider/status',{cache:'no-store'});if(!r.ok)return{configured:false,reason:'http_'+r.status};return await r.json()}catch{return{configured:false,reason:'unreachable'}}}
async function screen(a,{force=false}={}){
 const id=k(a),sym=symbol(a),all=read(),cached=all[id],age=cached?.checkedAt?Date.now()-Date.parse(cached.checkedAt):Infinity;
 if(!force&&cached&&age<TTL)return cached;
 if(!sym)return{provider:'HALAL_TERMINAL',verdict:'UNRATED',reason:'symbol_missing',checkedAt:new Date().toISOString()};
 try{
   const r=await fetch(API+'/api/halal/screen?symbol='+encodeURIComponent(sym),{cache:'no-store'});
   const d=await r.json().catch(()=>({}));
   if(!r.ok){
     const x={provider:'HALAL_TERMINAL',symbol:sym,verdict:'UNRATED',reason:String(d?.error||'provider_http_'+r.status),checkedAt:new Date().toISOString(),freeOnly:true};
     if(!['halal_provider_not_configured','halal_free_quota_exhausted'].includes(x.reason)){all[id]=x;write(all)}
     return x;
   }
   const x={...d,isin:String(a?.isin||'').toUpperCase(),checkedAt:d.checkedAt||new Date().toISOString()};
   all[id]=x;write(all);return x;
 }catch{return{provider:'HALAL_TERMINAL',symbol:sym,verdict:'UNRATED',reason:'provider_unreachable',checkedAt:new Date().toISOString(),freeOnly:true}}
}
function cached(a){return read()[k(a)]||null}
function label(x){if(!x)return'NICHT GEPRÜFT';if(x.verdict==='COMPLIANT')return'HALALKONFORM';if(x.verdict==='NON_COMPLIANT')return'NICHT HALALKONFORM';if(x.verdict==='QUESTIONABLE')return'PRÜFUNG OFFEN';return'NICHT GEPRÜFT'}
window.HPOS_HALAL_PROVIDER=Object.freeze({status,screen,cached,label,provider:'HALAL_TERMINAL',freeOnly:true});
})();
