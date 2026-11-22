'use client';

import React from 'react';
import { Loader2, AlertTriangle } from 'lucide-react';

interface ConfirmDialogProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'primary' | 'success' | 'danger';
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmDialog({
  isOpen,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Volver',
  variant = 'success',
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  const confirmBg =
    variant === 'danger'
      ? 'bg-[#DC2626] hover:bg-[#B91C1C]'
      : variant === 'primary'
      ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
      : 'bg-[#15803D] hover:bg-[#166534]';

  return (
    <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-sm w-full p-5 space-y-4"
      >
        <div className="flex items-start gap-3">
          {variant === 'danger' && (
            <div className="w-9 h-9 rounded-full bg-[#FEF2F2] border border-[#FCA5A5] flex items-center justify-center shrink-0">
              <AlertTriangle className="w-5 h-5 text-[#DC2626]" strokeWidth={2} />
            </div>
          )}
          <div>
            <h3 className="text-[16px] font-semibold text-black">{title}</h3>
            <p className="text-[14px] text-[#525252] mt-1 leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="h-12 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[14px] font-medium disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`h-12 rounded-[6px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${confirmBg}`}
          >
            {isLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
