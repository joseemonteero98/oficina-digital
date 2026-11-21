'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { formatMoney } from '@/lib/utils';
import { Sparkles, Building2, DollarSign } from 'lucide-react';

export function DuenoView() {
  const { prestamos, cierreCaja } = useApp();

  const totalCapital = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((acc, p) => acc + p.saldo_pendiente, 0);

  const totalRecaudo = cierreCaja.total_cobrado;
  const gananciaEsperada = prestamos.reduce((acc, p) => acc + p.total_interes, 0);

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-1 px-3 sm:px-0 space-y-4">
      {/* Encabezado Dueño */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-950 font-black flex items-center justify-center">
            👑
          </div>
          <div>
            <h2 className="text-base font-black text-black leading-tight">
              Panel del Propietario • Valledupar
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Control general de capital y rendimiento
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Capital en Calle</span>
          <span className="text-base sm:text-lg font-black text-black tabular-nums block mt-0.5">
            {formatMoney(totalCapital)}
          </span>
          <span className="text-[10px] text-emerald-700 font-bold block">Colocado</span>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Cobrado Hoy</span>
          <span className="text-base sm:text-lg font-black text-emerald-800 tabular-nums block mt-0.5">
            {formatMoney(totalRecaudo)}
          </span>
          <span className="text-[10px] text-gray-600 font-bold block">Efectivo ruta</span>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Utilidad Esperada</span>
          <span className="text-base sm:text-lg font-black text-black tabular-nums block mt-0.5">
            {formatMoney(gananciaEsperada)}
          </span>
          <span className="text-[10px] text-gray-600 font-bold block">Interés total</span>
        </div>
      </div>

      {/* Detalle de Oficina */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs space-y-2">
        <div className="flex items-center justify-between pb-2 border-b border-gray-200">
          <div>
            <h4 className="font-black text-sm text-black">Oficina Central Valledupar</h4>
            <p className="text-xs font-bold text-gray-600">Valledupar, Cesar • 3 Rutas activas</p>
          </div>
          <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
            Activa
          </span>
        </div>
        <div className="text-xs text-gray-700 space-y-1">
          <p>• <strong>Ruta 1:</strong> La Nevada / Divino Niño (Brayan Martínez)</p>
          <p>• <strong>Ruta 2:</strong> Los Fundadores / 12 de Octubre</p>
          <p>• <strong>Ruta 3:</strong> Centro / Mercado Público</p>
        </div>
      </div>
    </div>
  );
}
