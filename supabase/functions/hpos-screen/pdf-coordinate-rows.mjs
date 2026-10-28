// Conservative PDFJS text-item geometry adapter. No financial gate uses this
// until year-column binding and issuer-document validation are implemented.
export function pdfCoordinateRows(items, tolerance = 2) {
  if (!Array.isArray(items) || !Number.isFinite(tolerance) || tolerance <= 0) return [];
  const rows = [];
  for (const item of items) {
    const value = String(item?.str ?? "").trim();
    const transform = item?.transform;
    const x = Number(transform?.[4]), y = Number(transform?.[5]);
    if (!value || !Number.isFinite(x) || !Number.isFinite(y)) continue;
    let row = rows.find(r => Math.abs(r.y - y) <= tolerance);
    if (!row) { row = { y, cells: [] }; rows.push(row); }
    row.cells.push({ x, text: value });
  }
  return rows.sort((a, b) => b.y - a.y).map(row => ({
    y: row.y,
    cells: row.cells.sort((a, b) => a.x - b.x)
  }));
}

// Return year header candidates only. This does NOT establish that a numeric
// cell belongs to a particular year; financial evidence must stay unbound.
export function comparativeYearHeaders(rows) {
  return rows.flatMap((row, rowIndex) => {
    const years = row.cells.filter(cell => /^20\d{2}$/.test(cell.text));
    if (new Set(years.map(cell => cell.text)).size < 2) return [];
    return [{ rowIndex, columns: years.map(cell => ({ x: cell.x, year: Number(cell.text) })) }];
  });
}

/**
 * Conservative year-column binding for one row of a PDF table.
 * Returns no value unless there is one unique header, one unique target-year
 * column and exactly one numeric cell within the configured x tolerance.
 * Never interprets the number as an audited financial metric.
 */
export function bindYearColumnCell(rows, headerIndex, dataIndex, year, tolerance = 12) {
  if (!Array.isArray(rows) || !Number.isInteger(headerIndex) || !Number.isInteger(dataIndex) ||
      dataIndex <= headerIndex || !Number.isInteger(year) ||
      !Number.isFinite(tolerance) || tolerance <= 0) return null;
  const headers = comparativeYearHeaders(rows).filter(h => h.rowIndex === headerIndex);
  if (headers.length !== 1 || !rows[dataIndex]?.cells) return null;
  const columns = headers[0].columns;
  if (new Set(columns.map(c => c.year)).size !== columns.length ||
      columns.filter(c => c.year === year).length !== 1) return null;
  const target = columns.find(c => c.year === year);
  const near = rows[dataIndex].cells.filter(c => Math.abs(c.x - target.x) <= tolerance);
  if (near.length !== 1 || !/^-?\d+(?:[.,]\d+)?$/.test(near[0].text)) return null;
  // A number must not fit two competing year headers.
  if (columns.some(c => c.year !== year && Math.abs(c.x - near[0].x) <= tolerance)) return null;
  return { year, valueText: near[0].text, x: near[0].x, headerRow: headerIndex, dataRow: dataIndex };
}
