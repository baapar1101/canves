import React from 'react';
import { X, Command } from 'lucide-react';

interface ShortcutsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const shortcutGroups = [
    {
      title: 'Tools',
      shortcuts: [
        { key: 'V', desc: 'Select & Move' },
        { key: 'H / Space', desc: 'Pan / Hand tool' },
        { key: 'P', desc: 'Pen (Freehand)' },
        { key: 'M', desc: 'Highlighter' },
        { key: 'E', desc: 'Eraser' },
        { key: 'R', desc: 'Rectangle' },
        { key: 'O', desc: 'Circle / Ellipse' },
        { key: 'L', desc: 'Line' },
        { key: 'A', desc: 'Arrow' },
        { key: 'S', desc: 'Star' },
        { key: 'T', desc: 'Text' },
        { key: 'N', desc: 'Sticky note' },
        { key: 'I', desc: 'Upload image' },
      ],
    },
    {
      title: 'Actions & Navigation',
      shortcuts: [
        { key: 'Ctrl + Z', desc: 'Undo' },
        { key: 'Ctrl + Y', desc: 'Redo' },
        { key: 'Ctrl + D', desc: 'Duplicate selected' },
        { key: 'Del / Backspace', desc: 'Delete selected' },
        { key: 'Ctrl + Scroll', desc: 'Zoom in / out' },
        { key: 'Space + Drag', desc: 'Pan canvas' },
        { key: 'Shift + 1', desc: 'Fit to content' },
        { key: 'Esc', desc: 'Cancel / Deselect' },
      ],
    },
  ];

  return (
    <div
      id="shortcuts-modal-overlay"
      className="fixed inset-0 bg-black/75 backdrop-blur-xs flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#141417] border border-[#27272A] rounded-2xl shadow-2xl w-full max-w-lg p-6 font-sans text-xs text-[#E4E4E7]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between pb-4 border-b border-[#222226] mb-4">
          <div className="flex items-center gap-2">
            <Command className="w-4 h-4 text-blue-400" />
            <h3 className="font-semibold text-[#F4F4F5] text-sm">Keyboard Shortcuts</h3>
          </div>
          <button
            onClick={onClose}
            className="text-[#71717A] hover:text-white p-1 rounded-lg hover:bg-[#222226] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-6">
          {shortcutGroups.map((group) => (
            <div key={group.title} className="space-y-2">
              <h4 className="font-semibold text-blue-400 text-xs uppercase tracking-wider">
                {group.title}
              </h4>
              <div className="space-y-1.5">
                {group.shortcuts.map((s) => (
                  <div key={s.key} className="flex items-center justify-between py-1">
                    <span className="text-[#A1A1AA]">{s.desc}</span>
                    <kbd className="px-2 py-0.5 bg-[#1F1F24] border border-[#2F2F36] rounded-md font-mono text-[11px] text-[#F4F4F5]">
                      {s.key}
                    </kbd>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-3 border-t border-[#222226] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl text-xs transition-colors cursor-pointer"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
};
