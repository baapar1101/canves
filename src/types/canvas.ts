export type ToolType =
  | 'select'
  | 'pen'
  | 'highlighter'
  | 'eraser'
  | 'line'
  | 'arrow'
  | 'rectangle'
  | 'circle'
  | 'star'
  | 'text'
  | 'sticky'
  | 'hand';

export type BackgroundStyle = 'dots' | 'grid' | 'cross' | 'blank';

export type CanvasTheme = 'dark' | 'midnight' | 'paper' | 'light';

export interface Point {
  x: number;
  y: number;
}

export interface BaseElement {
  id: string;
  type: ToolType | 'image';
  x: number;
  y: number;
  width?: number;
  height?: number;
  strokeColor: string;
  fillColor?: string;
  strokeWidth: number;
  opacity: number;
  roughness?: number;
  rotation?: number;
  isLocked?: boolean;
}

export interface PathElement extends BaseElement {
  type: 'pen' | 'highlighter';
  points: Point[];
}

export interface ShapeElement extends BaseElement {
  type: 'line' | 'arrow' | 'rectangle' | 'circle' | 'star';
  width: number;
  height: number;
}

export interface TextElement extends BaseElement {
  type: 'text';
  text: string;
  fontSize: number;
  fontFamily: string;
  width: number;
  height: number;
}

export interface StickyElement extends BaseElement {
  type: 'sticky';
  text: string;
  noteColor: string;
  width: number;
  height: number;
}

export interface ImageElement extends BaseElement {
  type: 'image';
  dataUrl: string;
  width: number;
  height: number;
}

export type CanvasElement =
  | PathElement
  | ShapeElement
  | TextElement
  | StickyElement
  | ImageElement;

export interface ViewportTransform {
  x: number;
  y: number;
  zoom: number;
}

export interface StyleDefaults {
  strokeColor: string;
  fillColor: string;
  strokeWidth: number;
  opacity: number;
  fontSize: number;
  stickyColor: string;
  backgroundStyle: BackgroundStyle;
  canvasTheme: CanvasTheme;
}
