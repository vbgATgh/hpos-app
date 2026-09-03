(()=>{'use strict';
// Legacy safety shim only. Watchlist membership is intentionally independent
// from canonical ISIN verification. Discovery assets may be observed while
// identity-dependent HPOS gates remain fail-closed elsewhere.
function rowValue(label){for(const r of document.querySelectorAll('#assetDetails .drow'))if(r.firstElementChild?.textContent?.trim()===label)return r.lastElementChild?.textContent?.trim()||'';return''}
function guardHolding(e){const b=e.target.closest?.('#watchToggle');if(!b)return;const status=String(rowValue('Portfolio-Status')||'').trim().toUpperCase();if(status!=='HOLDING')return;e.preventDefault();e.stopImmediatePropagation();b.textContent='Im Depot';b.disabled=true;b.setAttribute('aria-disabled','true');}
document.addEventListener('click',guardHolding,true);
})();
