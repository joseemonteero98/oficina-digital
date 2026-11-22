'use client';

import React from 'react';
import { AlertCircle } from 'lucide-react';

interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  message = 'No se pudo cargar la información. Verifica tu conexión e inténtalo nuevamente.',
  onRetry,
}: ErrorStateProps) {
  return (
    <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] p-5 text-center">
      <AlertCircle className="w-6 h-6 text-[#DC2626] mx-auto mb-2" strokeWidth={2} />
      <p className="text-[14px] font-medium text-[#DC2626]">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-3 h-11 px-4 rounded-[6px] bg-white text-black border border-[#D1D5DB] text-[14px] font-medium hover:bg-[#F7F8FA]"
        >
          Reintentar
        </button>
      )}
    </div>
  );
}
