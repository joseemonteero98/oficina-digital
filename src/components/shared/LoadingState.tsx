'use client';

import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingStateProps {
  message?: string;
}

export function LoadingState({ message = 'Cargando información...' }: LoadingStateProps) {
  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-8 flex flex-col items-center justify-center text-center">
      <Loader2 className="w-6 h-6 text-[#2563EB] animate-spin mb-2" strokeWidth={2} />
      <p className="text-[14px] font-medium text-[#525252]">{message}</p>
    </div>
  );
}
