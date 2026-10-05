import React, { useState, useRef } from 'react';
import {
  FolderOpen,
  Upload,
  Globe,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  FileText,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import {
  parseCSV,
  importXLSXToDocument,
  createEmptySheet,
  parseGoogleSheetUrl,
} from '../utils/fileIO';
import { CellData, SheetData, SpreadsheetDocument } from '../types/spreadsheet';
import { getCellKey } from '../utils/cellUtils';
import { recalculateSheet } from '../utils/formulaEngine';
import { createDefaultDocument } from '../data/sampleSheets';

interface ImportModalProps {
  onClose: () => void;
  onLoadDocument: (doc: SpreadsheetDocument) => void;
}

export const ImportModal: React.FC<ImportModalProps> = ({
  onClose,
  onLoadDocument,
}) => {
  const [activeTab, setActiveTab] = useState<'url' | 'file' | 'paste' | 'templates'>('url');
  const [sheetUrl, setSheetUrl] = useState(
    'https://docs.google.com/spreadsheets/d/13oFdBSZjwgQDeG-bMSANo3LzSH8ha0lbKrXqTXrbA5I/edit?gid=633733787'
  );
  const [pastedData, setPastedData] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: 'info' | 'error' | 'success' } | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle Google Sheet URL connect / import
  const handleImportUrl = async () => {
    if (!sheetUrl.trim()) return;
    setIsLoading(true);
    setStatusMessage({ text: 'Connecting to Google Sheets...', type: 'info' });

    const { sheetId, gid } = parseGoogleSheetUrl(sheetUrl);
    if (!sheetId) {
      setIsLoading(false);
      setStatusMessage({
        text: 'Invalid Google Sheet URL. Please ensure it contains /spreadsheets/d/[SHEET_ID]',
        type: 'error',
      });
      return;
    }

    try {
      // Attempt fetching public CSV export
      const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gid ? `&gid=${gid}` : ''}`;
      const response = await fetch(exportUrl);

      if (response.ok) {
        const text = await response.text();
        // Check if response returned HTML login page instead of CSV
        if (text.includes('<html') || text.includes('accounts.google.com')) {
          throw new Error('This Google Sheet requires access permissions. You can also export it as CSV/XLSX and upload it below, or paste the table cells directly!');
        }

        const rows = parseCSV(text);
        const cells: Record<string, CellData> = {};
        for (let r = 0; r < rows.length; r++) {
          for (let c = 0; c < rows[r].length; c++) {
            const val = rows[r][c];
            if (val !== '') {
              cells[getCellKey(r, c)] = { raw: val };
            }
          }
        }

        const rawSheet: SheetData = {
          id: `sheet-${Date.now()}`,
          name: `Sheet (gid: ${gid || '0'})`,
          cells,
          rowHeights: {},
          colWidths: {},
          mergedCells: [],
        };

        const newDoc: SpreadsheetDocument = {
          id: `doc-${Date.now()}`,
          title: `Google Sheet - ${sheetId.substring(0, 8)}...`,
          sheets: [recalculateSheet(rawSheet)],
          activeSheetId: rawSheet.id,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };

        onLoadDocument(newDoc);
        onClose();
      } else {
        throw new Error('Could not fetch sheet data directly. (Google permissions or CORS restricted)');
      }
    } catch (err: any) {
      setIsLoading(false);
      setStatusMessage({
        text: err?.message || 'Access restricted. Please use the "Paste Data" or "Upload File" tab to import your Google Sheet instantly.',
        type: 'error',
      });
    }
  };

  // Handle file upload (.xlsx, .csv)
  const handleFileUpload = (file: File) => {
    setIsLoading(true);
    setStatusMessage({ text: `Reading ${file.name}...`, type: 'info' });

    const reader = new FileReader();
    const isXLSX = file.name.endsWith('.xlsx') || file.name.endsWith('.xls');

    if (isXLSX) {
      reader.onload = (e) => {
        try {
          const buffer = e.target?.result as ArrayBuffer;
          const doc = importXLSXToDocument(buffer, file.name);
          onLoadDocument(doc);
          onClose();
        } catch (err: any) {
          setIsLoading(false);
          setStatusMessage({ text: 'Error parsing Excel file', type: 'error' });
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      // CSV or plain text
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const rows = parseCSV(text);
          const cells: Record<string, CellData> = {};
          for (let r = 0; r < rows.length; r++) {
            for (let c = 0; c < rows[r].length; c++) {
              const val = rows[r][c];
              if (val !== '') {
                cells[getCellKey(r, c)] = { raw: val };
              }
            }
          }

          const rawSheet: SheetData = {
            id: `sheet-${Date.now()}`,
            name: file.name.replace(/\.[^/.]+$/, ''),
            cells,
            rowHeights: {},
            colWidths: {},
            mergedCells: [],
          };

          const doc: SpreadsheetDocument = {
            id: `doc-${Date.now()}`,
            title: file.name.replace(/\.[^/.]+$/, ''),
            sheets: [recalculateSheet(rawSheet)],
            activeSheetId: rawSheet.id,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };

          onLoadDocument(doc);
          onClose();
        } catch (err) {
          setIsLoading(false);
          setStatusMessage({ text: 'Error parsing CSV file', type: 'error' });
        }
      };
      reader.readAsText(file);
    }
  };

  // Handle pasted TSV/CSV table from Google Sheets
  const handleImportPasted = () => {
    if (!pastedData.trim()) return;

    // Detect if tab-separated (standard clipboard copy from Google Sheets) or comma-separated
    const isTSV = pastedData.includes('\t');
    const lines = pastedData.split(/\r?\n/).filter((l) => l.trim() !== '');

    const cells: Record<string, CellData> = {};
    for (let r = 0; r < lines.length; r++) {
      const line = lines[r];
      const cols = isTSV ? line.split('\t') : parseCSV(line)[0] || [];

      for (let c = 0; c < cols.length; c++) {
        const val = cols[c].trim();
        if (val !== '') {
          cells[getCellKey(r, c)] = { raw: val };
        }
      }
    }

    const rawSheet: SheetData = {
      id: `sheet-${Date.now()}`,
      name: 'Pasted Sheet',
      cells,
      rowHeights: {},
      colWidths: {},
      mergedCells: [],
    };

    const doc: SpreadsheetDocument = {
      id: `doc-${Date.now()}`,
      title: 'Imported Spreadsheet',
      sheets: [recalculateSheet(rawSheet)],
      activeSheetId: rawSheet.id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    onLoadDocument(doc);
    onClose();
  };

  return (
    <div
      id="import-modal-overlay"
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        id="import-modal-container"
        className="bg-[#141417] rounded-xl shadow-2xl border border-[#27272A] w-full max-w-xl p-6 font-sans text-xs text-[#E4E4E7]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#222226] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 flex items-center justify-center font-bold border border-emerald-800/40">
              <FileSpreadsheet className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#F4F4F5] text-sm">Open & Import Spreadsheet</h3>
              <p className="text-[11px] text-[#A1A1AA]">Connect Google Sheets, upload files, or choose templates</p>
            </div>
          </div>
          <button
            id="btn-close-import-modal"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#E4E4E7] text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#222226] mb-4 gap-1">
          <button
            id="tab-import-url"
            onClick={() => setActiveTab('url')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'url' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            <Globe className="w-3.5 h-3.5" />
            Google Sheet URL
          </button>
          <button
            id="tab-import-file"
            onClick={() => setActiveTab('file')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'file' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            Upload File (XLSX / CSV)
          </button>
          <button
            id="tab-import-paste"
            onClick={() => setActiveTab('paste')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'paste' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            Paste Table Data
          </button>
          <button
            id="tab-import-templates"
            onClick={() => setActiveTab('templates')}
            className={`px-3 py-2 font-medium border-b-2 transition-colors cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'templates' ? 'border-emerald-500 text-emerald-400' : 'border-transparent text-[#A1A1AA] hover:text-[#F4F4F5]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            Sample Templates
          </button>
        </div>

        {/* Tab 1: Google Sheet URL */}
        {activeTab === 'url' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[#E4E4E7] font-medium mb-1">
                Google Sheets Link or Spreadsheet ID
              </label>
              <input
                id="input-gsheet-url"
                type="text"
                value={sheetUrl}
                onChange={(e) => setSheetUrl(e.target.value)}
                placeholder="https://docs.google.com/spreadsheets/d/..."
                className="w-full px-3 py-2 bg-[#18181B] border border-[#27272A] rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs font-mono text-[#F4F4F5] placeholder-[#52525B]"
              />
              <p className="text-[11px] text-[#71717A] mt-1">
                Paste any Google Sheet URL to load its data and formula structures.
              </p>
            </div>

            {statusMessage && (
              <div
                id="import-url-status"
                className={`p-2.5 rounded-lg flex items-start gap-2 text-[11px] ${
                  statusMessage.type === 'error'
                    ? 'bg-red-950/40 text-red-300 border border-red-800/60'
                    : 'bg-blue-950/40 text-blue-300 border border-blue-800/60'
                }`}
              >
                {statusMessage.type === 'error' ? (
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
                )}
                <span>{statusMessage.text}</span>
              </div>
            )}

            <div className="pt-2 flex justify-end">
              <button
                id="btn-submit-import-url"
                onClick={handleImportUrl}
                disabled={isLoading || !sheetUrl}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer flex items-center gap-2"
              >
                <span>{isLoading ? 'Connecting...' : 'Load Google Sheet'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Tab 2: File Upload */}
        {activeTab === 'file' && (
          <div className="space-y-4">
            <div
              id="drop-zone-import"
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragOver(true);
              }}
              onDragLeave={() => setIsDragOver(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragOver(false);
                if (e.dataTransfer.files?.[0]) {
                  handleFileUpload(e.dataTransfer.files[0]);
                }
              }}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
                isDragOver ? 'border-emerald-500 bg-emerald-950/30' : 'border-[#27272A] hover:border-[#3F3F46] bg-[#18181B]/50'
              }`}
            >
              <input
                ref={fileInputRef}
                id="file-upload-input"
                type="file"
                accept=".xlsx,.xls,.csv,.tsv"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    handleFileUpload(e.target.files[0]);
                  }
                }}
              />
              <div className="w-12 h-12 bg-[#1F1F24] border border-[#27272A] rounded-full shadow-xs mx-auto flex items-center justify-center text-emerald-400 mb-3">
                <Upload className="w-6 h-6" />
              </div>
              <p className="font-semibold text-[#F4F4F5] text-sm">
                Drag and drop your spreadsheet file here
              </p>
              <p className="text-[#A1A1AA] text-[11px] mt-1">
                Supports Microsoft Excel (.xlsx, .xls) and CSV (.csv)
              </p>
            </div>

            {statusMessage && (
              <div className="text-[11px] text-blue-400 text-center font-medium">
                {statusMessage.text}
              </div>
            )}
          </div>
        )}

        {/* Tab 3: Paste Data */}
        {activeTab === 'paste' && (
          <div className="space-y-3">
            <div>
              <label className="block text-[#E4E4E7] font-medium mb-1">
                Paste copied cells from Google Sheets or Excel (Ctrl+V)
              </label>
              <textarea
                id="textarea-pasted-data"
                rows={6}
                value={pastedData}
                onChange={(e) => setPastedData(e.target.value)}
                placeholder="Product&#9;Price&#9;Qty&#9;Total&#10;Cloud Tier A&#9;150&#9;10&#9;1500"
                className="w-full px-3 py-2 bg-[#18181B] border border-[#27272A] rounded-lg focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 outline-none text-xs font-mono text-[#F4F4F5] placeholder-[#52525B]"
              />
            </div>

            <div className="pt-2 flex justify-end">
              <button
                id="btn-submit-pasted-data"
                onClick={handleImportPasted}
                disabled={!pastedData.trim()}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-medium rounded-lg disabled:opacity-50 transition-colors cursor-pointer"
              >
                Import Pasted Data
              </button>
            </div>
          </div>
        )}

        {/* Tab 4: Sample Templates */}
        {activeTab === 'templates' && (
          <div className="grid grid-cols-2 gap-3">
            <button
              id="tpl-financial-kpi"
              onClick={() => {
                onLoadDocument(createDefaultDocument());
                onClose();
              }}
              className="p-3 border border-[#27272A] bg-[#18181B]/40 rounded-lg text-left hover:border-emerald-500/60 hover:bg-emerald-950/20 transition-all cursor-pointer group"
            >
              <div className="font-semibold text-[#F4F4F5] group-hover:text-emerald-400 text-xs">
                Quarterly Financials & KPI Model
              </div>
              <p className="text-[#A1A1AA] text-[11px] mt-1">
                Complete with SUM, AVERAGE, profit margins, formulas, and formatted metrics.
              </p>
            </button>

            <button
              id="tpl-blank-sheet"
              onClick={() => {
                const emptySheet = createEmptySheet('Sheet1');
                onLoadDocument({
                  id: `doc-${Date.now()}`,
                  title: 'Untitled Spreadsheet',
                  sheets: [emptySheet],
                  activeSheetId: emptySheet.id,
                  createdAt: Date.now(),
                  updatedAt: Date.now(),
                });
                onClose();
              }}
              className="p-3 border border-[#27272A] bg-[#18181B]/40 rounded-lg text-left hover:border-emerald-500/60 hover:bg-emerald-950/20 transition-all cursor-pointer group"
            >
              <div className="font-semibold text-[#F4F4F5] group-hover:text-emerald-400 text-xs">
                Blank Spreadsheet
              </div>
              <p className="text-[#A1A1AA] text-[11px] mt-1">
                Clean, empty canvas ready for custom data models and calculations.
              </p>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
