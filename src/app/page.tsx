'use client';

import React from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { Header } from '@/components/Header';
import { ReceiptModal } from '@/components/ReceiptModal';
import { CobradorView } from '@/components/cobrador/CobradorView';
import { SupervisorView } from '@/components/supervisor/SupervisorView';
import { AdminView } from '@/components/admin/AdminView';
import { DuenoView } from '@/components/dueno/DuenoView';

function AppContent() {
  const { currentRole } = useApp();

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500 selection:text-slate-950">
      <Header />

      <main className="flex-1 w-full max-w-7xl mx-auto p-2 sm:p-4">
        {currentRole === 'cobrador' && <CobradorView />}
        {currentRole === 'supervisor' && <SupervisorView />}
        {currentRole === 'admin' && <AdminView />}
        {currentRole === 'dueno' && <DuenoView />}
      </main>

      {/* Modal global de comprobantes y recibos WhatsApp */}
      <ReceiptModal />
    </div>
  );
}

export default function Home() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
