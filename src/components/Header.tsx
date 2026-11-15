'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { UserRole } from '@/types';
import { Building2, Shield, UserCheck, Bike, Sparkles, ChevronDown } from 'lucide-react';

export function Header() {
  const { currentRole, switchRole, currentUser, oficinas, selectedOficinaId, setSelectedOficinaId } = useApp();

  const roles: { id: UserRole; label: string; icon: any; color: string }[] = [
    { id: 'cobrador', label: 'Cobrador', icon: Bike, color: 'text-amber-500 bg-amber-500/10 border-amber-500/30' },
    { id: 'supervisor', label: 'Supervisor', icon: Shield, color: 'text-blue-500 bg-blue-500/10 border-blue-500/30' },
    { id: 'admin', label: 'Administrador', icon: UserCheck, color: 'text-purple-500 bg-purple-500/10 border-purple-500/30' },
    { id: 'dueno', label: 'Dueño', icon: Sparkles, color: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/30' },
  ];

  const currentOffice = oficinas.find((o) => o.id === selectedOficinaId);

  return (
    <header className="sticky top-0 z-40 bg-slate-900/95 backdrop-blur border-b border-slate-800 text-white px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-2.5">
        
        {/* Logo y contexto de oficina */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center font-black text-slate-950 text-lg shadow-lg shadow-emerald-500/20">
              OF
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-base sm:text-lg tracking-tight text-white leading-tight">
                  Oficina Digital
                </h1>
                <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  MVP
                </span>
              </div>
              <p className="text-xs text-slate-400 flex items-center gap-1">
                <Building2 className="w-3 h-3 text-slate-500" />
                {currentRole === 'dueno' && selectedOficinaId === 'todas'
                  ? 'Todas las Oficinas (Consolidado)'
                  : currentOffice?.nombre || 'Oficina Central'}
              </p>
            </div>
          </div>

          {/* Selector de oficina rápida (para dueño / admin) */}
          {(currentRole === 'dueno' || currentRole === 'admin') && (
            <div className="md:hidden">
              <select
                value={selectedOficinaId}
                onChange={(e) => setSelectedOficinaId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2 py-1 text-slate-200 focus:outline-none"
              >
                {currentRole === 'dueno' && <option value="todas">Todas las Oficinas</option>}
                {oficinas.map((ofi) => (
                  <option key={ofi.id} value={ofi.id}>
                    {ofi.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Simulador interactivo de roles (para probar todos los perfiles) */}
        <div className="flex items-center justify-between sm:justify-end gap-2 pt-1 md:pt-0 border-t md:border-t-0 border-slate-800">
          <div className="text-[11px] text-slate-400 font-medium hidden sm:block">
            Probar como:
          </div>
          <div className="grid grid-cols-4 sm:flex gap-1.5 w-full sm:w-auto">
            {roles.map((r) => {
              const Icon = r.icon;
              const isActive = currentRole === r.id;
              return (
                <button
                  key={r.id}
                  onClick={() => switchRole(r.id)}
                  className={`flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                    isActive
                      ? `${r.color} shadow-sm font-bold scale-[1.02]`
                      : 'bg-slate-800/80 hover:bg-slate-800 text-slate-400 border-slate-700/60'
                  }`}
                  title={`Ver interfaz desde el rol de ${r.label}`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{r.label}</span>
                </button>
              );
            })}
          </div>

          {/* Selector de oficina en Desktop */}
          {(currentRole === 'dueno' || currentRole === 'admin') && (
            <div className="hidden md:block ml-2">
              <select
                value={selectedOficinaId}
                onChange={(e) => setSelectedOficinaId(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-xs rounded-lg px-2.5 py-1.5 text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                {currentRole === 'dueno' && <option value="todas">🏢 Todas las Oficinas</option>}
                {oficinas.map((ofi) => (
                  <option key={ofi.id} value={ofi.id}>
                    🏢 {ofi.nombre}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

      </div>
    </header>
  );
}
