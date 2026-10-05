import React, { useState, useRef } from 'react';
import {
  Undo2,
  Redo2,
  Download,
  Upload,
  Trash2,
  HelpCircle,
  Sparkles,
  Check,
  ChevronDown,
  FileImage,
  Code,
  FileJson,
} from 'lucide-react';

interface CanvasHeaderProps {
  canvasTitle: string;
  onChangeTitle: (title: string) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onClear: () => void;
  onExportPNG: (transparent: boolean) => void;
  onExportSVG: () => void;
  onExportJSON: () => void;
  onImportJSON: (jsonStr: string) => void;
  onOpenShortcuts: () => void;
}

export const CanvasHeader: React.FC<CanvasHeaderProps> = ({
  canvasTitle,
  onChangeTitle,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onClear,
  onExportPNG,
  onExportSVG,
  onExportJSON,
  onImportJSON,
  onOpenShortcuts,
}) => {
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(e.target as Node)) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const content = event.target?.result as string;
        if (content) {
          onImportJSON(content);
        }
      };
      reader.readAsText(file);
      e.target.value = '';
    }
  };

  return (
    <div
      id="canvas-header-bar"
      className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none"
    >
      {/* Hidden File Input for JSON import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Left: App Title & Document Name */}
      <div className="flex items-center gap-3 pointer-events-auto bg-[#141417]/90 backdrop-blur-md border border-[#27272A] px-3.5 py-2 rounded-2xl shadow-xl">
        <div className="w-7 h-7 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-xs">
          <Sparkles className="w-4 h-4" />
        </div>
        <input
          id="canvas-title-input"
          value={canvasTitle}
          onChange={(e) => onChangeTitle(e.target.value)}
          className="bg-transparent border-b border-transparent hover:border-[#3F3F46] focus:border-blue-500 font-semibold text-sm text-[#F4F4F5] outline-none px-1 py-0.5 max-w-[160px] transition-colors"
          placeholder="Untitled Canvas"
        />
      </div>

      {/* Right Controls: Undo/Redo, Clear, Export, Import, Shortcuts */}
      <div className="flex items-center gap-1.5 pointer-events-auto bg-[#141417]/90 backdrop-blur-md border border-[#27272A] p-1.5 rounded-2xl shadow-xl text-[#E4E4E7]">
        {/* Undo */}
        <button
          id="btn-canvas-undo"
          onClick={onUndo}
          disabled={!canUndo}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] disabled:opacity-30 transition-all cursor-pointer"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="w-4 h-4" />
        </button>

        {/* Redo */}
        <button
          id="btn-canvas-redo"
          onClick={onRedo}
          disabled={!canRedo}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] disabled:opacity-30 transition-all cursor-pointer"
          title="Redo (Ctrl+Y)"
        >
          <Redo2 className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#27272A] mx-0.5" />

        {/* Clear Canvas */}
        <div className="relative">
          <button
            id="btn-canvas-clear"
            onClick={() => setIsClearConfirmOpen(true)}
            className="p-2 rounded-xl text-[#A1A1AA] hover:text-red-400 hover:bg-[#222226] transition-all cursor-pointer"
            title="Clear Canvas"
          >
            <Trash2 className="w-4 h-4" />
          </button>

          {isClearConfirmOpen && (
            <div
              id="clear-confirm-popup"
              className="absolute right-0 top-full mt-2 bg-[#18181B] border border-[#27272A] p-3 rounded-xl shadow-2xl z-50 w-56 text-xs text-[#E4E4E7] select-none"
            >
              <p className="font-medium text-[#F4F4F5] mb-2">Clear entire canvas?</p>
              <div className="flex items-center justify-end gap-2">
                <button
                  onClick={() => setIsClearConfirmOpen(false)}
                  className="px-2.5 py-1 rounded-lg hover:bg-[#27272A] text-[#A1A1AA] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    onClear();
                    setIsClearConfirmOpen(false);
                  }}
                  className="px-2.5 py-1 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg cursor-pointer transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Import JSON */}
        <button
          id="btn-canvas-import"
          onClick={() => fileInputRef.current?.click()}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer"
          title="Import Canvas Project (.json)"
        >
          <Upload className="w-4 h-4" />
        </button>

        {/* Export Dropdown */}
        <div ref={exportDropdownRef} className="relative">
          <button
            id="btn-canvas-export-dropdown"
            onClick={() => setIsExportOpen(!isExportOpen)}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
            <ChevronDown className="w-3 h-3" />
          </button>

          {isExportOpen && (
            <div
              id="export-options-menu"
              className="absolute right-0 top-full mt-2 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl p-1.5 w-48 z-50 text-xs text-[#E4E4E7] space-y-0.5 font-sans select-none"
            >
              <button
                id="export-png-bg"
                onClick={() => {
                  onExportPNG(false);
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#222226] hover:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <FileImage className="w-4 h-4 text-blue-400" />
                <div>
                  <div className="font-medium text-[#F4F4F5]">PNG Image</div>
                  <div className="text-[10px] text-[#71717A]">With background</div>
                </div>
              </button>

              <button
                id="export-png-transparent"
                onClick={() => {
                  onExportPNG(true);
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#222226] hover:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <FileImage className="w-4 h-4 text-emerald-400" />
                <div>
                  <div className="font-medium text-[#F4F4F5]">PNG Image</div>
                  <div className="text-[10px] text-[#71717A]">Transparent background</div>
                </div>
              </button>

              <button
                id="export-svg"
                onClick={() => {
                  onExportSVG();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#222226] hover:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <Code className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium text-[#F4F4F5]">SVG Vector</div>
                  <div className="text-[10px] text-[#71717A]">Scalable vector file</div>
                </div>
              </button>

              <button
                id="export-json"
                onClick={() => {
                  onExportJSON();
                  setIsExportOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#222226] hover:text-white flex items-center gap-2.5 cursor-pointer"
              >
                <FileJson className="w-4 h-4 text-purple-400" />
                <div>
                  <div className="font-medium text-[#F4F4F5]">Save Project</div>
                  <div className="text-[10px] text-[#71717A]">JSON canvas data</div>
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="w-px h-5 bg-[#27272A] mx-0.5" />

        {/* Shortcuts */}
        <button
          id="btn-canvas-shortcuts"
          onClick={onOpenShortcuts}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer"
          title="Keyboard Shortcuts (?)"
        >
          <HelpCircle className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
