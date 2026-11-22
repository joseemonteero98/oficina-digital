'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { AppSection, UserRole } from '@/types';
import {
  X,
  CalendarCheck,
  Briefcase,
  PlusCircle,
  Users,
  Receipt,
  Calculator,
  History,
  LayoutDashboard,
  Clock,
  Bike,
  Wallet,
  FolderKanban,
  Building2,
  UserCog,
  Shield,
  BarChart3,
  Settings,
  ClipboardList,
  TrendingUp,
  ArrowLeftRight,
  ChevronDown,
  ChevronUp,
  LogOut,
  LucideIcon,
} from 'lucide-react';
import { OfficeSelector } from './OfficeSelector';
import { RoleSwitcher } from './RoleSwitcher';

interface AppDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenPersonalConfig: () => void;
}

interface MenuItem {
  id: AppSection;
  label: string;
  icon: LucideIcon;
  badge?: number;
}

const ROLE_LABELS: Record<UserRole, string> = {
  cobrador: 'Cobrador',
  supervisor: 'Supervisor',
  admin: 'Administrador',
  dueno: 'Dueño',
};

export function AppDrawer({ isOpen, onClose, onOpenPersonalConfig }: AppDrawerProps) {
  const {
    currentRole,
    currentUser,
    activeSection,
    setActiveSection,
    oficinas,
    selectedOficinaId,
    prestamos,
    cierres,
    switchRole,
    showToast,
  } = useApp();

  const [testModeOpen, setTestModeOpen] = useState(false);

  if (!isOpen) return null;

  const activeOffice =
    selectedOficinaId === 'todas'
      ? 'Todas las oficinas'
      : oficinas.find((o) => o.id === selectedOficinaId)?.nombre || 'Oficina Central Valledupar';

  const pendingSolicitudesCount = prestamos.filter((p) => p.estado === 'pendiente').length;
  const approvedForDisbursementCount = prestamos.filter((p) => p.estado === 'aprobado').length;
  const pendingCierresCount = cierres.filter((c) => c.estado === 'pendiente_revision').length;

  const menuByRole: Record<UserRole, MenuItem[]> = {
    cobrador: [
      { id: 'cobros_hoy', label: 'Cobros de hoy', icon: CalendarCheck },
      { id: 'mis_prestamos', label: 'Mis préstamos', icon: Briefcase, badge: approvedForDisbursementCount || undefined },
      { id: 'nuevo_prestamo', label: 'Nuevo préstamo', icon: PlusCircle },
      { id: 'mis_clientes', label: 'Mis clientes', icon: Users },
      { id: 'gastos_calle', label: 'Gastos de calle', icon: Receipt },
      { id: 'arqueo_cierre', label: 'Arqueo y cierre', icon: Calculator },
      { id: 'historial_recaudos', label: 'Historial de recaudos', icon: History },
    ],
    supervisor: [
      { id: 'resumen_oficina', label: 'Resumen de oficina', icon: LayoutDashboard },
      { id: 'solicitudes', label: 'Solicitudes por aprobar', icon: Clock, badge: pendingSolicitudesCount || undefined },
      { id: 'cobradores_calle', label: 'Cobradores en calle', icon: Bike },
      { id: 'arqueos_pendientes', label: 'Arqueos pendientes', icon: Wallet, badge: pendingCierresCount || undefined },
      { id: 'cartera', label: 'Cartera', icon: FolderKanban },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'historial_operaciones', label: 'Historial de operaciones', icon: History },
    ],
    admin: [
      { id: 'resumen', label: 'Resumen', icon: LayoutDashboard },
      { id: 'oficinas_asignadas', label: 'Oficinas asignadas', icon: Building2 },
      { id: 'equipo', label: 'Equipo de trabajo', icon: UserCog },
      { id: 'supervisores', label: 'Supervisores', icon: Shield },
      { id: 'cobradores', label: 'Cobradores', icon: Bike },
      { id: 'cartera', label: 'Cartera de préstamos', icon: FolderKanban },
      { id: 'clientes', label: 'Clientes', icon: Users },
      { id: 'reportes', label: 'Reportes', icon: BarChart3 },
      { id: 'configuracion', label: 'Configuración de oficina', icon: Settings },
      { id: 'auditoria', label: 'Auditoría', icon: ClipboardList },
    ],
    dueno: [
      { id: 'resumen_general', label: 'Resumen general', icon: LayoutDashboard },
      { id: 'oficinas', label: 'Oficinas', icon: Building2 },
      { id: 'administradores', label: 'Administradores', icon: UserCog },
      { id: 'personal', label: 'Personal', icon: Users },
      { id: 'cartera_consolidada', label: 'Cartera consolidada', icon: FolderKanban },
      { id: 'indicadores', label: 'Indicadores financieros', icon: TrendingUp },
      { id: 'comparacion_oficinas', label: 'Comparación de oficinas', icon: ArrowLeftRight },
      { id: 'reportes_generales', label: 'Reportes generales', icon: BarChart3 },
      { id: 'auditoria_global', label: 'Auditoría global', icon: ClipboardList },
    ],
  };

  const items = menuByRole[currentRole] || [];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Overlay negro con 30% de opacidad */}
      <div
        className="fixed inset-0 bg-black/30 transition-opacity"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Drawer blanco lateral izquierdo */}
      <aside
        aria-label="Menú principal"
        className="relative w-[290px] max-w-[85vw] md:w-[300px] bg-white h-full border-r border-[#D1D5DB] flex flex-col justify-between z-10 overflow-hidden"
      >
        {/* Encabezado */}
        <div className="p-4 border-b border-[#E5E7EB]">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-[6px] bg-[#2563EB] text-white font-bold text-[13px] flex items-center justify-center">
                OD
              </div>
              <div>
                <p className="text-[15px] font-semibold text-black leading-tight">Oficina Digital</p>
                <p className="text-[12px] text-[#525252] leading-tight">Valledupar, Cesar</p>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Cerrar menú"
              className="w-9 h-9 rounded-[6px] flex items-center justify-center text-[#525252] hover:text-black hover:bg-[#F7F8FA]"
            >
              <X className="w-5 h-5" strokeWidth={2} />
            </button>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-2.5 text-[12px] space-y-0.5">
            <p className="font-semibold text-black truncate">{activeOffice}</p>
            <p className="text-[#525252] truncate">{currentUser.nombre_completo}</p>
            <p className="text-[#2563EB] font-medium">{ROLE_LABELS[currentRole]}</p>
          </div>
        </div>

        {/* Menú dinámico según permisos */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const isActive = activeSection === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => {
                  setActiveSection(item.id);
                  onClose();
                }}
                className={`w-full h-11 px-3 rounded-[6px] flex items-center justify-between text-[14px] transition-colors ${
                  isActive
                    ? 'bg-[#EFF6FF] text-[#2563EB] font-semibold'
                    : 'bg-white text-black font-normal hover:bg-[#F7F8FA]'
                }`}
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Icon
                    className={`w-4 h-4 shrink-0 ${isActive ? 'text-[#2563EB]' : 'text-[#525252]'}`}
                    strokeWidth={2}
                  />
                  <span className="truncate">{item.label}</span>
                </div>
                {item.badge !== undefined && item.badge > 0 && (
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[#FFFBEB] text-[#D97706] border border-[#FCD34D]">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Parte inferior del Drawer */}
        <div className="border-t border-[#E5E7EB] p-3 bg-[#F7F8FA] space-y-2.5 max-h-[45vh] overflow-y-auto">
          {(currentRole === 'admin' || currentRole === 'dueno') && (
            <div className="pb-1">
              <label className="block text-[11px] font-medium text-[#525252] mb-1">
                Oficina activa
              </label>
              <OfficeSelector />
            </div>
          )}

          {/* Acordeón Modo de prueba (Oculto por defecto) */}
          <div className="bg-white border border-[#D1D5DB] rounded-[6px] overflow-hidden">
            <button
              type="button"
              onClick={() => setTestModeOpen(!testModeOpen)}
              className="w-full px-3 py-2.5 flex items-center justify-between text-[12px] font-medium text-[#525252] hover:text-black"
            >
              <span>Modo de prueba</span>
              {testModeOpen ? (
                <ChevronUp className="w-4 h-4" strokeWidth={2} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
            {testModeOpen && (
              <div className="px-3 pb-3 border-t border-[#E5E7EB]">
                <RoleSwitcher onRoleChanged={onClose} />
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenPersonalConfig();
              }}
              className="h-10 px-2.5 rounded-[6px] bg-white border border-[#D1D5DB] text-[12px] font-medium text-black hover:bg-[#F7F8FA] flex items-center justify-center gap-1.5"
            >
              <Settings className="w-3.5 h-3.5 text-[#525252]" strokeWidth={2} />
              <span>Mi perfil</span>
            </button>

            <button
              type="button"
              onClick={() => {
                switchRole('cobrador');
                onClose();
                showToast('info', 'Sesión reiniciada en vista inicial.');
              }}
              className="h-10 px-2.5 rounded-[6px] bg-white border border-[#D1D5DB] text-[12px] font-medium text-[#DC2626] hover:bg-[#FEF2F2] flex items-center justify-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" strokeWidth={2} />
              <span>Cerrar sesión</span>
            </button>
          </div>
        </div>
      </aside>
    </div>
  );
}
