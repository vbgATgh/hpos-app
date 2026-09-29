/* HPOS v8.7.73 - private broker overrides, KPI provenance and discrepancy journal */
(()=>{'use strict';
const OVERRIDE_KEY='hpos_broker_overrides_v1';
const DISCREPANCY_KEY='hpos_data_discrepancies_v1';
const LEGACY_CRANEWARE_KEY='hpos_craneware_override_v1';
const CRANEWARE_ISIN='GB00B2425G68';
const ALLOWED_FIELDS=new Set(['shares','currentPrice','currentValue','avgEntryPrice','broker']);
const FIELD_MAP={price:'currentPrice',value:'currentValue',avg:'avgEntryPrice',purchasePrice:'avgEntryPrice'};
const FIELD_TO_HOLDING={shares:'shares',currentPrice:'price',currentValue:'value',avgEntryPrice:'avg',broker:'broker'};
const num=v=>Number.isFinite(Number(v))?Number(v):null;
const iso=v=>{const n=Date.parse(v);return Number.isFinite(n)?new Date(n).toISOString():null};
const norm=v=>String(v??'').trim().toUpperCase().replace(/[^A-Z0-9]/g,'');
function read(key,fallback){try{const v=JSON.parse(localStorage.getItem(key)||'null');return v??fallback}catch{return fallback}}
function write(key,value){localStorage.setItem(key,JSON.stringify(value));return value}
function fieldName(v){const raw=String(v||'');return FIELD_MAP[raw]||raw}
function validValue(field,value){if(field==='broker')return Boolean(String(value||'').trim());const n=num(value);return n!==null&&n>0}
function normalizeOverride(raw){
  const field=fieldName(raw?.field),confirmedAt=iso(raw?.confirmedAt),isin=String(raw?.isin||'').trim().toUpperCase(),assetKey=String(raw?.assetKey||isin||'').trim().toUpperCase();
  if(!assetKey||!confirmedAt||!ALLOWED_FIELDS.has(field)||!validValue(field,raw?.value))return null;
  const value=field==='broker'?String(raw.value).trim().toUpperCase():Number(raw.value);
  return{id:String(raw.id||`${assetKey}:${field}:${confirmedAt}`),assetKey,isin,field,value,source:['BROKER_CONFIRMED','USER_CONFIRMED'].includes(String(raw.source||'').toUpperCase())?String(raw.source).toUpperCase():'USER_CONFIRMED',broker:raw.broker?String(raw.broker).trim().toUpperCase():null,confirmedAt,expiresAt:iso(raw.expiresAt||raw.expiresWhen),expiryPolicy:String(raw.expiryPolicy||'SOURCE_NEWER').toUpperCase(),reason:String(raw.reason||'').trim()||null,evidenceRef:String(raw.evidenceRef||'').trim()||null};
}
function migrateLegacyCraneware(){
  const legacy=read(LEGACY_CRANEWARE_KEY,null);if(!legacy)return;
  const confirmedAt=legacy.confirmedAt||legacy.asOf;if(!iso(confirmedAt))return;
  const candidates=[['shares',legacy.shares],['currentPrice',legacy.currentPrice??legacy.price],['currentValue',legacy.currentValue??legacy.value],['avgEntryPrice',legacy.avgEntryPrice??legacy.avg]];
  for(const [field,value] of candidates)if(validValue(field,value))setOverride({assetKey:'CRANEWARE',isin:CRANEWARE_ISIN,field,value,confirmedAt,source:legacy.source||'USER_CONFIRMED',broker:legacy.broker||null,reason:legacy.reason||'Migrierte Craneware-Brokerkorrektur',evidenceRef:legacy.evidenceRef||null});
  localStorage.removeItem(LEGACY_CRANEWARE_KEY);
}
function listOverrides(){const rank={BROKER_CONFIRMED:2,USER_CONFIRMED:1};return read(OVERRIDE_KEY,[]).map(normalizeOverride).filter(Boolean).sort((a,b)=>(rank[b.source]-rank[a.source])||b.confirmedAt.localeCompare(a.confirmedAt))}
function setOverride(input){const next=normalizeOverride(input);if(!next)throw new Error('Ungültiger Broker-Override');const rows=listOverrides().filter(x=>x.id!==next.id&&!(x.assetKey===next.assetKey&&x.field===next.field&&x.confirmedAt===next.confirmedAt));rows.push(next);const rank={BROKER_CONFIRMED:2,USER_CONFIRMED:1};rows.sort((a,b)=>(rank[b.source]-rank[a.source])||b.confirmedAt.localeCompare(a.confirmedAt));write(OVERRIDE_KEY,rows.slice(0,200));return next}
function removeOverride(id){const before=listOverrides(),after=before.filter(x=>x.id!==id);write(OVERRIDE_KEY,after);return before.length!==after.length}
function matches(o,h){const ids=[norm(h?.assetKey),norm(h?.isin),norm(h?.ticker),norm(h?.name)].filter(Boolean);return ids.includes(norm(o.assetKey))||(o.isin&&ids.includes(norm(o.isin)))}
function active(o,fieldMeta){const now=Date.now(),expires=o.expiresAt?Date.parse(o.expiresAt):Infinity;if(expires<=now)return false;const kind=String(fieldMeta?.source||'').toUpperCase();if(kind.includes('MARKET_DATA')||kind.includes('YAHOO'))return true;const source=Date.parse(fieldMeta?.asOf||0),confirmed=Date.parse(o.confirmedAt);return !(o.expiryPolicy==='SOURCE_NEWER'&&Number.isFinite(source)&&source>confirmed)}
function materiallyDifferent(a,b){if(typeof a==='string'||typeof b==='string')return String(a)!==String(b);const x=num(a),y=num(b);if(x===null||y===null)return x!==y;return Math.abs(x-y)>Math.max(.005,Math.abs(x)*.0001)}
function appendDiscrepancy(entry){
  const rows=read(DISCREPANCY_KEY,[]),key=[entry.assetKey,entry.field,entry.overrideConfirmedAt,entry.sourceAsOf||''].join('|'),existing=rows.find(x=>x.key===key);
  if(existing){existing.lastSeenAt=entry.observedAt;existing.occurrences=Number(existing.occurrences||1)+1;existing.sourceValue=entry.sourceValue;existing.overrideValue=entry.overrideValue}else rows.unshift({key,occurrences:1,...entry,lastSeenAt:entry.observedAt});
  write(DISCREPANCY_KEY,rows.slice(0,250));
}
function applyHolding(input,{sourceAsOf=null,source='PARQET'}={}){
  const h={...input,provenance:{...(input?.provenance||{})}},observedAt=new Date().toISOString(),selected=new Map();
  for(const o of listOverrides()){const fieldMeta=h.provenance?.[o.field]||null;if(matches(o,h)&&active(o,fieldMeta)&&!selected.has(o.field))selected.set(o.field,o)}
  for(const field of ALLOWED_FIELDS){const target=FIELD_TO_HOLDING[field],base=h[target];if(!h.provenance[field])h.provenance[field]={source,asOf:sourceAsOf||null,state:sourceAsOf?'CURRENT':'UNKNOWN'};const o=selected.get(field);if(!o)continue;if(materiallyDifferent(base,o.value))appendDiscrepancy({observedAt,assetKey:o.assetKey,isin:o.isin||h.isin||null,field,source,sourceAsOf:sourceAsOf||null,sourceValue:base,overrideValue:o.value,overrideSource:o.source,overrideConfirmedAt:o.confirmedAt,broker:o.broker,reason:o.reason});h[target]=o.value;h.provenance[field]={source:o.source,asOf:o.confirmedAt,state:'OVERRIDDEN',broker:o.broker,evidenceRef:o.evidenceRef,reason:o.reason};}
  if(selected.has('currentPrice')&&!selected.has('currentValue')&&num(h.shares)!==null)h.value=Number(h.shares)*Number(h.price);
  if(selected.has('currentValue')&&!selected.has('currentPrice')&&Number(h.shares)>0)h.price=Number(h.value)/Number(h.shares);
  if(selected.has('shares')&&selected.has('currentPrice')&&!selected.has('currentValue'))h.value=Number(h.shares)*Number(h.price);
  return h;
}
function applyPortfolio(p,meta={}){const sourceAsOf=meta.sourceAsOf||p?.savedAt||null,source=meta.source||p?.source||'PARQET';return{...p,holdings:(p?.holdings||[]).map(h=>applyHolding(h,{sourceAsOf,source}))}}
function positionSources(h){const p=h?.provenance||{},row=(field,fallback)=>({source:p[field]?.source||fallback,asOf:p[field]?.asOf||null,state:p[field]?.state||'UNKNOWN'});return{shares:row('shares','PARQET'),currentPrice:row('currentPrice','PARQET'),currentValue:row('currentValue','DERIVED'),avgEntryPrice:row('avgEntryPrice',h?.avgSource||'PARQET')}}
function portfolioKpis({holdings=[],cash=0,lastPortfolioSync=null,source='PARQET'}={}){const asOf=lastPortfolioSync||null,total=(holdings||[]).reduce((s,h)=>s+Number(h.value||0),0)+Number(cash||0),covered=(holdings||[]).filter(h=>Number(h.avg)>0).length;return[{key:'portfolioValue',label:'Depotwert',value:total,source:'HPOS_SUM_FROM_POSITIONS_AND_CASH',asOf},{key:'positions',label:'Positionen',value:holdings.length,source,asOf},{key:'cash',label:'Cash',value:Number(cash||0),source,asOf},{key:'entryCoverage',label:'Einstandsabdeckung',value:`${covered}/${holdings.length}`,source:'HPOS_VALIDATION',asOf}]}
function discrepancies(){return read(DISCREPANCY_KEY,[])}
function registerCraneware(input){const base={assetKey:'CRANEWARE',isin:CRANEWARE_ISIN,source:'USER_CONFIRMED',reason:'Craneware-Brokerkorrektur'};return Object.entries(input||{}).filter(([field,value])=>ALLOWED_FIELDS.has(fieldName(field))&&validValue(fieldName(field),value)).map(([field,value])=>setOverride({...base,...input,field:fieldName(field),value}))}
migrateLegacyCraneware();
window.HPOS_DATA_INTEGRITY={version:'1.0.0',keys:{overrides:OVERRIDE_KEY,discrepancies:DISCREPANCY_KEY},listOverrides,setOverride,removeOverride,applyHolding,applyPortfolio,positionSources,portfolioKpis,discrepancies,registerCraneware};
})();
