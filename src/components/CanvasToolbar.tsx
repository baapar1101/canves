import React from 'react';
import {
  MousePointer,
  Pen,
  Highlighter,
  Eraser,
  Square,
  Circle,
  Minus,
  ArrowUpRight,
  Star,
  Type,
  StickyNote,
  Image as ImageIcon,
  Hand,
} from 'lucide-react';
import { ToolType } from '../types/canvas';

interface CanvasToolbarProps {
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  onUploadImage: (file: File) => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  activeTool,
  onSelectTool,
  onUploadImage,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const tools: { id: ToolType; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select & Move', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'hand', label: 'Pan / Hand', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
    { id: 'pen', label: 'Draw Pen', icon: <Pen className="w-4 h-4" />, shortcut: 'P' },
    { id: 'highlighter', label: 'Highlighter', icon: <Highlighter className="w-4 h-4" />, shortcut: 'M' },
    { id: 'eraser', label: 'Eraser', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
    { id: 'rectangle', label: 'Rectangle', icon: <Square className="w-4 h-4" />, shortcut: 'R' },
    { id: 'circle', label: 'Circle / Ellipse', icon: <Circle className="w-4 h-4" />, shortcut: 'O' },
    { id: 'line', label: 'Line', icon: <Minus className="w-4 h-4" />, shortcut: 'L' },
    { id: 'arrow', label: 'Arrow', icon: <ArrowUpRight className="w-4 h-4" />, shortcut: 'A' },
    { id: 'star', label: 'Star', icon: <Star className="w-4 h-4" />, shortcut: 'S' },
    { id: 'text', label: 'Text', icon: <Type className="w-4 h-4" />, shortcut: 'T' },
    { id: 'sticky', label: 'Sticky Note', icon: <StickyNote className="w-4 h-4" />, shortcut: 'N' },
  ];

  return (
    <div
      id="canvas-main-toolbar"
      className="absolute top-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1 bg-[#141417]/90 backdrop-blur-md border border-[#27272A] p-1.5 rounded-2xl shadow-2xl text-[#E4E4E7] select-none"
    >
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) {
            onUploadImage(file);
            e.target.value = '';
          }
        }}
      />

      {tools.map((t, index) => {
        const isActive = activeTool === t.id;
        // Group dividers for visual elegance
        const isDividerBefore = index === 2 || index === 5 || index === 10;

        return (
          <React.Fragment key={t.id}>
            {isDividerBefore && <div className="w-px h-5 bg-[#27272A] mx-0.5" />}
            <button
              id={`tool-btn-${t.id}`}
              onClick={() => onSelectTool(t.id)}
              className={`relative p-2.5 rounded-xl flex items-center justify-center transition-all cursor-pointer group ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20'
                  : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226]'
              }`}
              title={`${t.label} (${t.shortcut})`}
            >
              {t.icon}
              {/* Tooltip */}
              <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#09090B] border border-[#27272A] text-white text-[11px] px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
                {t.label} <span className="text-[#71717A] ml-1">({t.shortcut})</span>
              </div>
            </button>
          </React.Fragment>
        );
      })}

      <div className="w-px h-5 bg-[#27272A] mx-0.5" />

      {/* Image Upload Button */}
      <button
        id="tool-btn-image"
        onClick={() => fileInputRef.current?.click()}
        className="relative p-2.5 rounded-xl flex items-center justify-center text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer group"
        title="Upload Image (I)"
      >
        <ImageIcon className="w-4 h-4" />
        <div className="absolute top-full mt-2 left-1/2 -translate-x-1/2 bg-[#09090B] border border-[#27272A] text-white text-[11px] px-2 py-1 rounded-md opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-xl z-50">
          Upload Image <span className="text-[#71717A] ml-1">(I)</span>
        </div>
      </button>
    </div>
  );
};
