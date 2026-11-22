'use client';

import React from 'react';
import { LucideIcon, Inbox } from 'lucide-react';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  secondaryActionLabel?: string;
  onSecondaryAction?: () => void;
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  secondaryActionLabel,
  onSecondaryAction,
}: EmptyStateProps) {
  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-8 text-center">
      <div className="w-11 h-11 rounded-full bg-[#F7F8FA] border border-[#E5E7EB] flex items-center justify-center mx-auto mb-3 text-[#525252]">
        <Icon className="w-5 h-5" strokeWidth={2} />
      </div>
      <p className="text-[16px] font-semibold text-black">{title}</p>
      {description && (
        <p className="text-[14px] text-[#525252] mt-1 max-w-sm mx-auto">{description}</p>
      )}
      {(actionLabel || secondaryActionLabel) && (
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-center gap-2">
          {actionLabel && onAction && (
            <button
              type="button"
              onClick={onAction}
              className="h-11 px-5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold transition-colors"
            >
              {actionLabel}
            </button>
          )}
          {secondaryActionLabel && onSecondaryAction && (
            <button
              type="button"
              onClick={onSecondaryAction}
              className="h-11 px-5 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[14px] font-medium transition-colors"
            >
              {secondaryActionLabel}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
