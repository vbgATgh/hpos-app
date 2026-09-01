(()=>{'use strict';
const WATCH_KEY='hpos_watchlist_v1';
let catalog=null;
const up=v=>String(v||'').trim().toUpperCase();
function validIsin(v){v=up(v);if(!/^[A-Z]{2}[A-Z0-9]{9}\d$/.test(v))return false;let s='';for(const c of v)s+=/[A-Z]/.test(c)?String(c.charCodeAt(0)-55):c;let sum=0,alt=false;for(let i=s.length-1;i>=0;i--){let n=Number(s[i]);if(alt){n*=2;if(n>9)n-=9}sum+=n;alt=!alt}return sum%10===0}
function readWatch(){try{const a=JSON.parse(localStorage.getItem(WATCH_KEY)||'[]');return Array.isArray(a)?a:[]}catch{return[]}}
function rowValue(label){for(const r of document.querySelectorAll('#assetDetails .drow'))if(r.firstElementChild?.textContent?.trim()===label)return r.lastElementChild?.textContent?.trim()||'';return''}
async function loadCatalog(){if(catalog)return catalog;try{const r=await fetch('../config/market_sources.json',{cache:'no-store'});if(r.ok){const d=await r.json();catalog=(d.assets||[]).filter(x=>x.enabled!==false&&validIsin(x.isin))}}catch{}return catalog||[]}
function writeVerified(entry){const isin=up(entry.isin);if(!validIsin(isin))return false;const w=readWatch().filter(x=>up(x.isin)!==isin);w.push({name:String(entry.name||entry.ticker||isin),isin,ticker:up(entry.ticker),source:entry.source||'MARKET_CONFIG',verified:true,addedAt:new Date().toISOString()});localStorage.setItem(WATCH_KEY,JSON.stringify(w));return true}
async function guard(e){const b=e.target.closest?.('#watchToggle');if(!b)return;const status=up(rowValue('Portfolio-Status'));
if(status==='HOLDING'){e.preventDefault();e.stopImmediatePropagation();b.textContent='Im Depot';b.disabled=true;return}
if(status==='WATCHLIST')return;
const isin=up(rowValue('ISIN')),ticker=up(rowValue('Ticker')),name=document.querySelector('#assetName')?.textContent?.trim()||ticker||isin;
if(!validIsin(isin)){e.preventDefault();e.stopImmediatePropagation();b.textContent='ISIN nicht verifiziert';b.disabled=true;return}
const c=await loadCatalog(),m=c.find(x=>up(x.isin)===isin);
if(!m){e.preventDefault();e.stopImmediatePropagation();b.textContent='Verifikation erforderlich';b.disabled=true;return}
e.preventDefault();e.stopImmediatePropagation();if(writeVerified({name,isin,ticker:ticker||m.symbol,source:'MARKET_CONFIG'})){b.textContent='✓ Watchlist';setTimeout(()=>location.reload(),250)}
}
document.addEventListener('click',guard,true);
})();
