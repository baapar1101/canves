import React from 'react';
import {
  Trash2,
  Copy,
  ArrowUpToLine,
  ArrowDownToLine,
} from 'lucide-react';
import { CanvasElement, ToolType, StyleDefaults } from '../types/canvas';

interface CanvasPropertiesProps {
  activeTool: ToolType;
  selectedElement: CanvasElement | null;
  styleDefaults: StyleDefaults;
  onUpdateStyleDefaults: (updates: Partial<StyleDefaults>) => void;
  onUpdateSelectedElement: (updates: Partial<CanvasElement>) => void;
  onDeleteSelected: () => void;
  onDuplicateSelected: () => void;
  onBringToFront: () => void;
  onSendToBack: () => void;
}

const STROKE_COLORS = [
  '#F4F4F5', // White / Light Grey
  '#EF4444', // Red
  '#F97316', // Orange
  '#EAB308', // Yellow
  '#10B981', // Emerald
  '#06B6D4', // Cyan
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#71717A', // Gray
  '#09090B', // Dark
];

const FILL_COLORS = [
  'transparent',
  'rgba(239, 68, 68, 0.2)',
  'rgba(249, 115, 22, 0.2)',
  'rgba(234, 179, 8, 0.2)',
  'rgba(16, 185, 129, 0.2)',
  'rgba(59, 130, 246, 0.2)',
  'rgba(139, 92, 246, 0.2)',
  '#EF4444',
  '#3B82F6',
  '#10B981',
  '#27272A',
];

const STICKY_COLORS = [
  { name: 'Yellow', bg: '#FEF08A' },
  { name: 'Pink', bg: '#FECDD3' },
  { name: 'Emerald', bg: '#A7F3D0' },
  { name: 'Sky', bg: '#BAE6FD' },
  { name: 'Purple', bg: '#E9D5FF' },
  { name: 'Orange', bg: '#FFEDD5' },
];

const STROKE_WIDTHS = [
  { label: 'Fine', value: 2 },
  { label: 'Medium', value: 4 },
  { label: 'Bold', value: 8 },
  { label: 'Heavy', value: 16 },
  { label: 'Marker', value: 24 },
];

const FONT_SIZES = [
  { label: 'S', value: 16 },
  { label: 'M', value: 24 },
  { label: 'L', value: 36 },
  { label: 'XL', value: 48 },
];

export const CanvasProperties: React.FC<CanvasPropertiesProps> = ({
  activeTool,
  selectedElement,
  styleDefaults,
  onUpdateStyleDefaults,
  onUpdateSelectedElement,
  onDeleteSelected,
  onDuplicateSelected,
  onBringToFront,
  onSendToBack,
}) => {
  // Check if we should show properties
  const isDrawingTool = ['pen', 'highlighter', 'rectangle', 'circle', 'line', 'arrow', 'star', 'text'].includes(activeTool);
  const isStickyTool = activeTool === 'sticky';
  const hasSelection = !!selectedElement;

  if (!isDrawingTool && !isStickyTool && !hasSelection) {
    return null;
  }

  const currentStrokeColor = selectedElement ? selectedElement.strokeColor : styleDefaults.strokeColor;
  const currentFillColor = selectedElement ? selectedElement.fillColor || 'transparent' : styleDefaults.fillColor;
  const currentStrokeWidth = selectedElement ? selectedElement.strokeWidth : styleDefaults.strokeWidth;
  const currentOpacity = selectedElement ? selectedElement.opacity : styleDefaults.opacity;

  const handleColorChange = (color: string) => {
    if (selectedElement) {
      onUpdateSelectedElement({ strokeColor: color });
    } else {
      onUpdateStyleDefaults({ strokeColor: color });
    }
  };

  const handleFillChange = (fill: string) => {
    if (selectedElement) {
      onUpdateSelectedElement({ fillColor: fill });
    } else {
      onUpdateStyleDefaults({ fillColor: fill });
    }
  };

  const handleWidthChange = (width: number) => {
    if (selectedElement) {
      onUpdateSelectedElement({ strokeWidth: width });
    } else {
      onUpdateStyleDefaults({ strokeWidth: width });
    }
  };

  const handleOpacityChange = (opacity: number) => {
    if (selectedElement) {
      onUpdateSelectedElement({ opacity });
    } else {
      onUpdateStyleDefaults({ opacity });
    }
  };

  const handleStickyColorChange = (color: string) => {
    if (selectedElement && selectedElement.type === 'sticky') {
      onUpdateSelectedElement({ noteColor: color } as Partial<CanvasElement>);
    } else {
      onUpdateStyleDefaults({ stickyColor: color });
    }
  };

  const handleFontSizeChange = (size: number) => {
    if (selectedElement && selectedElement.type === 'text') {
      onUpdateSelectedElement({ fontSize: size } as Partial<CanvasElement>);
    } else {
      onUpdateStyleDefaults({ fontSize: size });
    }
  };

  return (
    <div
      id="canvas-properties-bar"
      className="absolute top-20 left-4 z-20 bg-[#141417]/95 backdrop-blur-md border border-[#27272A] p-3.5 rounded-2xl shadow-2xl text-[#E4E4E7] w-64 text-xs select-none space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto"
    >
      {/* Sticky Note Colors */}
      {(isStickyTool || (selectedElement && selectedElement.type === 'sticky')) ? (
        <div>
          <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
            Note Color
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {STICKY_COLORS.map((c) => {
              const currentSticky = selectedElement?.type === 'sticky' ? (selectedElement as { noteColor: string }).noteColor : styleDefaults.stickyColor;
              const isSelected = currentSticky === c.bg;
              return (
                <button
                  key={c.bg}
                  id={`sticky-color-${c.name}`}
                  onClick={() => handleStickyColorChange(c.bg)}
                  style={{ backgroundColor: c.bg }}
                  className={`w-7 h-7 rounded-lg transition-transform cursor-pointer border ${
                    isSelected ? 'ring-2 ring-blue-500 scale-110 border-white' : 'border-black/10'
                  }`}
                  title={c.name}
                />
              );
            })}
          </div>
        </div>
      ) : (
        <>
          {/* Stroke Color */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
              <span>Stroke Color</span>
              <input
                id="prop-custom-color-input"
                type="color"
                value={currentStrokeColor.startsWith('#') ? currentStrokeColor : '#3B82F6'}
                onChange={(e) => handleColorChange(e.target.value)}
                className="w-4 h-4 rounded cursor-pointer p-0 bg-transparent border-0"
                title="Custom color picker"
              />
            </div>
            <div className="grid grid-cols-6 gap-1.5">
              {STROKE_COLORS.map((color) => {
                const isSelected = currentStrokeColor.toLowerCase() === color.toLowerCase();
                return (
                  <button
                    key={color}
                    id={`stroke-color-swatch-${color.replace('#', '')}`}
                    onClick={() => handleColorChange(color)}
                    style={{ backgroundColor: color }}
                    className={`w-6 h-6 rounded-md transition-transform cursor-pointer border ${
                      isSelected ? 'ring-2 ring-blue-500 scale-110 border-white' : 'border-[#27272A]'
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Fill Color (for Shapes) */}
          {(['rectangle', 'circle', 'star'].includes(activeTool) ||
            (selectedElement && ['rectangle', 'circle', 'star'].includes(selectedElement.type))) && (
            <div>
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                Fill
              </div>
              <div className="grid grid-cols-6 gap-1.5">
                {FILL_COLORS.map((fill, idx) => {
                  const isSelected = currentFillColor === fill;
                  const isTransparent = fill === 'transparent';
                  return (
                    <button
                      key={idx}
                      id={`fill-color-swatch-${idx}`}
                      onClick={() => handleFillChange(fill)}
                      style={{ backgroundColor: fill }}
                      className={`w-6 h-6 rounded-md transition-transform cursor-pointer border relative overflow-hidden ${
                        isSelected ? 'ring-2 ring-blue-500 scale-110 border-white' : 'border-[#27272A]'
                      }`}
                      title={isTransparent ? 'Transparent' : `Fill ${idx}`}
                    >
                      {isTransparent && (
                        <div className="absolute inset-0 flex items-center justify-center text-[10px] text-[#71717A]">
                          /
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Stroke Width */}
          <div>
            <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
              Stroke Width
            </div>
            <div className="grid grid-cols-5 gap-1 bg-[#18181B] p-1 rounded-xl border border-[#27272A]">
              {STROKE_WIDTHS.map((sw) => {
                const isSelected = currentStrokeWidth === sw.value;
                return (
                  <button
                    key={sw.value}
                    id={`stroke-width-${sw.value}`}
                    onClick={() => handleWidthChange(sw.value)}
                    className={`py-1.5 text-[10px] font-medium rounded-lg transition-colors cursor-pointer flex flex-col items-center justify-center gap-1 ${
                      isSelected ? 'bg-blue-600 text-white' : 'text-[#A1A1AA] hover:text-white hover:bg-[#222226]'
                    }`}
                  >
                    <div
                      className="bg-current rounded-full"
                      style={{ width: `${Math.min(16, sw.value * 2)}px`, height: `${Math.min(8, sw.value)}px` }}
                    />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Font Size (For Text) */}
          {(activeTool === 'text' || (selectedElement && selectedElement.type === 'text')) && (
            <div>
              <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-2">
                Font Size
              </div>
              <div className="grid grid-cols-4 gap-1 bg-[#18181B] p-1 rounded-xl border border-[#27272A]">
                {FONT_SIZES.map((fs) => {
                  const currentSize = selectedElement?.type === 'text' ? (selectedElement as { fontSize: number }).fontSize : styleDefaults.fontSize;
                  const isSelected = currentSize === fs.value;
                  return (
                    <button
                      key={fs.value}
                      id={`font-size-${fs.value}`}
                      onClick={() => handleFontSizeChange(fs.value)}
                      className={`py-1 text-[11px] font-semibold rounded-lg transition-colors cursor-pointer ${
                        isSelected ? 'bg-blue-600 text-white' : 'text-[#A1A1AA] hover:text-white hover:bg-[#222226]'
                      }`}
                    >
                      {fs.label}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Opacity Slider */}
          <div>
            <div className="flex items-center justify-between text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mb-1.5">
              <span>Opacity</span>
              <span className="text-[#F4F4F5] font-mono">{currentOpacity}%</span>
            </div>
            <input
              id="prop-opacity-slider"
              type="range"
              min="10"
              max="100"
              value={currentOpacity}
              onChange={(e) => handleOpacityChange(Number(e.target.value))}
              className="w-full h-1.5 bg-[#27272A] rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>
        </>
      )}

      {/* Selected Element Actions */}
      {selectedElement && (
        <div className="pt-2 border-t border-[#222226] space-y-2">
          <div className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider">
            Element Actions
          </div>
          <div className="grid grid-cols-4 gap-1.5">
            <button
              id="action-duplicate-selected"
              onClick={onDuplicateSelected}
              className="p-2 bg-[#18181B] hover:bg-[#222226] hover:text-white rounded-lg border border-[#27272A] flex items-center justify-center transition-colors cursor-pointer"
              title="Duplicate (Ctrl+D)"
            >
              <Copy className="w-3.5 h-3.5" />
            </button>
            <button
              id="action-bring-to-front"
              onClick={onBringToFront}
              className="p-2 bg-[#18181B] hover:bg-[#222226] hover:text-white rounded-lg border border-[#27272A] flex items-center justify-center transition-colors cursor-pointer"
              title="Bring to Front"
            >
              <ArrowUpToLine className="w-3.5 h-3.5" />
            </button>
            <button
              id="action-send-to-back"
              onClick={onSendToBack}
              className="p-2 bg-[#18181B] hover:bg-[#222226] hover:text-white rounded-lg border border-[#27272A] flex items-center justify-center transition-colors cursor-pointer"
              title="Send to Back"
            >
              <ArrowDownToLine className="w-3.5 h-3.5" />
            </button>
            <button
              id="action-delete-selected"
              onClick={onDeleteSelected}
              className="p-2 bg-red-950/40 hover:bg-red-900/60 text-red-400 hover:text-red-300 rounded-lg border border-red-800/40 flex items-center justify-center transition-colors cursor-pointer"
              title="Delete (Backspace / Del)"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
