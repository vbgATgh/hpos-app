(()=>{'use strict';
const KEY='hpos_halal_manual_evidence_v1';
const VALID_ISIN=/^[A-Z]{2}[A-Z0-9]{9}\d$/;
const KNOWN=['RaqabaIQ','Musaffa','Zoya','Islamicly','Other'];
const $=s=>document.querySelector(s);
const esc=v=>String(v??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function read(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch{return{}}}
function write(x){try{localStorage.setItem(KEY,JSON.stringify(x))}catch{}}
function detail(label){const row=[...document.querySelectorAll('#assetDetails .drow')].find(r=>r.firstElementChild?.textContent?.trim()===label);return row?.lastElementChild?.textContent?.trim()||''}
function current(){const isin=detail('ISIN').toUpperCase(),ticker=detail('Ticker').toUpperCase(),name=$('#assetName')?.textContent?.trim()||'';return{isin:VALID_ISIN.test(isin)?isin:'',ticker,name}}
function parse(text,provider=''){
 const t=String(text||'').replace(/\s+/g,' ').trim(),u=t.toUpperCase();
 let aa='UNRATED',providerVerdict='UNRATED';
 if(/AAOIFI\s*[:\-]?\s*(PASS|COMPLIANT)/i.test(t)||(/AAOIFI/i.test(t)&&/SHARIAH\s+COMPLIANT|SHARIA\s+COMPLIANT|COMPLIANT/i.test(t)))aa='PASS';
 if(/AAOIFI\s*[:\-]?\s*(FAIL|NON[- ]?COMPLIANT|NOT\s+COMPLIANT)/i.test(t)||(/AAOIFI/i.test(t)&&/NOT\s+SHARIAH|NON[- ]?COMPLIANT/i.test(t)))aa='FAIL';
 if(aa==='UNRATED'&&/RESULT\s*[:\-]?\s*["']?COMPLIANT/i.test(t)&&/AAOIFI/i.test(t))aa='PASS';
 if(aa==='UNRATED'&&/RESULT\s*[:\-]?\s*["']?(NON[- ]?COMPLIANT|NOT\s+COMPLIANT)/i.test(t)&&/AAOIFI/i.test(t))aa='FAIL';
 const pName=String(provider||'').toLowerCase();
 if(/SHARIAH\s+COMPLIANCE\s+STATUS[^A-Z]{0,20}(HALAL|COMPLIANT|SHARIAH[- ]COMPLIANT)/i.test(t))providerVerdict='PASS';
 if(/SHARIAH\s+COMPLIANCE\s+STATUS[^A-Z]{0,20}(HARAM|NON[- ]?COMPLIANT|NOT\s+COMPLIANT)/i.test(t))providerVerdict='FAIL';
 if(providerVerdict==='UNRATED'&&/(^|\s)RESULT\s*[:\-]?\s*["']?COMPLIANT/i.test(t))providerVerdict='PASS';
 if(providerVerdict==='UNRATED'&&/(^|\s)RESULT\s*[:\-]?\s*["']?(NON[- ]?COMPLIANT|NOT\s+COMPLIANT)/i.test(t))providerVerdict='FAIL';
 if(providerVerdict==='UNRATED'&&pName==='musaffa'&&/\bHALAL\b/i.test(t)&&/SHARIAH\s+COMPLIANCE\s+STATUS/i.test(t))providerVerdict='PASS';
 if(providerVerdict==='UNRATED'&&pName==='musaffa'&&/\bHARAM\b/i.test(t)&&/SHARIAH\s+COMPLIANCE\s+STATUS/i.test(t))providerVerdict='FAIL';
 const ratios={};
 const patterns=[
  ['debt',/(?:DEBT|INTEREST[- ]BEARING DEBT)[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/i],
  ['nca',/(?:NCA|NON[- ]COMPLIANT ASSETS|INTEREST[- ]BEARING ASSETS)[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/i],
  ['impureIncome',/(?:IMPURE INCOME|NON[- ]PERMISSIBLE INCOME|IMPERMISSIBLE REVENUE)[^0-9]{0,30}([0-9]+(?:[.,][0-9]+)?)\s*%/i]
 ];
 for(const [k,re] of patterns){const m=t.match(re);if(m)ratios[k]=Number(m[1].replace(',','.'))/100}
 return{aaofi:aa,providerVerdict,ratios,raw:t};
}
function record(){return read()[current().isin]||null}
function save(provider,text,confirmed){
 const id=current();if(!id.isin)throw new Error('ISIN fehlt');
 const p=parse(text,provider),all=read(),state=p.aaofi==='PASS'?'PASS':p.aaofi==='FAIL'?'FAIL':p.providerVerdict==='PASS'?'PASS':p.providerVerdict==='FAIL'?'FAIL':'OPEN_REVIEW';
 all[id.isin]={state,provider,standard:p.aaofi!=='UNRATED'?'AAOIFI':'PROVIDER_VERDICT',identityConfirmed:!!confirmed,isin:id.isin,ticker:id.ticker,name:id.name,rawText:String(text||'').trim(),parsed:p,createdAt:new Date().toISOString(),sourceType:'MANUAL_COPY_PASTE'};
 write(all);document.dispatchEvent(new CustomEvent('hpos:halal-manual-evidence'));return all[id.isin]
}
function ensureDialog(){
 let d=$('#manualHalalDialog');if(d)return d;
 d=document.createElement('dialog');d.id='manualHalalDialog';d.className='sheet';
 d.innerHTML='<div class="sheetHead"><div><div class="eye">Gate 1 · letzte Prüfinstanz</div><h2>Externe Evidenz</h2></div><button class="close" id="manualHalalClose">×</button></div><div class="panel"><div class="status"><span>Instrument</span><strong id="manualHalalAsset">—</strong></div><div class="status"><span>Quelle</span><select id="manualHalalProvider"><option>RaqabaIQ</option><option>Musaffa</option><option>Zoya</option><option>Islamicly</option><option>Other</option></select></div></div><textarea id="manualHalalText" class="searchInput manualEvidenceText" rows="10" placeholder="Ergebnis oder relevante Passage der externen Prüfung hier einfügen …"></textarea><label class="manualConfirm"><input id="manualHalalConfirm" type="checkbox"> Ich bestätige, dass der eingefügte Text zu genau diesem Wertpapier gehört.</label><div id="manualHalalPreview" class="notice">Noch keine Evidenz analysiert.</div><button id="manualHalalParse" class="secondary full">Evidenz prüfen</button><button id="manualHalalSave" class="primary full" disabled>Bestätigt speichern</button>';
 document.body.appendChild(d);
 $('#manualHalalClose').onclick=()=>d.close();
 $('#manualHalalParse').onclick=()=>{const p=parse($('#manualHalalText').value,$('#manualHalalProvider').value),id=current(),confirmed=$('#manualHalalConfirm').checked;$('#manualHalalPreview').innerHTML='<strong>AAOIFI:</strong> '+(p.aaofi==='PASS'?'<span class="pos">PASS</span>':p.aaofi==='FAIL'?'<span class="neg">FAIL</span>':'<span class="warn">kein eindeutiges Urteil</span>')+'<br><strong>Provider-Urteil:</strong> '+(p.providerVerdict==='PASS'?'<span class="pos">HALAL / COMPLIANT</span>':p.providerVerdict==='FAIL'?'<span class="neg">NICHT HALAL</span>':'<span class="warn">kein eindeutiges Urteil</span>')+'<br><strong>Zuordnung:</strong> '+esc(id.isin||'ISIN fehlt')+(Object.keys(p.ratios).length?'<br><strong>Erkannte Kennzahlen:</strong> '+esc(JSON.stringify(p.ratios)):'');$('#manualHalalSave').disabled=!confirmed||!id.isin||!$('#manualHalalText').value.trim()};
 $('#manualHalalConfirm').onchange=()=>$('#manualHalalParse').click();
 $('#manualHalalSave').onclick=()=>{try{save($('#manualHalalProvider').value,$('#manualHalalText').value,$('#manualHalalConfirm').checked);d.close()}catch(e){$('#manualHalalPreview').textContent=String(e.message||e)}};
 return d
}
function open(){const d=ensureDialog(),id=current();$('#manualHalalAsset').textContent=(id.name||id.ticker)+' · '+(id.isin||'ISIN fehlt');$('#manualHalalText').value='';$('#manualHalalConfirm').checked=false;$('#manualHalalPreview').textContent='Noch keine Evidenz analysiert.';$('#manualHalalSave').disabled=true;d.showModal()}
document.addEventListener('click',e=>{if(e.target.closest('#addManualHalalEvidence')){e.preventDefault();open()}},true);
window.HPOS_HALAL_MANUAL=Object.freeze({record,open,parse,save,knownProviders:KNOWN});
})();
