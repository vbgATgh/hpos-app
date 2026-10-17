import test from 'node:test';
import assert from 'node:assert/strict';
import {extractOfficialReportText} from '../supabase/functions/hpos-screen/issuer-report.js';
const meta={identity:{name:'Example Manufacturing SE',isin:'DE0005492938'},reportUrl:'https://example.com/report.pdf'};
function report(values){return '[PAGE 1] Example Manufacturing SE annual financial statements in EUR for the fiscal year ended December 31, 2025. '+ 'Financial overview and business description. '.repeat(30) + values;}
test('conflicting same-label financial figures remain unavailable',()=>{const r=extractOfficialReportText(report('Revenue 125 Revenue 115 Total debt 40 Interest income 2'),meta);assert.ok(r);assert.equal(r.financial.revenue,null);assert.equal(r.financial.extractionConflicts,true);assert.equal(r.evidence.some(e=>e.metric==='revenue'),false)});
test('repeated identical financial values are not treated as conflicting',()=>{const r=extractOfficialReportText(report('Revenue 125 Revenue 125 Total debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,125);assert.equal(r.financial.extractionConflicts,false)});
