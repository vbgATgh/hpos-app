import test from 'node:test';
import assert from 'node:assert/strict';
import {trustedHttpsUrl,issuerHostMatches,fetchIssuerResource,isPublicIp} from '../supabase/functions/hpos-screen/source-trust.mjs';
test('accepts normal issuer URLs',()=>assert.ok(trustedHttpsUrl('https://www.netcall.com/investors/')));
for(const url of ['http://www.netcall.com','https://localhost/a','https://127.0.0.1/x','https://[::1]/x','https://169.254.169.254/a','https://user:pass@netcall.com/a','https://netcall.com:8080/a','https://example.internal/a','https://2130706433/a'])test('rejects unsafe '+url,()=>assert.equal(trustedHttpsUrl(url),null));
test('rejects attacker-controlled pdf domain',()=>assert.equal(issuerHostMatches('https://www.netcall.com','https://malicious.example/report.pdf'),false));
test('rejects lookalike issuer domain',()=>assert.equal(issuerHostMatches('https://www.netcall.com','https://www.netcall.com.evil.org/a.pdf'),false));
test('accepts issuer subdomain',()=>assert.equal(issuerHostMatches('https://netcall.com','https://reports.netcall.com/report.pdf'),true));
test('does not fetch untrusted initial URL',async()=>{let called=false;const old=globalThis.fetch;globalThis.fetch=()=>{called=true;throw Error('must not fetch')};try{assert.equal(await fetchIssuerResource('https://evil.org/a.pdf','https://netcall.com'),null);assert.equal(called,false)}finally{globalThis.fetch=old}});
test('rejects cross-host redirect',async()=>{const old=globalThis.fetch;let calls=0;globalThis.fetch=async()=>{calls++;return {ok:false,status:302,headers:{get:()=> 'https://evil.org/report.pdf'},url:'https://netcall.com/old'}};try{assert.equal(await fetchIssuerResource('https://netcall.com/old','https://netcall.com',{}, {resolvePublicDns:async()=>true}),null);assert.equal(calls,1)}finally{globalThis.fetch=old}});
test('accepts valid issuer response',async()=>{const old=globalThis.fetch;globalThis.fetch=async()=>({ok:true,status:200,url:'https://netcall.com/report.pdf',headers:{get:()=>null}});try{assert.ok(await fetchIssuerResource('https://netcall.com/report.pdf','https://netcall.com',{}, {resolvePublicDns:async()=>true}))}finally{globalThis.fetch=old}});

for (const ip of ['127.0.0.1','10.0.0.5','192.168.1.2','169.254.169.254','172.16.0.1','100.64.0.1','0.0.0.0','256.1.1.1']) test('blocks private or invalid IPv4 '+ip,()=>assert.equal(isPublicIp(ip),false));
for (const ip of ['1.1.1.1','8.8.8.8','93.184.215.14']) test('accepts public IPv4 '+ip,()=>assert.equal(isPublicIp(ip),true));

test('fails closed when DNS cannot be verified',async()=>{let called=false;const response=await fetchIssuerResource('https://netcall.com/report.pdf','https://netcall.com',{}, {resolvePublicDns:async()=>false,fetch:async()=>{called=true;return {ok:true}}});assert.equal(response,null);assert.equal(called,false)});
test('allows same issuer redirect after fresh DNS verification',async()=>{let calls=0,checks=0;const response=await fetchIssuerResource('https://netcall.com/old','https://netcall.com',{}, {resolvePublicDns:async()=>{checks++;return true},fetch:async()=>++calls===1?{status:302,headers:{get:()=>'/new'},url:'https://netcall.com/old'}:{ok:true,status:200,headers:{get:()=>null},url:'https://netcall.com/new'}});assert.equal(response?.status,200);assert.equal(calls,2);assert.equal(checks,2)});
