import test from 'node:test';
import assert from 'node:assert/strict';
import {readLimitedBytes} from '../supabase/functions/hpos-screen/issuer-report.js';
const response=(parts,declared='')=>({headers:{get:()=>declared},body:new ReadableStream({start(controller){for(const p of parts)controller.enqueue(new Uint8Array(p));controller.close()}})});
test('bounded reader accepts payload below cap',async()=>assert.deepEqual([...await readLimitedBytes(response([[1,2],[3]]),4)],[1,2,3]));
test('bounded reader rejects streamed oversize without Content-Length',async()=>assert.equal(await readLimitedBytes(response([[1,2],[3,4,5]]),4),null));
test('bounded reader rejects misleading declared Content-Length',async()=>assert.equal(await readLimitedBytes(response([[1]],100),4),null));
test('bounded reader rejects invalid max',async()=>assert.equal(await readLimitedBytes(response([[1]]),0),null));
