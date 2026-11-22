'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { AppSection } from '@/types';
import { getInitials } from '@/lib/utils';
import { Menu, Wifi, WifiOff, RefreshCw, AlertTriangle } from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { OfficeSelector } from './OfficeSelector';

interface AppHeaderProps {
  onOpenDrawer: () => void;
}

const SECTION_TITLES: Record<AppSection, string> = {
  // Cobrador
  cobros_hoy: 'Cobros de hoy',
  mis_prestamos: 'Mis préstamos',
  nuevo_prestamo: 'Nuevo préstamo',
  mis_clientes: 'Mis clientes',
  gastos_calle: 'Gastos de calle',
  arqueo_cierre: 'Arqueo y cierre',
  historial_recaudos: 'Historial de recaudos',
  // Supervisor
  resumen_oficina: 'Resumen de oficina',
  solicitudes: 'Solicitudes por aprobar',
  cobradores_calle: 'Cobradores en calle',
  arqueos_pendientes: 'Arqueos pendientes',
  cartera: 'Cartera',
  clientes: 'Clientes',
  historial_operaciones: 'Historial de operaciones',
  // Admin
  resumen: 'Resumen',
  oficinas_asignadas: 'Oficinas asignadas',
  equipo: 'Equipo de trabajo',
  supervisores: 'Supervisores',
  cobradores: 'Cobradores',
  reportes: 'Reportes',
  configuracion: 'Configuración de oficina',
  auditoria: 'Auditoría',
  // Dueño
  resumen_general: 'Resumen general',
  oficinas: 'Oficinas',
  administradores: 'Administradores',
  personal: 'Personal',
  cartera_consolidada: 'Cartera consolidada',
  indicadores: 'Indicadores financieros',
  comparacion_oficinas: 'Comparación de oficinas',
  reportes_generales: 'Reportes generales',
  auditoria_global: 'Auditoría global',
};

export function AppHeader({ onOpenDrawer }: AppHeaderProps) {
  const { activeSection, currentUser, syncStatus, isDbConnected, currentRole } = useApp();

  const renderSyncIndicator = () => {
    if (syncStatus === 'sincronizando') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD]">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" strokeWidth={2} />
          <span className="hidden sm:inline">Sincronizando</span>
        </span>
      );
    }
    if (syncStatus === 'sin_conexion') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium bg-[#FFFBEB] text-[#D97706] border border-[#FCD34D]">
          <WifiOff className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Sin conexión</span>
        </span>
      );
    }
    if (syncStatus === 'error') {
      return (
        <span className="inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium bg-[#FEF2F2] text-[#DC2626] border border-[#FCA5A5]">
          <AlertTriangle className="w-3.5 h-3.5" strokeWidth={2} />
          <span className="hidden sm:inline">Error de sincronización</span>
        </span>
      );
    }
    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-[12px] font-medium border ${
          isDbConnected
            ? 'bg-[#F0FDF4] text-[#15803D] border-[#86EFAC]'
            : 'bg-[#F7F8FA] text-[#525252] border-[#D1D5DB]'
        }`}
        title={isDbConnected ? 'Conectado a Neon Postgres' : 'Modo demostración'}
      >
        <Wifi className="w-3.5 h-3.5" strokeWidth={2} />
        <span className="hidden sm:inline">{isDbConnected ? 'Conectado' : 'Demo'}</span>
      </span>
    );
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-[#E5E7EB] h-14 md:h-16 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto h-full flex items-center justify-between gap-2">
        
        {/* Izquierda: Menú hamburguesa + Nombre de sección */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenDrawer}
            aria-label="Abrir menú principal"
            className="w-11 h-11 -ml-1.5 rounded-[6px] flex items-center justify-center text-black hover:bg-[#F7F8FA] shrink-0"
          >
            <Menu className="w-6 h-6" strokeWidth={2} />
          </button>

          <h1 className="text-[16px] md:text-[18px] font-semibold text-black truncate">
            {SECTION_TITLES[activeSection] || 'Oficina Digital'}
          </h1>
        </div>

        {/* Derecha: Oficina activa (desktop) + Estado conexión + Notificaciones + Iniciales */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {(currentRole === 'admin' || currentRole === 'dueno') && (
            <div className="hidden md:block">
              <OfficeSelector compact />
            </div>
          )}

          {renderSyncIndicator()}

          <NotificationCenter />

          <div
            className="w-9 h-9 rounded-full bg-[#F7F8FA] border border-[#D1D5DB] flex items-center justify-center text-[12px] font-semibold text-black shrink-0"
            title={currentUser.nombre_completo}
          >
            {getInitials(currentUser.nombre_completo)}
          </div>
        </div>

      </div>
    </header>
  );
}
