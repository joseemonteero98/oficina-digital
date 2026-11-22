'use client';

import React from 'react';

export interface FilterOption {
  id: string;
  label: string;
  count?: number;
}

interface FilterBarProps {
  options: FilterOption[];
  selectedId: string;
  onSelect: (id: string) => void;
  secondarySelect?: {
    label: string;
    value: string;
    options: { value: string; label: string }[];
    onChange: (val: string) => void;
  };
}

export function FilterBar({
  options,
  selectedId,
  onSelect,
  secondarySelect,
}: FilterBarProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {options.map((opt) => {
          const isActive = selectedId === opt.id;
          return (
            <button
              key={opt.id}
              type="button"
              onClick={() => onSelect(opt.id)}
              className={`h-9 px-3 rounded-[6px] text-[12px] font-medium border whitespace-nowrap transition-colors ${
                isActive
                  ? 'bg-[#000000] text-white border-[#000000]'
                  : 'bg-white text-[#525252] border-[#D1D5DB] hover:bg-[#F7F8FA] hover:text-black'
              }`}
            >
              {opt.label}
              {opt.count !== undefined ? ` (${opt.count})` : ''}
            </button>
          );
        })}
      </div>

      {secondarySelect && (
        <div className="shrink-0">
          <select
            aria-label={secondarySelect.label}
            value={secondarySelect.value}
            onChange={(e) => secondarySelect.onChange(e.target.value)}
            className="h-9 w-full sm:w-auto bg-white border border-[#9CA3AF] rounded-[6px] px-2.5 text-[12px] font-medium text-black focus:outline-none focus:border-[#2563EB]"
          >
            {secondarySelect.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
