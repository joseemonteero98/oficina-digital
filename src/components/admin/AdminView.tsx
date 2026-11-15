'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoPrestamoBadge } from '@/lib/utils';
import {
  UserCheck,
  Shield,
  Bike,
  Building,
  TrendingUp,
  AlertOctagon,
  Users,
  Settings,
  DollarSign,
  Plus,
  CheckCircle2,
  FileSpreadsheet,
} from 'lucide-react';

export function AdminView() {
  const {
    prestamos,
    usuarios,
    oficinas,
    selectedOficinaId,
    cierreCaja,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'resumen' | 'equipo' | 'config'>('resumen');

  const currentOffice = oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];

  // Métricas financieras calculadas
  const prestamosActivos = prestamos.filter((p) => p.estado === 'activo');
  const prestamosEnMora = prestamos.filter((p) => p.estado === 'mora');

  const capitalEnLaCalle = prestamosActivos.reduce((acc, p) => acc + p.saldo_pendiente, 0);
  const recaudoHoy = cierreCaja.total_cobrado;
  const saldoEnMora = prestamosEnMora.reduce((acc, p) => acc + p.saldo_pendiente, 0);
  const interesTotalColocado = prestamos.reduce((acc, p) => acc + p.total_interes, 0);

  const supervisores = usuarios.filter((u) => u.rol === 'supervisor');
  const cobradores = usuarios.filter((u) => u.rol === 'cobrador');

  return (
    <div className="max-w-6xl mx-auto pb-24 pt-2 px-3 sm:px-6 space-y-6">
      
      {/* HEADER ADMINISTRATIVO */}
      <div className="bg-gradient-to-r from-slate-900 via-purple-950/40 to-slate-900 border border-purple-900/30 rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 shrink-0">
              <UserCheck className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded border border-purple-500/20">
                  Administración de Oficina
                </span>
              </div>
              <h2 className="text-xl font-black text-white mt-0.5">
                {currentOffice.nombre}
              </h2>
              <p className="text-xs text-slate-400">
                Jefatura de Supervisores y Gestión Operativa • {currentOffice.ciudad}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 block">Supervisores a cargo</span>
              <strong className="text-white text-sm">{supervisores.length} Activos</strong>
            </div>
            <div className="bg-slate-800/80 border border-slate-700 px-3 py-1.5 rounded-xl text-xs text-slate-300">
              <span className="text-[10px] text-slate-400 block">Cobradores en campo</span>
              <strong className="text-emerald-400 text-sm">{cobradores.length} Activos</strong>
            </div>
          </div>
        </div>
      </div>

      {/* TARJETAS KPI DE LA OFICINA */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Capital en la Calle</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-white tabular-nums">
            {formatMoney(capitalEnLaCalle)}
          </p>
          <span className="text-[11px] text-emerald-400 font-medium">
            {prestamosActivos.length} préstamos activos
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Recaudo de Hoy</span>
            <TrendingUp className="w-4 h-4 text-blue-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-blue-400 tabular-nums">
            {formatMoney(recaudoHoy)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Ingreso cobrado en ruta
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Cartera en Mora</span>
            <AlertOctagon className="w-4 h-4 text-rose-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-rose-400 tabular-nums">
            {formatMoney(saldoEnMora)}
          </p>
          <span className="text-[11px] text-rose-400/80 font-medium">
            {prestamosEnMora.length} cliente(s) atrasados
          </span>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between text-slate-400 mb-2">
            <span className="text-xs font-semibold">Utilidad Estimada</span>
            <TrendingUp className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-xl sm:text-2xl font-black text-purple-400 tabular-nums">
            {formatMoney(interesTotalColocado)}
          </p>
          <span className="text-[11px] text-slate-400 font-medium">
            Margen de interés total
          </span>
        </div>
      </div>

      {/* PESTAÑAS DE ADMINISTRACIÓN */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl text-xs font-bold w-fit">
        <button
          onClick={() => setActiveTab('resumen')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'resumen' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Auditoría de Préstamos
        </button>
        <button
          onClick={() => setActiveTab('equipo')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'equipo' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Supervisores y Cobradores
        </button>
        <button
          onClick={() => setActiveTab('config')}
          className={`px-4 py-2 rounded-xl transition-all ${
            activeTab === 'config' ? 'bg-purple-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
          }`}
        >
          Reglas de la Oficina
        </button>
      </div>

      {/* TAB 1: AUDITORÍA DE PRÉSTAMOS */}
      {activeTab === 'resumen' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="p-4 border-b border-slate-800 flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white">
              Libro Maestro de Préstamos de la Oficina
            </h3>
            <span className="text-xs text-slate-400">Total: {prestamos.length} registros</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-800/80 text-slate-300">
                <tr>
                  <th className="p-3">Código</th>
                  <th className="p-3">Cliente</th>
                  <th className="p-3">Cobrador</th>
                  <th className="p-3">Supervisor</th>
                  <th className="p-3 text-right">Capital</th>
                  <th className="p-3 text-right">Saldo</th>
                  <th className="p-3 text-center">Plan</th>
                  <th className="p-3 text-center">Estado</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-slate-300">
                {prestamos.map((p) => {
                  const badge = getEstadoPrestamoBadge(p.estado);
                  return (
                    <tr key={p.id} className="hover:bg-slate-800/40">
                      <td className="p-3 font-mono font-bold text-white">{p.codigo}</td>
                      <td className="p-3 font-semibold text-white">
                        {p.cliente?.nombre_completo || 'Cliente'}
                      </td>
                      <td className="p-3 text-slate-400">{p.cobrador_nombre || 'Asignado'}</td>
                      <td className="p-3 text-slate-400">{p.supervisor_nombre || 'Pendiente'}</td>
                      <td className="p-3 text-right font-bold text-slate-200">{formatMoney(p.capital)}</td>
                      <td className="p-3 text-right font-extrabold text-amber-400">{formatMoney(p.saldo_pendiente)}</td>
                      <td className="p-3 text-center text-slate-400">
                        {p.num_cuotas} {p.frecuencia}s ({formatMoney(p.valor_cuota)})
                      </td>
                      <td className="p-3 text-center">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
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
      )}

      {/* TAB 2: EQUIPO (SUPERVISORES Y COBRADORES) */}
      {activeTab === 'equipo' && (
        <div className="space-y-6">
          {/* Supervisores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Shield className="w-4 h-4 text-blue-400" />
                Supervisores de la Oficina (Jefes de Verificación)
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {supervisores.map((s) => (
                <div key={s.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{s.nombre_completo}</h4>
                    <p className="text-xs text-slate-400">{s.email} • {s.telefono}</p>
                    <span className="text-[10px] text-blue-400 font-semibold mt-1 block">
                      Autoriza solicitudes y audita cierres de caja
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    Activo
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Cobradores */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                <Bike className="w-4 h-4 text-amber-400" />
                Cobradores en Campo Asignados
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {cobradores.map((c) => (
                <div key={c.id} className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-white text-sm">{c.nombre_completo}</h4>
                    <p className="text-xs text-slate-400">{c.email} • {c.telefono}</p>
                    <span className="text-[10px] text-amber-400 font-semibold mt-1 block">
                      Ruta 1 Manrique / Aranjuez
                    </span>
                  </div>
                  <span className="text-xs bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded font-bold">
                    En Calle
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CONFIGURACIÓN DE REGLAS DE LA OFICINA */}
      {activeTab === 'config' && (
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-xl space-y-4">
          <h3 className="font-extrabold text-base text-white">Parámetros Operativos de {currentOffice.nombre}</h3>
          
          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Tasa de Interés Sugerida por Defecto (%):
              </label>
              <input
                type="number"
                defaultValue={currentOffice.tasa_interes_defecto}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Regla de Domingos para Frecuencia Diaria:
              </label>
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-200 cursor-pointer">
                  <input type="checkbox" defaultChecked={currentOffice.excluir_domingos} className="rounded text-purple-600" />
                  Excluir domingos automáticamente al calcular cuotas diarias
                </label>
              </div>
            </div>

            <div>
              <label className="text-slate-300 font-semibold block mb-1">
                Límite de Aprobación Inmediata por Préstamo:
              </label>
              <input
                type="text"
                defaultValue="$ 3.000.000"
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-bold"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Montos superiores requieren confirmación adicional del Administrador.
              </span>
            </div>

            <button
              onClick={() => alert('¡Configuración de oficina guardada!')}
              className="bg-purple-600 hover:bg-purple-500 text-white font-bold px-4 py-2.5 rounded-xl mt-2"
            >
              Guardar Parámetros de Oficina
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
