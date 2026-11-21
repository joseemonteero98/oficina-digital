'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { Header } from '@/components/Header';
import { SidebarDrawer } from '@/components/SidebarDrawer';
import { ReceiptModal } from '@/components/ReceiptModal';
import { NewLoanModal } from '@/components/NewLoanModal';
import { CobradorView } from '@/components/cobrador/CobradorView';
import { SupervisorView } from '@/components/supervisor/SupervisorView';
import { AdminView } from '@/components/admin/AdminView';
import { DuenoView } from '@/components/dueno/DuenoView';

function AppContent() {
  const { currentRole } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isNewLoanOpen, setIsNewLoanOpen] = useState(false);
  const [cobradorSubTab, setCobradorSubTab] = useState<'ruta' | 'caja'>('ruta');

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans">
      {/* Cabecera limpia con menú desplegable a la izquierda */}
      <Header
        onOpenDrawer={() => setIsDrawerOpen(true)}
        onOpenNewLoan={() => setIsNewLoanOpen(true)}
      />

      {/* Menú Lateral Desplegable (Drawer) */}
      <SidebarDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenNewLoan={() => setIsNewLoanOpen(true)}
        onSelectTab={(tab) => setCobradorSubTab(tab as any)}
      />

      {/* Contenido Principal */}
      <main className="flex-1 w-full max-w-2xl mx-auto p-2 sm:p-4">
        {currentRole === 'cobrador' && (
          <CobradorView
            onOpenNewLoan={() => setIsNewLoanOpen(true)}
            activeSubTab={cobradorSubTab}
          />
        )}
        {currentRole === 'supervisor' && <SupervisorView />}
        {currentRole === 'admin' && <AdminView />}
        {currentRole === 'dueno' && <DuenoView />}
      </main>

      {/* Modal global de comprobantes y recibos WhatsApp */}
      <ReceiptModal />

      {/* Modal de nuevo préstamo */}
      {isNewLoanOpen && (
        <NewLoanModal onClose={() => setIsNewLoanOpen(false)} />
      )}
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
