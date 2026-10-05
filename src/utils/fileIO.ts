import * as XLSX from 'xlsx';
import { CellData, SheetData, SpreadsheetDocument } from '../types/spreadsheet';
import { getCellKey, positionToA1 } from './cellUtils';
import { recalculateSheet } from './formulaEngine';

// Parse CSV text into 2D array of string values
export function parseCSV(csvText: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = '';
  let insideQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const char = csvText[i];
    const nextChar = csvText[i + 1];

    if (char === '"') {
      if (insideQuotes && nextChar === '"') {
        currentCell += '"';
        i++; // skip escaped quote
      } else {
        insideQuotes = !insideQuotes;
      }
    } else if (char === ',' && !insideQuotes) {
      currentRow.push(currentCell.trim());
      currentCell = '';
    } else if ((char === '\r' || char === '\n') && !insideQuotes) {
      if (char === '\r' && nextChar === '\n') {
        i++;
      }
      currentRow.push(currentCell.trim());
      if (currentRow.some(c => c !== '')) {
        rows.push(currentRow);
      }
      currentRow = [];
      currentCell = '';
    } else {
      currentCell += char;
    }
  }

  if (currentCell !== '' || currentRow.length > 0) {
    currentRow.push(currentCell.trim());
    if (currentRow.some(c => c !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
}

// Convert SheetData to CSV string
export function exportSheetToCSV(sheet: SheetData): string {
  let maxRow = 0;
  let maxCol = 0;

  for (const key of Object.keys(sheet.cells)) {
    const [r, c] = key.split(':').map(Number);
    if (r > maxRow) maxRow = r;
    if (c > maxCol) maxCol = c;
  }

  const lines: string[] = [];
  for (let r = 0; r <= maxRow; r++) {
    const rowValues: string[] = [];
    for (let c = 0; c <= maxCol; c++) {
      const cell = sheet.cells[getCellKey(r, c)];
      let val = '';
      if (cell) {
        val = cell.computed !== undefined && cell.computed !== null ? String(cell.computed) : cell.raw || '';
      }
      // Escape if contains comma, quote, or newline
      if (val.includes(',') || val.includes('"') || val.includes('\n')) {
        val = `"${val.replace(/"/g, '""')}"`;
      }
      rowValues.push(val);
    }
    lines.push(rowValues.join(','));
  }

  return lines.join('\n');
}

// Convert SheetData to Excel file (.xlsx) download
export function exportDocumentToXLSX(doc: SpreadsheetDocument) {
  const wb = XLSX.utils.book_new();

  for (const sheet of doc.sheets) {
    let maxRow = 0;
    let maxCol = 0;
    for (const key of Object.keys(sheet.cells)) {
      const [r, c] = key.split(':').map(Number);
      if (r > maxRow) maxRow = r;
      if (c > maxCol) maxCol = c;
    }

    const aoa: any[][] = [];
    for (let r = 0; r <= maxRow; r++) {
      const rowArr: any[] = [];
      for (let c = 0; c <= maxCol; c++) {
        const cell = sheet.cells[getCellKey(r, c)];
        if (!cell || !cell.raw) {
          rowArr.push('');
        } else if (cell.raw.startsWith('=')) {
          // If formula, export raw formula or computed value
          rowArr.push(cell.computed !== undefined ? cell.computed : cell.raw);
        } else {
          const num = Number(cell.raw);
          if (!isNaN(num) && cell.raw.trim() !== '') {
            rowArr.push(num);
          } else {
            rowArr.push(cell.raw);
          }
        }
      }
      aoa.push(rowArr);
    }

    const ws = XLSX.utils.aoa_to_sheet(aoa);
    XLSX.utils.book_append_sheet(wb, ws, sheet.name.substring(0, 31));
  }

  XLSX.writeFile(wb, `${doc.title || 'Spreadsheet'}.xlsx`);
}

// Import XLSX ArrayBuffer into SpreadsheetDocument
export function importXLSXToDocument(buffer: ArrayBuffer, fileName: string): SpreadsheetDocument {
  const wb = XLSX.read(buffer, { type: 'array' });
  const sheets: SheetData[] = [];

  for (let sIdx = 0; sIdx < wb.SheetNames.length; sIdx++) {
    const sheetName = wb.SheetNames[sIdx];
    const ws = wb.Sheets[sheetName];
    const rows = XLSX.utils.sheet_to_json<any[]>(ws, { header: 1, defval: '' });

    const cells: Record<string, CellData> = {};
    for (let r = 0; r < rows.length; r++) {
      const row = rows[r];
      if (Array.isArray(row)) {
        for (let c = 0; c < row.length; c++) {
          const val = row[c];
          if (val !== undefined && val !== null && val !== '') {
            cells[getCellKey(r, c)] = {
              raw: String(val),
            };
          }
        }
      }
    }

    const rawSheet: SheetData = {
      id: `sheet-${Date.now()}-${sIdx}`,
      name: sheetName,
      cells,
      rowHeights: {},
      colWidths: {},
      mergedCells: [],
    };

    sheets.push(recalculateSheet(rawSheet));
  }

  const title = fileName.replace(/\.[^/.]+$/, '') || 'Imported Spreadsheet';

  return {
    id: `doc-${Date.now()}`,
    title,
    sheets: sheets.length > 0 ? sheets : [createEmptySheet('Sheet1')],
    activeSheetId: sheets[0]?.id || 'sheet-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

// Create a blank sheet
export function createEmptySheet(name: string): SheetData {
  return {
    id: `sheet-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
    name,
    cells: {},
    rowHeights: {},
    colWidths: {},
    mergedCells: [],
  };
}

// Parse Google Sheet ID & gid from URL
export function parseGoogleSheetUrl(url: string): { sheetId: string | null; gid: string | null } {
  try {
    const match = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const sheetId = match ? match[1] : null;

    let gid: string | null = null;
    const gidMatch = url.match(/[#&?]gid=([0-9]+)/);
    if (gidMatch) {
      gid = gidMatch[1];
    }

    return { sheetId, gid };
  } catch {
    return { sheetId: null, gid: null };
  }
}
