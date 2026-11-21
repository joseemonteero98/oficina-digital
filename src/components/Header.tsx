'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { Menu, PlusCircle, Building2 } from 'lucide-react';

interface HeaderProps {
  onOpenDrawer: () => void;
  onOpenNewLoan: () => void;
}

export function Header({ onOpenDrawer, onOpenNewLoan }: HeaderProps) {
  const { currentRole, isDbConnected } = useApp();

  const getTitulo = () => {
    switch (currentRole) {
      case 'cobrador':
        return 'Ruta de Cobro';
      case 'supervisor':
        return 'Bandeja Supervisor';
      case 'admin':
        return 'Administración';
      case 'dueno':
        return 'Panel Propietario';
      default:
        return 'Oficina Digital';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white border-b border-gray-200 px-4 py-3 shadow-xs">
      <div className="max-w-2xl mx-auto flex items-center justify-between">
        
        {/* Botón de Menú Desplegable a la Izquierda */}
        <button
          onClick={onOpenDrawer}
          className="flex items-center gap-2 p-2 -ml-2 rounded-xl text-black hover:bg-gray-100 transition-colors"
          aria-label="Abrir menú de secciones"
        >
          <Menu className="w-6 h-6 stroke-[2.5]" />
          <div className="text-left">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block leading-none">
              Valledupar
            </span>
            <h1 className="text-sm font-black text-black leading-tight">
              {getTitulo()}
            </h1>
          </div>
        </button>

        {/* Acciones Rápidas a la Derecha */}
        <div className="flex items-center gap-2">
          {currentRole === 'cobrador' && (
            <button
              onClick={onOpenNewLoan}
              className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-2 px-3.5 rounded-xl shadow-xs active:scale-95 transition-all"
            >
              <PlusCircle className="w-4 h-4 stroke-[2.5]" />
              <span>+ Prestar</span>
            </button>
          )}

          {/* Indicador de conexión */}
          <span
            className={`w-2.5 h-2.5 rounded-full ${
              isDbConnected ? 'bg-emerald-600' : 'bg-amber-500'
            }`}
            title={isDbConnected ? 'Conectado a Neon Postgres' : 'Modo Demo'}
          />
        </div>

      </div>
    </header>
  );
}
