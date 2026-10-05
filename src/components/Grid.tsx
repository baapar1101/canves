import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  CellData,
  CellPosition,
  CellRange,
  CopyBuffer,
  SheetData,
} from '../types/spreadsheet';
import {
  colIndexToName,
  formatCellValue,
  getCellKey,
  isCellInRange,
  normalizeRange,
  positionToA1,
  extrapolateFillValue,
} from '../utils/cellUtils';

interface GridProps {
  sheet: SheetData;
  activeCell: CellPosition;
  selectionRange: CellRange;
  isEditing: boolean;
  editValue: string;
  copyBuffer?: CopyBuffer | null;
  zoomLevel: number;
  onSelectCell: (pos: CellPosition, extendRange?: boolean) => void;
  onUpdateSelectionRange: (range: CellRange) => void;
  onStartEditing: (initialValue?: string) => void;
  onEditChange: (val: string) => void;
  onCommitEdit: () => void;
  onCancelEdit: () => void;
  onFillSeries: (sourceRange: CellRange, targetRange: CellRange) => void;
  onResizeCol: (col: number, width: number) => void;
  onResizeRow: (row: number, height: number) => void;
  onContextMenu: (e: React.MouseEvent, pos: CellPosition) => void;
  onKeyDown: (e: React.KeyboardEvent) => void;
}

const DEFAULT_ROW_COUNT = 50;
const DEFAULT_COL_COUNT = 26;
const DEFAULT_COL_WIDTH = 100;
const DEFAULT_ROW_HEIGHT = 24;
const HEADER_ROW_HEIGHT = 26;
const HEADER_COL_WIDTH = 46;

export const Grid: React.FC<GridProps> = ({
  sheet,
  activeCell,
  selectionRange,
  isEditing,
  editValue,
  copyBuffer,
  zoomLevel,
  onSelectCell,
  onUpdateSelectionRange,
  onStartEditing,
  onEditChange,
  onCommitEdit,
  onCancelEdit,
  onFillSeries,
  onResizeCol,
  onResizeRow,
  onContextMenu,
  onKeyDown,
}) => {
  const gridContainerRef = useRef<HTMLDivElement>(null);
  const editorInputRef = useRef<HTMLInputElement>(null);

  // Dragging states
  const [isMouseDownOnGrid, setIsMouseDownOnGrid] = useState(false);
  const [dragStartPos, setDragStartPos] = useState<CellPosition | null>(null);

  // Fill handle dragging
  const [isDraggingFillHandle, setIsDraggingFillHandle] = useState(false);
  const [fillTargetRange, setFillTargetRange] = useState<CellRange | null>(null);

  // Resize states
  const [resizingCol, setResizingCol] = useState<{ col: number; startX: number; startWidth: number } | null>(null);
  const [resizingRow, setResizingRow] = useState<{ row: number; startY: number; startHeight: number } | null>(null);

  // Calculate max rows and cols needed
  const maxRowIndex = useMemo(() => {
    let max = DEFAULT_ROW_COUNT;
    for (const key of Object.keys(sheet.cells)) {
      const [r] = key.split(':').map(Number);
      if (r + 10 > max) max = r + 10;
    }
    return Math.max(max, selectionRange.endRow + 10, activeCell.row + 10);
  }, [sheet.cells, selectionRange, activeCell]);

  const maxColIndex = useMemo(() => {
    let max = DEFAULT_COL_COUNT;
    for (const key of Object.keys(sheet.cells)) {
      const [, c] = key.split(':').map(Number);
      if (c + 5 > max) max = c + 5;
    }
    return Math.max(max, selectionRange.endCol + 5, activeCell.col + 5);
  }, [sheet.cells, selectionRange, activeCell]);

  // Column widths array
  const colWidths = useMemo(() => {
    const widths: number[] = [];
    for (let c = 0; c < maxColIndex; c++) {
      widths.push(sheet.colWidths[c] || DEFAULT_COL_WIDTH);
    }
    return widths;
  }, [sheet.colWidths, maxColIndex]);

  // Row heights array
  const rowHeights = useMemo(() => {
    const heights: number[] = [];
    for (let r = 0; r < maxRowIndex; r++) {
      heights.push(sheet.rowHeights[r] || DEFAULT_ROW_HEIGHT);
    }
    return heights;
  }, [sheet.rowHeights, maxRowIndex]);

  // Cumulative positions for exact geometric calculation
  const colPositions = useMemo(() => {
    const positions = [0];
    for (let c = 0; c < colWidths.length; c++) {
      positions.push(positions[c] + colWidths[c]);
    }
    return positions;
  }, [colWidths]);

  const rowPositions = useMemo(() => {
    const positions = [0];
    for (let r = 0; r < rowHeights.length; r++) {
      positions.push(positions[r] + rowHeights[r]);
    }
    return positions;
  }, [rowHeights]);

  // Focus editor when edit mode activates
  useEffect(() => {
    if (isEditing && editorInputRef.current) {
      editorInputRef.current.focus();
      // Move cursor to end
      const len = editorInputRef.current.value.length;
      editorInputRef.current.setSelectionRange(len, len);
    }
  }, [isEditing]);

  // Global mouse handlers for cell drag selection, fill handle, and column/row resizing
  useEffect(() => {
    const handleGlobalMouseMove = (e: MouseEvent) => {
      // Column resize drag
      if (resizingCol) {
        const delta = (e.clientX - resizingCol.startX) / zoomLevel;
        const newWidth = Math.max(30, Math.round(resizingCol.startWidth + delta));
        onResizeCol(resizingCol.col, newWidth);
        return;
      }

      // Row resize drag
      if (resizingRow) {
        const delta = (e.clientY - resizingRow.startY) / zoomLevel;
        const newHeight = Math.max(18, Math.round(resizingRow.startHeight + delta));
        onResizeRow(resizingRow.row, newHeight);
        return;
      }
    };

    const handleGlobalMouseUp = () => {
      if (resizingCol) setResizingCol(null);
      if (resizingRow) setResizingRow(null);
      if (isMouseDownOnGrid) setIsMouseDownOnGrid(false);

      if (isDraggingFillHandle && fillTargetRange) {
        onFillSeries(selectionRange, fillTargetRange);
        setIsDraggingFillHandle(false);
        setFillTargetRange(null);
      }
    };

    window.addEventListener('mousemove', handleGlobalMouseMove);
    window.addEventListener('mouseup', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mousemove', handleGlobalMouseMove);
      window.removeEventListener('mouseup', handleGlobalMouseUp);
    };
  }, [
    resizingCol,
    resizingRow,
    isMouseDownOnGrid,
    isDraggingFillHandle,
    fillTargetRange,
    selectionRange,
    zoomLevel,
    onResizeCol,
    onResizeRow,
    onFillSeries,
  ]);

  // Cell click handler
  const handleCellMouseDown = (
    e: React.MouseEvent,
    row: number,
    col: number
  ) => {
    if (e.button === 2) {
      // Right click
      if (!isCellInRange({ row, col }, selectionRange)) {
        onSelectCell({ row, col });
      }
      onContextMenu(e, { row, col });
      return;
    }

    if (e.button !== 0) return; // Only left button

    if (isEditing) {
      onCommitEdit();
    }

    if (e.shiftKey) {
      onSelectCell({ row, col }, true);
    } else {
      onSelectCell({ row, col });
      setIsMouseDownOnGrid(true);
      setDragStartPos({ row, col });
    }
  };

  const handleCellMouseEnter = (row: number, col: number) => {
    if (isMouseDownOnGrid && dragStartPos) {
      onUpdateSelectionRange({
        startRow: dragStartPos.row,
        startCol: dragStartPos.col,
        endRow: row,
        endCol: col,
      });
    }

    if (isDraggingFillHandle) {
      const norm = normalizeRange(selectionRange);
      // Determine if expanding vertically or horizontally
      if (row > norm.endRow) {
        setFillTargetRange({
          startRow: norm.startRow,
          startCol: norm.startCol,
          endRow: row,
          endCol: norm.endCol,
        });
      } else if (col > norm.endCol) {
        setFillTargetRange({
          startRow: norm.startRow,
          startCol: norm.startCol,
          endRow: norm.endRow,
          endCol: col,
        });
      }
    }
  };

  const handleCellDoubleClick = (row: number, col: number) => {
    const key = getCellKey(row, col);
    const cell = sheet.cells[key];
    onStartEditing(cell?.raw || '');
  };

  // Header column click (select entire column)
  const handleColumnHeaderClick = (col: number, e: React.MouseEvent) => {
    onUpdateSelectionRange({
      startRow: 0,
      startCol: col,
      endRow: maxRowIndex - 1,
      endCol: col,
    });
    onSelectCell({ row: 0, col });
  };

  // Header row click (select entire row)
  const handleRowHeaderClick = (row: number, e: React.MouseEvent) => {
    onUpdateSelectionRange({
      startRow: row,
      startCol: 0,
      endRow: row,
      endCol: maxColIndex - 1,
    });
    onSelectCell({ row, col: 0 });
  };

  // Select all cells
  const handleSelectAll = () => {
    onUpdateSelectionRange({
      startRow: 0,
      startCol: 0,
      endRow: maxRowIndex - 1,
      endCol: maxColIndex - 1,
    });
    onSelectCell({ row: 0, col: 0 });
  };

  const normSelection = normalizeRange(selectionRange);

  // Compute selection box pixel bounds
  const selectionStyle = useMemo(() => {
    const left = colPositions[normSelection.startCol];
    const top = rowPositions[normSelection.startRow];
    const width = colPositions[normSelection.endCol + 1] - left;
    const height = rowPositions[normSelection.endRow + 1] - top;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [normSelection, colPositions, rowPositions]);

  // Compute fill box pixel bounds
  const fillBoxStyle = useMemo(() => {
    if (!fillTargetRange) return null;
    const norm = normalizeRange(fillTargetRange);
    const left = colPositions[norm.startCol];
    const top = rowPositions[norm.startRow];
    const width = colPositions[norm.endCol + 1] - left;
    const height = rowPositions[norm.endRow + 1] - top;

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [fillTargetRange, colPositions, rowPositions]);

  // Compute active cell pixel bounds
  const activeCellStyle = useMemo(() => {
    const left = colPositions[activeCell.col];
    const top = rowPositions[activeCell.row];
    const width = colWidths[activeCell.col];
    const height = rowHeights[activeCell.row];

    return {
      left: `${left}px`,
      top: `${top}px`,
      width: `${width}px`,
      height: `${height}px`,
    };
  }, [activeCell, colPositions, rowPositions, colWidths, rowHeights]);

  return (
    <div
      ref={gridContainerRef}
      id="spreadsheet-grid-container"
      tabIndex={0}
      onKeyDown={onKeyDown}
      style={{
        transform: `scale(${zoomLevel})`,
        transformOrigin: 'top left',
      }}
      className="flex-1 overflow-auto bg-[#0A0A0A] relative outline-none select-none"
    >
      <div
        id="spreadsheet-grid-inner"
        className="relative inline-block min-w-full min-h-full bg-[#0A0A0A]"
        style={{
          width: `${colPositions[colPositions.length - 1] + HEADER_COL_WIDTH + 40}px`,
          height: `${rowPositions[rowPositions.length - 1] + HEADER_ROW_HEIGHT + 40}px`,
        }}
      >
        {/* Top-Left Select All Corner Header */}
        <div
          id="grid-corner-select-all"
          onClick={handleSelectAll}
          style={{ width: `${HEADER_COL_WIDTH}px`, height: `${HEADER_ROW_HEIGHT}px` }}
          className="sticky top-0 left-0 z-30 bg-[#121215] border-r border-b border-[#222226] flex items-center justify-center cursor-pointer hover:bg-[#1C1C20] transition-colors"
          title="Select all cells"
        >
          <div className="w-2.5 h-2.5 bg-[#71717A] rounded-xs"></div>
        </div>

        {/* Column Headers (Sticky Top) */}
        <div
          id="grid-column-headers-row"
          style={{
            left: `${HEADER_COL_WIDTH}px`,
            height: `${HEADER_ROW_HEIGHT}px`,
          }}
          className="sticky top-0 z-20 flex bg-[#121215] border-b border-[#222226] font-sans text-xs text-[#A1A1AA]"
        >
          {colWidths.map((width, colIdx) => {
            const isColSelected =
              colIdx >= normSelection.startCol && colIdx <= normSelection.endCol;
            return (
              <div
                key={colIdx}
                id={`col-header-${colIndexToName(colIdx)}`}
                onClick={(e) => handleColumnHeaderClick(colIdx, e)}
                style={{ width: `${width}px`, minWidth: `${width}px` }}
                className={`relative h-full flex items-center justify-center border-r border-[#222226] text-xs font-semibold cursor-pointer hover:bg-[#1C1C20] hover:text-[#F4F4F5] transition-colors ${
                  isColSelected ? 'bg-blue-950/60 text-blue-300 font-bold border-r-blue-800/60' : ''
                }`}
              >
                <span>{colIndexToName(colIdx)}</span>

                {/* Column Resize Handle */}
                <div
                  id={`col-resize-handle-${colIdx}`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    setResizingCol({
                      col: colIdx,
                      startX: e.clientX,
                      startWidth: width,
                    });
                  }}
                  className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-blue-500 z-10"
                />
              </div>
            );
          })}
        </div>

        {/* Row Headers (Sticky Left) & Cells Container */}
        <div className="flex relative">
          {/* Row Headers */}
          <div
            id="grid-row-headers-col"
            style={{ width: `${HEADER_COL_WIDTH}px` }}
            className="sticky left-0 z-10 bg-[#121215] border-r border-[#222226] text-xs text-[#A1A1AA] select-none"
          >
            {rowHeights.map((height, rowIdx) => {
              const isRowSelected =
                rowIdx >= normSelection.startRow && rowIdx <= normSelection.endRow;
              return (
                <div
                  key={rowIdx}
                  id={`row-header-${rowIdx + 1}`}
                  onClick={(e) => handleRowHeaderClick(rowIdx, e)}
                  style={{ height: `${height}px` }}
                  className={`relative flex items-center justify-center border-b border-[#222226] font-semibold cursor-pointer hover:bg-[#1C1C20] hover:text-[#F4F4F5] transition-colors ${
                    isRowSelected ? 'bg-blue-950/60 text-blue-300 font-bold border-b-blue-800/60' : ''
                  }`}
                >
                  <span>{rowIdx + 1}</span>

                  {/* Row Resize Handle */}
                  <div
                    id={`row-resize-handle-${rowIdx}`}
                    onMouseDown={(e) => {
                      e.stopPropagation();
                      setResizingRow({
                        row: rowIdx,
                        startY: e.clientY,
                        startHeight: height,
                      });
                    }}
                    className="absolute left-0 right-0 bottom-0 h-1.5 cursor-row-resize hover:bg-blue-500 z-10"
                  />
                </div>
              );
            })}
          </div>

          {/* Cells Grid Matrix */}
          <div id="grid-cells-layer" className="relative flex-1">
            {rowHeights.map((height, rowIdx) => (
              <div
                key={rowIdx}
                id={`grid-row-${rowIdx}`}
                style={{ height: `${height}px` }}
                className="flex border-b border-[#1F1F24]"
              >
                {colWidths.map((width, colIdx) => {
                  const key = getCellKey(rowIdx, colIdx);
                  const cell = sheet.cells[key];
                  const style = cell?.style;
                  const hasError = Boolean(cell?.error);
                  const formatted = formatCellValue(cell?.computed, style);

                  return (
                    <div
                      key={colIdx}
                      id={`cell-${colIndexToName(colIdx)}${rowIdx + 1}`}
                      data-cell-key={key}
                      onMouseDown={(e) => handleCellMouseDown(e, rowIdx, colIdx)}
                      onMouseEnter={() => handleCellMouseEnter(rowIdx, colIdx)}
                      onDoubleClick={() => handleCellDoubleClick(rowIdx, colIdx)}
                      style={{
                        width: `${width}px`,
                        minWidth: `${width}px`,
                        height: `${height}px`,
                        fontWeight: style?.bold ? 'bold' : 'normal',
                        fontStyle: style?.italic ? 'italic' : 'normal',
                        textDecoration: style?.strikethrough ? 'line-through' : style?.underline ? 'underline' : 'none',
                        color: hasError ? '#F87171' : style?.color || '#D4D4D8',
                        backgroundColor: style?.backgroundColor || 'transparent',
                        textAlign: style?.textAlign || (typeof cell?.computed === 'number' ? 'right' : 'left'),
                        fontSize: style?.fontSize ? `${style.fontSize}px` : '11px',
                        fontFamily: style?.fontFamily || 'Arial',
                        borderTop: style?.borderTop,
                        borderRight: style?.borderRight,
                        borderBottom: style?.borderBottom,
                        borderLeft: style?.borderLeft,
                      }}
                      className="border-r border-[#1F1F24] px-1.5 py-0.5 flex items-center overflow-hidden whitespace-nowrap text-ellipsis cursor-cell font-sans relative"
                      title={cell?.raw?.startsWith('=') ? `${cell.raw} (Value: ${formatted})` : formatted}
                    >
                      <span className="truncate w-full leading-tight select-none">
                        {formatted}
                      </span>
                    </div>
                  );
                })}
              </div>
            ))}

            {/* Selection Range Overlay Box */}
            <div
              id="grid-selection-box"
              style={selectionStyle}
              className="absolute pointer-events-none border-2 border-blue-500 bg-blue-500/15 z-10 transition-all duration-75 shadow-xs"
            >
              {/* Fill Handle (Little Square at bottom-right corner) */}
              <div
                id="grid-fill-handle"
                onMouseDown={(e) => {
                  e.stopPropagation();
                  setIsDraggingFillHandle(true);
                  setFillTargetRange(selectionRange);
                }}
                className="absolute -bottom-1.5 -right-1.5 w-2.5 h-2.5 bg-blue-500 border-2 border-[#0A0A0A] rounded-xs pointer-events-auto cursor-crosshair hover:scale-125 transition-transform"
                title="Drag to auto-fill series or formulas"
              />
            </div>

            {/* Fill Drag Preview Box */}
            {fillTargetRange && fillBoxStyle && (
              <div
                id="grid-fill-preview-box"
                style={fillBoxStyle}
                className="absolute pointer-events-none border-2 border-dashed border-blue-400 bg-blue-400/20 z-15"
              />
            )}

            {/* In-Cell Active Editor */}
            {isEditing && (
              <div
                id="grid-in-cell-editor-container"
                style={activeCellStyle}
                className="absolute z-20 bg-[#18181B] border-2 border-blue-500 shadow-2xl flex items-center"
              >
                <input
                  ref={editorInputRef}
                  id="in-cell-editor-input"
                  type="text"
                  value={editValue}
                  onChange={(e) => onEditChange(e.target.value)}
                  onBlur={onCommitEdit}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      onCommitEdit();
                    } else if (e.key === 'Escape') {
                      onCancelEdit();
                    }
                  }}
                  className="w-full h-full px-1.5 py-0.5 text-xs text-[#F4F4F5] bg-[#18181B] outline-none font-sans"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
