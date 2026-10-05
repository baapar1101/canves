import React, { useState, useRef, useEffect } from 'react';
import {
  Undo2,
  Redo2,
  Printer,
  DollarSign,
  Percent,
  ChevronDown,
  Bold,
  Italic,
  Strikethrough,
  Baseline,
  PaintBucket,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignVerticalJustifyStart,
  AlignVerticalJustifyCenter,
  AlignVerticalJustifyEnd,
  WrapText,
  BarChart2,
  Filter,
  Sigma,
  Plus,
  Minus,
  Sparkles,
} from 'lucide-react';
import { CellStyle } from '../types/spreadsheet';
import { ColorPicker } from './ColorPicker';

interface ToolbarProps {
  currentStyle: CellStyle;
  onUpdateStyle: (style: Partial<CellStyle>) => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenChartModal: () => void;
  onApplyFormula: (formulaName: string) => void;
  onToggleMerge: () => void;
  isMerged: boolean;
  zoomLevel: number;
  onChangeZoom: (zoom: number) => void;
}

const FONTS = [
  'Arial',
  'Roboto',
  'Inter',
  'Georgia',
  'Courier New',
  'Times New Roman',
  'Trebuchet MS',
  'Verdana',
];

const FONT_SIZES = [8, 9, 10, 11, 12, 14, 16, 18, 20, 24, 30, 36];

export const Toolbar: React.FC<ToolbarProps> = ({
  currentStyle,
  onUpdateStyle,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenChartModal,
  onApplyFormula,
  onToggleMerge,
  isMerged,
  zoomLevel,
  onChangeZoom,
}) => {
  const [showTextColorPicker, setShowTextColorPicker] = useState(false);
  const [showBgColorPicker, setShowBgColorPicker] = useState(false);
  const [showBorderDropdown, setShowBorderDropdown] = useState(false);
  const [showFormatDropdown, setShowFormatDropdown] = useState(false);
  const [showFormulaDropdown, setShowFormulaDropdown] = useState(false);

  const toolbarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        setShowTextColorPicker(false);
        setShowBgColorPicker(false);
        setShowBorderDropdown(false);
        setShowFormatDropdown(false);
        setShowFormulaDropdown(false);
      }
    }
    window.addEventListener('mousedown', handleClickOutside);
    return () => window.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDecimals = (delta: number) => {
    const current = currentStyle.decimalPlaces !== undefined ? currentStyle.decimalPlaces : 2;
    const next = Math.max(0, Math.min(6, current + delta));
    onUpdateStyle({ decimalPlaces: next });
  };

  return (
    <div
      ref={toolbarRef}
      id="spreadsheet-toolbar"
      className="flex items-center gap-0.5 px-3 py-1 bg-[#121215] border-b border-[#222226] select-none overflow-x-auto text-xs text-[#D4D4D8] min-h-[36px]"
    >
      {/* Undo & Redo */}
      <button
        id="toolbar-btn-undo"
        disabled={!canUndo}
        onClick={onUndo}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors ${
          !canUndo ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Undo (Ctrl+Z)"
      >
        <Undo2 className="w-4 h-4" />
      </button>
      <button
        id="toolbar-btn-redo"
        disabled={!canRedo}
        onClick={onRedo}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors ${
          !canRedo ? 'opacity-30 cursor-not-allowed' : 'cursor-pointer'
        }`}
        title="Redo (Ctrl+Y)"
      >
        <Redo2 className="w-4 h-4" />
      </button>

      <button
        id="toolbar-btn-print"
        onClick={() => window.print()}
        className="p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer"
        title="Print"
      >
        <Printer className="w-4 h-4" />
      </button>

      {/* Zoom Selector */}
      <div className="flex items-center px-1">
        <select
          id="toolbar-zoom-select"
          value={zoomLevel}
          onChange={(e) => onChangeZoom(Number(e.target.value))}
          className="bg-[#18181B] border border-[#27272A] text-xs text-[#D4D4D8] font-medium py-1 px-1.5 rounded hover:bg-[#222226] cursor-pointer outline-none"
        >
          <option value={0.75} className="bg-[#18181B] text-[#D4D4D8]">75%</option>
          <option value={0.9} className="bg-[#18181B] text-[#D4D4D8]">90%</option>
          <option value={1} className="bg-[#18181B] text-[#D4D4D8]">100%</option>
          <option value={1.25} className="bg-[#18181B] text-[#D4D4D8]">125%</option>
          <option value={1.5} className="bg-[#18181B] text-[#D4D4D8]">150%</option>
        </select>
      </div>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Currency, Percent, Decimals */}
      <button
        id="toolbar-btn-currency"
        onClick={() =>
          onUpdateStyle({
            format: currentStyle.format === 'currency' ? 'general' : 'currency',
          })
        }
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.format === 'currency' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Format as currency ($)"
      >
        <DollarSign className="w-4 h-4" />
      </button>
      <button
        id="toolbar-btn-percent"
        onClick={() =>
          onUpdateStyle({
            format: currentStyle.format === 'percent' ? 'general' : 'percent',
          })
        }
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.format === 'percent' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Format as percent (%)"
      >
        <Percent className="w-4 h-4" />
      </button>

      <button
        id="toolbar-btn-dec-decrease"
        onClick={() => handleDecimals(-1)}
        className="px-1.5 py-1 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer font-mono font-medium text-[11px]"
        title="Decrease decimal places (.0)"
      >
        .0←
      </button>
      <button
        id="toolbar-btn-dec-increase"
        onClick={() => handleDecimals(1)}
        className="px-1.5 py-1 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer font-mono font-medium text-[11px]"
        title="Increase decimal places (.00)"
      >
        .00→
      </button>

      {/* Number Formats Dropdown */}
      <div className="relative">
        <button
          id="toolbar-btn-more-formats"
          onClick={() => setShowFormatDropdown(!showFormatDropdown)}
          className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] cursor-pointer font-medium text-[11px]"
          title="More formats (123)"
        >
          <span>123</span>
          <ChevronDown className="w-3 h-3 text-[#71717A]" />
        </button>
        {showFormatDropdown && (
          <div
            id="toolbar-dropdown-formats"
            className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl py-1 w-44 z-50 text-xs text-[#E4E4E7]"
          >
            {[
              { label: 'Automatic / General', value: 'general' },
              { label: 'Plain text', value: 'text' },
              { label: 'Number (1,000.12)', value: 'number' },
              { label: 'Percent (12.50%)', value: 'percent' },
              { label: 'Currency ($1,000.00)', value: 'currency' },
              { label: 'Date (MM/DD/YYYY)', value: 'date' },
              { label: 'Scientific (1.23E+03)', value: 'scientific' },
            ].map((fmt) => (
              <button
                key={fmt.value}
                id={`format-opt-${fmt.value}`}
                onClick={() => {
                  onUpdateStyle({ format: fmt.value as any });
                  setShowFormatDropdown(false);
                }}
                className={`w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white cursor-pointer ${
                  currentStyle.format === fmt.value ? 'font-semibold text-blue-400' : ''
                }`}
              >
                {fmt.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Font Family Selector */}
      <select
        id="toolbar-font-family-select"
        value={currentStyle.fontFamily || 'Arial'}
        onChange={(e) => onUpdateStyle({ fontFamily: e.target.value })}
        className="bg-[#18181B] border border-[#27272A] text-xs text-[#D4D4D8] font-medium py-1 px-1.5 rounded hover:bg-[#222226] cursor-pointer outline-none max-w-[110px]"
      >
        {FONTS.map((font) => (
          <option key={font} value={font} className="bg-[#18181B] text-[#D4D4D8]">
            {font}
          </option>
        ))}
      </select>

      {/* Font Size Selector */}
      <select
        id="toolbar-font-size-select"
        value={currentStyle.fontSize || 11}
        onChange={(e) => onUpdateStyle({ fontSize: Number(e.target.value) })}
        className="bg-[#18181B] border border-[#27272A] text-xs text-[#D4D4D8] font-medium py-1 px-1 rounded hover:bg-[#222226] cursor-pointer outline-none w-12"
      >
        {FONT_SIZES.map((size) => (
          <option key={size} value={size} className="bg-[#18181B] text-[#D4D4D8]">
            {size}
          </option>
        ))}
      </select>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Bold, Italic, Strikethrough */}
      <button
        id="toolbar-btn-bold"
        onClick={() => onUpdateStyle({ bold: !currentStyle.bold })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.bold ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30 font-bold' : ''
        }`}
        title="Bold (Ctrl+B)"
      >
        <Bold className="w-4 h-4" />
      </button>

      <button
        id="toolbar-btn-italic"
        onClick={() => onUpdateStyle({ italic: !currentStyle.italic })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.italic ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Italic (Ctrl+I)"
      >
        <Italic className="w-4 h-4" />
      </button>

      <button
        id="toolbar-btn-strikethrough"
        onClick={() => onUpdateStyle({ strikethrough: !currentStyle.strikethrough })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.strikethrough ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Strikethrough"
      >
        <Strikethrough className="w-4 h-4" />
      </button>

      {/* Text Color */}
      <div className="relative">
        <button
          id="toolbar-btn-text-color"
          onClick={() => {
            setShowTextColorPicker(!showTextColorPicker);
            setShowBgColorPicker(false);
          }}
          className="p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-0.5"
          title="Text color"
        >
          <Baseline className="w-4 h-4" style={{ color: currentStyle.color || '#E4E4E7' }} />
          <ChevronDown className="w-2.5 h-2.5 text-[#71717A]" />
        </button>
        {showTextColorPicker && (
          <ColorPicker
            currentColor={currentStyle.color}
            onChange={(color) => onUpdateStyle({ color })}
            onClose={() => setShowTextColorPicker(false)}
            title="Text Color"
          />
        )}
      </div>

      {/* Fill Color */}
      <div className="relative">
        <button
          id="toolbar-btn-fill-color"
          onClick={() => {
            setShowBgColorPicker(!showBgColorPicker);
            setShowTextColorPicker(false);
          }}
          className="p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-0.5"
          title="Fill color"
        >
          <PaintBucket className="w-4 h-4" style={{ color: currentStyle.backgroundColor || '#A1A1AA' }} />
          <ChevronDown className="w-2.5 h-2.5 text-[#71717A]" />
        </button>
        {showBgColorPicker && (
          <ColorPicker
            currentColor={currentStyle.backgroundColor}
            onChange={(backgroundColor) => onUpdateStyle({ backgroundColor })}
            onClose={() => setShowBgColorPicker(false)}
            title="Fill Color"
          />
        )}
      </div>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Borders Dropdown */}
      <div className="relative">
        <button
          id="toolbar-btn-borders"
          onClick={() => setShowBorderDropdown(!showBorderDropdown)}
          className="p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer flex items-center gap-0.5"
          title="Borders"
        >
          <Grid className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-[#71717A]" />
        </button>
        {showBorderDropdown && (
          <div
            id="toolbar-dropdown-borders"
            className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl p-2 w-48 z-50 text-xs grid grid-cols-2 gap-1.5 text-[#E4E4E7]"
          >
            <button
              id="border-all"
              onClick={() => {
                onUpdateStyle({
                  borderTop: '1px solid #3f3f46',
                  borderRight: '1px solid #3f3f46',
                  borderBottom: '1px solid #3f3f46',
                  borderLeft: '1px solid #3f3f46',
                });
                setShowBorderDropdown(false);
              }}
              className="px-2 py-1 hover:bg-[#1F1F24] border border-[#27272A] rounded text-center cursor-pointer text-[#E4E4E7]"
            >
              All Borders
            </button>
            <button
              id="border-clear"
              onClick={() => {
                onUpdateStyle({
                  borderTop: undefined,
                  borderRight: undefined,
                  borderBottom: undefined,
                  borderLeft: undefined,
                });
                setShowBorderDropdown(false);
              }}
              className="px-2 py-1 hover:bg-red-950/40 text-red-400 border border-red-900/40 rounded text-center cursor-pointer"
            >
              Clear Borders
            </button>
            <button
              id="border-outer"
              onClick={() => {
                onUpdateStyle({
                  borderTop: '2px solid #52525b',
                  borderRight: '2px solid #52525b',
                  borderBottom: '2px solid #52525b',
                  borderLeft: '2px solid #52525b',
                });
                setShowBorderDropdown(false);
              }}
              className="px-2 py-1 hover:bg-[#1F1F24] border border-[#27272A] rounded text-center cursor-pointer text-[#E4E4E7]"
            >
              Thick Outer
            </button>
            <button
              id="border-bottom"
              onClick={() => {
                onUpdateStyle({ borderBottom: '2px solid #3b82f6' });
                setShowBorderDropdown(false);
              }}
              className="px-2 py-1 hover:bg-blue-950/40 border border-blue-800/40 rounded text-center cursor-pointer text-blue-400 font-medium"
            >
              Accent Underline
            </button>
          </div>
        )}
      </div>

      {/* Merge Cells */}
      <button
        id="toolbar-btn-merge"
        onClick={onToggleMerge}
        className={`px-2 py-1 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer text-[11px] font-medium ${
          isMerged ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Merge cells"
      >
        Merge
      </button>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Horizontal Alignment */}
      <button
        id="toolbar-align-left"
        onClick={() => onUpdateStyle({ textAlign: 'left' })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.textAlign === 'left' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Align left"
      >
        <AlignLeft className="w-4 h-4" />
      </button>
      <button
        id="toolbar-align-center"
        onClick={() => onUpdateStyle({ textAlign: 'center' })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.textAlign === 'center' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Align center"
      >
        <AlignCenter className="w-4 h-4" />
      </button>
      <button
        id="toolbar-align-right"
        onClick={() => onUpdateStyle({ textAlign: 'right' })}
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.textAlign === 'right' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Align right"
      >
        <AlignRight className="w-4 h-4" />
      </button>

      {/* Text Wrap */}
      <button
        id="toolbar-btn-wrap"
        onClick={() =>
          onUpdateStyle({
            wrapText: currentStyle.wrapText === 'wrap' ? 'overflow' : 'wrap',
          })
        }
        className={`p-1.5 rounded hover:bg-[#222226] text-[#A1A1AA] hover:text-[#FFFFFF] transition-colors cursor-pointer ${
          currentStyle.wrapText === 'wrap' ? 'bg-blue-600/25 text-blue-400 border border-blue-500/30' : ''
        }`}
        title="Text wrap"
      >
        <WrapText className="w-4 h-4" />
      </button>

      <div className="h-4 w-px bg-[#27272A] mx-1" />

      {/* Chart Visualization */}
      <button
        id="toolbar-btn-chart"
        onClick={onOpenChartModal}
        className="p-1.5 rounded hover:bg-[#222226] transition-colors cursor-pointer text-blue-400 hover:text-blue-300"
        title="Insert Chart"
      >
        <BarChart2 className="w-4 h-4" />
      </button>

      {/* Quick Formula Dropdown (Σ) */}
      <div className="relative">
        <button
          id="toolbar-btn-sigma"
          onClick={() => setShowFormulaDropdown(!showFormulaDropdown)}
          className="p-1.5 rounded hover:bg-[#222226] transition-colors cursor-pointer flex items-center gap-0.5 text-blue-400 hover:text-blue-300 font-semibold"
          title="Functions"
        >
          <Sigma className="w-4 h-4" />
          <ChevronDown className="w-2.5 h-2.5 text-[#71717A]" />
        </button>
        {showFormulaDropdown && (
          <div
            id="toolbar-dropdown-sigma"
            className="absolute right-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl py-1 w-48 z-50 text-xs text-[#E4E4E7]"
          >
            {['SUM', 'AVERAGE', 'COUNT', 'MAX', 'MIN', 'IF', 'VLOOKUP', 'CONCAT'].map((fn) => (
              <button
                key={fn}
                id={`func-opt-${fn}`}
                onClick={() => {
                  onApplyFormula(fn);
                  setShowFormulaDropdown(false);
                }}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white flex items-center justify-between cursor-pointer"
              >
                <span className="font-semibold text-[#F4F4F5]">{fn}</span>
                <span className="text-[10px] text-[#71717A]">={fn}(...)</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
