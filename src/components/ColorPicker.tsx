import React from 'react';

interface ColorPickerProps {
  currentColor?: string;
  onChange: (color: string) => void;
  onClose: () => void;
  title?: string;
}

const PALETTE = [
  ['#000000', '#434343', '#666666', '#999999', '#b7b7b7', '#cccccc', '#d9d9d9', '#efefef', '#f3f3f3', '#ffffff'],
  ['#980000', '#ff0000', '#ff9900', '#ffff00', '#00ff00', '#00ffff', '#4a86e8', '#0000ff', '#9900ff', '#ff00ff'],
  ['#e6b8af', '#f4cccc', '#fce5cd', '#fff2cc', '#d9ead3', '#d0e0e3', '#c9daf8', '#cfe2f3', '#d9d2e9', '#ead1dc'],
  ['#dd7e6b', '#ea9999', '#f9cb9c', '#ffe599', '#b6d7a8', '#a2c4c9', '#a4c2f4', '#9fc5e8', '#b4a7d6', '#d5a6bd'],
  ['#cc4125', '#e06666', '#f6b26b', '#ffd966', '#93c47d', '#76a5af', '#6d9eeb', '#6fa8dc', '#8e7cc3', '#c27ba0'],
  ['#a61c1c', '#cc0000', '#e69138', '#f1c232', '#6aa84f', '#45818e', '#3c78d8', '#3d85c6', '#674ea7', '#a64d79'],
  ['#85200c', '#990000', '#b45f06', '#bf9000', '#38761d', '#134f5c', '#1155cc', '#0b5394', '#351c75', '#741b47'],
  ['#5b0f00', '#660000', '#783f04', '#7f6000', '#274e13', '#0c343d', '#1c4587', '#073763', '#20124d', '#4c1130'],
];

export const ColorPicker: React.FC<ColorPickerProps> = ({
  currentColor,
  onChange,
  onClose,
  title = 'Pick Color',
}) => {
  return (
    <div
      id="color-picker-popover"
      className="absolute z-50 bg-[#141417] rounded-lg shadow-2xl border border-[#27272A] p-3 w-64 text-xs font-sans select-none text-[#E4E4E7]"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-[#222226] font-medium text-[#F4F4F5]">
        <span>{title}</span>
        <button
          id="color-picker-reset-btn"
          onClick={() => {
            onChange('');
            onClose();
          }}
          className="text-blue-400 hover:text-blue-300 cursor-pointer"
        >
          Reset
        </button>
      </div>

      <div className="space-y-1.5">
        {PALETTE.map((row, rIdx) => (
          <div key={rIdx} className="flex gap-1.5 justify-between">
            {row.map((color) => {
              const isSelected = currentColor?.toLowerCase() === color.toLowerCase();
              return (
                <button
                  key={color}
                  id={`color-swatch-${color.replace('#', '')}`}
                  className={`w-5 h-5 rounded-sm border cursor-pointer transition-transform hover:scale-110 ${
                    isSelected ? 'ring-2 ring-blue-500 ring-offset-1 ring-offset-[#141417] z-10' : 'border-[#27272A]'
                  }`}
                  style={{ backgroundColor: color }}
                  title={color}
                  onClick={() => {
                    onChange(color);
                    onClose();
                  }}
                />
              );
            })}
          </div>
        ))}
      </div>

      <div className="mt-3 pt-2 border-t border-[#222226] flex items-center gap-2">
        <span className="text-[#A1A1AA]">Custom:</span>
        <input
          id="color-picker-custom-input"
          type="color"
          value={currentColor && currentColor.startsWith('#') ? currentColor : '#000000'}
          onChange={(e) => {
            onChange(e.target.value);
            onClose();
          }}
          className="w-7 h-7 rounded border border-[#27272A] cursor-pointer p-0 bg-transparent"
        />
        <input
          id="color-picker-custom-hex"
          type="text"
          placeholder="#hex"
          value={currentColor || ''}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 px-2 py-1 bg-[#18181B] border border-[#27272A] rounded text-xs text-[#F4F4F5] placeholder-[#52525B] outline-none focus:border-blue-500"
        />
      </div>
    </div>
  );
};
