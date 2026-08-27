/* HPOS Alpha 4.3.3 – Privacy Boundary P0
   - private portfolio/strategy/halal data stay in local browser state
   - encrypted local-first backup is the default export path
   - AI handoff requires an explicit private-data boundary acknowledgement
   - public news scope is mapped to holdings/watchlist only from local state
*/
(() => {
'use strict';
const VERSION433='1.3.0-alpha.4.3.3';
const PRIVACY_BACKUP_FORMAT='HPOS_ENCRYPTED_BACKUP_V1';
const PRIVACY_KDF_ITERATIONS=250000;

function css433(){
  if($('#alpha433css'))return;
  const s=document.createElement('style');s.id='alpha433css';s.textContent=`
  .privacy-grid433{display:grid;gap:10px}.privacy-ok433{border-left:4px solid var(--green)}
  .privacy-boundary433{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin-top:12px}
  .privacy-boundary433>div{background:rgba(255,255,255,.025);border:1px solid var(--line);border-radius:11px;padding:10px}
  .privacy-boundary433 small{display:block;color:var(--muted);font-size:11px}.privacy-boundary433 strong{display:block;margin-top:4px;font-size:13px}
  @media(min-width:760px){.privacy-boundary433{grid-template-columns:repeat(4,minmax(0,1fr))}}
  `;document.head.appendChild(s);
}

function bytesToB64433(bytes){
  let out='';const chunk=0x8000;
  for(let i=0;i<bytes.length;i+=chunk)out+=String.fromCharCode(...bytes.subarray(i,i+chunk));
  return btoa(out);
}
function b64ToBytes433(text){
  const raw=atob(text),out=new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++)out[i]=raw.charCodeAt(i);
  return out;
}
async function key433(passphrase,salt,usage){
  const base=await crypto.subtle.importKey('raw',new TextEncoder().encode(passphrase),'PBKDF2',false,['deriveKey']);
  return crypto.subtle.deriveKey({name:'PBKDF2',hash:'SHA-256',salt,iterations:PRIVACY_KDF_ITERATIONS},base,{name:'AES-GCM',length:256},false,[usage]);
}
async function encryptBackup433(backup,passphrase){
  if(!crypto?.subtle)throw new Error('Web-Crypto ist in diesem Browser nicht verfügbar.');
  if(String(passphrase||'').length<10)throw new Error('Backup-Passphrase muss mindestens 10 Zeichen lang sein.');
  const salt=crypto.getRandomValues(new Uint8Array(16)),iv=crypto.getRandomValues(new Uint8Array(12));
  const k=await key433(passphrase,salt,'encrypt');
  const plain=new TextEncoder().encode(JSON.stringify(backup));
  const cipher=new Uint8Array(await crypto.subtle.encrypt({name:'AES-GCM',iv},k,plain));
  return {
    format:PRIVACY_BACKUP_FORMAT,
    version:1,
    createdAt:new Date().toISOString(),
    appVersion:VERSION433,
    kdf:{name:'PBKDF2',hash:'SHA-256',iterations:PRIVACY_KDF_ITERATIONS,salt:bytesToB64433(salt)},
    cipher:{name:'AES-GCM',iv:bytesToB64433(iv),data:bytesToB64433(cipher)},
    privacy:'LOCAL_FIRST_ENCRYPTED'
  };
}
async function decryptBackup433(envelope,passphrase){
  if(envelope?.format!==PRIVACY_BACKUP_FORMAT)throw new Error('Kein verschlüsseltes HPOS-Backup v1.');
  if(envelope?.kdf?.name!=='PBKDF2'||envelope?.kdf?.hash!=='SHA-256'||envelope?.cipher?.name!=='AES-GCM')throw new Error('Backup verwendet ein nicht unterstütztes Kryptoprofil.');
  const iterations=Number(envelope.kdf.iterations);
  if(iterations!==PRIVACY_KDF_ITERATIONS)throw new Error('Backup-KDF entspricht nicht dem freigegebenen HPOS-Profil.');
  const salt=b64ToBytes433(envelope.kdf.salt),iv=b64ToBytes433(envelope.cipher.iv),data=b64ToBytes433(envelope.cipher.data);
  const k=await key433(passphrase,salt,'decrypt');
  try{
    const plain=await crypto.subtle.decrypt({name:'AES-GCM',iv},k,data);
    return JSON.parse(new TextDecoder().decode(plain));
  }catch(e){throw new Error('Entschlüsselung fehlgeschlagen. Passphrase oder Datei ist falsch.');}
}
async function exportEncrypted433(){
  const p1=prompt('Passphrase für das verschlüsselte HPOS-Backup (mind. 10 Zeichen):');
  if(p1===null)return;
  const p2=prompt('Passphrase wiederholen:');
  if(p2===null)return;
  if(p1!==p2)throw new Error('Passphrasen stimmen nicht überein.');
  const envelope=await encryptBackup433(exportBackup(state),p1);
  downloadText(`HPOS_Backup_${isoDate()}.hpos-backup.enc.json`,JSON.stringify(envelope,null,2),'application/json');
  toast('Verschlüsseltes Backup erstellt');
}
async function importPrivate433(file){
  const parsed=JSON.parse(await file.text());
  let payload=parsed;
  if(parsed?.format===PRIVACY_BACKUP_FORMAT){
    const pass=prompt('Passphrase für dieses HPOS-Backup:');
    if(pass===null)return;
    payload=await decryptBackup433(parsed,pass);
  }else{
    const legacy=confirm('Dies ist kein verschlüsseltes Alpha-4.3.3-Backup. Legacy-JSON trotzdem lokal prüfen und importieren?');
    if(!legacy)return;
  }
  const imp=importBackup(payload);
  if(!imp.ok)throw new Error((imp.errors||['Backup ungültig.']).join(' | '));
  if(!confirm('Aktuellen lokalen HPOS-Stand durch dieses geprüfte Backup ersetzen?'))return;
  state=imp.state;persist();recompute();toast('Backup lokal wiederhergestellt');route('dashboard');
}

renderData=function(){
  css433();
  $('#main').innerHTML=`<div class="section-head"><div><h1>Daten & Privacy</h1><p>Local-first · kein privater Portfolio-State im öffentlichen Repository</p></div><span class="badge good">P0 aktiv</span></div><div class="stack">
  <div class="card privacy-ok433"><div class="top"><div><h3>Privacy Boundary</h3><p>Private Investmentdaten bleiben im Browser und werden nicht aus einem öffentlichen Depot-Snapshot geladen.</p></div><span class="badge good">LOCAL ONLY</span></div><div class="privacy-boundary433"><div><small>Stückzahlen / Einstand</small><strong>lokal</strong></div><div><small>Broker / Cash / Journal</small><strong>lokal</strong></div><div><small>Strategie / Halal-Historie</small><strong>lokal</strong></div><div><small>Markt / News / Quellen</small><strong>öffentlich</strong></div></div></div>
  <div class="card"><h3>Verschlüsseltes Backup</h3><p>Portfolio, Strategie, Halal-Prüfungen und Watchlist werden clientseitig mit AES-GCM verschlüsselt. Die Passphrase verlässt diesen Browser nicht und wird nicht gespeichert.</p><div class="action-row"><button class="btn primary" id="backupExport433">Verschlüsseltes Backup erstellen</button><label class="btn" for="backupImport433">Backup wiederherstellen</label><input id="backupImport433" type="file" accept="application/json,.json" class="hide"></div><div class="rule-source">PBKDF2-SHA256 · 250.000 Iterationen · AES-256-GCM. Legacy-JSON kann weiterhin bewusst importiert, aber nicht mehr unverschlüsselt exportiert werden.</div></div>
  <div class="card"><h3>Lokale Daten</h3><p>Schema v${state.appMeta.schemaVersion} · App ${esc(VERSION433)}</p><div class="action-row"><button class="btn danger" id="resetLocal433">Daten zurücksetzen</button></div></div>
  <div class="card"><h3>Datenstand</h3>${renderDataStrip()}</div></div>`;
  $('#backupExport433').onclick=async()=>{try{await exportEncrypted433();}catch(e){toast(e.message)}};
  $('#backupImport433').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;try{await importPrivate433(f)}catch(err){toast(`Import abgebrochen: ${err.message}`)}finally{e.target.value=''}};
  $('#resetLocal433').onclick=()=>{if(confirm('Wirklich alle lokalen HPOS-Daten zurücksetzen? Vorher verschlüsseltes Backup empfohlen.')){state=createEmptyState();persist();previousSnapshot=null;recompute();toast('Lokaler Stand zurückgesetzt');route('dashboard')}};
  bindDataStatus();
};

openAiHandoff=function(){
  recompute();
  openModal('Privacy Boundary · ChatGPT',`<div class="stack"><div class="notice warn"><strong>Bewusste externe Übergabe</strong><p>Der Analyseauftrag kann private Portfolio-, Strategie- und Halal-Daten enthalten. HPOS sendet nichts automatisch. Erst der nächste Schritt erzeugt den kopierbaren Text.</p></div><div class="action-row"><button class="btn" id="aiCancel433">Abbrechen</button><button class="btn primary" id="aiContinue433">Privaten Analyseauftrag erzeugen</button></div></div>`);
  $('#aiCancel433').onclick=closeModal;
  $('#aiContinue433').onclick=()=>{
    const h=buildAiHandoff(state,snapshot,alerts);
    openModal('Analyseauftrag',`<div class="stack"><div class="notice info">Nur durch bewusstes Kopieren verlässt der Text HPOS.</div>${h.missing.length?`<div class="notice warn"><strong>Fehlend / veraltet</strong><ul>${h.missing.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></div>`:'<div class="notice info">Keine fehlenden Daten vom Handoff-Builder erkannt.</div>'}<div class="action-row"><button class="btn primary" id="copyPrompt433">Analyseauftrag kopieren</button></div></div>`);
    $('#copyPrompt433').onclick=async()=>{try{await navigator.clipboard.writeText(h.prompt);toast('Analyseauftrag kopiert');closeModal()}catch(e){openModal('Analyseauftrag',`<div class="field"><textarea style="min-height:55vh">${esc(h.prompt)}</textarea></div>`)}};
  };
};

window.HPOSPrivacy433={format:PRIVACY_BACKUP_FORMAT,encryptBackup:encryptBackup433,decryptBackup:decryptBackup433};
css433();
})();
