'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';

export function ToastBanner() {
  const { toast, clearToast } = useApp();
  if (!toast) return null;

  const styles =
    toast.tipo === 'success'
      ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
      : toast.tipo === 'error'
      ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
      : 'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]';

  const Icon =
    toast.tipo === 'success'
      ? CheckCircle2
      : toast.tipo === 'error'
      ? AlertCircle
      : Info;

  return (
    <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-[80]">
      <div
        role="status"
        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-[8px] border ${styles}`}
      >
        <div className="flex items-center gap-2.5">
          <Icon className="w-5 h-5 shrink-0" strokeWidth={2} />
          <p className="text-[14px] font-medium text-black">{toast.mensaje}</p>
        </div>
        <button
          type="button"
          onClick={clearToast}
          aria-label="Cerrar notificación"
          className="p-1 text-[#525252] hover:text-black"
        >
          <X className="w-4 h-4" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
