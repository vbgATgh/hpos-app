import test from 'node:test';
import assert from 'node:assert/strict';
import { pdfCoordinateRows, comparativeYearHeaders } from '../supabase/functions/hpos-screen/pdf-coordinate-rows.mjs';

const item = (text,x,y) => ({str:text,transform:[1,0,0,1,x,y]});

test('PDF coordinate adapter sorts visual rows top-down and cells left-right',()=>{
  const rows=pdfCoordinateRows([item('115',410,700),item('Revenue',30,700),item('125',300,700),item('2024',410,730),item('2025',300,730)]);
  assert.deepEqual(rows.map(r=>r.cells.map(c=>c.text)),[['2025','2024'],['Revenue','125','115']]);
  assert.deepEqual(comparativeYearHeaders(rows),[{rowIndex:0,columns:[{x:300,year:2025},{x:410,year:2024}]}]);
});

test('close PDF baseline positions group into one row',()=>{
  const rows=pdfCoordinateRows([item('Revenue',30,700),item('125',300,699)]);
  assert.equal(rows.length,1);
});

test('invalid positions are discarded instead of fabricated',()=>{
  const rows=pdfCoordinateRows([{str:'125',transform:[1,0,0,1,NaN,700]},item('2025',200,720)]);
  assert.equal(rows.length,1);
  assert.deepEqual(comparativeYearHeaders(rows),[]);
});

test('prose and repeated same-year cells are not comparative headers',()=>{
  assert.deepEqual(comparativeYearHeaders(pdfCoordinateRows([item('2025 and 2024',30,700),item('2025',300,680),item('2025',400,680)])),[]);
});
