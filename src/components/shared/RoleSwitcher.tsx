'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { UserRole } from '@/types';
import { Bike, Shield, UserCheck, Briefcase, LucideIcon } from 'lucide-react';

interface RoleSwitcherProps {
  onRoleChanged?: () => void;
}

export function RoleSwitcher({ onRoleChanged }: RoleSwitcherProps) {
  const { currentRole, switchRole, isEmptyDb, cargarDatosEjemplo } = useApp();

  const roles: { id: UserRole; label: string; icon: LucideIcon }[] = [
    { id: 'cobrador', label: 'Cobrador', icon: Bike },
    { id: 'supervisor', label: 'Supervisor', icon: Shield },
    { id: 'admin', label: 'Administrador', icon: UserCheck },
    { id: 'dueno', label: 'Dueño', icon: Briefcase },
  ];

  return (
    <div className="space-y-3 pt-2">
      <div className="grid grid-cols-2 gap-1.5">
        {roles.map((r) => {
          const Icon = r.icon;
          const isActive = currentRole === r.id;
          return (
            <button
              key={r.id}
              type="button"
              onClick={() => {
                switchRole(r.id);
                if (onRoleChanged) onRoleChanged();
              }}
              className={`h-10 flex items-center justify-center gap-1.5 px-2 rounded-[6px] text-[12px] font-medium border transition-colors ${
                isActive
                  ? 'bg-[#2563EB] text-white border-[#2563EB]'
                  : 'bg-white text-black border-[#D1D5DB] hover:bg-[#F7F8FA]'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" strokeWidth={2} />
              <span>{r.label}</span>
            </button>
          );
        })}
      </div>

      {isEmptyDb && (
        <button
          type="button"
          onClick={cargarDatosEjemplo}
          className="w-full h-10 rounded-[6px] bg-[#F0FDF4] text-[#15803D] border border-[#86EFAC] text-[12px] font-semibold hover:bg-[#DCFCE7]"
        >
          Cargar ruta ejemplo Valledupar
        </button>
      )}

      <p className="text-[11px] text-[#525252] leading-snug">
        Selector exclusivo para pruebas. Los permisos reales se validan en el servidor.
      </p>
    </div>
  );
}
