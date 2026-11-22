'use client';

import React from 'react';
import { cn } from '@/lib/utils';

export type BadgeVariant = 'pending' | 'success' | 'info' | 'danger' | 'neutral';

interface StatusBadgeProps {
  label: string;
  variant?: BadgeVariant;
  className?: string;
}

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  pending: 'bg-[#FFFBEB] text-[#D97706] border-[#FCD34D]',
  success: 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]',
  info: 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]',
  danger: 'bg-[#FEF2F2] text-[#DC2626] border-[#FCA5A5]',
  neutral: 'bg-[#F7F8FA] text-[#525252] border-[#D1D5DB]',
};

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2.5 py-0.5 rounded-md text-[12px] font-medium border whitespace-nowrap',
        VARIANT_CLASSES[variant],
        className
      )}
    >
      {label}
    </span>
  );
}
