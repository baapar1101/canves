import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  CanvasElement,
  ToolType,
  ViewportTransform,
  Point,
  CanvasTheme,
  BackgroundStyle,
  StyleDefaults,
  PathElement,
  ShapeElement,
  TextElement,
  StickyElement,
  ImageElement,
} from '../types/canvas';
import {
  renderBackground,
  renderElement,
  renderSelectionBox,
  isPointInElement,
  getElementBounds,
} from '../utils/canvasRenderer';

interface CanvasAreaProps {
  elements: CanvasElement[];
  activeTool: ToolType;
  onSelectTool: (tool: ToolType) => void;
  selectedElementId: string | null;
  onSelectElementId: (id: string | null) => void;
  styleDefaults: StyleDefaults;
  transform: ViewportTransform;
  onUpdateTransform: (transform: ViewportTransform | ((prev: ViewportTransform) => ViewportTransform)) => void;
  onAddElement: (element: CanvasElement) => void;
  onUpdateElement: (id: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (id: string) => void;
  onAddImage: (file: File, atPoint?: Point) => void;
}

export const CanvasArea: React.FC<CanvasAreaProps> = ({
  elements,
  activeTool,
  onSelectTool,
  selectedElementId,
  onSelectElementId,
  styleDefaults,
  transform,
  onUpdateTransform,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onAddImage,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Interaction State
  const [isPointerDown, setIsPointerDown] = useState(false);
  const [currentDraftElement, setCurrentDraftElement] = useState<CanvasElement | null>(null);
  const [dragStartPoint, setDragStartPoint] = useState<Point | null>(null);
  const [dragOffset, setDragOffset] = useState<Point>({ x: 0, y: 0 });
  const [isSpacePressed, setIsSpacePressed] = useState(false);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState<Point>({ x: 0, y: 0 });

  // In-place text editor state
  const [editingTextElement, setEditingTextElement] = useState<{
    id: string;
    text: string;
    x: number;
    y: number;
    width: number;
    height: number;
    fontSize: number;
    color: string;
    isSticky?: boolean;
    stickyColor?: string;
  } | null>(null);

  // Screen to World coordinates transform
  const screenToWorld = useCallback(
    (screenX: number, screenY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const canvasLeft = rect ? rect.left : 0;
      const canvasTop = rect ? rect.top : 0;

      const x = (screenX - canvasLeft - transform.x) / transform.zoom;
      const y = (screenY - canvasTop - transform.y) / transform.zoom;
      return { x, y };
    },
    [transform]
  );

  // World to Screen coordinates transform
  const worldToScreen = useCallback(
    (worldX: number, worldY: number): Point => {
      const rect = canvasRef.current?.getBoundingClientRect();
      const canvasLeft = rect ? rect.left : 0;
      const canvasTop = rect ? rect.top : 0;

      const x = worldX * transform.zoom + transform.x + canvasLeft;
      const y = worldY * transform.zoom + transform.y + canvasTop;
      return { x, y };
    },
    [transform]
  );

  // Spacebar tracking for quick panning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !editingTextElement && (e.target as HTMLElement)?.tagName !== 'INPUT') {
        setIsSpacePressed(true);
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        setIsSpacePressed(false);
        setIsPanning(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [editingTextElement]);

  // Main Render Loop
  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const width = canvas.width / dpr;
    const height = canvas.height / dpr;

    // Reset transform & clear
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Render background
    renderBackground(
      ctx,
      width,
      height,
      transform,
      styleDefaults.canvasTheme,
      styleDefaults.backgroundStyle
    );

    // Apply viewport camera transform
    ctx.save();
    ctx.scale(dpr, dpr);
    ctx.translate(transform.x, transform.y);
    ctx.scale(transform.zoom, transform.zoom);

    // Render all elements
    elements.forEach((el) => {
      // Don't render element text if currently editing it with HTML overlay
      if (editingTextElement && editingTextElement.id === el.id) {
        if (el.type === 'sticky') {
          // Render sticky card without text
          const stickyCopy = { ...el, text: '' } as StickyElement;
          renderElement(ctx, stickyCopy);
        }
        return;
      }
      renderElement(ctx, el);
    });

    // Render draft element (currently drawing)
    if (currentDraftElement) {
      renderElement(ctx, currentDraftElement);
    }

    // Render selection outline
    if (selectedElementId) {
      const selected = elements.find((e) => e.id === selectedElementId);
      if (selected && (!editingTextElement || editingTextElement.id !== selected.id)) {
        renderSelectionBox(ctx, selected);
      }
    }

    ctx.restore();
  }, [elements, transform, styleDefaults, currentDraftElement, selectedElementId, editingTextElement]);

  // Resize canvas according to container
  useEffect(() => {
    const handleResize = () => {
      const canvas = canvasRef.current;
      const container = containerRef.current;
      if (!canvas || !container) return;

      const dpr = window.devicePixelRatio || 1;
      const width = container.clientWidth;
      const height = container.clientHeight;

      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = `${width}px`;
      canvas.style.height = `${height}px`;

      render();
    };

    handleResize();
    const observer = new ResizeObserver(handleResize);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    return () => observer.disconnect();
  }, [render]);

  // Redraw when dependencies change
  useEffect(() => {
    render();
  }, [render]);

  // Pointer Down
  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (editingTextElement) {
      // Commit text
      commitTextEdit();
    }

    const isPanMode = activeTool === 'hand' || isSpacePressed || e.button === 1;

    if (isPanMode) {
      setIsPanning(true);
      setPanStart({ x: e.clientX - transform.x, y: e.clientY - transform.y });
      return;
    }

    if (e.button !== 0) return; // Left click only

    const worldPoint = screenToWorld(e.clientX, e.clientY);
    setIsPointerDown(true);
    setDragStartPoint(worldPoint);

    if (activeTool === 'select') {
      // Find clicked element in reverse order (top to bottom)
      const clicked = [...elements].reverse().find((el) => isPointInElement(worldPoint, el));
      if (clicked) {
        onSelectElementId(clicked.id);
        setDragOffset({
          x: worldPoint.x - clicked.x,
          y: worldPoint.y - clicked.y,
        });
      } else {
        onSelectElementId(null);
      }
      return;
    }

    if (activeTool === 'eraser') {
      // Erase element if clicked
      const clicked = [...elements].reverse().find((el) => isPointInElement(worldPoint, el));
      if (clicked) {
        onDeleteElement(clicked.id);
      }
      return;
    }

    if (activeTool === 'pen' || activeTool === 'highlighter') {
      const newPath: PathElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: activeTool,
        x: worldPoint.x,
        y: worldPoint.y,
        points: [worldPoint],
        strokeColor: styleDefaults.strokeColor,
        strokeWidth: activeTool === 'highlighter' ? Math.max(16, styleDefaults.strokeWidth * 2) : styleDefaults.strokeWidth,
        opacity: styleDefaults.opacity,
      };
      setCurrentDraftElement(newPath);
      return;
    }

    if (['rectangle', 'circle', 'line', 'arrow', 'star'].includes(activeTool)) {
      const newShape: ShapeElement = {
        id: `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        type: activeTool as 'rectangle' | 'circle' | 'line' | 'arrow' | 'star',
        x: worldPoint.x,
        y: worldPoint.y,
        width: 1,
        height: 1,
        strokeColor: styleDefaults.strokeColor,
        fillColor: styleDefaults.fillColor,
        strokeWidth: styleDefaults.strokeWidth,
        opacity: styleDefaults.opacity,
      };
      setCurrentDraftElement(newShape);
      return;
    }

    if (activeTool === 'text') {
      const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      setEditingTextElement({
        id,
        text: '',
        x: worldPoint.x,
        y: worldPoint.y,
        width: 160,
        height: 40,
        fontSize: styleDefaults.fontSize,
        color: styleDefaults.strokeColor,
      });
      return;
    }

    if (activeTool === 'sticky') {
      const id = `el_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
      const newSticky: StickyElement = {
        id,
        type: 'sticky',
        x: worldPoint.x - 90,
        y: worldPoint.y - 90,
        width: 180,
        height: 180,
        text: 'New note...',
        noteColor: styleDefaults.stickyColor,
        strokeColor: '#1C1917',
        strokeWidth: 1,
        opacity: 100,
      };
      onAddElement(newSticky);
      onSelectElementId(id);
      onSelectTool('select');
      return;
    }
  };

  // Pointer Move
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (isPanning) {
      onUpdateTransform((prev) => ({
        ...prev,
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      }));
      return;
    }

    if (!isPointerDown) return;

    const worldPoint = screenToWorld(e.clientX, e.clientY);

    if (activeTool === 'eraser') {
      const clicked = [...elements].reverse().find((el) => isPointInElement(worldPoint, el));
      if (clicked) {
        onDeleteElement(clicked.id);
      }
      return;
    }

    if (activeTool === 'select' && selectedElementId && dragStartPoint) {
      const selected = elements.find((e) => e.id === selectedElementId);
      if (selected) {
        const newX = worldPoint.x - dragOffset.x;
        const newY = worldPoint.y - dragOffset.y;
        const deltaX = newX - selected.x;
        const deltaY = newY - selected.y;

        if (selected.type === 'pen' || selected.type === 'highlighter') {
          const pathEl = selected as PathElement;
          const updatedPoints = pathEl.points.map((p) => ({
            x: p.x + deltaX,
            y: p.y + deltaY,
          }));
          onUpdateElement(selected.id, {
            x: newX,
            y: newY,
            points: updatedPoints,
          } as Partial<CanvasElement>);
        } else {
          onUpdateElement(selected.id, { x: newX, y: newY });
        }
      }
      return;
    }

    if (currentDraftElement) {
      if (currentDraftElement.type === 'pen' || currentDraftElement.type === 'highlighter') {
        const pathEl = currentDraftElement as PathElement;
        const updatedPoints = [...pathEl.points, worldPoint];
        setCurrentDraftElement({
          ...pathEl,
          points: updatedPoints,
        });
      } else if (dragStartPoint) {
        const width = worldPoint.x - dragStartPoint.x;
        const height = worldPoint.y - dragStartPoint.y;
        setCurrentDraftElement({
          ...currentDraftElement,
          x: dragStartPoint.x,
          y: dragStartPoint.y,
          width,
          height,
        } as ShapeElement);
      }
    }
  };

  // Pointer Up
  const handlePointerUp = () => {
    if (isPanning) {
      setIsPanning(false);
    }

    if (isPointerDown) {
      setIsPointerDown(false);

      if (currentDraftElement) {
        if (
          currentDraftElement.type === 'pen' ||
          currentDraftElement.type === 'highlighter'
        ) {
          const path = currentDraftElement as PathElement;
          if (path.points && path.points.length > 0) {
            onAddElement(currentDraftElement);
          }
        } else if (
          ['rectangle', 'circle', 'line', 'arrow', 'star'].includes(
            currentDraftElement.type
          )
        ) {
          const shape = currentDraftElement as ShapeElement;
          if (Math.abs(shape.width) > 3 || Math.abs(shape.height) > 3) {
            onAddElement(currentDraftElement);
          }
        }
        setCurrentDraftElement(null);
      }
    }
  };

  // Double Click for Text or Sticky Edit
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const worldPoint = screenToWorld(e.clientX, e.clientY);
    const clicked = [...elements].reverse().find((el) => isPointInElement(worldPoint, el));

    if (clicked) {
      if (clicked.type === 'text') {
        const textEl = clicked as TextElement;
        setEditingTextElement({
          id: textEl.id,
          text: textEl.text,
          x: textEl.x,
          y: textEl.y,
          width: textEl.width || 180,
          height: textEl.height || 40,
          fontSize: textEl.fontSize || 20,
          color: textEl.strokeColor,
        });
      } else if (clicked.type === 'sticky') {
        const stickyEl = clicked as StickyElement;
        setEditingTextElement({
          id: stickyEl.id,
          text: stickyEl.text,
          x: stickyEl.x + 14,
          y: stickyEl.y + 24,
          width: (stickyEl.width || 180) - 28,
          height: (stickyEl.height || 180) - 38,
          fontSize: 16,
          color: '#1C1917',
          isSticky: true,
          stickyColor: stickyEl.noteColor,
        });
      }
    }
  };

  // Wheel Zoom & Pan
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();

    if (e.ctrlKey || e.metaKey) {
      // Zoom centered around mouse pointer
      const rect = canvasRef.current?.getBoundingClientRect();
      const mouseX = e.clientX - (rect?.left || 0);
      const mouseY = e.clientY - (rect?.top || 0);

      const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
      const newZoom = Math.min(5, Math.max(0.1, transform.zoom * zoomFactor));

      const newX = mouseX - (mouseX - transform.x) * (newZoom / transform.zoom);
      const newY = mouseY - (mouseY - transform.y) * (newZoom / transform.zoom);

      onUpdateTransform({
        x: newX,
        y: newY,
        zoom: newZoom,
      });
    } else {
      // Normal pan with wheel
      onUpdateTransform((prev) => ({
        ...prev,
        x: prev.x - e.deltaX,
        y: prev.y - e.deltaY,
      }));
    }
  };

  // Commit text editing
  const commitTextEdit = () => {
    if (!editingTextElement) return;

    const trimmed = editingTextElement.text.trim();
    const existing = elements.find((e) => e.id === editingTextElement.id);

    if (editingTextElement.isSticky) {
      if (existing) {
        onUpdateElement(editingTextElement.id, {
          text: editingTextElement.text,
        });
      }
    } else {
      if (trimmed) {
        if (existing) {
          onUpdateElement(editingTextElement.id, {
            text: editingTextElement.text,
          });
        } else {
          const newText: TextElement = {
            id: editingTextElement.id,
            type: 'text',
            x: editingTextElement.x,
            y: editingTextElement.y,
            text: editingTextElement.text,
            fontSize: editingTextElement.fontSize,
            fontFamily: 'Inter, sans-serif',
            strokeColor: editingTextElement.color,
            strokeWidth: 1,
            opacity: 100,
            width: Math.max(120, editingTextElement.text.length * editingTextElement.fontSize * 0.6),
            height: Math.max(30, editingTextElement.text.split('\n').length * editingTextElement.fontSize * 1.35),
          };
          onAddElement(newText);
        }
      } else if (existing) {
        onDeleteElement(existing.id);
      }
    }

    setEditingTextElement(null);
  };

  // Drag & Drop Image Files onto Canvas
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const dropWorldPoint = screenToWorld(e.clientX, e.clientY);
      onAddImage(file, dropWorldPoint);
    }
  };

  // Compute cursor style
  const getCursorStyle = () => {
    if (isPanning || isSpacePressed || activeTool === 'hand') return 'grab';
    if (activeTool === 'select') return 'default';
    if (activeTool === 'eraser') return 'crosshair';
    if (activeTool === 'text') return 'text';
    return 'crosshair';
  };

  return (
    <div
      ref={containerRef}
      id="canvas-container-root"
      className="w-full h-full relative overflow-hidden select-none outline-none"
      onDragOver={handleDragOver}
      onDrop={handleDrop}
    >
      <canvas
        ref={canvasRef}
        id="main-drawing-canvas"
        style={{ cursor: getCursorStyle() }}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        onWheel={handleWheel}
      />

      {/* HTML In-place Text/Sticky Editor Overlay */}
      {editingTextElement && (
        <div
          id="in-place-text-editor-container"
          style={{
            position: 'absolute',
            left: `${worldToScreen(editingTextElement.x, editingTextElement.y).x}px`,
            top: `${worldToScreen(editingTextElement.x, editingTextElement.y).y}px`,
            transform: `scale(${transform.zoom})`,
            transformOrigin: 'top left',
            zIndex: 40,
          }}
        >
          <textarea
            id="in-place-text-textarea"
            autoFocus
            value={editingTextElement.text}
            onChange={(e) =>
              setEditingTextElement({
                ...editingTextElement,
                text: e.target.value,
              })
            }
            onBlur={commitTextEdit}
            onKeyDown={(e) => {
              if (e.key === 'Escape') {
                commitTextEdit();
              }
              if (e.key === 'Enter' && !e.shiftKey && !editingTextElement.isSticky) {
                e.preventDefault();
                commitTextEdit();
              }
            }}
            placeholder={editingTextElement.isSticky ? 'Type sticky note...' : 'Type text...'}
            style={{
              fontSize: `${editingTextElement.fontSize}px`,
              color: editingTextElement.color,
              fontFamily: editingTextElement.isSticky
                ? 'Caveat, Patrick Hand, Comic Sans MS, sans-serif'
                : 'Inter, sans-serif',
              width: editingTextElement.isSticky ? `${editingTextElement.width}px` : 'auto',
              minWidth: '140px',
              height: editingTextElement.isSticky ? `${editingTextElement.height}px` : 'auto',
              minHeight: '32px',
            }}
            className="bg-transparent border-2 border-blue-500/80 rounded-lg p-1 outline-none resize-none overflow-hidden leading-tight font-sans shadow-lg"
          />
        </div>
      )}
    </div>
  );
};
