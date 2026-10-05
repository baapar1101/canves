import { CellPosition, CellRange, CellStyle, CellValue } from '../types/spreadsheet';

// Converts 0-indexed column number (0 -> 'A', 25 -> 'Z', 26 -> 'AA')
export function colIndexToName(index: number): string {
  let name = '';
  let num = index;
  while (num >= 0) {
    name = String.fromCharCode((num % 26) + 65) + name;
    num = Math.floor(num / 26) - 1;
  }
  return name;
}

// Converts column name ('A' -> 0, 'Z' -> 25, 'AA' -> 26)
export function colNameToIndex(name: string): number {
  let index = 0;
  const upper = name.toUpperCase();
  for (let i = 0; i < upper.length; i++) {
    index = index * 26 + (upper.charCodeAt(i) - 64);
  }
  return index - 1;
}

// Converts {row: 0, col: 0} -> "A1"
export function positionToA1(pos: CellPosition): string {
  return `${colIndexToName(pos.col)}${pos.row + 1}`;
}

// Converts "A1" or "B12" -> {row: 0, col: 0}
export function a1ToPosition(a1: string): CellPosition | null {
  const match = a1.trim().toUpperCase().match(/^([A-Z]+)([0-9]+)$/);
  if (!match) return null;
  const col = colNameToIndex(match[1]);
  const row = parseInt(match[2], 10) - 1;
  if (isNaN(row) || col < 0) return null;
  return { row, col };
}

// Formats "row:col" string key (e.g. "0:0")
export function getCellKey(row: number, col: number): string {
  return `${row}:${col}`;
}

// Parses "row:col" string key
export function parseCellKey(key: string): CellPosition {
  const [row, col] = key.split(':').map((v) => parseInt(v, 10));
  return { row, col };
}

// Checks if a cell position is inside a range
export function isCellInRange(pos: CellPosition, range: CellRange): boolean {
  const minRow = Math.min(range.startRow, range.endRow);
  const maxRow = Math.max(range.startRow, range.endRow);
  const minCol = Math.min(range.startCol, range.endCol);
  const maxCol = Math.max(range.startCol, range.endCol);

  return pos.row >= minRow && pos.row <= maxRow && pos.col >= minCol && pos.col <= maxCol;
}

// Normalizes a range so start <= end
export function normalizeRange(range: CellRange): CellRange {
  return {
    startRow: Math.min(range.startRow, range.endRow),
    startCol: Math.min(range.startCol, range.endCol),
    endRow: Math.max(range.startRow, range.endRow),
    endCol: Math.max(range.startCol, range.endCol),
  };
}

// Converts range to A1 notation, e.g. "A1:C5" or "A1"
export function rangeToA1(range: CellRange): string {
  const norm = normalizeRange(range);
  const start = positionToA1({ row: norm.startRow, col: norm.startCol });
  const end = positionToA1({ row: norm.endRow, col: norm.endCol });
  return start === end ? start : `${start}:${end}`;
}

// Parses "A1:C5" into CellRange
export function a1ToRange(a1Range: string): CellRange | null {
  const parts = a1Range.split(':');
  if (parts.length === 1) {
    const pos = a1ToPosition(parts[0]);
    if (!pos) return null;
    return { startRow: pos.row, startCol: pos.col, endRow: pos.row, endCol: pos.col };
  } else if (parts.length === 2) {
    const start = a1ToPosition(parts[0]);
    const end = a1ToPosition(parts[1]);
    if (!start || !end) return null;
    return { startRow: start.row, startCol: start.col, endRow: end.row, endCol: end.col };
  }
  return null;
}

// Format a value according to cell style
export function formatCellValue(value: CellValue, style?: CellStyle): string {
  if (value === null || value === undefined || value === '') return '';

  if (typeof value === 'boolean') {
    return value ? 'TRUE' : 'FALSE';
  }

  const format = style?.format || 'general';
  const decimals = style?.decimalPlaces !== undefined ? style.decimalPlaces : 2;

  if (typeof value === 'number') {
    if (isNaN(value)) return '#NUM!';
    if (!isFinite(value)) return value > 0 ? '#INFINITY!' : '#-INFINITY!';

    switch (format) {
      case 'currency':
        return new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD',
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);

      case 'percent':
        return `${(value * 100).toFixed(decimals)}%`;

      case 'number':
        return new Intl.NumberFormat('en-US', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        }).format(value);

      case 'scientific':
        return value.toExponential(decimals);

      case 'date':
        // Excel serial date number (days since 1899-12-30) or timestamp
        try {
          const date = value > 100000 ? new Date(value) : new Date((value - 25569) * 86400 * 1000);
          return date.toLocaleDateString();
        } catch {
          return String(value);
        }

      default:
        // Default smart number format
        if (Number.isInteger(value)) {
          return value.toLocaleString('en-US');
        }
        return Number(value.toFixed(4)).toString();
    }
  }

  return String(value);
}

// Extrapolate series for fill-handle (drag to fill)
export function extrapolateFillValue(values: string[], stepIndex: number): string {
  if (values.length === 0) return '';
  if (values.length === 1) {
    const val = values[0];
    // Check if numeric
    const num = parseFloat(val);
    if (!isNaN(num) && val.trim() === String(num)) {
      return String(num + stepIndex);
    }
    // Check pattern like "Item 1" or "Month 1"
    const match = val.match(/^(.*?)(\d+)$/);
    if (match) {
      const prefix = match[1];
      const n = parseInt(match[2], 10);
      return `${prefix}${n + stepIndex}`;
    }
    // Check days of week or months
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const shortDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
    const shortMonths = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    const dayIdx = days.findIndex(d => d.toLowerCase() === val.toLowerCase());
    if (dayIdx !== -1) return days[(dayIdx + stepIndex) % 7];
    const sDayIdx = shortDays.findIndex(d => d.toLowerCase() === val.toLowerCase());
    if (sDayIdx !== -1) return shortDays[(sDayIdx + stepIndex) % 7];

    const mIdx = months.findIndex(m => m.toLowerCase() === val.toLowerCase());
    if (mIdx !== -1) return months[(mIdx + stepIndex) % 12];
    const smIdx = shortMonths.findIndex(m => m.toLowerCase() === val.toLowerCase());
    if (smIdx !== -1) return shortMonths[(smIdx + stepIndex) % 12];

    return val;
  }

  // Multiple values: linear regression / arithmetic progression
  const nums = values.map(v => parseFloat(v));
  if (nums.every(n => !isNaN(n))) {
    const diff = (nums[nums.length - 1] - nums[0]) / (nums.length - 1);
    const last = nums[nums.length - 1];
    return String(Math.round((last + diff * stepIndex) * 10000) / 10000);
  }

  // Fallback repeat pattern
  return values[(stepIndex - 1) % values.length];
}
