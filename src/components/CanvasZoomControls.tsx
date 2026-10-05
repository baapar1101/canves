import React, { useState, useRef, useEffect } from 'react';
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Grid,
  Moon,
  Sun,
  Palette,
  RotateCcw,
} from 'lucide-react';
import { BackgroundStyle, CanvasTheme } from '../types/canvas';

interface CanvasZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitContent: () => void;
  backgroundStyle: BackgroundStyle;
  onChangeBackgroundStyle: (style: BackgroundStyle) => void;
  canvasTheme: CanvasTheme;
  onChangeCanvasTheme: (theme: CanvasTheme) => void;
}

export const CanvasZoomControls: React.FC<CanvasZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitContent,
  backgroundStyle,
  onChangeBackgroundStyle,
  canvasTheme,
  onChangeCanvasTheme,
}) => {
  const [isGridMenuOpen, setIsGridMenuOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);

  const gridMenuRef = useRef<HTMLDivElement>(null);
  const themeMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (gridMenuRef.current && !gridMenuRef.current.contains(e.target as Node)) {
        setIsGridMenuOpen(false);
      }
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const gridStyles: { id: BackgroundStyle; label: string }[] = [
    { id: 'dots', label: 'Dot Grid' },
    { id: 'grid', label: 'Lined Grid' },
    { id: 'cross', label: 'Cross Pattern' },
    { id: 'blank', label: 'Blank Canvas' },
  ];

  const themes: { id: CanvasTheme; label: string; icon: React.ReactNode }[] = [
    { id: 'dark', label: 'Pitch Dark', icon: <Moon className="w-3.5 h-3.5 text-zinc-400" /> },
    { id: 'midnight', label: 'Midnight Blue', icon: <Palette className="w-3.5 h-3.5 text-blue-400" /> },
    { id: 'paper', label: 'Warm Paper', icon: <Sun className="w-3.5 h-3.5 text-amber-400" /> },
    { id: 'light', label: 'Pure Light', icon: <Sun className="w-3.5 h-3.5 text-zinc-600" /> },
  ];

  return (
    <div
      id="canvas-bottom-dock"
      className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 pointer-events-none"
    >
      {/* Zoom Controls Pill */}
      <div className="flex items-center gap-1 bg-[#141417]/90 backdrop-blur-md border border-[#27272A] p-1.5 rounded-2xl shadow-2xl text-[#E4E4E7] pointer-events-auto select-none">
        <button
          id="btn-zoom-out"
          onClick={onZoomOut}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer"
          title="Zoom Out (Ctrl+-)"
        >
          <ZoomOut className="w-4 h-4" />
        </button>

        <button
          id="btn-zoom-reset"
          onClick={onResetZoom}
          className="px-2.5 py-1 text-xs font-mono font-semibold text-[#F4F4F5] hover:bg-[#222226] rounded-xl transition-all cursor-pointer min-w-[54px] text-center"
          title="Reset Zoom to 100%"
        >
          {Math.round(zoom * 100)}%
        </button>

        <button
          id="btn-zoom-in"
          onClick={onZoomIn}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer"
          title="Zoom In (Ctrl++)"
        >
          <ZoomIn className="w-4 h-4" />
        </button>

        <div className="w-px h-5 bg-[#27272A] mx-0.5" />

        <button
          id="btn-fit-content"
          onClick={onFitContent}
          className="p-2 rounded-xl text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226] transition-all cursor-pointer"
          title="Fit All Content into Screen (Shift+1)"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>

      {/* Grid Pattern & Theme Switcher */}
      <div className="flex items-center gap-1 bg-[#141417]/90 backdrop-blur-md border border-[#27272A] p-1.5 rounded-2xl shadow-2xl text-[#E4E4E7] pointer-events-auto select-none">
        {/* Grid pattern picker */}
        <div ref={gridMenuRef} className="relative">
          <button
            id="btn-grid-style"
            onClick={() => setIsGridMenuOpen(!isGridMenuOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isGridMenuOpen ? 'bg-blue-600 text-white' : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226]'
            }`}
            title="Canvas Grid Pattern"
          >
            <Grid className="w-4 h-4" />
          </button>

          {isGridMenuOpen && (
            <div
              id="grid-style-menu"
              className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl p-1.5 w-36 z-50 text-xs text-[#E4E4E7] space-y-0.5"
            >
              {gridStyles.map((g) => (
                <button
                  key={g.id}
                  id={`grid-opt-${g.id}`}
                  onClick={() => {
                    onChangeBackgroundStyle(g.id);
                    setIsGridMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center justify-between ${
                    backgroundStyle === g.id
                      ? 'bg-blue-600/30 text-blue-400 font-semibold'
                      : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  <span>{g.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Theme Picker */}
        <div ref={themeMenuRef} className="relative">
          <button
            id="btn-canvas-theme"
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`p-2 rounded-xl transition-all cursor-pointer ${
              isThemeMenuOpen ? 'bg-blue-600 text-white' : 'text-[#A1A1AA] hover:text-[#F4F4F5] hover:bg-[#222226]'
            }`}
            title="Canvas Theme & Contrast"
          >
            <Palette className="w-4 h-4" />
          </button>

          {isThemeMenuOpen && (
            <div
              id="canvas-theme-menu"
              className="absolute bottom-full mb-2 right-0 bg-[#18181B] border border-[#27272A] rounded-xl shadow-2xl p-1.5 w-40 z-50 text-xs text-[#E4E4E7] space-y-0.5"
            >
              {themes.map((t) => (
                <button
                  key={t.id}
                  id={`theme-opt-${t.id}`}
                  onClick={() => {
                    onChangeCanvasTheme(t.id);
                    setIsThemeMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-1.5 rounded-lg transition-colors cursor-pointer flex items-center gap-2 ${
                    canvasTheme === t.id
                      ? 'bg-blue-600/30 text-blue-400 font-semibold'
                      : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-white'
                  }`}
                >
                  {t.icon}
                  <span>{t.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
