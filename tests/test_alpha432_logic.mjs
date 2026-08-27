import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

const src=fs.readFileSync('alpha41/alpha432.js','utf8');
const start=src.indexOf('function parseTime432');
const end=src.indexOf('getEffectiveHalal=getEffectiveHalal432;');
assert.ok(start>=0&&end>start,'Halal-Logik in alpha432.js nicht gefunden');
const code=src.slice(start,end)+`\nthis.api={compareChecks432,sourceState432,latestSources432,getEffectiveHalal432};`;
const sandbox={
  srcEq432:(a,b)=>String(a??'').trim().toLowerCase()===String(b??'').trim().toLowerCase(),
  strictRank432:{H0:4,H2:3,UNKNOWN:2,H1:1},
  getEffectiveProfile:()=>({halalConflictPolicy:'MANUAL_REVIEW',rules:{halalSourcePriority:{effectiveValue:['Musaffa','Zoya']}}}),
};
vm.createContext(sandbox);vm.runInContext(code,sandbox);
const {getEffectiveHalal432}=sandbox.api;
const asset={assetId:'A',isin:'XX',ticker:'X'};
const base={standardProfile:{rules:{nvoException:{match:{isin:null,ticker:null},ruleId:'ASSET.NVO.H2'}}},halalChecks:[]};

// Gleicher Prüftag, gleiche Quelle: später erfasstes Urteil ist aktuell.
let state=structuredClone(base);
state.halalChecks=[
 {checkId:'1',assetId:'A',source:'Musaffa',status:'H0',checkedAt:'2026-08-27',updatedAt:'2026-08-27T09:00:00Z'},
 {checkId:'2',assetId:'A',source:'Musaffa',status:'H1',checkedAt:'2026-08-27',updatedAt:'2026-08-27T10:00:00Z'},
];
let r=getEffectiveHalal432(state,asset);
assert.equal(r.status,'H1');assert.equal(r.conflict,false);assert.equal(r.checks[0].checkId,'2');

// Exakt gleicher Zeitstempel + widersprüchlicher Status darf nicht zufällig H0/H1 werden.
state=structuredClone(base);
state.halalChecks=[
 {checkId:'1',assetId:'A',source:'Musaffa',status:'H0',checkedAt:'2026-08-27',updatedAt:'2026-08-27T10:00:00Z'},
 {checkId:'2',assetId:'A',source:'Musaffa',status:'H1',checkedAt:'2026-08-27',updatedAt:'2026-08-27T10:00:00Z'},
];
r=getEffectiveHalal432(state,asset);
assert.equal(r.status,'H2');assert.equal(r.conflict,true);assert.equal(r.ruleId,'HALAL.SAME_SOURCE.AMBIGUOUS');

// Unterschiedliche aktuelle Quellen mit Konflikt => H2/Review im Produktdefault.
state=structuredClone(base);
state.halalChecks=[
 {checkId:'1',assetId:'A',source:'Musaffa',status:'H1',checkedAt:'2026-08-27',updatedAt:'2026-08-27T10:00:00Z'},
 {checkId:'2',assetId:'A',source:'Zoya',status:'H0',checkedAt:'2026-08-27',updatedAt:'2026-08-27T10:01:00Z'},
];
r=getEffectiveHalal432(state,asset);
assert.equal(r.status,'H2');assert.equal(r.conflict,true);
console.log('Alpha 4.3.2 Halal logic: OK');
