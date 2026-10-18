import test from 'node:test';
import assert from 'node:assert/strict';
import {extractOfficialReportText} from '../supabase/functions/hpos-screen/issuer-report.js';
const meta={identity:{name:'Example Manufacturing SE',isin:'DE0005492938'},reportUrl:'https://example.com/report.pdf'};
function report(values){return '[PAGE 1] Example Manufacturing SE annual financial statements in EUR for the fiscal year ended December 31, 2025. '+ 'Financial overview and business description. '.repeat(30) + values;}
test('conflicting same-label financial figures remain unavailable',()=>{const r=extractOfficialReportText(report('Revenue 125 Revenue 115 Total debt 40 Interest income 2'),meta);assert.ok(r);assert.equal(r.financial.revenue,null);assert.equal(r.financial.extractionConflicts,true);assert.equal(r.evidence.some(e=>e.metric==='revenue'),false)});
test('repeated identical financial values are not treated as conflicting',()=>{const r=extractOfficialReportText(report('Revenue 125 Revenue 125 Total debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,125);assert.equal(r.financial.extractionConflicts,false)});

test('mixed currencies do not produce financial evidence',()=>assert.equal(extractOfficialReportText(report('Revenue 125. EUR USD. Total debt 40'),meta),null));
test('mixed thousand and million scales do not produce evidence',()=>assert.equal(extractOfficialReportText(report('In millions. In thousands. Revenue 125 Total debt 40'),meta),null));
test('different periods on the same page do not yield financial metrics',()=>{const r=extractOfficialReportText(report('Fiscal year ended December 31, 2024. Revenue 125 Total debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,null);assert.equal(r.financial.totalDebt,null)});

test('metrics on a uniquely dated latest-year page are accepted while older page is ignored',()=>{const raw=report('Revenue 125 Total debt 40')+'\n[PAGE 2] Fiscal year ended December 31, 2024. Revenue 110 Total debt 39';const r=extractOfficialReportText(raw,meta);assert.ok(r);assert.equal(r.financial.period,'2025-12-31');assert.equal(r.financial.revenue,125);assert.equal(r.financial.totalDebt,40)});
test('metrics on an undated page are not assigned the latest report period',()=>{const raw=report('')+'\n[PAGE 2] Revenue 125 Total debt 40';const r=extractOfficialReportText(raw,meta);assert.ok(r);assert.equal(r.financial.revenue,null)});
