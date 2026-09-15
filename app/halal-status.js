(()=>{'use strict';
const STATES=new Set(['PASS','FAIL','OPEN_REVIEW']);
function stateOf(x){const state=String(x?.state||'').toUpperCase();return STATES.has(state)?state:''}
function resolve({canonical,curated,automatic,manual,imported}={}){
 for(const [source,value] of [['CANONICAL_BACKEND',canonical],['CURATED_REGISTRY',curated],['LOCAL_AUTOMATIC_FALLBACK',automatic],['MANUAL_CONFIRMED_FALLBACK',manual]]){
   const state=stateOf(value);if(state)return{state,source,value};
 }
 const state=String(imported||'').toUpperCase();
 return{state:STATES.has(state)?state:'UNKNOWN',source:STATES.has(state)?'IMPORTED_FALLBACK':'NONE',value:null};
}
window.HPOS_HALAL_STATUS=Object.freeze({resolve,stateOf});
})();
