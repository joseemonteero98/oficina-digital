'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Building2 } from 'lucide-react';

interface OfficeSelectorProps {
  compact?: boolean;
}

export function OfficeSelector({ compact = false }: OfficeSelectorProps) {
  const { currentRole, oficinas, selectedOficinaId, setSelectedOficinaId } = useApp();

  if (currentRole !== 'dueno' && currentRole !== 'admin') {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      {!compact && <Building2 className="w-4 h-4 text-[#525252] shrink-0" strokeWidth={2} />}
      <select
        aria-label="Seleccionar oficina"
        value={selectedOficinaId}
        onChange={(e) => setSelectedOficinaId(e.target.value)}
        className={`bg-white border border-[#9CA3AF] rounded-[6px] text-black font-medium focus:outline-none focus:border-[#2563EB] ${
          compact ? 'h-9 px-2.5 text-[12px]' : 'h-11 px-3 text-[14px] w-full'
        }`}
      >
        {currentRole === 'dueno' && <option value="todas">Todas las oficinas</option>}
        {oficinas.map((ofi) => (
          <option key={ofi.id} value={ofi.id}>
            {ofi.nombre}
          </option>
        ))}
      </select>
    </div>
  );
}
