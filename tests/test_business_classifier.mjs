import assert from 'node:assert/strict';
import { classifyBusiness } from '../supabase/functions/hpos-screen/business-classifier.ts';

const novo = classifyBusiness('A leading global healthcare company developing pharmaceutical medicines for serious chronic diseases.', '', true);
assert.equal(novo.state, 'PASS');
assert.equal(novo.category, 'HEALTHCARE_AND_LIFE_SCIENCES');

assert.equal(classifyBusiness('Conventional banking and consumer credit services.', '', true).state, 'FAIL');
assert.equal(classifyBusiness('A diversified global group.', '', true).state, 'OPEN');
assert.equal(classifyBusiness('A healthcare company.', '', false).state, 'OPEN');
assert.equal(classifyBusiness('Pharmaceutical preparations', '2834', true).state, 'PASS');

console.log('5 business-classifier behavior tests passed');
