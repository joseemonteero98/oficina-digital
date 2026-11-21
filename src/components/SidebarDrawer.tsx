'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { UserRole } from '@/types';
import {
  X,
  Bike,
  Shield,
  UserCheck,
  Sparkles,
  Building2,
  PlusCircle,
  Wallet,
  FileText,
  MapPin,
  CheckCircle2,
} from 'lucide-react';

interface SidebarDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenNewLoan: () => void;
  onSelectTab?: (tab: string) => void;
}

export function SidebarDrawer({
  isOpen,
  onClose,
  onOpenNewLoan,
  onSelectTab,
}: SidebarDrawerProps) {
  const {
    currentRole,
    switchRole,
    currentUser,
    oficinas,
    selectedOficinaId,
    isDbConnected,
    cierreCaja,
    prestamos,
  } = useApp();

  if (!isOpen) return null;

  const currentOffice = oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];
  const solicitudesPendientes = prestamos.filter((p) => p.estado === 'pendiente');

  const roles: { id: UserRole; label: string; icon: any }[] = [
    { id: 'cobrador', label: 'Cobrador', icon: Bike },
    { id: 'supervisor', label: 'Supervisor', icon: Shield },
    { id: 'admin', label: 'Administrador', icon: UserCheck },
    { id: 'dueno', label: 'Dueño', icon: Sparkles },
  ];

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-150">
      {/* Fondo oscuro para cerrar al hacer clic afuera */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Panel Desplegable a la Izquierda */}
      <div className="relative w-80 max-w-[85vw] bg-white h-full shadow-2xl flex flex-col justify-between z-10 border-r border-gray-200">
        
        {/* Encabezado del menú */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shadow-md">
                OF
              </div>
              <div>
                <h2 className="font-extrabold text-base text-black leading-tight">
                  Oficina Digital
                </h2>
                <p className="text-xs font-semibold text-emerald-800 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-emerald-700" />
                  Valledupar, Cesar
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-gray-500 hover:text-black hover:bg-gray-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-xs">
            <span className="text-gray-500 text-[10px] uppercase font-bold block">Usuario Activo:</span>
            <p className="font-bold text-black">{currentUser.nombre_completo}</p>
            <span className="text-[11px] font-semibold text-emerald-700 capitalize">
              Rol: {currentRole}
            </span>
          </div>
        </div>

        {/* Lista de Secciones Limpias */}
        <div className="p-3 overflow-y-auto flex-1 space-y-1 text-sm font-bold text-gray-900">
          
          <button
            onClick={() => {
              switchRole('cobrador');
              if (onSelectTab) onSelectTab('ruta');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
              currentRole === 'cobrador'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Bike className="w-5 h-5 text-emerald-700" />
            <span>Ruta de Cobro del Día</span>
          </button>

          <button
            onClick={() => {
              onClose();
              onOpenNewLoan();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-emerald-50 text-emerald-800 transition-all font-extrabold"
          >
            <PlusCircle className="w-5 h-5 text-emerald-600" />
            <span>+ Solicitar Nuevo Préstamo</span>
          </button>

          <button
            onClick={() => {
              switchRole('cobrador');
              if (onSelectTab) onSelectTab('caja');
              onClose();
            }}
            className="w-full flex items-center gap-3 px-3.5 py-3 rounded-xl hover:bg-gray-100 text-gray-700 transition-all"
          >
            <Wallet className="w-5 h-5 text-amber-700" />
            <span>Arqueo y Cierre de Caja</span>
          </button>

          <div className="my-2 border-t border-gray-200" />

          {/* Secciones de Supervisión y Admin */}
          <button
            onClick={() => {
              switchRole('supervisor');
              onClose();
            }}
            className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl transition-all ${
              currentRole === 'supervisor'
                ? 'bg-blue-50 text-blue-900 border border-blue-300 font-extrabold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <div className="flex items-center gap-3">
              <Shield className="w-5 h-5 text-blue-700" />
              <span>Bandeja del Supervisor</span>
            </div>
            {solicitudesPendientes.length > 0 && (
              <span className="bg-amber-500 text-black text-xs font-black px-2 py-0.5 rounded-full">
                {solicitudesPendientes.length}
              </span>
            )}
          </button>

          <button
            onClick={() => {
              switchRole('admin');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
              currentRole === 'admin'
                ? 'bg-purple-50 text-purple-900 border border-purple-300 font-extrabold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <UserCheck className="w-5 h-5 text-purple-700" />
            <span>Administración de Oficina</span>
          </button>

          <button
            onClick={() => {
              switchRole('dueno');
              onClose();
            }}
            className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl transition-all ${
              currentRole === 'dueno'
                ? 'bg-emerald-50 text-emerald-900 border border-emerald-300 font-extrabold'
                : 'hover:bg-gray-100 text-gray-700'
            }`}
          >
            <Sparkles className="w-5 h-5 text-emerald-700" />
            <span>Consolidado de Dueño</span>
          </button>
        </div>

        {/* Selector de Roles y Estado de Conexión (Abajo para no estorbar) */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 space-y-3">
          <div>
            <span className="text-[10px] font-black uppercase text-gray-500 block mb-1.5 tracking-wider">
              Alternar Rol de Prueba:
            </span>
            <div className="grid grid-cols-2 gap-1.5">
              {roles.map((r) => {
                const Icon = r.icon;
                const isActive = currentRole === r.id;
                return (
                  <button
                    key={r.id}
                    onClick={() => {
                      switchRole(r.id);
                      onClose();
                    }}
                    className={`flex items-center justify-center gap-1.5 py-2 px-2 rounded-lg text-xs font-bold border transition-all ${
                      isActive
                        ? 'bg-black text-white border-black shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    <span>{r.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-1 flex items-center justify-between text-xs font-semibold text-gray-600">
            <span className="flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${isDbConnected ? 'bg-emerald-600' : 'bg-amber-500'}`} />
              {isDbConnected ? 'Base de Datos Conectada' : 'Modo Demo Local'}
            </span>
            <span className="text-[10px] font-bold text-gray-400">v1.2</span>
          </div>
        </div>

      </div>
    </div>
  );
}
