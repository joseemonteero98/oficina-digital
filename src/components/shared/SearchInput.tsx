'use client';

import React from 'react';
import { Search, X } from 'lucide-react';

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}

export function SearchInput({
  value,
  onChange,
  placeholder = 'Buscar...',
  id = 'search-input',
}: SearchInputProps) {
  return (
    <div className="relative w-full">
      <label htmlFor={id} className="sr-only">
        {placeholder}
      </label>
      <Search
        className="w-4 h-4 text-[#525252] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
        strokeWidth={2}
      />
      <input
        id={id}
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full h-11 bg-white border border-[#9CA3AF] rounded-[6px] pl-10 pr-9 text-[14px] text-black placeholder-[#8A8A8A] focus:outline-none focus:border-[#2563EB]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Limpiar búsqueda"
          className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 text-[#525252] hover:text-black"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      )}
    </div>
  );
}
