import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  Plus,
  ChevronDown,
  Trash2,
  Copy,
  Edit2,
  Palette,
  Sigma,
} from 'lucide-react';
import { CellRange, SheetData } from '../types/spreadsheet';
import { getCellKey, normalizeRange } from '../utils/cellUtils';
import { ColorPicker } from './ColorPicker';

interface SheetTabsProps {
  sheets: SheetData[];
  activeSheetId: string;
  selectionRange: CellRange;
  onSelectSheet: (id: string) => void;
  onAddSheet: () => void;
  onRenameSheet: (id: string, newName: string) => void;
  onDuplicateSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  onSetSheetTabColor: (id: string, color: string) => void;
}

export const SheetTabs: React.FC<SheetTabsProps> = ({
  sheets,
  activeSheetId,
  selectionRange,
  onSelectSheet,
  onAddSheet,
  onRenameSheet,
  onDuplicateSheet,
  onDeleteSheet,
  onSetSheetTabColor,
}) => {
  const [editingSheetId, setEditingSheetId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [activeMenuSheetId, setActiveMenuSheetId] = useState<string | null>(null);
  const [colorPickerSheetId, setColorPickerSheetId] = useState<string | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setActiveMenuSheetId(null);
        setColorPickerSheetId(null);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleStartRename = (sheet: SheetData) => {
    setEditingSheetId(sheet.id);
    setEditingName(sheet.name);
    setActiveMenuSheetId(null);
  };

  const handleFinishRename = () => {
    if (editingSheetId && editingName.trim()) {
      onRenameSheet(editingSheetId, editingName.trim());
    }
    setEditingSheetId(null);
  };

  // Compute live selection statistics (Sum, Average, Min, Max, Count)
  const currentSheet = sheets.find((s) => s.id === activeSheetId);
  const selectionStats = useMemo(() => {
    if (!currentSheet) return null;
    const norm = normalizeRange(selectionRange);
    const nums: number[] = [];
    let count = 0;

    for (let r = norm.startRow; r <= norm.endRow; r++) {
      for (let c = norm.startCol; c <= norm.endCol; c++) {
        const key = getCellKey(r, c);
        const cell = currentSheet.cells[key];
        if (cell && cell.computed !== null && cell.computed !== undefined && cell.computed !== '') {
          count++;
          const n = typeof cell.computed === 'number' ? cell.computed : parseFloat(String(cell.computed));
          if (!isNaN(n)) {
            nums.push(n);
          }
        }
      }
    }

    if (count === 0) return null;

    const sum = nums.reduce((a, b) => a + b, 0);
    const avg = nums.length > 0 ? sum / nums.length : 0;
    const min = nums.length > 0 ? Math.min(...nums) : 0;
    const max = nums.length > 0 ? Math.max(...nums) : 0;

    return {
      count,
      numCount: nums.length,
      sum: Math.round(sum * 100) / 100,
      avg: Math.round(avg * 100) / 100,
      min,
      max,
    };
  }, [currentSheet, selectionRange]);

  return (
    <div
      id="spreadsheet-bottom-bar"
      className="flex items-center justify-between px-2 bg-[#0F0F12] border-t border-[#222226] select-none text-xs text-[#A1A1AA] min-h-[36px]"
    >
      {/* Left Sheet Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto py-1">
        {/* Add Sheet Button */}
        <button
          id="btn-add-sheet"
          onClick={onAddSheet}
          className="p-1 rounded hover:bg-[#222226] hover:text-[#FFFFFF] transition-colors cursor-pointer text-[#A1A1AA]"
          title="Add Sheet (+)"
        >
          <Plus className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-[#27272A] mx-1" />

        {/* Tab Items */}
        <div ref={menuRef} className="flex items-center gap-1">
          {sheets.map((sheet) => {
            const isActive = sheet.id === activeSheetId;
            const isEditing = sheet.id === editingSheetId;

            return (
              <div
                key={sheet.id}
                id={`sheet-tab-${sheet.id}`}
                onClick={() => onSelectSheet(sheet.id)}
                onDoubleClick={() => handleStartRename(sheet)}
                style={{
                  borderBottomColor: sheet.tabColor || (isActive ? '#3b82f6' : 'transparent'),
                }}
                className={`relative flex items-center gap-1.5 px-3 py-1.5 rounded-t font-medium cursor-pointer transition-all border-b-2 text-xs ${
                  isActive
                    ? 'bg-[#18181B] text-[#F4F4F5] shadow-xs'
                    : 'hover:bg-[#18181B]/70 text-[#A1A1AA] hover:text-[#E4E4E7]'
                }`}
              >
                {sheet.tabColor && (
                  <span
                    className="w-2 h-2 rounded-full shrink-0"
                    style={{ backgroundColor: sheet.tabColor }}
                  />
                )}

                {isEditing ? (
                  <input
                    id={`sheet-rename-input-${sheet.id}`}
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleFinishRename}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') handleFinishRename();
                      if (e.key === 'Escape') setEditingSheetId(null);
                    }}
                    autoFocus
                    className="bg-[#141417] border border-blue-500 rounded px-1 text-xs outline-none w-28 text-[#F4F4F5]"
                  />
                ) : (
                  <span className="truncate max-w-[130px]">{sheet.name}</span>
                )}

                {/* Tab Context Dropdown Trigger */}
                <button
                  id={`sheet-tab-menu-btn-${sheet.id}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    setActiveMenuSheetId(
                      activeMenuSheetId === sheet.id ? null : sheet.id
                    );
                    setColorPickerSheetId(null);
                  }}
                  className="p-0.5 hover:bg-[#222226] rounded text-[#71717A] hover:text-[#E4E4E7] cursor-pointer"
                >
                  <ChevronDown className="w-3 h-3" />
                </button>

                {/* Tab Context Menu */}
                {activeMenuSheetId === sheet.id && (
                  <div
                    id={`sheet-tab-menu-popover-${sheet.id}`}
                    className="absolute left-0 bottom-full mb-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl py-1 w-44 z-50 text-xs text-[#E4E4E7]"
                  >
                    <button
                      id={`tab-action-rename-${sheet.id}`}
                      onClick={() => handleStartRename(sheet)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-[#A1A1AA]" /> Rename
                    </button>
                    <button
                      id={`tab-action-duplicate-${sheet.id}`}
                      onClick={() => {
                        onDuplicateSheet(sheet.id);
                        setActiveMenuSheetId(null);
                      }}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" /> Duplicate
                    </button>
                    <button
                      id={`tab-action-color-${sheet.id}`}
                      onClick={() => setColorPickerSheetId(sheet.id)}
                      className="w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2 cursor-pointer"
                    >
                      <Palette className="w-3.5 h-3.5 text-[#A1A1AA]" /> Change color
                    </button>
                    {sheets.length > 1 && (
                      <>
                        <div className="my-1 border-t border-[#222226]" />
                        <button
                          id={`tab-action-delete-${sheet.id}`}
                          onClick={() => {
                            onDeleteSheet(sheet.id);
                            setActiveMenuSheetId(null);
                          }}
                          className="w-full text-left px-3 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center gap-2 cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" /> Delete sheet
                        </button>
                      </>
                    )}
                  </div>
                )}

                {/* Tab Color Picker */}
                {colorPickerSheetId === sheet.id && (
                  <div className="absolute left-0 bottom-full mb-1 z-50">
                    <ColorPicker
                      currentColor={sheet.tabColor}
                      onChange={(color) => {
                        onSetSheetTabColor(sheet.id, color);
                        setColorPickerSheetId(null);
                        setActiveMenuSheetId(null);
                      }}
                      onClose={() => setColorPickerSheetId(null)}
                      title="Sheet Tab Color"
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Right Real-Time Stats Bar */}
      {selectionStats && (
        <div
          id="status-bar-metrics"
          className="flex items-center gap-3 px-3 py-1 bg-[#141417] border border-[#27272A] rounded-full text-[11px] text-[#A1A1AA] shadow-2xs"
        >
          <span id="metric-count" className="font-medium">
            Count: <strong className="text-[#F4F4F5]">{selectionStats.count}</strong>
          </span>
          {selectionStats.numCount > 0 && (
            <>
              <span className="text-[#3F3F46]">|</span>
              <span id="metric-sum" className="font-medium">
                Sum: <strong className="text-blue-400">${selectionStats.sum.toLocaleString()}</strong>
              </span>
              <span className="text-[#3F3F46]">|</span>
              <span id="metric-avg" className="font-medium">
                Avg: <strong className="text-[#F4F4F5]">{selectionStats.avg.toLocaleString()}</strong>
              </span>
              <span className="text-[#3F3F46]">|</span>
              <span id="metric-min-max" className="font-medium text-[#71717A]">
                Min: <span className="text-[#D4D4D8]">{selectionStats.min}</span> / Max: <span className="text-[#D4D4D8]">{selectionStats.max}</span>
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
};
