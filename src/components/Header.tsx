import React, { useState, useRef, useEffect } from 'react';
import {
  FileSpreadsheet,
  FolderOpen,
  Download,
  Printer,
  Undo2,
  Redo2,
  Trash2,
  FilePlus,
  Table,
  BarChart2,
  Search,
  Share2,
  CloudCheck,
  Globe,
  SlidersHorizontal,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { SpreadsheetDocument } from '../types/spreadsheet';

interface HeaderProps {
  document: SpreadsheetDocument;
  onUpdateTitle: (title: string) => void;
  onNewDocument: () => void;
  onOpenImportModal: () => void;
  onOpenFindReplaceModal: () => void;
  onOpenChartModal: () => void;
  onExportCSV: () => void;
  onExportXLSX: () => void;
  onExportJSON: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onInsertRow: () => void;
  onInsertColumn: () => void;
  onDeleteRow: () => void;
  onDeleteColumn: () => void;
  onClearContents: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  document,
  onUpdateTitle,
  onNewDocument,
  onOpenImportModal,
  onOpenFindReplaceModal,
  onOpenChartModal,
  onExportCSV,
  onExportXLSX,
  onExportJSON,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onInsertRow,
  onInsertColumn,
  onDeleteRow,
  onDeleteColumn,
  onClearContents,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [titleInput, setTitleInput] = useState(document.title);
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setTitleInput(document.title);
  }, [document.title]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenu(null);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleTitleSubmit = () => {
    setIsEditingTitle(false);
    if (titleInput.trim()) {
      onUpdateTitle(titleInput.trim());
    } else {
      setTitleInput(document.title);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleCopyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  return (
    <header id="spreadsheet-header" className="bg-[#0F0F12] border-b border-[#222226] select-none text-xs text-[#E4E4E7]">
      <div className="flex items-center justify-between px-3 pt-2 pb-1">
        <div className="flex items-center gap-3">
          {/* Sheets Icon */}
          <div
            id="app-logo-badge"
            className="w-10 h-10 rounded-lg bg-emerald-600/90 hover:bg-emerald-500 flex items-center justify-center text-white shadow-sm cursor-pointer transition-colors"
            title="Google Sheets Replica - Interactive Spreadsheet"
            onClick={onOpenImportModal}
          >
            <FileSpreadsheet className="w-6 h-6" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              {isEditingTitle ? (
                <input
                  id="spreadsheet-title-input"
                  type="text"
                  value={titleInput}
                  onChange={(e) => setTitleInput(e.target.value)}
                  onBlur={handleTitleSubmit}
                  onKeyDown={(e) => e.key === 'Enter' && handleTitleSubmit()}
                  autoFocus
                  className="text-lg font-medium text-[#F4F4F5] bg-[#18181B] border border-blue-500 rounded px-1.5 py-0.5 outline-none"
                />
              ) : (
                <h1
                  id="spreadsheet-title"
                  onClick={() => setIsEditingTitle(true)}
                  className="text-lg font-medium text-[#F4F4F5] hover:bg-[#1E1E22] rounded px-1.5 py-0.5 cursor-pointer truncate max-w-md transition-colors"
                  title="Click to rename document"
                >
                  {document.title}
                </h1>
              )}

              <span className="flex items-center gap-1 text-[11px] text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                Saved locally
              </span>
            </div>

            {/* Top Menu Bar */}
            <div ref={menuRef} className="flex items-center gap-0.5 mt-0.5 relative text-[#D4D4D8] font-normal">
              {/* File Menu */}
              <div className="relative">
                <button
                  id="menu-btn-file"
                  onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                  onMouseEnter={() => activeMenu && setActiveMenu('file')}
                  className={`px-2 py-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors ${
                    activeMenu === 'file' ? 'bg-[#222226] text-[#FFFFFF] font-medium' : ''
                  }`}
                >
                  File
                </button>
                {activeMenu === 'file' && (
                  <div
                    id="menu-dropdown-file"
                    className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl shadow-black/80 py-1.5 w-60 z-50 text-xs text-[#E4E4E7]"
                  >
                    <button
                      id="menu-file-new"
                      onClick={() => {
                        onNewDocument();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <FilePlus className="w-4 h-4 text-[#A1A1AA]" />
                      <span>New spreadsheet</span>
                    </button>
                    <button
                      id="menu-file-import"
                      onClick={() => {
                        onOpenImportModal();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <FolderOpen className="w-4 h-4 text-[#A1A1AA]" />
                      <span>Open / Import Google Sheet...</span>
                    </button>
                    <div className="my-1 border-t border-[#222226]" />
                    <button
                      id="menu-file-export-xlsx"
                      onClick={() => {
                        onExportXLSX();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-emerald-400" />
                      <span>Download as Excel (.xlsx)</span>
                    </button>
                    <button
                      id="menu-file-export-csv"
                      onClick={() => {
                        onExportCSV();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-blue-400" />
                      <span>Download as CSV (.csv)</span>
                    </button>
                    <button
                      id="menu-file-export-json"
                      onClick={() => {
                        onExportJSON();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <Download className="w-4 h-4 text-amber-400" />
                      <span>Download as JSON (.json)</span>
                    </button>
                    <div className="my-1 border-t border-[#222226]" />
                    <button
                      id="menu-file-print"
                      onClick={() => {
                        handlePrint();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
                    >
                      <Printer className="w-4 h-4 text-[#A1A1AA]" />
                      <span>Print (Ctrl+P)</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Edit Menu */}
              <div className="relative">
                <button
                  id="menu-btn-edit"
                  onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                  onMouseEnter={() => activeMenu && setActiveMenu('edit')}
                  className={`px-2 py-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors ${
                    activeMenu === 'edit' ? 'bg-[#222226] text-[#FFFFFF] font-medium' : ''
                  }`}
                >
                  Edit
                </button>
                {activeMenu === 'edit' && (
                  <div
                    id="menu-dropdown-edit"
                    className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl shadow-black/80 py-1.5 w-56 z-50 text-xs text-[#E4E4E7]"
                  >
                    <button
                      id="menu-edit-undo"
                      disabled={!canUndo}
                      onClick={() => {
                        onUndo();
                        setActiveMenu(null);
                      }}
                      className={`w-full text-left px-4 py-1.5 flex items-center justify-between cursor-pointer ${
                        canUndo ? 'hover:bg-[#1F1F24] hover:text-white' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Undo2 className="w-4 h-4" /> Undo
                      </span>
                      <span className="text-[#71717A] text-[10px]">Ctrl+Z</span>
                    </button>
                    <button
                      id="menu-edit-redo"
                      disabled={!canRedo}
                      onClick={() => {
                        onRedo();
                        setActiveMenu(null);
                      }}
                      className={`w-full text-left px-4 py-1.5 flex items-center justify-between cursor-pointer ${
                        canRedo ? 'hover:bg-[#1F1F24] hover:text-white' : 'opacity-40 cursor-not-allowed'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Redo2 className="w-4 h-4" /> Redo
                      </span>
                      <span className="text-[#71717A] text-[10px]">Ctrl+Y</span>
                    </button>
                    <div className="my-1 border-t border-[#222226]" />
                    <button
                      id="menu-edit-find-replace"
                      onClick={() => {
                        onOpenFindReplaceModal();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center justify-between cursor-pointer"
                    >
                      <span className="flex items-center gap-2">
                        <Search className="w-4 h-4" /> Find and replace
                      </span>
                      <span className="text-[#71717A] text-[10px]">Ctrl+H</span>
                    </button>
                    <button
                      id="menu-edit-clear"
                      onClick={() => {
                        onClearContents();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 hover:text-red-400 flex items-center gap-2 text-red-400 cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" /> Clear selected cells
                    </button>
                  </div>
                )}
              </div>

              {/* Insert Menu */}
              <div className="relative">
                <button
                  id="menu-btn-insert"
                  onClick={() => setActiveMenu(activeMenu === 'insert' ? null : 'insert')}
                  onMouseEnter={() => activeMenu && setActiveMenu('insert')}
                  className={`px-2 py-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors ${
                    activeMenu === 'insert' ? 'bg-[#222226] text-[#FFFFFF] font-medium' : ''
                  }`}
                >
                  Insert
                </button>
                {activeMenu === 'insert' && (
                  <div
                    id="menu-dropdown-insert"
                    className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl shadow-black/80 py-1.5 w-56 z-50 text-xs text-[#E4E4E7]"
                  >
                    <button
                      id="menu-insert-row"
                      onClick={() => {
                        onInsertRow();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Table className="w-4 h-4 text-[#A1A1AA]" /> Insert 1 row above
                    </button>
                    <button
                      id="menu-insert-col"
                      onClick={() => {
                        onInsertColumn();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Table className="w-4 h-4 text-[#A1A1AA]" /> Insert 1 column left
                    </button>
                    <div className="my-1 border-t border-[#222226]" />
                    <button
                      id="menu-insert-chart"
                      onClick={() => {
                        onOpenChartModal();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <BarChart2 className="w-4 h-4 text-blue-400" /> Chart visualization
                    </button>
                  </div>
                )}
              </div>

              {/* Data Menu */}
              <div className="relative">
                <button
                  id="menu-btn-data"
                  onClick={() => setActiveMenu(activeMenu === 'data' ? null : 'data')}
                  onMouseEnter={() => activeMenu && setActiveMenu('data')}
                  className={`px-2 py-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors ${
                    activeMenu === 'data' ? 'bg-[#222226] text-[#FFFFFF] font-medium' : ''
                  }`}
                >
                  Data
                </button>
                {activeMenu === 'data' && (
                  <div
                    id="menu-dropdown-data"
                    className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl shadow-black/80 py-1.5 w-56 z-50 text-xs text-[#E4E4E7]"
                  >
                    <button
                      id="menu-data-delete-row"
                      onClick={() => {
                        onDeleteRow();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 text-red-400 cursor-pointer"
                    >
                      Delete selected row
                    </button>
                    <button
                      id="menu-data-delete-col"
                      onClick={() => {
                        onDeleteColumn();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 text-red-400 cursor-pointer"
                    >
                      Delete selected column
                    </button>
                  </div>
                )}
              </div>

              {/* Help & Templates */}
              <div className="relative">
                <button
                  id="menu-btn-help"
                  onClick={() => setActiveMenu(activeMenu === 'help' ? null : 'help')}
                  onMouseEnter={() => activeMenu && setActiveMenu('help')}
                  className={`px-2 py-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors ${
                    activeMenu === 'help' ? 'bg-[#222226] text-[#FFFFFF] font-medium' : ''
                  }`}
                >
                  Help
                </button>
                {activeMenu === 'help' && (
                  <div
                    id="menu-dropdown-help"
                    className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl shadow-black/80 py-1.5 w-64 z-50 text-xs text-[#E4E4E7]"
                  >
                    <div className="px-4 py-2 text-[#A1A1AA] border-b border-[#222226]">
                      <div className="font-semibold text-[#F4F4F5]">Keyboard Shortcuts</div>
                      <div className="mt-1 space-y-1 text-[11px]">
                        <div><kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Enter</kbd> : Next row</div>
                        <div><kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Tab</kbd> : Next column</div>
                        <div><kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Ctrl+Z</kbd> / <kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Ctrl+Y</kbd> : Undo / Redo</div>
                        <div><kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Del</kbd> / <kbd className="bg-[#1F1F24] border border-[#2E2E34] px-1 rounded text-[#D4D4D8]">Backspace</kbd> : Clear</div>
                      </div>
                    </div>
                    <button
                      id="menu-help-samples"
                      onClick={() => {
                        onOpenImportModal();
                        setActiveMenu(null);
                      }}
                      className="w-full text-left px-4 py-2 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Browse Sample Templates</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="header-import-gsheet-btn"
            onClick={onOpenImportModal}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-emerald-500/40 text-emerald-400 bg-emerald-950/40 hover:bg-emerald-900/60 font-medium transition-colors cursor-pointer text-xs"
            title="Import Google Sheet or Excel file"
          >
            <Globe className="w-3.5 h-3.5" />
            <span>Connect Sheet</span>
          </button>

          <button
            id="header-share-btn"
            onClick={() => setShowShareModal(true)}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm transition-colors cursor-pointer text-xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share & Export</span>
          </button>
        </div>
      </div>

      {/* Share / Export Modal Dialog */}
      {showShareModal && (
        <div
          id="share-modal-overlay"
          className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
          onClick={() => setShowShareModal(false)}
        >
          <div
            id="share-modal-content"
            className="bg-[#141417] rounded-xl shadow-2xl border border-[#27272A] w-full max-w-md p-6 text-[#E4E4E7]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between pb-3 border-b border-[#222226]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-950/60 text-emerald-400 border border-emerald-800/50 flex items-center justify-center font-bold">
                  <Share2 className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-semibold text-[#F4F4F5] text-sm">Share Spreadsheet</h3>
                  <p className="text-[11px] text-[#A1A1AA]">Export or share access to this sheet</p>
                </div>
              </div>
              <button
                id="share-modal-close-btn"
                onClick={() => setShowShareModal(false)}
                className="text-[#71717A] hover:text-[#F4F4F5] text-lg leading-none cursor-pointer"
              >
                &times;
              </button>
            </div>

            <div className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-medium text-[#D4D4D8] block mb-1">Spreadsheet Link</label>
                <div className="flex items-center gap-2">
                  <input
                    id="share-url-input"
                    type="text"
                    readOnly
                    value={window.location.href}
                    className="flex-1 bg-[#18181B] border border-[#2E2E34] rounded-lg px-3 py-1.5 text-xs text-[#E4E4E7] outline-none"
                  />
                  <button
                    id="share-copy-link-btn"
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-medium text-xs cursor-pointer"
                  >
                    {copiedLink ? 'Copied!' : 'Copy'}
                  </button>
                </div>
              </div>

              <div className="border-t border-[#222226] pt-3">
                <label className="text-xs font-medium text-[#D4D4D8] block mb-2">Instant Downloads</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    id="share-download-xlsx"
                    onClick={() => {
                      onExportXLSX();
                      setShowShareModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-[#2E2E34] bg-[#18181B] rounded-lg hover:bg-[#1F1F24] hover:border-emerald-500/50 text-emerald-400 font-medium text-xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Microsoft Excel (.xlsx)
                  </button>
                  <button
                    id="share-download-csv"
                    onClick={() => {
                      onExportCSV();
                      setShowShareModal(false);
                    }}
                    className="flex items-center justify-center gap-2 px-3 py-2 border border-[#2E2E34] bg-[#18181B] rounded-lg hover:bg-[#1F1F24] hover:border-blue-500/50 text-blue-400 font-medium text-xs cursor-pointer transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    CSV File (.csv)
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
