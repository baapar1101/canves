import { CanvasElement, CanvasTheme, BackgroundStyle, ViewportTransform, Point, PathElement, ShapeElement, TextElement, StickyElement, ImageElement } from '../types/canvas';

// Image cache to avoid re-decoding data URLs on every frame
const imageCache = new Map<string, HTMLImageElement>();

export function getCachedImage(src: string): HTMLImageElement {
  if (imageCache.has(src)) {
    return imageCache.get(src)!;
  }
  const img = new Image();
  img.src = src;
  imageCache.set(src, img);
  return img;
}

export const THEME_COLORS: Record<CanvasTheme, { bg: string; grid: string; text: string }> = {
  dark: { bg: '#0F0F12', grid: '#27272A', text: '#F4F4F5' },
  midnight: { bg: '#090D16', grid: '#1E293B', text: '#E2E8F0' },
  paper: { bg: '#FDFBF7', grid: '#E5E0D8', text: '#2D2B2A' },
  light: { bg: '#FFFFFF', grid: '#E2E8F0', text: '#0F172A' },
};

export function renderBackground(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  transform: ViewportTransform,
  theme: CanvasTheme,
  bgStyle: BackgroundStyle
) {
  const themeColors = THEME_COLORS[theme];
  ctx.save();
  ctx.fillStyle = themeColors.bg;
  ctx.fillRect(0, 0, width, height);

  if (bgStyle === 'blank') {
    ctx.restore();
    return;
  }

  const gridSize = 32 * transform.zoom;
  if (gridSize < 8) {
    ctx.restore();
    return; // Don't render tiny cluttered grid at high zoom out
  }

  const offsetX = (transform.x % gridSize + gridSize) % gridSize;
  const offsetY = (transform.y % gridSize + gridSize) % gridSize;

  ctx.strokeStyle = themeColors.grid;
  ctx.fillStyle = themeColors.grid;
  ctx.lineWidth = 1;

  if (bgStyle === 'dots') {
    const dotRadius = Math.max(1, 1.2 * Math.min(1.5, transform.zoom));
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.arc(x, y, dotRadius, 0, Math.PI * 2);
        ctx.fill();
      }
    }
  } else if (bgStyle === 'grid') {
    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
    }
    for (let y = offsetY; y < height; y += gridSize) {
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
    }
    ctx.stroke();
  } else if (bgStyle === 'cross') {
    const crossSize = 3;
    ctx.beginPath();
    for (let x = offsetX; x < width; x += gridSize) {
      for (let y = offsetY; y < height; y += gridSize) {
        ctx.moveTo(x - crossSize, y);
        ctx.lineTo(x + crossSize, y);
        ctx.moveTo(x, y - crossSize);
        ctx.lineTo(x, y + crossSize);
      }
    }
    ctx.stroke();
  }

  ctx.restore();
}

export function renderElement(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  ctx.save();
  ctx.globalAlpha = (el.opacity ?? 100) / 100;

  if (el.type === 'highlighter') {
    ctx.globalAlpha = Math.min(0.4, (el.opacity ?? 100) / 100 * 0.45);
  }

  switch (el.type) {
    case 'pen':
    case 'highlighter':
      renderPath(ctx, el as PathElement);
      break;
    case 'line':
    case 'arrow':
    case 'rectangle':
    case 'circle':
    case 'star':
      renderShape(ctx, el as ShapeElement);
      break;
    case 'text':
      renderText(ctx, el as TextElement);
      break;
    case 'sticky':
      renderSticky(ctx, el as StickyElement);
      break;
    case 'image':
      renderImage(ctx, el as ImageElement);
      break;
  }

  ctx.restore();
}

function renderPath(ctx: CanvasRenderingContext2D, el: PathElement) {
  if (!el.points || el.points.length === 0) return;

  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.points.length === 1) {
    ctx.beginPath();
    ctx.arc(el.points[0].x, el.points[0].y, el.strokeWidth / 2, 0, Math.PI * 2);
    ctx.fillStyle = el.strokeColor;
    ctx.fill();
    return;
  }

  ctx.beginPath();
  ctx.moveTo(el.points[0].x, el.points[0].y);

  for (let i = 1; i < el.points.length - 1; i++) {
    const xc = (el.points[i].x + el.points[i + 1].x) / 2;
    const yc = (el.points[i].y + el.points[i + 1].y) / 2;
    ctx.quadraticCurveTo(el.points[i].x, el.points[i].y, xc, yc);
  }

  const last = el.points[el.points.length - 1];
  const secondLast = el.points[el.points.length - 2];
  if (secondLast) {
    ctx.quadraticCurveTo(secondLast.x, secondLast.y, last.x, last.y);
  } else {
    ctx.lineTo(last.x, last.y);
  }

  ctx.stroke();
}

function renderShape(ctx: CanvasRenderingContext2D, el: ShapeElement) {
  ctx.strokeStyle = el.strokeColor;
  ctx.lineWidth = el.strokeWidth;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  if (el.fillColor && el.fillColor !== 'transparent') {
    ctx.fillStyle = el.fillColor;
  }

  const { x, y, width, height, type } = el;

  if (type === 'rectangle') {
    const rx = width < 0 ? x + width : x;
    const ry = height < 0 ? y + height : y;
    const rw = Math.abs(width);
    const rh = Math.abs(height);
    const radius = Math.min(8, rw / 2, rh / 2);

    ctx.beginPath();
    ctx.roundRect(rx, ry, rw, rh, radius);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  } else if (type === 'circle') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const rx = Math.abs(width / 2);
    const ry = Math.abs(height / 2);

    ctx.beginPath();
    ctx.ellipse(cx, cy, Math.max(0.1, rx), Math.max(0.1, ry), 0, 0, Math.PI * 2);
    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  } else if (type === 'line') {
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + width, y + height);
    ctx.stroke();
  } else if (type === 'arrow') {
    const startX = x;
    const startY = y;
    const endX = x + width;
    const endY = y + height;

    ctx.beginPath();
    ctx.moveTo(startX, startY);
    ctx.lineTo(endX, endY);
    ctx.stroke();

    // Arrowhead
    const angle = Math.atan2(endY - startY, endX - startX);
    const headLength = Math.max(12, el.strokeWidth * 3);
    const headAngle = Math.PI / 6; // 30 degrees

    ctx.beginPath();
    ctx.moveTo(endX, endY);
    ctx.lineTo(
      endX - headLength * Math.cos(angle - headAngle),
      endY - headLength * Math.sin(angle - headAngle)
    );
    ctx.lineTo(
      endX - headLength * Math.cos(angle + headAngle),
      endY - headLength * Math.sin(angle + headAngle)
    );
    ctx.closePath();
    ctx.fillStyle = el.strokeColor;
    ctx.fill();
  } else if (type === 'star') {
    const cx = x + width / 2;
    const cy = y + height / 2;
    const outerR = Math.max(Math.abs(width), Math.abs(height)) / 2;
    const innerR = outerR * 0.45;
    const spikes = 5;

    ctx.beginPath();
    let rot = (Math.PI / 2) * 3;
    const step = Math.PI / spikes;

    let sx = cx + Math.cos(rot) * outerR;
    let sy = cy + Math.sin(rot) * outerR;
    ctx.moveTo(sx, sy);

    for (let i = 0; i < spikes; i++) {
      sx = cx + Math.cos(rot) * outerR;
      sy = cy + Math.sin(rot) * outerR;
      ctx.lineTo(sx, sy);
      rot += step;

      sx = cx + Math.cos(rot) * innerR;
      sy = cy + Math.sin(rot) * innerR;
      ctx.lineTo(sx, sy);
      rot += step;
    }
    ctx.closePath();

    if (el.fillColor && el.fillColor !== 'transparent') {
      ctx.fill();
    }
    if (el.strokeWidth > 0) {
      ctx.stroke();
    }
  }
}

function renderText(ctx: CanvasRenderingContext2D, el: TextElement) {
  const fontSize = el.fontSize || 20;
  const fontFamily = el.fontFamily || 'Inter, sans-serif';
  ctx.font = `${fontSize}px ${fontFamily}`;
  ctx.fillStyle = el.strokeColor || '#FFFFFF';
  ctx.textBaseline = 'top';

  const lines = (el.text || '').split('\n');
  const lineHeight = fontSize * 1.35;

  lines.forEach((line, index) => {
    ctx.fillText(line, el.x, el.y + index * lineHeight);
  });
}

function renderSticky(ctx: CanvasRenderingContext2D, el: StickyElement) {
  const { x, y, width = 180, height = 180, noteColor = '#FEF08A', text = '' } = el;

  // Shadow
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.25)';
  ctx.shadowBlur = 12;
  ctx.shadowOffsetY = 4;

  ctx.fillStyle = noteColor;
  ctx.beginPath();
  ctx.roundRect(x, y, width, height, 8);
  ctx.fill();
  ctx.restore();

  // Subtle tape or fold effect at top
  ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
  ctx.fillRect(x + width / 4, y, width / 2, 8);

  // Text inside sticky note
  ctx.font = '15px Caveat, Patrick Hand, Comic Sans MS, sans-serif, system-ui';
  ctx.fillStyle = '#1C1917';
  ctx.textBaseline = 'top';

  const padding = 14;
  const maxWidth = width - padding * 2;
  const lines = wrapText(ctx, text, maxWidth);
  const lineHeight = 20;

  lines.slice(0, Math.floor((height - padding * 2) / lineHeight)).forEach((line, idx) => {
    ctx.fillText(line, x + padding, y + padding + idx * lineHeight);
  });
}

function renderImage(ctx: CanvasRenderingContext2D, el: ImageElement) {
  if (!el.dataUrl) return;
  const img = getCachedImage(el.dataUrl);
  if (img.complete && img.naturalWidth > 0) {
    ctx.drawImage(ctx.canvas, 0, 0); // harmless check
    ctx.drawImage(img, el.x, el.y, el.width, el.height);
  } else {
    img.onload = () => {
      // triggers next frame render
    };
  }
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = '';

  for (let i = 0; i < words.length; i++) {
    const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = words[i];
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) {
    lines.push(currentLine);
  }
  return lines.length > 0 ? lines : [''];
}

export function getElementBounds(el: CanvasElement): { x: number; y: number; width: number; height: number } {
  if (el.type === 'pen' || el.type === 'highlighter') {
    const path = el as PathElement;
    if (!path.points || path.points.length === 0) {
      return { x: el.x, y: el.y, width: 0, height: 0 };
    }
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    path.points.forEach((p) => {
      minX = Math.min(minX, p.x);
      minY = Math.min(minY, p.y);
      maxX = Math.max(maxX, p.x);
      maxY = Math.max(maxY, p.y);
    });

    const pad = (el.strokeWidth || 4) / 2;
    return {
      x: minX - pad,
      y: minY - pad,
      width: Math.max(10, maxX - minX + pad * 2),
      height: Math.max(10, maxY - minY + pad * 2),
    };
  }

  if (el.type === 'text') {
    const textEl = el as TextElement;
    const fontSize = textEl.fontSize || 20;
    const lines = (textEl.text || '').split('\n');
    const width = Math.max(textEl.width || 100, Math.max(...lines.map((l) => l.length * fontSize * 0.6)));
    const height = Math.max(textEl.height || 30, lines.length * fontSize * 1.35);
    return { x: el.x, y: el.y, width, height };
  }

  const w = el.width ?? 100;
  const h = el.height ?? 100;
  const x = w < 0 ? el.x + w : el.x;
  const y = h < 0 ? el.y + h : el.y;
  return { x, y, width: Math.abs(w), height: Math.abs(h) };
}

export function isPointInElement(point: Point, el: CanvasElement): boolean {
  const bounds = getElementBounds(el);
  const margin = 8;
  return (
    point.x >= bounds.x - margin &&
    point.x <= bounds.x + bounds.width + margin &&
    point.y >= bounds.y - margin &&
    point.y <= bounds.y + bounds.height + margin
  );
}

export function renderSelectionBox(ctx: CanvasRenderingContext2D, el: CanvasElement) {
  const bounds = getElementBounds(el);
  const padding = 6;

  ctx.save();
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 4]);

  const sx = bounds.x - padding;
  const sy = bounds.y - padding;
  const sw = bounds.width + padding * 2;
  const sh = bounds.height + padding * 2;

  ctx.strokeRect(sx, sy, sw, sh);
  ctx.setLineDash([]);

  // Handles (corners)
  const handleSize = 7;
  ctx.fillStyle = '#FFFFFF';
  ctx.strokeStyle = '#3B82F6';
  ctx.lineWidth = 2;

  const handles = [
    { x: sx, y: sy },
    { x: sx + sw, y: sy },
    { x: sx, y: sy + sh },
    { x: sx + sw, y: sy + sh },
  ];

  handles.forEach((h) => {
    ctx.fillRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
    ctx.strokeRect(h.x - handleSize / 2, h.y - handleSize / 2, handleSize, handleSize);
  });

  ctx.restore();
}
