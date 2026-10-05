import { CellData, SheetData, SpreadsheetDocument } from '../types/spreadsheet';
import { getCellKey } from '../utils/cellUtils';
import { recalculateSheet } from '../utils/formulaEngine';

export function createDefaultDocument(): SpreadsheetDocument {
  // Sheet 1: Financial & KPI Model
  const sheet1Cells: Record<string, CellData> = {
    // Title Banner
    [getCellKey(0, 0)]: {
      raw: 'Quarterly Financial & Performance Overview',
      style: { bold: true, fontSize: 16, color: '#1a73e8', fontFamily: 'Arial' },
    },
    [getCellKey(1, 0)]: {
      raw: 'Department:',
      style: { bold: true, color: '#5f6368', fontSize: 11 },
    },
    [getCellKey(1, 1)]: {
      raw: 'Enterprise Solutions Group',
      style: { italic: true, fontSize: 11 },
    },
    [getCellKey(1, 4)]: {
      raw: 'Last Updated:',
      style: { bold: true, color: '#5f6368', fontSize: 11 },
    },
    [getCellKey(1, 5)]: {
      raw: '=TODAY()',
      style: { format: 'date', fontSize: 11, textAlign: 'right' },
    },

    // Table 1: Revenue Streams
    [getCellKey(3, 0)]: { raw: 'Revenue Stream', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 1)]: { raw: 'Units Sold', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 2)]: { raw: 'Unit Price', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 3)]: { raw: 'Total Revenue', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 4)]: { raw: 'Cost of Goods', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 5)]: { raw: 'Gross Profit', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 6)]: { raw: 'Margin %', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'right', borderBottom: '2px solid #1a73e8' } },
    [getCellKey(3, 7)]: { raw: 'Status', style: { bold: true, backgroundColor: '#e8f0fe', color: '#1967d2', textAlign: 'center', borderBottom: '2px solid #1a73e8' } },

    // Data Rows
    [getCellKey(4, 0)]: { raw: 'Cloud Tier A' },
    [getCellKey(4, 1)]: { raw: '1240', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(4, 2)]: { raw: '150', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(4, 3)]: { raw: '=B5*C5', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(4, 4)]: { raw: '62000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(4, 5)]: { raw: '=D5-E5', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(4, 6)]: { raw: '=F5/D5', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(4, 7)]: { raw: '=IF(G5>0.5, "High Margin", "Standard")', style: { textAlign: 'center' } },

    [getCellKey(5, 0)]: { raw: 'Enterprise Pro' },
    [getCellKey(5, 1)]: { raw: '430', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(5, 2)]: { raw: '480', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(5, 3)]: { raw: '=B6*C6', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(5, 4)]: { raw: '84000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(5, 5)]: { raw: '=D6-E6', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(5, 6)]: { raw: '=F6/D6', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(5, 7)]: { raw: '=IF(G6>0.5, "High Margin", "Standard")', style: { textAlign: 'center' } },

    [getCellKey(6, 0)]: { raw: 'Dedicated Storage' },
    [getCellKey(6, 1)]: { raw: '860', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(6, 2)]: { raw: '95', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(6, 3)]: { raw: '=B7*C7', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(6, 4)]: { raw: '38500', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(6, 5)]: { raw: '=D7-E7', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(6, 6)]: { raw: '=F7/D7', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(6, 7)]: { raw: '=IF(G7>0.5, "High Margin", "Standard")', style: { textAlign: 'center' } },

    [getCellKey(7, 0)]: { raw: 'Security Suite' },
    [getCellKey(7, 1)]: { raw: '310', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(7, 2)]: { raw: '350', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(7, 3)]: { raw: '=B8*C8', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(7, 4)]: { raw: '41000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(7, 5)]: { raw: '=D8-E8', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(7, 6)]: { raw: '=F8/D8', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(7, 7)]: { raw: '=IF(G8>0.5, "High Margin", "Standard")', style: { textAlign: 'center' } },

    [getCellKey(8, 0)]: { raw: 'Custom Consulting' },
    [getCellKey(8, 1)]: { raw: '180', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(8, 2)]: { raw: '650', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(8, 3)]: { raw: '=B9*C9', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(8, 4)]: { raw: '52000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(8, 5)]: { raw: '=D9-E9', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(8, 6)]: { raw: '=F9/D9', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(8, 7)]: { raw: '=IF(G9>0.5, "High Margin", "Standard")', style: { textAlign: 'center' } },

    // Summary Totals Row
    [getCellKey(9, 0)]: { raw: 'Total Summary', style: { bold: true, backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 1)]: { raw: '=SUM(B5:B9)', style: { bold: true, format: 'number', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 2)]: { raw: '=AVERAGE(C5:C9)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 3)]: { raw: '=SUM(D5:D9)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 4)]: { raw: '=SUM(E5:E9)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 5)]: { raw: '=SUM(F5:F9)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 6)]: { raw: '=F10/D10', style: { bold: true, format: 'percent', textAlign: 'right', backgroundColor: '#f1f3f4', borderTop: '2px solid #dadce0' } },
    [getCellKey(9, 7)]: { raw: 'Target Met', style: { bold: true, textAlign: 'center', backgroundColor: '#e6f4ea', color: '#137333', borderTop: '2px solid #dadce0' } },

    // KPI Metrics Section
    [getCellKey(11, 0)]: { raw: 'Key Financial Metrics', style: { bold: true, fontSize: 13, color: '#202124' } },
    [getCellKey(12, 0)]: { raw: 'Max Single Revenue:', style: { color: '#5f6368' } },
    [getCellKey(12, 1)]: { raw: '=MAX(D5:D9)', style: { bold: true, format: 'currency' } },
    [getCellKey(12, 3)]: { raw: 'Min Single Revenue:', style: { color: '#5f6368' } },
    [getCellKey(12, 4)]: { raw: '=MIN(D5:D9)', style: { bold: true, format: 'currency' } },

    [getCellKey(13, 0)]: { raw: 'Product Streams Count:', style: { color: '#5f6368' } },
    [getCellKey(13, 1)]: { raw: '=COUNTA(A5:A9)', style: { bold: true, format: 'number' } },
    [getCellKey(13, 3)]: { raw: 'High Margin Products:', style: { color: '#5f6368' } },
    [getCellKey(13, 4)]: { raw: '=COUNTIF(H5:H9, "High Margin")', style: { bold: true, format: 'number' } },
  };

  const rawSheet1: SheetData = {
    id: 'sheet-1',
    name: 'Quarterly Financials',
    cells: sheet1Cells,
    rowHeights: { 0: 38, 3: 28, 9: 28 },
    colWidths: { 0: 170, 1: 100, 2: 110, 3: 130, 4: 120, 5: 120, 6: 95, 7: 130 },
    mergedCells: [],
  };

  // Sheet 2: Sales Pipeline
  const sheet2Cells: Record<string, CellData> = {
    [getCellKey(0, 0)]: { raw: 'Client Account', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb' } },
    [getCellKey(0, 1)]: { raw: 'Lead Owner', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb' } },
    [getCellKey(0, 2)]: { raw: 'Deal Stage', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb' } },
    [getCellKey(0, 3)]: { raw: 'Probability', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb', textAlign: 'right' } },
    [getCellKey(0, 4)]: { raw: 'Deal Value', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb', textAlign: 'right' } },
    [getCellKey(0, 5)]: { raw: 'Weighted Forecast', style: { bold: true, backgroundColor: '#f3e8fd', color: '#7627bb', textAlign: 'right' } },

    [getCellKey(1, 0)]: { raw: 'Acme Corp' },
    [getCellKey(1, 1)]: { raw: 'Sarah Jenkins' },
    [getCellKey(1, 2)]: { raw: 'Proposal Sent' },
    [getCellKey(1, 3)]: { raw: '0.75', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(1, 4)]: { raw: '45000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(1, 5)]: { raw: '=D2*E2', style: { format: 'currency', textAlign: 'right' } },

    [getCellKey(2, 0)]: { raw: 'Globex Industries' },
    [getCellKey(2, 1)]: { raw: 'Alex Rivera' },
    [getCellKey(2, 2)]: { raw: 'Negotiation' },
    [getCellKey(2, 3)]: { raw: '0.90', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(2, 4)]: { raw: '88000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(2, 5)]: { raw: '=D3*E3', style: { format: 'currency', textAlign: 'right' } },

    [getCellKey(3, 0)]: { raw: 'Initech Systems' },
    [getCellKey(3, 1)]: { raw: 'Sarah Jenkins' },
    [getCellKey(3, 2)]: { raw: 'Discovery' },
    [getCellKey(3, 3)]: { raw: '0.30', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(3, 4)]: { raw: '24000', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(3, 5)]: { raw: '=D4*E4', style: { format: 'currency', textAlign: 'right' } },

    [getCellKey(4, 0)]: { raw: 'Soylent Health' },
    [getCellKey(4, 1)]: { raw: 'Marcus Chen' },
    [getCellKey(4, 2)]: { raw: 'Closed Won' },
    [getCellKey(4, 3)]: { raw: '1.00', style: { format: 'percent', textAlign: 'right' } },
    [getCellKey(4, 4)]: { raw: '62500', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(4, 5)]: { raw: '=D5*E5', style: { format: 'currency', textAlign: 'right' } },

    [getCellKey(5, 0)]: { raw: 'Total Forecast', style: { bold: true, backgroundColor: '#f1f3f4' } },
    [getCellKey(5, 1)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(5, 2)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(5, 3)]: { raw: '=AVERAGE(D2:D5)', style: { bold: true, format: 'percent', textAlign: 'right', backgroundColor: '#f1f3f4' } },
    [getCellKey(5, 4)]: { raw: '=SUM(E2:E5)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4' } },
    [getCellKey(5, 5)]: { raw: '=SUM(F2:F5)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4' } },
  };

  const rawSheet2: SheetData = {
    id: 'sheet-2',
    name: 'Sales Pipeline',
    cells: sheet2Cells,
    rowHeights: { 0: 28, 5: 28 },
    colWidths: { 0: 160, 1: 130, 2: 130, 3: 110, 4: 120, 5: 140 },
    mergedCells: [],
  };

  // Sheet 3: Inventory Tracker
  const sheet3Cells: Record<string, CellData> = {
    [getCellKey(0, 0)]: { raw: 'SKU', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333' } },
    [getCellKey(0, 1)]: { raw: 'Item Description', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333' } },
    [getCellKey(0, 2)]: { raw: 'Category', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333' } },
    [getCellKey(0, 3)]: { raw: 'Stock Qty', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333', textAlign: 'right' } },
    [getCellKey(0, 4)]: { raw: 'Reorder Level', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333', textAlign: 'right' } },
    [getCellKey(0, 5)]: { raw: 'Unit Cost', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333', textAlign: 'right' } },
    [getCellKey(0, 6)]: { raw: 'Total Value', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333', textAlign: 'right' } },
    [getCellKey(0, 7)]: { raw: 'Status', style: { bold: true, backgroundColor: '#e6f4ea', color: '#137333', textAlign: 'center' } },

    [getCellKey(1, 0)]: { raw: 'SKU-1001' },
    [getCellKey(1, 1)]: { raw: 'UltraWide Monitor 34"' },
    [getCellKey(1, 2)]: { raw: 'Hardware' },
    [getCellKey(1, 3)]: { raw: '42', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(1, 4)]: { raw: '20', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(1, 5)]: { raw: '380', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(1, 6)]: { raw: '=D2*F2', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(1, 7)]: { raw: '=IF(D2<=E2, "Reorder Alert", "Optimal")', style: { textAlign: 'center' } },

    [getCellKey(2, 0)]: { raw: 'SKU-1002' },
    [getCellKey(2, 1)]: { raw: 'Ergonomic Desk Chair' },
    [getCellKey(2, 2)]: { raw: 'Furniture' },
    [getCellKey(2, 3)]: { raw: '14', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(2, 4)]: { raw: '25', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(2, 5)]: { raw: '220', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(2, 6)]: { raw: '=D3*F3', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(2, 7)]: { raw: '=IF(D3<=E3, "Reorder Alert", "Optimal")', style: { textAlign: 'center', color: '#d93025', bold: true } },

    [getCellKey(3, 0)]: { raw: 'SKU-1003' },
    [getCellKey(3, 1)]: { raw: 'Mechanical Keyboard' },
    [getCellKey(3, 2)]: { raw: 'Accessories' },
    [getCellKey(3, 3)]: { raw: '95', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(3, 4)]: { raw: '30', style: { format: 'number', textAlign: 'right' } },
    [getCellKey(3, 5)]: { raw: '85', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(3, 6)]: { raw: '=D4*F4', style: { format: 'currency', textAlign: 'right' } },
    [getCellKey(3, 7)]: { raw: '=IF(D4<=E4, "Reorder Alert", "Optimal")', style: { textAlign: 'center' } },

    [getCellKey(4, 0)]: { raw: 'Total Inventory Valuation', style: { bold: true, backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 1)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 2)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 3)]: { raw: '=SUM(D2:D4)', style: { bold: true, format: 'number', textAlign: 'right', backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 4)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 5)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 6)]: { raw: '=SUM(G2:G4)', style: { bold: true, format: 'currency', textAlign: 'right', backgroundColor: '#f1f3f4' } },
    [getCellKey(4, 7)]: { raw: '', style: { backgroundColor: '#f1f3f4' } },
  };

  const rawSheet3: SheetData = {
    id: 'sheet-3',
    name: 'Inventory Valuation',
    cells: sheet3Cells,
    rowHeights: { 0: 28, 4: 28 },
    colWidths: { 0: 100, 1: 180, 2: 120, 3: 95, 4: 110, 5: 100, 6: 120, 7: 130 },
    mergedCells: [],
  };

  return {
    id: 'doc-initial',
    title: 'Untitled Spreadsheet - Financial & KPI Model',
    sheets: [
      recalculateSheet(rawSheet1),
      recalculateSheet(rawSheet2),
      recalculateSheet(rawSheet3),
    ],
    activeSheetId: 'sheet-1',
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}
