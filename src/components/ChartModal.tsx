import React, { useState, useMemo } from 'react';
import { BarChart2, TrendingUp, PieChart, AreaChart, X, Download } from 'lucide-react';
import { CellRange, SheetData } from '../types/spreadsheet';
import { getCellKey, normalizeRange, positionToA1 } from '../utils/cellUtils';

interface ChartModalProps {
  sheet: SheetData;
  selectionRange: CellRange;
  onClose: () => void;
}

export const ChartModal: React.FC<ChartModalProps> = ({
  sheet,
  selectionRange,
  onClose,
}) => {
  const [chartType, setChartType] = useState<'bar' | 'line' | 'pie' | 'area'>('bar');
  const [chartTitle, setChartTitle] = useState('Data Visualization');

  const norm = normalizeRange(selectionRange);

  // Extract labels and data points from the selection range
  const chartData = useMemo(() => {
    const dataPoints: { label: string; value: number }[] = [];
    const isSingleCol = norm.startCol === norm.endCol;

    if (isSingleCol) {
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        const key = getCellKey(r, norm.startCol);
        const cell = sheet.cells[key];
        const val = typeof cell?.computed === 'number' ? cell.computed : parseFloat(String(cell?.computed || cell?.raw || '0'));
        dataPoints.push({
          label: `Row ${r + 1}`,
          value: isNaN(val) ? 0 : val,
        });
      }
    } else {
      // First column as labels, second column (or next cols) as values
      for (let r = norm.startRow; r <= norm.endRow; r++) {
        const labelKey = getCellKey(r, norm.startCol);
        const valKey = getCellKey(r, norm.startCol + 1);

        const labelCell = sheet.cells[labelKey];
        const valCell = sheet.cells[valKey];

        const label = labelCell?.computed ? String(labelCell.computed) : labelCell?.raw || `Item ${r - norm.startRow + 1}`;
        const val = typeof valCell?.computed === 'number' ? valCell.computed : parseFloat(String(valCell?.computed || valCell?.raw || '0'));

        dataPoints.push({
          label,
          value: isNaN(val) ? 0 : val,
        });
      }
    }

    return dataPoints;
  }, [sheet, norm]);

  const maxVal = Math.max(...chartData.map((d) => d.value), 1);
  const minVal = Math.min(...chartData.map((d) => d.value), 0);
  const valRange = maxVal - minVal || 1;

  const COLORS = ['#1a73e8', '#12b5cb', '#e37400', '#188038', '#a142f4', '#e52592', '#f29900', '#d93025'];

  return (
    <div
      id="chart-modal-overlay"
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        id="chart-modal-container"
        className="bg-[#141417] rounded-xl shadow-2xl border border-[#27272A] w-full max-w-2xl p-6 font-sans text-xs text-[#E4E4E7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222226] mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-950/60 text-blue-400 flex items-center justify-center font-bold border border-blue-800/40">
              <BarChart2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-[#F4F4F5] text-sm">Chart Editor</h3>
              <p className="text-[11px] text-[#A1A1AA]">
                Range: {positionToA1({ row: norm.startRow, col: norm.startCol })}:
                {positionToA1({ row: norm.endRow, col: norm.endCol })} ({chartData.length} data points)
              </p>
            </div>
          </div>
          <button
            id="btn-close-chart-modal"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#E4E4E7] text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-2">
            <label className="font-medium text-[#E4E4E7]">Type:</label>
            <div className="flex border border-[#27272A] bg-[#18181B] rounded-lg overflow-hidden">
              <button
                id="chart-type-bar"
                onClick={() => setChartType('bar')}
                className={`px-3 py-1.5 flex items-center gap-1 cursor-pointer transition-colors ${
                  chartType === 'bar' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                <BarChart2 className="w-3.5 h-3.5" /> Bar
              </button>
              <button
                id="chart-type-line"
                onClick={() => setChartType('line')}
                className={`px-3 py-1.5 flex items-center gap-1 cursor-pointer transition-colors ${
                  chartType === 'line' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" /> Line
              </button>
              <button
                id="chart-type-area"
                onClick={() => setChartType('area')}
                className={`px-3 py-1.5 flex items-center gap-1 cursor-pointer transition-colors ${
                  chartType === 'area' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                <AreaChart className="w-3.5 h-3.5" /> Area
              </button>
              <button
                id="chart-type-pie"
                onClick={() => setChartType('pie')}
                className={`px-3 py-1.5 flex items-center gap-1 cursor-pointer transition-colors ${
                  chartType === 'pie' ? 'bg-blue-600 text-white font-medium' : 'hover:bg-[#222226] text-[#A1A1AA] hover:text-[#F4F4F5]'
                }`}
              >
                <PieChart className="w-3.5 h-3.5" /> Pie
              </button>
            </div>
          </div>

          <div className="flex-1 max-w-xs">
            <input
              id="chart-title-input"
              type="text"
              value={chartTitle}
              onChange={(e) => setChartTitle(e.target.value)}
              placeholder="Chart Title"
              className="w-full px-3 py-1.5 bg-[#18181B] border border-[#27272A] rounded-lg text-xs outline-none focus:border-blue-500 font-medium text-[#F4F4F5] placeholder-[#52525B]"
            />
          </div>
        </div>

        {/* Chart Canvas / SVG Container */}
        <div
          id="chart-render-area"
          className="bg-[#0A0A0A] border border-[#27272A] rounded-xl p-4 h-72 flex flex-col items-center justify-center relative overflow-hidden"
        >
          <div className="font-semibold text-[#F4F4F5] text-sm mb-2 text-center">{chartTitle}</div>

          {chartData.length === 0 ? (
            <div className="text-[#71717A]">No data found in selected cells</div>
          ) : chartType === 'bar' ? (
            <div className="w-full h-full flex items-end justify-around gap-2 pt-4 pb-6 px-4">
              {chartData.map((d, idx) => {
                const heightPercent = Math.max(8, Math.round(((d.value - Math.min(0, minVal)) / valRange) * 80));
                const color = COLORS[idx % COLORS.length];

                return (
                  <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] text-[#A1A1AA] mb-1 opacity-0 group-hover:opacity-100 transition-opacity font-mono font-medium">
                      {d.value.toLocaleString()}
                    </span>
                    <div
                      style={{ height: `${heightPercent}%`, backgroundColor: color }}
                      className="w-full max-w-[48px] rounded-t-sm transition-all hover:opacity-90 shadow-2xs"
                    />
                    <span className="text-[10px] text-[#A1A1AA] truncate max-w-[60px] mt-1.5 text-center font-medium">
                      {d.label}
                    </span>
                  </div>
                );
              })}
            </div>
          ) : chartType === 'line' || chartType === 'area' ? (
            <div className="w-full h-full relative pt-4 pb-6 px-4 flex items-center justify-center">
              <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
                {/* Grid Lines */}
                <line x1="0" y1="0" x2="500" y2="0" stroke="#27272A" strokeDasharray="3 3" />
                <line x1="0" y1="100" x2="500" y2="100" stroke="#27272A" strokeDasharray="3 3" />
                <line x1="0" y1="200" x2="500" y2="200" stroke="#27272A" />

                {/* Path calculation */}
                {(() => {
                  const points = chartData.map((d, i) => {
                    const x = chartData.length === 1 ? 250 : (i / (chartData.length - 1)) * 480 + 10;
                    const y = 180 - ((d.value - Math.min(0, minVal)) / valRange) * 160;
                    return { x, y, val: d.value, label: d.label };
                  });

                  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
                  const areaPath = `${linePath} L ${points[points.length - 1].x} 200 L ${points[0].x} 200 Z`;

                  return (
                    <>
                      {chartType === 'area' && (
                        <path d={areaPath} fill="rgba(59, 130, 246, 0.2)" />
                      )}
                      <path d={linePath} fill="none" stroke="#3b82f6" strokeWidth="3" strokeLinecap="round" />
                      {points.map((p, i) => (
                        <g key={i}>
                          <circle cx={p.x} cy={p.y} r="5" fill="#3b82f6" stroke="#0A0A0A" strokeWidth="2" />
                          <text x={p.x} y="215" textAnchor="middle" fontSize="10" fill="#A1A1AA">
                            {p.label}
                          </text>
                        </g>
                      ))}
                    </>
                  );
                })()}
              </svg>
            </div>
          ) : (
            /* Pie Chart */
            <div className="w-full h-full flex items-center justify-center gap-8 py-2">
              <svg className="w-44 h-44 -rotate-90" viewBox="0 0 100 100">
                {(() => {
                  const total = chartData.reduce((acc, d) => acc + Math.max(0, d.value), 0) || 1;
                  let accumulatedPercent = 0;

                  return chartData.map((d, i) => {
                    const percent = (Math.max(0, d.value) / total) * 100;
                    const strokeDasharray = `${percent} ${100 - percent}`;
                    const strokeDashoffset = -accumulatedPercent;
                    accumulatedPercent += percent;

                    return (
                      <circle
                        key={i}
                        cx="50"
                        cy="50"
                        r="25"
                        fill="transparent"
                        stroke={COLORS[i % COLORS.length]}
                        strokeWidth="50"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                      />
                    );
                  });
                })()}
              </svg>

              {/* Legend */}
              <div className="space-y-1.5 max-h-48 overflow-y-auto">
                {chartData.map((d, i) => (
                  <div key={i} className="flex items-center gap-2 text-xs">
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: COLORS[i % COLORS.length] }}
                    />
                    <span className="font-medium text-[#E4E4E7] truncate max-w-[120px]">{d.label}</span>
                    <span className="text-[#71717A] font-mono">({d.value.toLocaleString()})</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-[#222226] flex justify-end">
          <button
            id="btn-close-chart"
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-lg cursor-pointer transition-colors text-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
