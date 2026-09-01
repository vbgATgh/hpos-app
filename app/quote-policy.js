(()=>{'use strict';
const originalFetch=window.fetch.bind(window);
const runtime=window.HPOS_RUNTIME||{};
const integration=runtime.integration||{};
const LEGACY_HOST=integration.legacyHost||'hpos-proxy.vbginbox.workers.dev';
const ACTIVE_BASE=integration.baseUrl||'';
const BLOCKED=new Set(['ISWD.L','SKUK.AS','ISDE.L']);
const EXPECTED={
'NOVO-B.CO':'DKK','ABT':'USD','FPE3.DE':'EUR','NOVN.SW':'CHF','CRW.L':'GBp','WM':'USD','MKC':'USD','BVI.PA':'EUR','AI.PA':'EUR','MDT':'USD','RIO.L':'GBp','MRK':'USD','REL.L':'GBp','FOUR.L':'GBp','CJ.TO':'CAD','SIS.TO':'CAD'
};
function parsed(input){try{return new URL(typeof input==='string'?input:input.url,location.href)}catch{return null}}
function rewriteLegacy(input){const u=parsed(input);if(!u||u.hostname!==LEGACY_HOST)return input;if(integration.enabled===false)return null;if(!ACTIVE_BASE)return input;try{const target=new URL(ACTIVE_BASE);u.protocol=target.protocol;u.host=target.host;u.pathname=target.pathname.endsWith('/')?target.pathname:target.pathname+'/';return u.toString()}catch{return input}}
function symbolFrom(url){const u=parsed(url);if(!u)return'';const activeHost=(()=>{try{return new URL(ACTIVE_BASE).hostname}catch{return''}})();if((u.hostname===LEGACY_HOST||u.hostname===activeHost)&&u.searchParams.get('s')==='yahoo')return String(u.searchParams.get('t')||'').toUpperCase();return''}
window.fetch=async function(input,init){const routed=rewriteLegacy(input);if(routed===null)return new Response(JSON.stringify({blocked:true,reason:'INTEGRATION_DISABLED'}),{status:503,headers:{'Content-Type':'application/json'}});const symbol=symbolFrom(routed);if(symbol&&BLOCKED.has(symbol))return new Response(JSON.stringify({blocked:true,reason:'SNAPSHOT_ONLY'}),{status:409,headers:{'Content-Type':'application/json'}});const response=await originalFetch(routed,init);if(!symbol||!response.ok||!EXPECTED[symbol])return response;try{const clone=response.clone(),data=await clone.json(),actual=String(data?.currency||'').trim();if(actual&&actual!==EXPECTED[symbol])return new Response(JSON.stringify({blocked:true,reason:'CURRENCY_MISMATCH',expected:EXPECTED[symbol],actual}),{status:409,headers:{'Content-Type':'application/json'}})}catch{}
return response};
})();
