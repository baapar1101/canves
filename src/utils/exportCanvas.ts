import { CanvasElement, CanvasTheme, StyleDefaults } from '../types/canvas';
import { THEME_COLORS, renderElement, renderBackground, getElementBounds } from './canvasRenderer';

export function exportToPNG(
  elements: CanvasElement[],
  theme: CanvasTheme,
  isTransparent: boolean,
  filename = 'canvas-drawing.png'
) {
  if (elements.length === 0) {
    alert('Canvas is empty, nothing to export.');
    return;
  }

  // Calculate bounding box of all elements with margin
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

  const margin = 40;
  const width = Math.max(200, maxX - minX + margin * 2);
  const height = Math.max(200, maxY - minY + margin * 2);

  const offCanvas = document.createElement('canvas');
  const dpr = 2; // 2x high-resolution export
  offCanvas.width = width * dpr;
  offCanvas.height = height * dpr;

  const ctx = offCanvas.getContext('2d');
  if (!ctx) return;

  ctx.scale(dpr, dpr);

  if (!isTransparent) {
    ctx.fillStyle = THEME_COLORS[theme].bg;
    ctx.fillRect(0, 0, width, height);
  }

  ctx.translate(-minX + margin, -minY + margin);

  elements.forEach((el) => {
    renderElement(ctx, el);
  });

  const dataUrl = offCanvas.toDataURL('image/png');
  const link = document.createElement('a');
  link.download = filename;
  link.href = dataUrl;
  link.click();
}

export function exportToSVG(
  elements: CanvasElement[],
  theme: CanvasTheme,
  filename = 'canvas-vector.svg'
) {
  if (elements.length === 0) {
    alert('Canvas is empty, nothing to export.');
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

  const margin = 40;
  const width = Math.max(200, maxX - minX + margin * 2);
  const height = Math.max(200, maxY - minY + margin * 2);

  const svgParts: string[] = [
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">`,
    `<rect width="${width}" height="${height}" fill="${THEME_COLORS[theme].bg}" />`,
    `<g transform="translate(${-minX + margin}, ${-minY + margin})">`,
  ];

  elements.forEach((el) => {
    const opacity = (el.opacity ?? 100) / 100;
    const stroke = el.strokeColor || '#FFFFFF';
    const strokeWidth = el.strokeWidth || 2;
    const fill = el.fillColor && el.fillColor !== 'transparent' ? el.fillColor : 'none';

    if (el.type === 'pen' || el.type === 'highlighter') {
      const pathEl = el as { points: { x: number; y: number }[] };
      if (pathEl.points && pathEl.points.length > 0) {
        const d = pathEl.points
          .map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`)
          .join(' ');
        const extraOp = el.type === 'highlighter' ? 0.35 : opacity;
        svgParts.push(
          `<path d="${d}" fill="none" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" stroke-linejoin="round" opacity="${extraOp}" />`
        );
      }
    } else if (el.type === 'rectangle') {
      const rx = (el.width ?? 0) < 0 ? el.x + (el.width ?? 0) : el.x;
      const ry = (el.height ?? 0) < 0 ? el.y + (el.height ?? 0) : el.y;
      svgParts.push(
        `<rect x="${rx}" y="${ry}" width="${Math.abs(el.width ?? 0)}" height="${Math.abs(
          el.height ?? 0
        )}" rx="8" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`
      );
    } else if (el.type === 'circle') {
      const cx = el.x + (el.width ?? 0) / 2;
      const cy = el.y + (el.height ?? 0) / 2;
      const rx = Math.abs((el.width ?? 0) / 2);
      const ry = Math.abs((el.height ?? 0) / 2);
      svgParts.push(
        `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="${fill}" stroke="${stroke}" stroke-width="${strokeWidth}" opacity="${opacity}" />`
      );
    } else if (el.type === 'line') {
      svgParts.push(
        `<line x1="${el.x}" y1="${el.y}" x2="${el.x + (el.width ?? 0)}" y2="${
          el.y + (el.height ?? 0)
        }" stroke="${stroke}" stroke-width="${strokeWidth}" stroke-linecap="round" opacity="${opacity}" />`
      );
    } else if (el.type === 'text') {
      const textEl = el as { text: string; fontSize: number };
      const lines = (textEl.text || '').split('\n');
      const fontSize = textEl.fontSize || 20;
      lines.forEach((l, i) => {
        svgParts.push(
          `<text x="${el.x}" y="${el.y + (i + 1) * fontSize}" font-size="${fontSize}" font-family="Inter, sans-serif" fill="${stroke}" opacity="${opacity}">${escapeXml(
            l
          )}</text>`
        );
      });
    } else if (el.type === 'sticky') {
      const sticky = el as { noteColor: string; text: string; width: number; height: number };
      svgParts.push(
        `<rect x="${el.x}" y="${el.y}" width="${sticky.width || 180}" height="${
          sticky.height || 180
        }" rx="8" fill="${sticky.noteColor || '#FEF08A'}" filter="drop-shadow(0px 4px 8px rgba(0,0,0,0.2))" />`
      );
      const lines = (sticky.text || '').split('\n');
      lines.forEach((l, i) => {
        svgParts.push(
          `<text x="${el.x + 16}" y="${el.y + 24 + i * 20}" font-size="15" font-family="sans-serif" fill="#1C1917">${escapeXml(
            l
          )}</text>`
        );
      });
    }
  });

  svgParts.push('</g>');
  svgParts.push('</svg>');

  const svgBlob = new Blob([svgParts.join('\n')], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}

function escapeXml(unsafe: string): string {
  return unsafe.replace(/[<>&'"]/g, (c) => {
    switch (c) {
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '&':
        return '&amp;';
      case '\'':
        return '&apos;';
      case '"':
        return '&quot;';
      default:
        return c;
    }
  });
}

export function exportToJSON(
  elements: CanvasElement[],
  title: string,
  styleDefaults: StyleDefaults,
  filename = 'canvas-project.json'
) {
  const project = {
    version: 1,
    title,
    createdAt: new Date().toISOString(),
    styleDefaults,
    elements,
  };

  const jsonStr = JSON.stringify(project, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.download = filename;
  link.href = url;
  link.click();
  URL.revokeObjectURL(url);
}
