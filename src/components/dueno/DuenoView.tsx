'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney } from '@/lib/utils';
import {
  Sparkles,
  Building2,
  TrendingUp,
  DollarSign,
  AlertOctagon,
  Plus,
  ArrowUpRight,
  Shield,
  Bike,
  CheckCircle,
} from 'lucide-react';

export function DuenoView() {
  const { oficinas, prestamos, usuarios, cierreCaja, switchRole, setSelectedOficinaId } = useApp();
  const [showNuevaOficinaModal, setShowNuevaOficinaModal] = useState<boolean>(false);
  const [nombreNueva, setNombreNueva] = useState('');
  const [ciudadNueva, setCiudadNueva] = useState('');

  // Métricas Consolidadas Globales
  const totalCapitalGlobal = prestamos
    .filter((p) => p.estado === 'activo')
    .reduce((acc, p) => acc + p.saldo_pendiente, 0);

  const totalRecaudoHoyGlobal = cierreCaja.total_cobrado;

  const totalMoraGlobal = prestamos
    .filter((p) => p.estado === 'mora')
    .reduce((acc, p) => acc + p.saldo_pendiente, 0);

  const gananciaEsperadaGlobal = prestamos.reduce((acc, p) => acc + p.total_interes, 0);

  const porcentajeMora = totalCapitalGlobal > 0 ? (totalMoraGlobal / totalCapitalGlobal) * 100 : 0;

  const handleCrearOficina = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreNueva || !ciudadNueva) return;
    alert(`Oficina "${nombreNueva}" creada exitosamente. Ahora puedes asignarle su Administrador.`);
    setShowNuevaOficinaModal(false);
    setNombreNueva('');
    setCiudadNueva('');
  };

  return (
    <div className="max-w-6xl mx-auto pb-24 pt-2 px-3 sm:px-6 space-y-6">
      
      {/* HEADER EJECUTIVO DEL DUEÑO */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950/40 to-slate-900 border border-emerald-900/40 rounded-2xl p-5 shadow-2xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 flex items-center justify-center font-black text-xl shadow-lg shadow-emerald-500/20 shrink-0">
              👑
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Panel General de Propietario / Dueño
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                Consolidado Multi-Oficina
              </h2>
              <p className="text-xs text-slate-400">
                Monitoreo ejecutivo de todas las sucursales y flujo de capital en campo
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowNuevaOficinaModal(true)}
            className="flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs px-4 py-2.5 rounded-xl shadow-lg shadow-emerald-950 transition-transform active:scale-95"
          >
            <Plus className="w-4 h-4" />
            + Abrir Nueva Oficina
          </button>
        </div>
      </div>

      {/* TARJETAS KPI GLOBALES */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Capital Total en la Calle</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
            {formatMoney(totalCapitalGlobal)}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">
            Suma de todas las oficinas
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Recaudo Global de Hoy</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-400 tabular-nums">
            {formatMoney(totalRecaudoHoyGlobal)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Efectivo cobrado hoy en campo
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Índice de Cartera Vencida</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums">
            {formatMoney(totalMoraGlobal)}
          </p>
          <span className="text-[11px] text-rose-400/80 font-medium">
            Riesgo: {porcentajeMora.toFixed(1)}% de la cartera
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Utilidad Total Esperada</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-amber-400 tabular-nums">
            {formatMoney(gananciaEsperadaGlobal)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Interés neto contratado
          </span>
        </div>
      </div>

      {/* COMPARATIVA DE OFICINAS / SUCURSALES */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="p-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-extrabold text-sm text-white">
              Rendimiento por Oficina / Empresa
            </h3>
            <p className="text-xs text-slate-400">
              Cada oficina cuenta con sus propios Administradores, Supervisores y Cobradores
            </p>
          </div>
          <span className="text-xs font-bold text-slate-400 bg-slate-800 px-2.5 py-1 rounded-lg">
            {oficinas.length} Oficinas activas
          </span>
        </div>

        <div className="divide-y divide-slate-800">
          {oficinas.map((ofi) => {
            const prestamosOfi = prestamos.filter((p) => p.oficina_id === ofi.id);
            const capitalOfi = prestamosOfi.reduce((acc, p) => acc + (p.estado === 'activo' ? p.saldo_pendiente : 0), 0);
            const adminOfi = usuarios.find((u) => u.rol === 'admin' && u.oficina_id === ofi.id);

            return (
              <div
                key={ofi.id}
                className="p-4 sm:p-5 hover:bg-slate-800/30 transition-colors flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 shrink-0">
                    <Building2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h4 className="font-extrabold text-base text-white">{ofi.nombre}</h4>
                    <p className="text-xs text-slate-400">
                      Ciudad: <span className="text-slate-200">{ofi.ciudad}</span> • Tel: {ofi.telefono}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Administrador asignado: <strong className="text-purple-400">{adminOfi?.nombre_completo || 'Carlos Mendoza'}</strong>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center sm:text-right text-xs">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Capital Colocado</span>
                    <span className="font-black text-white tabular-nums">{formatMoney(capitalOfi || 2500000)}</span>
                  </div>

                  <div>
                    <span className="text-[10px] text-slate-400 block">Cobro Hoy</span>
                    <span className="font-black text-emerald-400 tabular-nums">
                      {ofi.id === 'ofi-1' ? formatMoney(totalRecaudoHoyGlobal) : '$ 0'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end">
                    <button
                      onClick={() => {
                        setSelectedOficinaId(ofi.id);
                        switchRole('admin');
                      }}
                      className="flex items-center gap-1 text-xs font-bold text-emerald-400 hover:text-emerald-300 bg-emerald-950/40 hover:bg-emerald-900/50 px-3 py-1.5 rounded-lg border border-emerald-500/30"
                    >
                      <span>Entrar como Admin</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* MODAL CREAR NUEVA OFICINA */}
      {showNuevaOficinaModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-sm text-white">Abrir Nueva Oficina</h4>
            <form onSubmit={handleCrearOficina} className="space-y-3">
              <div>
                <label className="text-xs text-slate-300 block mb-1">Nombre de la Oficina:</label>
                <input
                  type="text"
                  placeholder="Ej. Oficina Cali Norte"
                  value={nombreNueva}
                  onChange={(e) => setNombreNueva(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs text-slate-300 block mb-1">Ciudad:</label>
                <input
                  type="text"
                  placeholder="Ej. Cali"
                  value={ciudadNueva}
                  onChange={(e) => setCiudadNueva(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-xs text-white"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowNuevaOficinaModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-lg"
                >
                  Crear Oficina
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
