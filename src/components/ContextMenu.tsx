import React, { useEffect, useRef } from 'react';
import {
  Scissors,
  Copy,
  Clipboard,
  Trash2,
  Plus,
  Table,
  BarChart2,
  Bold,
  DollarSign,
  Percent,
} from 'lucide-react';
import { CellPosition } from '../types/spreadsheet';

interface ContextMenuProps {
  x: number;
  y: number;
  cellPos: CellPosition;
  onClose: () => void;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onClear: () => void;
  onInsertRowAbove: () => void;
  onInsertRowBelow: () => void;
  onInsertColLeft: () => void;
  onInsertColRight: () => void;
  onDeleteRow: () => void;
  onDeleteCol: () => void;
  onToggleBold: () => void;
  onFormatCurrency: () => void;
  onOpenChart: () => void;
}

export const ContextMenu: React.FC<ContextMenuProps> = ({
  x,
  y,
  onClose,
  onCut,
  onCopy,
  onPaste,
  onClear,
  onInsertRowAbove,
  onInsertRowBelow,
  onInsertColLeft,
  onInsertColRight,
  onDeleteRow,
  onDeleteCol,
  onToggleBold,
  onFormatCurrency,
  onOpenChart,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Adjust coordinates if menu overflows window
  const adjustedX = Math.min(x, window.innerWidth - 220);
  const adjustedY = Math.min(y, window.innerHeight - 340);

  return (
    <div
      ref={menuRef}
      id="spreadsheet-context-menu"
      style={{ left: `${adjustedX}px`, top: `${adjustedY}px` }}
      className="fixed z-50 bg-[#141417] border border-[#27272A] rounded-lg shadow-2xl py-1.5 w-56 text-xs text-[#E4E4E7] select-none animate-in fade-in zoom-in-95 duration-100 font-sans"
    >
      <button
        id="ctx-cut"
        onClick={() => {
          onCut();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Scissors className="w-3.5 h-3.5 text-[#A1A1AA]" /> Cut
        </span>
        <span className="text-[#71717A] text-[10px]">Ctrl+X</span>
      </button>

      <button
        id="ctx-copy"
        onClick={() => {
          onCopy();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Copy className="w-3.5 h-3.5 text-[#A1A1AA]" /> Copy
        </span>
        <span className="text-[#71717A] text-[10px]">Ctrl+C</span>
      </button>

      <button
        id="ctx-paste"
        onClick={() => {
          onPaste();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center justify-between cursor-pointer"
      >
        <span className="flex items-center gap-2.5">
          <Clipboard className="w-3.5 h-3.5 text-[#A1A1AA]" /> Paste
        </span>
        <span className="text-[#71717A] text-[10px]">Ctrl+V</span>
      </button>

      <div className="my-1 border-t border-[#222226]" />

      <button
        id="ctx-insert-row-above"
        onClick={() => {
          onInsertRowAbove();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 text-[#A1A1AA]" /> Insert row above
      </button>

      <button
        id="ctx-insert-row-below"
        onClick={() => {
          onInsertRowBelow();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5 text-[#A1A1AA]" /> Insert row below
      </button>

      <button
        id="ctx-insert-col-left"
        onClick={() => {
          onInsertColLeft();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
      >
        <Table className="w-3.5 h-3.5 text-[#A1A1AA]" /> Insert column left
      </button>

      <button
        id="ctx-insert-col-right"
        onClick={() => {
          onInsertColRight();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center gap-2.5 cursor-pointer"
      >
        <Table className="w-3.5 h-3.5 text-[#A1A1AA]" /> Insert column right
      </button>

      <div className="my-1 border-t border-[#222226]" />

      <button
        id="ctx-delete-row"
        onClick={() => {
          onDeleteRow();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center gap-2.5 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete row
      </button>

      <button
        id="ctx-delete-col"
        onClick={() => {
          onDeleteCol();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center gap-2.5 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" /> Delete column
      </button>

      <button
        id="ctx-clear"
        onClick={() => {
          onClear();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-red-950/40 text-red-400 flex items-center gap-2.5 cursor-pointer"
      >
        <Trash2 className="w-3.5 h-3.5" /> Clear contents (Del)
      </button>

      <div className="my-1 border-t border-[#222226]" />

      <button
        id="ctx-chart"
        onClick={() => {
          onOpenChart();
          onClose();
        }}
        className="w-full text-left px-4 py-1.5 hover:bg-blue-950/40 hover:text-blue-300 flex items-center gap-2.5 text-blue-400 font-medium cursor-pointer"
      >
        <BarChart2 className="w-3.5 h-3.5" /> Create Chart
      </button>
    </div>
  );
};
