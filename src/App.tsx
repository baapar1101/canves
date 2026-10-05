import React, { useState, useEffect, useCallback } from 'react';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CanvasProperties } from './components/CanvasProperties';
import { CanvasHeader } from './components/CanvasHeader';
import { CanvasZoomControls } from './components/CanvasZoomControls';
import { CanvasArea } from './components/CanvasArea';
import { ShortcutsModal } from './components/ShortcutsModal';
import {
  ToolType,
  CanvasElement,
  ViewportTransform,
  StyleDefaults,
  BackgroundStyle,
  CanvasTheme,
  Point,
  ImageElement,
} from './types/canvas';
import { useCanvasHistory } from './hooks/useCanvasHistory';
import { getElementBounds } from './utils/canvasRenderer';
import { exportToPNG, exportToSVG, exportToJSON } from './utils/exportCanvas';

const DEFAULT_STYLE: StyleDefaults = {
  strokeColor: '#F4F4F5',
  fillColor: 'transparent',
  strokeWidth: 4,
  opacity: 100,
  fontSize: 24,
  stickyColor: '#FEF08A',
  backgroundStyle: 'dots',
  canvasTheme: 'dark',
};

const INITIAL_STARTER_ELEMENTS: CanvasElement[] = [
  {
    id: 'starter_welcome_sticky',
    type: 'sticky',
    x: 100,
    y: 120,
    width: 200,
    height: 180,
    text: '✨ Welcome to Canvas!\n\n• Draw with Pen (P)\n• Add Shapes & Arrows\n• Write Text (T)\n• Drop Images & Notes',
    noteColor: '#FEF08A',
    strokeColor: '#1C1917',
    strokeWidth: 1,
    opacity: 100,
  },
  {
    id: 'starter_arrow',
    type: 'arrow',
    x: 330,
    y: 200,
    width: 90,
    height: 30,
    strokeColor: '#3B82F6',
    strokeWidth: 4,
    opacity: 100,
  },
  {
    id: 'starter_rect',
    type: 'rectangle',
    x: 450,
    y: 130,
    width: 220,
    height: 160,
    strokeColor: '#10B981',
    fillColor: 'rgba(16, 185, 129, 0.15)',
    strokeWidth: 3,
    opacity: 100,
  },
  {
    id: 'starter_text',
    type: 'text',
    x: 480,
    y: 190,
    text: 'Infinite Board 🚀',
    fontSize: 22,
    fontFamily: 'Inter, sans-serif',
    strokeColor: '#F4F4F5',
    strokeWidth: 1,
    opacity: 100,
    width: 170,
    height: 30,
  },
];

export function App() {
  const [canvasTitle, setCanvasTitle] = useState('My Canvas');
  const [activeTool, setActiveTool] = useState<ToolType>('pen');
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [styleDefaults, setStyleDefaults] = useState<StyleDefaults>(() => {
    try {
      const saved = localStorage.getItem('canvas_style_defaults');
      if (saved) return { ...DEFAULT_STYLE, ...JSON.parse(saved) };
    } catch {
      // ignore
    }
    return DEFAULT_STYLE;
  });

  const [transform, setTransform] = useState<ViewportTransform>({
    x: 60,
    y: 60,
    zoom: 1,
  });

  const [isShortcutsOpen, setIsShortcutsOpen] = useState(false);

  const {
    elements,
    canUndo,
    canRedo,
    pushState,
    undo,
    redo,
    setPresentDirect,
    clearAll,
  } = useCanvasHistory(INITIAL_STARTER_ELEMENTS);

  // Persist style defaults
  const handleUpdateStyleDefaults = (updates: Partial<StyleDefaults>) => {
    setStyleDefaults((prev) => {
      const next = { ...prev, ...updates };
      try {
        localStorage.setItem('canvas_style_defaults', JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const selectedElement = elements.find((e) => e.id === selectedElementId) || null;

  // Add new element
  const handleAddElement = useCallback(
    (newEl: CanvasElement) => {
      pushState((prev) => [...prev, newEl]);
    },
    [pushState]
  );

  // Update existing element
  const handleUpdateElement = useCallback(
    (id: string, updates: Partial<CanvasElement>) => {
      pushState((prev) =>
        prev.map((el) => (el.id === id ? ({ ...el, ...updates } as CanvasElement) : el))
      );
    },
    [pushState]
  );

  // Update selected element
  const handleUpdateSelectedElement = useCallback(
    (updates: Partial<CanvasElement>) => {
      if (!selectedElementId) return;
      handleUpdateElement(selectedElementId, updates);
    },
    [selectedElementId, handleUpdateElement]
  );

  // Delete element
  const handleDeleteElement = useCallback(
    (id: string) => {
      pushState((prev) => prev.filter((el) => el.id !== id));
      if (selectedElementId === id) {
        setSelectedElementId(null);
      }
    },
    [pushState, selectedElementId]
  );

  // Delete currently selected element
  const handleDeleteSelected = useCallback(() => {
    if (selectedElementId) {
      handleDeleteElement(selectedElementId);
    }
  }, [selectedElementId, handleDeleteElement]);

  // Duplicate currently selected element
  const handleDuplicateSelected = useCallback(() => {
    if (!selectedElement) return;
    const duplicated: CanvasElement = {
      ...selectedElement,
      id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      x: selectedElement.x + 24,
      y: selectedElement.y + 24,
    };
    if (selectedElement.type === 'pen' || selectedElement.type === 'highlighter') {
      const pathEl = selectedElement as { points: Point[] };
      (duplicated as { points: Point[] }).points = pathEl.points.map((p) => ({
        x: p.x + 24,
        y: p.y + 24,
      }));
    }
    pushState((prev) => [...prev, duplicated]);
    setSelectedElementId(duplicated.id);
  }, [selectedElement, pushState]);

  // Bring to Front
  const handleBringToFront = useCallback(() => {
    if (!selectedElementId) return;
    pushState((prev) => {
      const item = prev.find((e) => e.id === selectedElementId);
      if (!item) return prev;
      return [...prev.filter((e) => e.id !== selectedElementId), item];
    });
  }, [selectedElementId, pushState]);

  // Send to Back
  const handleSendToBack = useCallback(() => {
    if (!selectedElementId) return;
    pushState((prev) => {
      const item = prev.find((e) => e.id === selectedElementId);
      if (!item) return prev;
      return [item, ...prev.filter((e) => e.id !== selectedElementId)];
    });
  }, [selectedElementId, pushState]);

  // Add Image
  const handleAddImage = useCallback(
    (file: File, atPoint?: Point) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return;

        const img = new Image();
        img.onload = () => {
          const maxDim = 400;
          let w = img.naturalWidth || 300;
          let h = img.naturalHeight || 200;

          if (w > maxDim || h > maxDim) {
            if (w > h) {
              h = (h / w) * maxDim;
              w = maxDim;
            } else {
              w = (w / h) * maxDim;
              h = maxDim;
            }
          }

          const targetX = atPoint ? atPoint.x : -transform.x / transform.zoom + 200;
          const targetY = atPoint ? atPoint.y : -transform.y / transform.zoom + 200;

          const newImgEl: ImageElement = {
            id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
            type: 'image',
            x: targetX,
            y: targetY,
            width: w,
            height: h,
            dataUrl,
            strokeColor: 'transparent',
            strokeWidth: 0,
            opacity: 100,
          };

          pushState((prev) => [...prev, newImgEl]);
          setSelectedElementId(newImgEl.id);
          setActiveTool('select');
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    },
    [transform, pushState]
  );

  // Zoom controls
  const handleZoomIn = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.min(5, prev.zoom * 1.2),
    }));
  };

  const handleZoomOut = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: Math.max(0.1, prev.zoom / 1.2),
    }));
  };

  const handleResetZoom = () => {
    setTransform((prev) => ({
      ...prev,
      zoom: 1,
    }));
  };

  const handleFitContent = () => {
    if (elements.length === 0) {
      setTransform({ x: 60, y: 60, zoom: 1 });
      return;
    }

    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    elements.forEach((el) => {
      const b = getElementBounds(el);
      minX = Math.min(minX, b.x);
      minY = Math.min(minY, b.y);
      maxX = Math.max(maxX, b.x + b.width);
      maxY = Math.max(maxY, b.y + b.height);
    });

    const w = maxX - minX;
    const h = maxY - minY;
    const padding = 80;

    const screenW = window.innerWidth - padding * 2;
    const screenH = window.innerHeight - padding * 2;

    const zoom = Math.min(2, Math.max(0.2, Math.min(screenW / w, screenH / h)));
    const x = (window.innerWidth - w * zoom) / 2 - minX * zoom;
    const y = (window.innerHeight - h * zoom) / 2 - minY * zoom;

    setTransform({ x, y, zoom });
  };

  // Import JSON project
  const handleImportJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (data && Array.isArray(data.elements)) {
        setPresentDirect(data.elements);
        if (data.title) setCanvasTitle(data.title);
        if (data.styleDefaults) handleUpdateStyleDefaults(data.styleDefaults);
        handleFitContent();
      } else {
        alert('Invalid canvas project file structure.');
      }
    } catch {
      alert('Failed to parse canvas JSON project.');
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const isInput =
        (e.target as HTMLElement)?.tagName === 'INPUT' ||
        (e.target as HTMLElement)?.tagName === 'TEXTAREA';

      if (isInput) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'd') {
        e.preventDefault();
        handleDuplicateSelected();
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElementId) {
          e.preventDefault();
          handleDeleteSelected();
        }
        return;
      }

      if (e.key === 'Escape') {
        setSelectedElementId(null);
        setActiveTool('select');
        return;
      }

      if (e.key === '?' || (e.shiftKey && e.key === '/')) {
        setIsShortcutsOpen((prev) => !prev);
        return;
      }

      if (e.shiftKey && e.key === '!') {
        // Shift + 1
        handleFitContent();
        return;
      }

      // Single-key Tool shortcuts
      const key = e.key.toLowerCase();
      switch (key) {
        case 'v':
        case '1':
          setActiveTool('select');
          break;
        case 'h':
          setActiveTool('hand');
          break;
        case 'p':
        case '2':
          setActiveTool('pen');
          break;
        case 'm':
        case '3':
          setActiveTool('highlighter');
          break;
        case 'e':
        case '4':
          setActiveTool('eraser');
          break;
        case 'r':
        case '5':
          setActiveTool('rectangle');
          break;
        case 'o':
        case 'c':
        case '6':
          setActiveTool('circle');
          break;
        case 'l':
        case '7':
          setActiveTool('line');
          break;
        case 'a':
        case '8':
          setActiveTool('arrow');
          break;
        case 's':
        case '9':
          setActiveTool('star');
          break;
        case 't':
        case '0':
          setActiveTool('text');
          break;
        case 'n':
          setActiveTool('sticky');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    undo,
    redo,
    selectedElementId,
    handleDeleteSelected,
    handleDuplicateSelected,
    handleFitContent,
  ]);

  return (
    <div id="canvas-app-root" className="w-screen h-screen overflow-hidden bg-[#0A0A0A] relative font-sans">
      {/* Top Header Bar */}
      <CanvasHeader
        canvasTitle={canvasTitle}
        onChangeTitle={setCanvasTitle}
        canUndo={canUndo}
        canRedo={canRedo}
        onUndo={undo}
        onRedo={redo}
        onClear={clearAll}
        onExportPNG={(transparent) =>
          exportToPNG(elements, styleDefaults.canvasTheme, transparent, `${canvasTitle.toLowerCase().replace(/\s+/g, '-')}.png`)
        }
        onExportSVG={() =>
          exportToSVG(elements, styleDefaults.canvasTheme, `${canvasTitle.toLowerCase().replace(/\s+/g, '-')}.svg`)
        }
        onExportJSON={() =>
          exportToJSON(elements, canvasTitle, styleDefaults, `${canvasTitle.toLowerCase().replace(/\s+/g, '-')}.json`)
        }
        onImportJSON={handleImportJSON}
        onOpenShortcuts={() => setIsShortcutsOpen(true)}
      />

      {/* Primary Floating Tools Dock */}
      <CanvasToolbar
        activeTool={activeTool}
        onSelectTool={(t) => {
          setActiveTool(t);
          if (t !== 'select') {
            setSelectedElementId(null);
          }
        }}
        onUploadImage={handleAddImage}
      />

      {/* Floating Property Inspector */}
      <CanvasProperties
        activeTool={activeTool}
        selectedElement={selectedElement}
        styleDefaults={styleDefaults}
        onUpdateStyleDefaults={handleUpdateStyleDefaults}
        onUpdateSelectedElement={handleUpdateSelectedElement}
        onDeleteSelected={handleDeleteSelected}
        onDuplicateSelected={handleDuplicateSelected}
        onBringToFront={handleBringToFront}
        onSendToBack={handleSendToBack}
      />

      {/* Main Interactive Drawing Canvas */}
      <CanvasArea
        elements={elements}
        activeTool={activeTool}
        onSelectTool={setActiveTool}
        selectedElementId={selectedElementId}
        onSelectElementId={setSelectedElementId}
        styleDefaults={styleDefaults}
        transform={transform}
        onUpdateTransform={setTransform}
        onAddElement={handleAddElement}
        onUpdateElement={handleUpdateElement}
        onDeleteElement={handleDeleteElement}
        onAddImage={handleAddImage}
      />

      {/* Bottom Zoom & Grid Dock */}
      <CanvasZoomControls
        zoom={transform.zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onResetZoom={handleResetZoom}
        onFitContent={handleFitContent}
        backgroundStyle={styleDefaults.backgroundStyle}
        onChangeBackgroundStyle={(style) => handleUpdateStyleDefaults({ backgroundStyle: style })}
        canvasTheme={styleDefaults.canvasTheme}
        onChangeCanvasTheme={(theme) => handleUpdateStyleDefaults({ canvasTheme: theme })}
      />

      {/* Shortcuts Modal */}
      <ShortcutsModal isOpen={isShortcutsOpen} onClose={() => setIsShortcutsOpen(false)} />
    </div>
  );
}

export default App;
