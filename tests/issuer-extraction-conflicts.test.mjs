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

test('comparative debt and interest values from older fiscal pages are excluded',()=>{const raw=report('Revenue 125 Total debt 40 Interest income 2 Total current assets 90')+'\n[PAGE 2] Fiscal year ended December 31, 2024. Revenue 110 Total debt 39 Interest income 1 Total current assets 80';const r=extractOfficialReportText(raw,meta);assert.ok(r);assert.equal(r.financial.revenue,125);assert.equal(r.financial.totalDebt,40);assert.equal(r.financial.interestIncome,2);assert.equal(r.financial.interestBearingAssetsUpperBound,90);assert.equal(r.financial.extractionConflicts,false)});
test('mixed-year page debt and interest must not be used even if revenue is available elsewhere',()=>{const raw=report('Revenue 125')+'\n[PAGE 2] Fiscal year ended December 31, 2024. Total debt 39 Interest income 1 Total current assets 80';const r=extractOfficialReportText(raw,meta);assert.ok(r);assert.equal(r.financial.revenue,125);assert.equal(r.financial.totalDebt,null);assert.equal(r.financial.interestIncome,null);assert.equal(r.financial.interestBearingAssetsUpperBound,null)});

test('unbound comparative columns do not become latest-year revenue',()=>{const r=extractOfficialReportText(report('Revenue 125 115 Total debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,null);assert.equal(r.evidence.some(e=>e.metric==='revenue'),false)});
test('single figure still accepted',()=>{const r=extractOfficialReportText(report('Revenue 125'),meta);assert.ok(r);assert.equal(r.financial.revenue,125)});

test('impossible fiscal date cannot be used to label financial evidence',()=>{const raw=report('Revenue 125').replace('December 31, 2025','February 31, 2025');assert.equal(extractOfficialReportText(raw,meta),null)});
test('future fiscal date cannot be used to label financial evidence',()=>{const raw=report('Revenue 125').replace('December 31, 2025','December 31, 2099');assert.equal(extractOfficialReportText(raw,meta),null)});

test('a financial label without a same-row figure cannot borrow the next row number',()=>{const r=extractOfficialReportText(report('Revenue\\n125 Total debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,null);assert.equal(r.financial.totalDebt,40)});
test('same-row label and figure remain extractable',()=>{const r=extractOfficialReportText(report('Revenue 125\\nTotal debt 40'),meta);assert.ok(r);assert.equal(r.financial.revenue,125);assert.equal(r.financial.totalDebt,40)});
