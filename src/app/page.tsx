'use client';

import React, { useState } from 'react';
import { AppProvider, useApp } from '@/lib/store';
import { AppHeader } from '@/components/shared/AppHeader';
import { AppDrawer } from '@/components/shared/AppDrawer';
import { PaymentReceipt } from '@/components/shared/PaymentReceipt';
import { ToastBanner } from '@/components/shared/ToastBanner';
import { CobradorView } from '@/components/cobrador/CobradorView';
import { SupervisorView } from '@/components/supervisor/SupervisorView';
import { AdminView } from '@/components/admin/AdminView';
import { DuenoView } from '@/components/dueno/DuenoView';
import { X } from 'lucide-react';

function AppContent() {
  const { currentRole, currentUser, oficinas, selectedOficinaId } = useApp();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const activeOffice =
    selectedOficinaId === 'todas'
      ? 'Todas las oficinas'
      : oficinas.find((o) => o.id === selectedOficinaId)?.nombre || 'Oficina Central Valledupar';

  const containerMaxWidth =
    currentRole === 'admin' || currentRole === 'dueno'
      ? 'max-w-7xl'
      : currentRole === 'supervisor'
      ? 'max-w-4xl'
      : 'max-w-2xl';

  return (
    <div className="min-h-screen bg-[#FFFFFF] text-[#000000] flex flex-col">
      <AppHeader onOpenDrawer={() => setIsDrawerOpen(true)} />

      <AppDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        onOpenPersonalConfig={() => setIsProfileOpen(true)}
      />

      <main className={`flex-1 w-full ${containerMaxWidth} mx-auto px-3 sm:px-6 py-4`}>
        {currentRole === 'cobrador' && <CobradorView />}
        {currentRole === 'supervisor' && <SupervisorView />}
        {currentRole === 'admin' && <AdminView />}
        {currentRole === 'dueno' && <DuenoView />}
      </main>

      {/* Modal de comprobante digital confirmado por servidor */}
      <PaymentReceipt />

      {/* Notificación flotante */}
      <ToastBanner />

      {/* Modal de configuración personal */}
      {isProfileOpen && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-sm w-full p-5 space-y-4">
            <div className="flex items-center justify-between border-b border-[#E5E7EB] pb-2">
              <h2 className="text-[16px] font-semibold text-black">Configuración personal</h2>
              <button
                type="button"
                onClick={() => setIsProfileOpen(false)}
                aria-label="Cerrar"
                className="text-[#525252] hover:text-black"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="space-y-2 text-[14px]">
              <p><span className="text-[#525252]">Nombre:</span> <strong className="text-black">{currentUser.nombre_completo}</strong></p>
              <p><span className="text-[#525252]">Documento:</span> <strong className="text-black">{currentUser.documento || '-'}</strong></p>
              <p><span className="text-[#525252]">Teléfono:</span> <strong className="text-black">{currentUser.telefono}</strong></p>
              <p><span className="text-[#525252]">Oficina:</span> <strong className="text-black">{activeOffice}</strong></p>
              <p><span className="text-[#525252]">Zona horaria:</span> <strong className="text-black">America/Bogota (es-CO)</strong></p>
            </div>
            <button
              type="button"
              onClick={() => setIsProfileOpen(false)}
              className="w-full h-11 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[14px] font-medium hover:bg-[#F7F8FA]"
            >
              Cerrar
            </button>
          </div>
        </div>
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
