import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

globalThis.window=globalThis;
vm.runInThisContext(fs.readFileSync('app/gate-engine.js','utf8'));
const engine=globalThis.HPOS_GATE_ENGINE;
const complete={gate1:{state:'PASS'},gate2:{state:'PASS'},gate3:{state:'SUPPORTED'},gate4:{state:'STRENGTHENING'},gate5:{state:'PASS'},gate6:{state:'PASS'},gate7:{state:'CURRENT'},gate8:{state:'EXTERNAL_ONLY'}};

assert.equal(engine.evaluate(complete).decision.state,'READY_FOR_RANKING');
assert.equal(engine.evaluate({...complete,gate1:{state:'FAIL'}}).decision.state,'HARD_BLOCKED');
assert.equal(engine.evaluate({...complete,gate4:{state:'UNKNOWN'}}).decision.state,'EVIDENCE_REQUIRED');
assert.equal(engine.evaluate({...complete,gate2:{state:'REVIEW'}}).decision.state,'REVIEW_REQUIRED');
assert.equal(engine.evaluate({...complete,gate6:{state:'WAIT'}}).decision.state,'WAIT_TRIGGER');

const t90=engine.evaluate({case:complete,t90:{active:true,reason:'90 Tage erreicht'}});
assert.equal(t90.decision.state,'READY_FOR_RANKING');
assert.equal(t90.reviewFlags[0].blocksCapital,false);

const conflict=engine.evaluate({...complete,gate1:{states:['PASS','FAIL']}});
assert.equal(conflict.decision.state,'EVIDENCE_REQUIRED');
assert.equal(conflict.conflicts.length,1);
assert.equal(conflict.eib.amount,null);
assert.equal(conflict.eib.status,'NOT_CALCULATED');

const cardinal=JSON.parse(fs.readFileSync('data/investment_cases/CARDINAL_ENERGY.json','utf8'));
const cardinalResult=engine.evaluate(cardinal);
assert.equal(cardinalResult.decision.state,'REVIEW_REQUIRED');
assert.equal(cardinalResult.decision.blockingGate,2);

console.log('AP2 gate-engine behavior tests passed');
