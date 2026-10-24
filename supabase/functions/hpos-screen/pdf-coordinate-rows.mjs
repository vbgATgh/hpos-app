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
