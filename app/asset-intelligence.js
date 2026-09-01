(()=>{'use strict';
const STATE_KEYS=['hpos_parqet_validated','hpos_parqet_previous'];
const API=(window.HPOS_RUNTIME?.integration?.baseUrl)||'https://moxyhjfbrmsnphikxqje.supabase.co/functions/v1/hpos-api';
const $=s=>document.querySelector(s);
const num=v=>Number.isFinite(Number(v))?Number(v):0;
const eur=n=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(num(n));
const pct=n=>`${n>=0?'+':''}${num(n).toFixed(1)}%`;
let marketConfig=null,token=0;
function readState(){for(const k of STATE_KEYS){try{const v=JSON.parse(localStorage.getItem(k)||'null');if(v&&Array.isArray(v.holdings)&&v.holdings.length)return v}catch{}}return null}
async function config(){if(marketConfig)return marketConfig;try{const r=await fetch('../config/market_sources.json',{cache:'no-store'});if(r.ok)marketConfig=await r.json()}catch{}return marketConfig||{assets:[]}}
function activeIsin(){const rows=[...document.querySelectorAll('#assetDetails .drow')];const row=rows.find(r=>r.firstElementChild?.textContent?.trim()==='ISIN');return row?.lastElementChild?.textContent?.trim().toUpperCase()||''}
function findHolding(state,isin){return state?.holdings?.find(h=>String(h.isin||'').toUpperCase()===isin)||null}
function total(state){return (state?.holdings||[]).reduce((s,h)=>s+num(h.value??h.currentValue??h.marketValue),0)+num(state?.cash)}
function mount(){let section=$('#assetIntelligenceSection');if(section)return section;const evidence=$('#assetEvidence')?.closest('.section');if(!evidence)return null;section=document.createElement('div');section.className='section';section.id='assetIntelligenceSection';section.innerHTML='<h2>Investment-Kennzahlen</h2><div id="assetIntelligence" class="detail"><div class="empty">Kennzahlen werden geprüft …</div></div>';evidence.insertAdjacentElement('afterend',section);return section}
function row(label,value,cls=''){return `<div class="drow"><span>${label}</span><strong${cls?` class="${cls}"`:''}>${value}</strong></div>`}
async function quote(symbol){if(!symbol)return null;try{const r=await fetch(`${API}?t=${encodeURIComponent(symbol)}&s=yahoo`,{cache:'no-store'});if(!r.ok)return null;return await r.json()}catch{return null}}
function metricRows(q){if(!q)return'';const out=[];const cap=num(q.marketCap);if(cap>0)out.push(row('Marktkapitalisierung',new Intl.NumberFormat('de-DE',{notation:'compact',maximumFractionDigits:1}).format(cap)+' '+String(q.currency||'')));
const pe=num(q.trailingPE||q.forwardPE);if(pe>0)out.push(row(q.trailingPE?'KGV (TTM)':'KGV (Forward)',pe.toFixed(1)));
let dy=num(q.dividendYield);if(dy>0){if(dy<1)dy*=100;out.push(row('Dividendenrendite',dy.toFixed(2)+' %'))}
const hi=num(q.fiftyTwoWeekHigh),lo=num(q.fiftyTwoWeekLow);if(hi>0)out.push(row('52W Hoch',hi.toLocaleString('de-DE',{maximumFractionDigits:2})+' '+String(q.currency||'')));if(lo>0)out.push(row('52W Tief',lo.toLocaleString('de-DE',{maximumFractionDigits:2})+' '+String(q.currency||'')));
return out.join('')}
function enforceWatchSemantics(h){const b=$('#watchToggle');if(!b)return;if(h){b.disabled=true;b.textContent='Im Depot';b.setAttribute('aria-disabled','true');b.title='Depotpositionen werden nicht zusätzlich in der Watchlist geführt.'}else{b.disabled=false;b.removeAttribute('aria-disabled');b.title=''}}
async function render(){if(!$('#asset')?.classList.contains('on'))return;const my=++token,section=mount();if(!section)return;const isin=activeIsin();if(!isin)return;const state=readState(),h=findHolding(state,isin),cfg=await config();if(my!==token)return;enforceWatchSemantics(h);const m=(cfg.assets||[]).find(x=>String(x.isin||'').toUpperCase()===isin)||null;const box=$('#assetIntelligence');if(!box)return;let html='';if(h){const value=num(h.value??h.currentValue??h.marketValue),shares=num(h.shares??h.quantity??h.qty),avg=num(h.avg??h.avgPrice??h.averagePrice),price=num(h.price??h.currentPrice??h.lastPrice),portfolio=total(state),weight=portfolio>0?value/portfolio*100:0;html+=row('Depotgewicht',weight.toFixed(1)+' %');if(avg>0&&shares>0)html+=row('Investiertes Kapital',eur(avg*shares));if(avg>0&&price>0&&shares>0){const gv=(price-avg)*shares,performance=(price/avg-1)*100;html+=row('G/V absolut',eur(gv),gv>=0?'pos':'neg');html+=row('G/V seit Einstand',pct(performance),performance>=0?'pos':'neg')}}
if(m){const policy=String(m.quotePolicy||'LIVE_GUARDED');html+=row('Kursmodus',policy==='SNAPSHOT_ONLY'?'Parqet Snapshot geschützt':'Live/Last mit Plausibilitätsfilter');if(m.symbol)html+=row('Markt-Symbol',m.symbol);if(m.expectedCurrency)html+=row('Erwartete Kurswährung',m.expectedCurrency)}
if(state?.savedAt)html+=row('Bestandsstand',new Date(state.savedAt).toLocaleString('de-DE'));
box.innerHTML=html||'<div class="empty">Keine zusätzlichen validierten Kennzahlen vorhanden.</div>';
if(m?.quotePolicy!=='SNAPSHOT_ONLY'&&m?.symbol){const q=await quote(m.symbol);if(my!==token)return;const extra=metricRows(q);if(extra)box.insertAdjacentHTML('beforeend',extra)} }
const observer=new MutationObserver(()=>{if($('#asset')?.classList.contains('on'))setTimeout(render,0)});observer.observe(document.body,{subtree:true,attributes:true,attributeFilter:['class'],childList:true});document.addEventListener('click',()=>setTimeout(render,80),true);setTimeout(render,700);
})();
