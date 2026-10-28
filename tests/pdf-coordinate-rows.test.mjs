import test from 'node:test';
import assert from 'node:assert/strict';
import { pdfCoordinateRows, comparativeYearHeaders, bindYearColumnCell } from '../supabase/functions/hpos-screen/pdf-coordinate-rows.mjs';

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

test('binds a unique target-year numeric cell using x coordinates',()=>{
  const rows=pdfCoordinateRows([item('2025',300,730),item('2024',410,730),item('Revenue',30,700),item('125',301,700),item('115',411,700)]);
  assert.deepEqual(bindYearColumnCell(rows,0,1,2025),{year:2025,valueText:'125',x:301,headerRow:0,dataRow:1});
  assert.equal(bindYearColumnCell(rows,0,1,2023),null);
});

test('refuses duplicated year headers, overlapping numeric cells and missing coordinates',()=>{
  const duplicated=pdfCoordinateRows([item('2025',300,730),item('2025',350,730),item('2024',410,730),item('125',300,700)]);
  assert.equal(bindYearColumnCell(duplicated,0,1,2025),null);
  const overlapping=pdfCoordinateRows([item('2025',300,730),item('2024',410,730),item('125',300,700),item('130',305,700)]);
  assert.equal(bindYearColumnCell(overlapping,0,1,2025),null);
  const missing=pdfCoordinateRows([item('2025',300,730),item('2024',410,730),item('Revenue',30,700)]);
  assert.equal(bindYearColumnCell(missing,0,1,2025),null);
});

test('refuses ambiguous year columns when their x ranges overlap',()=>{
  const rows=pdfCoordinateRows([item('2025',300,730),item('2024',307,730),item('125',303,700)]);
  assert.equal(bindYearColumnCell(rows,0,1,2025),null);
});

test('year binding rejects nonnumeric cells and accepts a decimal numeric cell',()=>{
  const rows=pdfCoordinateRows([item('2025',300,730),item('2024',410,730),item('Revenue',30,700),item('125.50',300,700),item('115',410,700)]);
  assert.equal(bindYearColumnCell(rows,0,1,2025)?.valueText,'125.50');
  const invalid=pdfCoordinateRows([item('2025',300,730),item('2024',410,730),item('N/A',300,700)]);
  assert.equal(bindYearColumnCell(invalid,0,1,2025),null);
});
