'use client';

import React from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoPrestamoBadge } from '@/lib/utils';
import { UserCheck, Shield, Bike, DollarSign, TrendingUp, AlertOctagon } from 'lucide-react';

export function AdminView() {
  const { prestamos, usuarios, cierreCaja } = useApp();

  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo');
  const prestamosEnMora = prestamos.filter((p) => p.estado === 'mora');
  const capitalEnLaCalle = prestamosActivos.reduce((acc, p) => acc + p.saldo_pendiente, 0);
  const recaudoHoy = cierreCaja.total_cobrado;
  const saldoEnMora = prestamosEnMora.reduce((acc, p) => acc + p.saldo_pendiente, 0);

  const supervisores = usuarios.filter((u) => u.rol === 'supervisor');
  const cobradores = usuarios.filter((u) => u.rol === 'cobrador');

  return (
    <div className="max-w-4xl mx-auto pb-20 pt-1 px-3 sm:px-0 space-y-4">
      {/* Encabezado */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-950 font-black flex items-center justify-center">
            <UserCheck className="w-5 h-5 text-purple-800" />
          </div>
          <div>
            <h2 className="text-base font-black text-black leading-tight">
              Administración General • Valledupar
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Jefe de Supervisores y Rutas de Campo
            </p>
          </div>
        </div>
      </div>

      {/* Tarjetas KPI */}
      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Capital en Calle</span>
          <span className="text-base sm:text-lg font-black text-black tabular-nums block mt-0.5">
            {formatMoney(capitalEnLaCalle)}
          </span>
          <span className="text-[10px] text-gray-600 font-bold block">{prestamosActivos.length} activos</span>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">Cobrado Hoy</span>
          <span className="text-base sm:text-lg font-black text-emerald-800 tabular-nums block mt-0.5">
            {formatMoney(recaudoHoy)}
          </span>
          <span className="text-[10px] text-gray-600 font-bold block">En ruta</span>
        </div>

        <div className="bg-white border-2 border-gray-300 rounded-2xl p-3 shadow-xs">
          <span className="text-[10px] font-bold text-gray-500 uppercase block">En Mora</span>
          <span className="text-base sm:text-lg font-black text-rose-800 tabular-nums block mt-0.5">
            {formatMoney(saldoEnMora)}
          </span>
          <span className="text-[10px] text-rose-700 font-bold block">{prestamosEnMora.length} atrasados</span>
        </div>
      </div>

      {/* Auditoría de Préstamos */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl overflow-hidden shadow-xs">
        <div className="p-3.5 border-b border-gray-200">
          <h3 className="font-black text-sm text-black">Libro de Préstamos Valledupar</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-100 text-black font-black border-b border-gray-200">
              <tr>
                <th className="p-3">Código</th>
                <th className="p-3">Cliente</th>
                <th className="p-3 text-right">Capital</th>
                <th className="p-3 text-right">Saldo</th>
                <th className="p-3 text-center">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 font-semibold text-black">
              {prestamos.map((p) => {
                const badge = getEstadoPrestamoBadge(p.estado);
                return (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="p-3 font-mono font-black">{p.codigo}</td>
                    <td className="p-3">{p.cliente?.nombre_completo || 'Cliente'}</td>
                    <td className="p-3 text-right">{formatMoney(p.capital)}</td>
                    <td className="p-3 text-right font-black">{formatMoney(p.saldo_pendiente)}</td>
                    <td className="p-3 text-center">
                      <span className="text-[10px] font-black px-2 py-0.5 rounded bg-gray-100 border border-gray-300">
                        {badge.label}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
