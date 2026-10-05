import React, { useState, useEffect, useRef } from 'react';
import { FunctionSquare, Check, X, AlertCircle } from 'lucide-react';
import { CellPosition } from '../types/spreadsheet';
import { a1ToPosition, positionToA1 } from '../utils/cellUtils';

interface FormulaBarProps {
  activeCell: CellPosition;
  rawFormula: string;
  computedValue?: string | number | boolean | null;
  cellError?: string | null;
  onFormulaChange: (val: string) => void;
  onFormulaSubmit: () => void;
  onNavigateToCell: (pos: CellPosition) => void;
}

const COMMON_FUNCTIONS = [
  { name: 'SUM', desc: 'SUM(value1, [value2, ...]) - Sum of numbers/ranges' },
  { name: 'AVERAGE', desc: 'AVERAGE(value1, [value2, ...]) - Numerical average' },
  { name: 'COUNT', desc: 'COUNT(value1, [value2, ...]) - Count of numbers' },
  { name: 'COUNTA', desc: 'COUNTA(value1, [value2, ...]) - Count of non-empty cells' },
  { name: 'COUNTIF', desc: 'COUNTIF(range, criteria) - Conditional count' },
  { name: 'MIN', desc: 'MIN(value1, [value2, ...]) - Minimum value' },
  { name: 'MAX', desc: 'MAX(value1, [value2, ...]) - Maximum value' },
  { name: 'IF', desc: 'IF(logical_expression, value_if_true, [value_if_false])' },
  { name: 'IFS', desc: 'IFS(condition1, value1, [condition2, ...])' },
  { name: 'IFERROR', desc: 'IFERROR(value, [value_if_error])' },
  { name: 'VLOOKUP', desc: 'VLOOKUP(search_key, range, index, [is_sorted])' },
  { name: 'HLOOKUP', desc: 'HLOOKUP(search_key, range, index, [is_sorted])' },
  { name: 'INDEX', desc: 'INDEX(reference, [row], [column])' },
  { name: 'MATCH', desc: 'MATCH(search_key, range, [search_type])' },
  { name: 'CONCATENATE', desc: 'CONCATENATE(string1, [string2, ...])' },
  { name: 'TODAY', desc: 'TODAY() - Current date' },
  { name: 'ROUND', desc: 'ROUND(value, [places])' },
];

export const FormulaBar: React.FC<FormulaBarProps> = ({
  activeCell,
  rawFormula,
  computedValue,
  cellError,
  onFormulaChange,
  onFormulaSubmit,
  onNavigateToCell,
}) => {
  const [cellNameInput, setCellNameInput] = useState(positionToA1(activeCell));
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filterText, setFilterText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setCellNameInput(positionToA1(activeCell));
  }, [activeCell]);

  const handleCellNameSubmit = () => {
    const pos = a1ToPosition(cellNameInput);
    if (pos) {
      onNavigateToCell(pos);
    } else {
      setCellNameInput(positionToA1(activeCell));
    }
  };

  const handleFormulaInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onFormulaChange(val);

    if (val.startsWith('=')) {
      const match = val.match(/=([A-Za-z]+)$/);
      if (match) {
        setFilterText(match[1].toUpperCase());
        setShowSuggestions(true);
      } else {
        setShowSuggestions(false);
      }
    } else {
      setShowSuggestions(false);
    }
  };

  const handleSelectFunction = (fnName: string) => {
    const newFormula = `=${fnName}(`;
    onFormulaChange(newFormula);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const suggestions = COMMON_FUNCTIONS.filter((fn) =>
    fn.name.startsWith(filterText)
  );

  return (
    <div
      id="formula-bar-container"
      className="flex items-center gap-1.5 px-3 py-1 bg-[#0F0F12] border-b border-[#222226] select-none text-xs min-h-[34px] relative text-[#E4E4E7]"
    >
      {/* Active Cell Reference Input */}
      <div className="relative">
        <input
          id="formula-active-cell-input"
          type="text"
          value={cellNameInput}
          onChange={(e) => setCellNameInput(e.target.value.toUpperCase())}
          onBlur={handleCellNameSubmit}
          onKeyDown={(e) => e.key === 'Enter' && handleCellNameSubmit()}
          className="w-16 px-2 py-1 text-center font-semibold text-[#F4F4F5] bg-[#18181B] border border-[#27272A] rounded focus:bg-[#1E1E22] focus:border-blue-500/80 outline-none text-xs"
          title="Name box - type cell e.g. B5 and press Enter"
        />
      </div>

      <div className="h-4 w-px bg-[#27272A] mx-0.5" />

      {/* fx symbol */}
      <div
        id="formula-fx-icon"
        className="text-[#71717A] font-serif italic text-sm font-bold px-1 select-none flex items-center justify-center"
      >
        fx
      </div>

      {/* Live Formula / Content Input */}
      <div className="flex-1 relative flex items-center">
        <input
          ref={inputRef}
          id="formula-input"
          type="text"
          value={rawFormula}
          onChange={handleFormulaInputChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              onFormulaSubmit();
              setShowSuggestions(false);
            } else if (e.key === 'Escape') {
              setShowSuggestions(false);
            }
          }}
          onFocus={() => {
            if (rawFormula.startsWith('=')) {
              setShowSuggestions(true);
            }
          }}
          placeholder="Enter text, numbers, or formula starting with '='"
          className="w-full px-2.5 py-1 text-xs text-[#F4F4F5] placeholder-[#52525B] bg-transparent rounded focus:bg-[#18181B] outline-none border border-transparent focus:border-blue-500/50 font-mono transition-colors"
        />

        {/* Error or Value Preview */}
        {cellError ? (
          <div
            id="formula-error-badge"
            className="flex items-center gap-1 text-[11px] text-red-400 bg-red-950/40 border border-red-800/60 px-2 py-0.5 rounded font-mono ml-2 shrink-0"
          >
            <AlertCircle className="w-3 h-3" />
            <span>{cellError}</span>
          </div>
        ) : rawFormula.startsWith('=') && computedValue !== undefined ? (
          <div
            id="formula-preview-badge"
            className="text-[11px] text-[#A1A1AA] bg-[#18181B] border border-[#27272A] px-2 py-0.5 rounded font-mono ml-2 shrink-0 truncate max-w-xs"
            title={`Result: ${String(computedValue)}`}
          >
            = {String(computedValue)}
          </div>
        ) : null}

        {/* Function Autocomplete Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div
            id="formula-autocomplete-dropdown"
            className="absolute left-0 top-full mt-1 bg-[#141417] border border-[#27272A] rounded-md shadow-2xl py-1 w-80 z-50 text-xs max-h-52 overflow-y-auto font-sans text-[#E4E4E7]"
          >
            <div className="px-3 py-1 text-[10px] font-semibold text-[#71717A] uppercase tracking-wider border-b border-[#222226]">
              Functions
            </div>
            {suggestions.map((fn) => (
              <button
                key={fn.name}
                id={`fn-suggestion-${fn.name}`}
                onClick={() => handleSelectFunction(fn.name)}
                className="w-full text-left px-3 py-1.5 hover:bg-[#1F1F24] hover:text-white cursor-pointer block group"
              >
                <div className="font-semibold text-[#F4F4F5] group-hover:text-blue-400 font-mono">
                  {fn.name}
                </div>
                <div className="text-[11px] text-[#A1A1AA] truncate">{fn.desc}</div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
