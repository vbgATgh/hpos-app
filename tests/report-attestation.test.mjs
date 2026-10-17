import test from 'node:test';
import assert from 'node:assert/strict';
import {attestReportMetadata,validIsin} from '../supabase/functions/hpos-screen/report-attestation.mjs';
const good={identity:{isin:'DE0005492938',name:'Masterflex SE'},reportUrl:'https://masterflexgroup.com/report.pdf',issuerWebsite:'https://masterflexgroup.com',period:'2025-12-31',currency:'EUR',pages:42,sha256:'a'.repeat(64)};
test('complete metadata is only METADATA_CHECKED, never fully attested',()=>assert.equal(attestReportMetadata(good).status,'METADATA_CHECKED'));
test('missing fingerprint fails closed',()=>assert.deepEqual(attestReportMetadata({...good,sha256:''}).reasons,['DOCUMENT_FINGERPRINT_MISSING']));
test('foreign document host fails closed',()=>assert.ok(attestReportMetadata({...good,reportUrl:'https://evil.example/a.pdf'}).reasons.includes('SOURCE_NOT_ISSUER_SCOPED')));
test('unknown issuer fails closed',()=>assert.ok(attestReportMetadata({...good,identity:{isin:good.identity.isin}}).reasons.includes('ISSUER_NAME_MISSING')));

test('ISIN checksum detects altered final digit',()=>{assert.equal(validIsin('DE0005492938'),true);assert.equal(validIsin('DE0005492939'),false)});
test('valid-looking but checksum-invalid identity fails closed',()=>assert.ok(attestReportMetadata({...good,identity:{...good.identity,isin:'DE0005492939'}}).reasons.includes('ISIN_MISSING_OR_INVALID')));
test('issuer URLs with credentials fail closed',()=>assert.ok(attestReportMetadata({...good,reportUrl:'https://attacker@masterflexgroup.com/report.pdf'}).reasons.includes('SOURCE_NOT_ISSUER_SCOPED')));
test('invalid calendar dates fail closed',()=>assert.ok(attestReportMetadata({...good,period:'2025-02-31'}).reasons.includes('PERIOD_UNVERIFIED')));
