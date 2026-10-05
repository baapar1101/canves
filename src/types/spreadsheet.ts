export type CellValue = string | number | boolean | null;

export interface CellStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  strikethrough?: boolean;
  fontSize?: number;
  fontFamily?: string;
  color?: string;
  backgroundColor?: string;
  textAlign?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  wrapText?: 'overflow' | 'wrap' | 'clip';
  format?: 'general' | 'number' | 'currency' | 'percent' | 'date' | 'text' | 'scientific';
  decimalPlaces?: number;
  borderTop?: string;
  borderRight?: string;
  borderBottom?: string;
  borderLeft?: string;
}

export interface CellData {
  raw: string; // User input e.g. "=SUM(A1:A5)" or "150" or "Revenue"
  computed?: CellValue;
  error?: string | null;
  style?: CellStyle;
  comment?: string;
  hyperlink?: string;
}

export interface CellPosition {
  row: number; // 0-indexed
  col: number; // 0-indexed
}

export interface CellRange {
  startRow: number;
  startCol: number;
  endRow: number;
  endCol: number;
}

export interface MergeCellRange extends CellRange {
  id: string;
}

export interface SheetData {
  id: string;
  name: string;
  cells: Record<string, CellData>; // key is "row:col" e.g. "0:0" for A1
  rowHeights: Record<number, number>;
  colWidths: Record<number, number>;
  mergedCells: MergeCellRange[];
  frozenRows?: number;
  frozenCols?: number;
  tabColor?: string;
  hidden?: boolean;
}

export interface SpreadsheetDocument {
  id: string;
  title: string;
  sheets: SheetData[];
  activeSheetId: string;
  createdAt: number;
  updatedAt: number;
}

export interface SelectionState {
  activeCell: CellPosition;
  range: CellRange;
  isSelecting: boolean;
  isDraggingFillHandle: boolean;
  fillRange?: CellRange;
}

export interface CopyBuffer {
  range: CellRange;
  data: (CellData | undefined)[][];
  isCut?: boolean;
  sheetId: string;
}

export interface FilterConfig {
  range: CellRange;
  conditions: Record<number, { textFilter?: string; condition?: 'equals' | 'contains' | 'greater' | 'less'; value?: string }>;
  sortCol?: number;
  sortAsc?: boolean;
}

export interface ChartConfig {
  id: string;
  title: string;
  type: 'bar' | 'line' | 'pie' | 'area';
  range: CellRange;
  hasHeaderRow: boolean;
  hasHeaderCol: boolean;
}
