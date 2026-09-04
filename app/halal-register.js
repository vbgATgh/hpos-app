(()=>{'use strict';
const REG='../data/halal_evidence_registry.json';
let registry=null,loading=null;
const uiState=s=>s==='PASS'?'HALALKONFORM':s==='FAIL'?'NICHT HALALKONFORM':s==='OPEN_REVIEW'?'PRÜFUNG OFFEN':'UNGEPRÜFT';
const cls=s=>s==='PASS'?'pos':s==='FAIL'?'neg':'warn';
async function load(){if(registry)return registry;if(loading)return loading;loading=fetch(REG,{cache:'no-store'}).then(r=>r.ok?r.json():{assets:{}}).catch(()=>({assets:{}})).then(x=>registry=x);return loading}
function evidenceFor(a){const isin=String(a?.isin||'').toUpperCase();return registry?.assets?.[isin]||null}
async function syncRows(){
 await load();
 document.querySelectorAll('.row[data-asset]').forEach(row=>{
   let id='';try{id=decodeURIComponent(row.dataset.asset||'').toUpperCase()}catch{}
   const e=registry?.assets?.[id]; if(!e)return;
   const small=row.querySelector('span:nth-child(2) small'); if(!small)return;
   const status=uiState(e.state), parts=small.textContent.split(' · ');
   if(parts.length>1)small.textContent=parts[0]+' · '+status; else small.textContent=(small.textContent||id)+' · '+status;
   small.classList.remove('pos','neg','warn');small.classList.add(cls(e.state));
 });
}
async function renderRegister(){
 await load();
 const box=document.querySelector('#moduleContent');if(!box||document.querySelector('#moduleTitle')?.textContent!=='Halal Register')return;
 const s=window.HPOS_STATE_SNAPSHOT?.()||{holdings:[],watchlist:[]};
 const all=[...s.holdings.map(x=>({...x,scope:'DEPOT'})),...s.watchlist.filter(w=>!s.holdings.some(h=>String(h.isin||h.ticker).toUpperCase()===String(w.isin||w.ticker).toUpperCase())).map(x=>({...x,scope:'WATCHLIST'}))];
 const counts={PASS:0,FAIL:0,OPEN_REVIEW:0,UNKNOWN:0};
 all.forEach(a=>{const e=evidenceFor(a),k=e?.state||'UNKNOWN';counts[k]=(counts[k]||0)+1});
 const rows=all.map(a=>{const e=evidenceFor(a),state=e?.state||'UNKNOWN';return '<button class="row halalRegisterRow" data-halal-asset="'+encodeURIComponent(String(a.isin||a.ticker||a.name))+'"><span class="avatar">'+String(a.name||'?').split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase()+'</span><span><strong>'+escapeHtml(a.name||a.ticker||a.isin)+'</strong><small>'+escapeHtml(a.scope)+' · '+escapeHtml(a.isin||a.ticker||'Identität offen')+'</small></span><span class="right '+cls(state)+'"><strong>'+uiState(state)+'</strong></span></button>'}).join('');
 box.innerHTML='<div class="cards"><div class="card"><small>Halalkonform</small><strong class="pos">'+counts.PASS+'</strong></div><div class="card"><small>Prüfung offen</small><strong class="warn">'+(counts.OPEN_REVIEW+counts.UNKNOWN)+'</strong></div></div><div class="panel spaced"><div class="labelWithInfo"><strong>Automatische Prüfliste</strong><button type="button" class="infoBtn" data-info-eye="Halal Register" data-info-title="Automatische Halal-Prüfung" data-info-html="Depot- und Watchlist-Werte werden automatisch in die Prüfliste aufgenommen. HPOS verwendet ausschließlich kostenlose Quellen und eigene transparente Regeln. Eine fehlende oder unvollständige Datenlage bleibt PRÜFUNG OFFEN und wird niemals als HALALKONFORM geraten." aria-label="Automatische Prüfung erklären">i</button></div><p class="sub">Depot + Watchlist · keine kostenpflichtigen Screening-APIs</p></div><div class="section"><div class="sectionHead"><h2>Prüfstatus</h2><span class="eye">'+all.length+' Werte</span></div><div class="list">'+(rows||'<div class="empty">Keine Werte vorhanden.</div>')+'</div></div>';
 box.querySelectorAll('.halalRegisterRow').forEach(b=>b.onclick=()=>{const id=decodeURIComponent(b.dataset.halalAsset||'');const match=[...s.holdings,...s.watchlist].find(a=>String(a.isin||a.ticker||a.name).toUpperCase()===id.toUpperCase());if(match){window.HPOS_OPEN_ASSET?.(match);}})
}
function escapeHtml(v){return String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]))}
document.addEventListener('click',e=>{if(e.target.closest('.module[data-module="halal"]'))setTimeout(renderRegister,20);setTimeout(syncRows,80)},true);
new MutationObserver(()=>{clearTimeout(syncRows.t);syncRows.t=setTimeout(syncRows,60)}).observe(document.body,{subtree:true,childList:true});
setTimeout(syncRows,700);
window.HPOS_HALAL_REGISTER=Object.freeze({refresh:async()=>{registry=null;loading=null;await load();await syncRows();await renderRegister()}});
})();
