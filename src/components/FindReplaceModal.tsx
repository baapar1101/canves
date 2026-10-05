import React, { useState } from 'react';
import { Search, Replace, X } from 'lucide-react';
import { CellData, CellPosition, SheetData } from '../types/spreadsheet';
import { getCellKey, parseCellKey } from '../utils/cellUtils';

interface FindReplaceModalProps {
  sheet: SheetData;
  onClose: () => void;
  onNavigateToCell: (pos: CellPosition) => void;
  onReplaceCell: (pos: CellPosition, newVal: string) => void;
  onReplaceAll: (findText: string, replaceText: string, matchCase: boolean) => number;
}

export const FindReplaceModal: React.FC<FindReplaceModalProps> = ({
  sheet,
  onClose,
  onNavigateToCell,
  onReplaceCell,
  onReplaceAll,
}) => {
  const [findText, setFindText] = useState('');
  const [replaceText, setReplaceText] = useState('');
  const [matchCase, setMatchCase] = useState(false);
  const [currentMatchIdx, setCurrentMatchIdx] = useState<number>(-1);
  const [matches, setMatches] = useState<CellPosition[]>([]);
  const [statusMessage, setStatusMessage] = useState('');

  const findMatches = () => {
    if (!findText.trim()) {
      setMatches([]);
      setStatusMessage('');
      return [];
    }

    const found: CellPosition[] = [];
    for (const [key, cell] of Object.entries(sheet.cells) as [string, CellData][]) {
      if (!cell || !cell.raw) continue;
      const text = cell.raw;
      const target = findText;

      const hasMatch = matchCase ? text.includes(target) : text.toLowerCase().includes(target.toLowerCase());
      if (hasMatch) {
        found.push(parseCellKey(key));
      }
    }

    setMatches(found);
    if (found.length > 0) {
      setCurrentMatchIdx(0);
      onNavigateToCell(found[0]);
      setStatusMessage(`Match 1 of ${found.length}`);
    } else {
      setCurrentMatchIdx(-1);
      setStatusMessage('No matches found');
    }
    return found;
  };

  const handleFindNext = () => {
    let currentMatches = matches;
    if (currentMatches.length === 0) {
      currentMatches = findMatches();
    }
    if (currentMatches.length === 0) return;

    const nextIdx = (currentMatchIdx + 1) % currentMatches.length;
    setCurrentMatchIdx(nextIdx);
    onNavigateToCell(currentMatches[nextIdx]);
    setStatusMessage(`Match ${nextIdx + 1} of ${currentMatches.length}`);
  };

  const handleReplace = () => {
    if (matches.length === 0 || currentMatchIdx === -1) {
      handleFindNext();
      return;
    }

    const pos = matches[currentMatchIdx];
    const key = getCellKey(pos.row, pos.col);
    const cell = sheet.cells[key];
    if (cell && cell.raw) {
      const regex = new RegExp(
        findText.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'),
        matchCase ? 'g' : 'gi'
      );
      const replaced = cell.raw.replace(regex, replaceText);
      onReplaceCell(pos, replaced);
    }

    // Refresh matches
    setTimeout(() => {
      findMatches();
    }, 50);
  };

  const handleReplaceAllClick = () => {
    if (!findText) return;
    const count = onReplaceAll(findText, replaceText, matchCase);
    setStatusMessage(`Replaced ${count} occurrences`);
    setMatches([]);
    setCurrentMatchIdx(-1);
  };

  return (
    <div
      id="find-replace-modal-overlay"
      className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        id="find-replace-modal-container"
        className="bg-[#141417] rounded-xl shadow-2xl border border-[#27272A] w-full max-w-md p-6 font-sans text-xs text-[#E4E4E7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#222226] mb-4">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-[#F4F4F5] text-sm">Find and replace</h3>
          </div>
          <button
            id="btn-close-find-replace"
            onClick={onClose}
            className="text-[#71717A] hover:text-[#E4E4E7] text-lg leading-none cursor-pointer"
          >
            &times;
          </button>
        </div>

        <div className="space-y-3">
          <div>
            <label className="block text-[#E4E4E7] font-medium mb-1">Find</label>
            <input
              id="find-text-input"
              type="text"
              value={findText}
              onChange={(e) => setFindText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFindNext()}
              placeholder="Text to find"
              autoFocus
              className="w-full px-3 py-1.5 bg-[#18181B] border border-[#27272A] rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-[#F4F4F5] placeholder-[#52525B]"
            />
          </div>

          <div>
            <label className="block text-[#E4E4E7] font-medium mb-1">Replace with</label>
            <input
              id="replace-text-input"
              type="text"
              value={replaceText}
              onChange={(e) => setReplaceText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleReplace()}
              placeholder="Replacement text"
              className="w-full px-3 py-1.5 bg-[#18181B] border border-[#27272A] rounded-md focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none text-xs text-[#F4F4F5] placeholder-[#52525B]"
            />
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              id="match-case-checkbox"
              type="checkbox"
              checked={matchCase}
              onChange={(e) => setMatchCase(e.target.checked)}
              className="rounded border-[#27272A] bg-[#18181B] text-blue-500 focus:ring-blue-500 cursor-pointer"
            />
            <label htmlFor="match-case-checkbox" className="text-[#A1A1AA] cursor-pointer">
              Match case
            </label>
          </div>

          {statusMessage && (
            <div id="find-replace-status" className="text-blue-400 font-medium pt-1 text-[11px]">
              {statusMessage}
            </div>
          )}
        </div>

        <div className="mt-6 pt-3 border-t border-[#222226] flex items-center justify-between">
          <button
            id="btn-replace-all"
            onClick={handleReplaceAllClick}
            disabled={!findText}
            className="px-3 py-1.5 border border-[#27272A] bg-[#18181B] rounded-md text-[#E4E4E7] hover:bg-[#1F1F24] disabled:opacity-30 cursor-pointer transition-colors"
          >
            Replace all
          </button>

          <div className="flex items-center gap-2">
            <button
              id="btn-replace-single"
              onClick={handleReplace}
              disabled={!findText}
              className="px-3 py-1.5 border border-[#27272A] bg-[#18181B] rounded-md text-[#E4E4E7] hover:bg-[#1F1F24] disabled:opacity-30 cursor-pointer transition-colors"
            >
              Replace
            </button>
            <button
              id="btn-find-next"
              onClick={handleFindNext}
              disabled={!findText}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-md disabled:opacity-30 cursor-pointer shadow-xs transition-colors"
            >
              Find next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
