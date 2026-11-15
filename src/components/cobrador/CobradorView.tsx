'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoCuotaBadge, getEstadoPrestamoBadge } from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { Prestamo, Cliente, Cuota } from '@/types';
import {
  Bike,
  PlusCircle,
  FileCheck2,
  Wallet,
  Phone,
  MessageCircle,
  MapPin,
  Clock,
  ArrowRight,
  Send,
  Plus,
  AlertTriangle,
  Receipt,
  Sparkles,
} from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';
import { NewLoanModal } from '@/components/NewLoanModal';

export function CobradorView() {
  const {
    prestamos,
    clientes,
    cierreCaja,
    registrarGastoCaja,
    enviarCierreCaja,
    desembolsarPrestamo,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'ruta' | 'prestamos' | 'caja'>('ruta');
  const [showNewLoanModal, setShowNewLoanModal] = useState<boolean>(false);
  const [selectedForPayment, setSelectedForPayment] = useState<{
    prestamo: Prestamo;
    cliente: Cliente;
    cuota?: Cuota;
  } | null>(null);

  // Estados de Caja
  const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');
  const [cierreObservaciones, setCierreObservaciones] = useState('');
  const [filtroPrestamos, setFiltroPrestamos] = useState<'todos' | 'aprobados' | 'activos' | 'pendientes'>('todos');

  const [today, setToday] = useState('2026-02-15');
  React.useEffect(() => {
    setToday(getTodayString());
  }, []);

  // Préstamos asignados al cobrador
  const misPrestamos = prestamos;

  // Préstamos que necesitan cobro hoy (activos o en mora)
  const cobrosDeHoy = misPrestamos.filter(
    (p) => p.estado === 'activo' || p.estado === 'mora'
  ).map((p) => {
    const cliente = clientes.find((c) => c.id === p.cliente_id)!;
    // Buscar cuota de hoy o la más atrasada
    const cuotaPendiente = (p.cuotas || []).find(
      (c) => c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'atrasada'
    );
    return {
      prestamo: p,
      cliente,
      cuota: cuotaPendiente,
    };
  }).filter((item) => item.cliente);

  // Préstamos aprobados esperando desembolso en efectivo
  const aprobadosParaEntrega = misPrestamos.filter((p) => p.estado === 'aprobado');

  // Metas del día
  const metaCobroHoy = cobrosDeHoy.reduce((acc, item) => acc + (item.cuota?.monto_total || item.prestamo.valor_cuota), 0);
  const totalCobradoHoy = cierreCaja.total_cobrado;
  const efectivoEnMano = cierreCaja.efectivo_esperado;

  const handleAgregarGasto = (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(nuevoGastoMonto);
    if (!nuevoGastoConcepto || !monto || monto <= 0) {
      alert('Ingresa concepto y monto válido');
      return;
    }
    registrarGastoCaja(nuevoGastoConcepto, monto);
    setNuevoGastoConcepto('');
    setNuevoGastoMonto('');
  };

  const handleEnviarCierre = () => {
    if (confirm(`¿Confirmas entregar ${formatMoney(efectivoEnMano)} al Supervisor al cierre de jornada?`)) {
      enviarCierreCaja(efectivoEnMano, cierreObservaciones);
      alert('¡Cierre de caja enviado al Supervisor para su revisión y arqueo!');
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 pt-2 px-3 sm:px-0">
      
      {/* TARJETA SUPERIOR: METAS Y EFECTIVO EN MANO */}
      <div className="bg-gradient-to-br from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-4 shadow-xl mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Bike className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                Turno de Cobranza en Campo
              </span>
              <p className="font-extrabold text-white text-sm">Brayan Martínez</p>
            </div>
          </div>

          <button
            onClick={() => setShowNewLoanModal(true)}
            className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs py-2 px-3 rounded-xl shadow-lg shadow-emerald-950 transition-transform active:scale-95"
          >
            <PlusCircle className="w-4 h-4" />
            + Prestar
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800/80">
          <div className="bg-slate-800/50 p-2.5 rounded-xl border border-slate-800">
            <span className="text-[10px] text-slate-400 block font-medium">Meta Hoy</span>
            <span className="text-xs font-black text-white tabular-nums">
              {formatMoney(metaCobroHoy)}
            </span>
          </div>

          <div className="bg-emerald-950/20 p-2.5 rounded-xl border border-emerald-500/30">
            <span className="text-[10px] text-emerald-300 block font-bold">Cobrado Hoy</span>
            <span className="text-xs font-black text-emerald-400 tabular-nums">
              {formatMoney(totalCobradoHoy)}
            </span>
          </div>

          <div className="bg-amber-950/20 p-2.5 rounded-xl border border-amber-500/30">
            <span className="text-[10px] text-amber-300 block font-bold">Caja / En Mano</span>
            <span className="text-xs font-black text-amber-400 tabular-nums">
              {formatMoney(efectivoEnMano)}
            </span>
          </div>
        </div>

        {/* Notificación si hay préstamos aprobados listos para entregar dinero */}
        {aprobadosParaEntrega.length > 0 && (
          <div
            onClick={() => {
              setActiveTab('prestamos');
              setFiltroPrestamos('aprobados');
            }}
            className="mt-3 bg-blue-500/10 border border-blue-500/30 rounded-xl p-2.5 flex items-center justify-between cursor-pointer hover:bg-blue-500/20 transition-colors"
          >
            <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
              <Sparkles className="w-4 h-4 text-blue-400 shrink-0" />
              <span>{aprobadosParaEntrega.length} préstamo(s) autorizado(s) listo(s) para entregar dinero</span>
            </div>
            <ArrowRight className="w-4 h-4 text-blue-400 shrink-0" />
          </div>
        )}
      </div>

      {/* PESTAÑAS PRINCIPALES */}
      <div className="flex bg-slate-900 border border-slate-800 p-1 rounded-xl mb-4 text-xs font-bold">
        <button
          onClick={() => setActiveTab('ruta')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'ruta'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Ruta de Hoy ({cobrosDeHoy.length})
        </button>

        <button
          onClick={() => setActiveTab('prestamos')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'prestamos'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Préstamos ({misPrestamos.length})
        </button>

        <button
          onClick={() => setActiveTab('caja')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'caja'
              ? 'bg-emerald-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Mi Caja ({cierreCaja.estado === 'abierto' ? 'Abierta' : 'Enviada'})
        </button>
      </div>

      {/* CONTENIDO TAB 1: RUTA DE HOY */}
      {activeTab === 'ruta' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Clientes a Visitar en la Ruta
            </span>
            <span className="text-[11px] text-slate-500 font-medium">
              Orden de calle
            </span>
          </div>

          {cobrosDeHoy.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-8 text-center text-slate-400">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-sm text-white">¡Ruta al día!</p>
              <p className="text-xs text-slate-500 mt-1">No hay cobros pendientes por cobrar en este momento.</p>
            </div>
          ) : (
            cobrosDeHoy.map(({ prestamo, cliente, cuota }, idx) => {
              const valorCobro = cuota ? (cuota.monto_total - cuota.monto_pagado) : prestamo.valor_cuota;
              const isMora = prestamo.estado === 'mora' || cuota?.estado === 'atrasada';

              return (
                <div
                  key={prestamo.id}
                  className={`bg-slate-900 border rounded-2xl p-4 shadow-md transition-all ${
                    isMora ? 'border-red-900/50 bg-red-950/10' : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  {/* Encabezado cliente y orden */}
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex items-center gap-2">
                      <span className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                        {idx + 1}
                      </span>
                      <div>
                        <h4 className="font-extrabold text-sm text-white leading-tight">
                          {cliente.nombre_completo}
                        </h4>
                        <p className="text-[11px] text-slate-400 font-medium">
                          {cliente.negocio || cliente.alias || 'Cliente particular'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Cuota hoy</span>
                      <span className="font-black text-sm text-emerald-400 tabular-nums">
                        {formatMoney(valorCobro)}
                      </span>
                    </div>
                  </div>

                  {/* Dirección y Teléfono */}
                  <div className="text-xs text-slate-400 space-y-1 mb-3 pt-1 border-t border-slate-800/60">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span className="truncate">{cliente.direccion}</span>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-500">
                        Saldo restante: <strong className="text-slate-300">{formatMoney(prestamo.saldo_pendiente)}</strong>
                      </span>
                      {isMora && (
                        <span className="text-[10px] bg-red-500/20 text-red-400 font-bold px-1.5 py-0.5 rounded border border-red-500/30">
                          Atrasado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botones de acción directa */}
                  <div className="grid grid-cols-3 gap-2 pt-1 border-t border-slate-800/80">
                    {/* Botón WhatsApp */}
                    <a
                      href={`https://wa.me/57${cliente.telefono.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-emerald-400 py-2 rounded-xl text-xs font-semibold border border-slate-700"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      Chat
                    </a>

                    {/* Botón Llamar */}
                    <a
                      href={`tel:${cliente.telefono.replace(/\D/g, '')}`}
                      className="flex items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-blue-400 py-2 rounded-xl text-xs font-semibold border border-slate-700"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      Llamar
                    </a>

                    {/* Botón COBRAR (Grande y Destacado) */}
                    <button
                      onClick={() =>
                        setSelectedForPayment({
                          prestamo,
                          cliente,
                          cuota,
                        })
                      }
                      className="flex items-center justify-center gap-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold py-2 px-3 rounded-xl text-xs shadow-md shadow-emerald-950 transition-transform active:scale-95"
                    >
                      Cobrar
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENIDO TAB 2: MIS PRÉSTAMOS */}
      {activeTab === 'prestamos' && (
        <div className="space-y-3">
          {/* Filtros */}
          <div className="flex gap-1.5 overflow-x-auto pb-1 text-[11px] font-semibold">
            {[
              { id: 'todos', label: 'Todos' },
              { id: 'aprobados', label: `Listos p/ entrega (${aprobadosParaEntrega.length})` },
              { id: 'activos', label: 'Activos' },
              { id: 'pendientes', label: 'Por Autorizar' },
            ].map((f) => (
              <button
                key={f.id}
                onClick={() => setFiltroPrestamos(f.id as any)}
                className={`px-3 py-1.5 rounded-lg whitespace-nowrap border transition-all ${
                  filtroPrestamos === f.id
                    ? 'bg-slate-200 text-slate-900 border-white font-bold'
                    : 'bg-slate-900 text-slate-400 border-slate-800'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {misPrestamos
            .filter((p) => {
              if (filtroPrestamos === 'aprobados') return p.estado === 'aprobado';
              if (filtroPrestamos === 'activos') return p.estado === 'activo' || p.estado === 'mora';
              if (filtroPrestamos === 'pendientes') return p.estado === 'pendiente';
              return true;
            })
            .map((p) => {
              const cliente = clientes.find((c) => c.id === p.cliente_id);
              const badge = getEstadoPrestamoBadge(p.estado);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-mono text-slate-400 font-bold block">
                        {p.codigo}
                      </span>
                      <h4 className="font-extrabold text-sm text-white">
                        {cliente?.nombre_completo || 'Cliente'}
                      </h4>
                      <p className="text-xs text-slate-400">{cliente?.negocio || cliente?.direccion}</p>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}
                    >
                      {badge.label}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Capital</span>
                      <span className="font-bold text-white tabular-nums">{formatMoney(p.capital)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cuota ({p.frecuencia})</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {formatMoney(p.valor_cuota)} x {p.num_cuotas}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-slate-400 block">Saldo</span>
                      <span className="font-bold text-amber-400 tabular-nums">
                        {formatMoney(p.saldo_pendiente)}
                      </span>
                    </div>
                  </div>

                  {/* ACCIÓN ESPECÍFICA SI ESTÁ APROBADO: DESEMBOLSAR */}
                  {p.estado === 'aprobado' && (
                    <div className="bg-blue-950/30 border border-blue-500/40 rounded-xl p-3">
                      <p className="text-xs text-blue-200 font-medium mb-2">
                        Autorizado por Supervisor {p.supervisor_nombre || ''}. ¿Ya le entregaste el dinero al cliente?
                      </p>
                      <button
                        onClick={() => {
                          if (confirm(`¿Confirmas entregar ${formatMoney(p.capital)} en efectivo a ${cliente?.nombre_completo}?`)) {
                            desembolsarPrestamo(p.id);
                          }
                        }}
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs py-2.5 rounded-lg shadow-lg shadow-blue-950 flex items-center justify-center gap-1.5"
                      >
                        <Wallet className="w-4 h-4" />
                        Entregar Dinero ({formatMoney(p.capital)}) y Activar Cobro
                      </button>
                    </div>
                  )}

                  {p.estado === 'pendiente' && (
                    <p className="text-[11px] text-amber-400/90 italic bg-amber-500/10 p-2 rounded-lg border border-amber-500/20">
                      Esperando verificación y autorización del Supervisor en la Oficina.
                    </p>
                  )}

                  {p.estado === 'rechazado' && (
                    <p className="text-[11px] text-rose-400 bg-rose-500/10 p-2 rounded-lg border border-rose-500/20">
                      Motivo rechazo: {p.motivo_rechazo || 'No especificado'}
                    </p>
                  )}
                </div>
              );
            })}
        </div>
      )}

      {/* CONTENIDO TAB 3: MI CAJA DEL DÍA (CUADRE) */}
      {activeTab === 'caja' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <h4 className="font-bold text-sm text-white flex items-center gap-2">
                <Wallet className="w-4 h-4 text-amber-400" />
                Arqueo de Caja del Día
              </h4>
              <span className="text-xs text-slate-400">{formatDate(today)}</span>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex justify-between py-1">
                <span className="text-slate-400">(+) Base inicial con la que saliste:</span>
                <span className="font-bold text-white tabular-nums">{formatMoney(cierreCaja.base_inicial)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-emerald-400 font-semibold">(+) Total cobrado hoy:</span>
                <span className="font-extrabold text-emerald-400 tabular-nums">{formatMoney(cierreCaja.total_cobrado)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-blue-400">(-) Total desembolsado en préstamos:</span>
                <span className="font-bold text-blue-400 tabular-nums">-{formatMoney(cierreCaja.total_desembolsado)}</span>
              </div>
              <div className="flex justify-between py-1">
                <span className="text-rose-400">(-) Total gastos operativos:</span>
                <span className="font-bold text-rose-400 tabular-nums">-{formatMoney(cierreCaja.total_gastos)}</span>
              </div>
              
              <div className="flex justify-between pt-2 border-t border-slate-700 text-sm font-black">
                <span className="text-white">EFECTIVO A ENTREGAR:</span>
                <span className="text-amber-400 tabular-nums">{formatMoney(efectivoEnMano)}</span>
              </div>
            </div>

            {/* Estado del cuadre */}
            <div className="pt-2">
              {cierreCaja.estado === 'abierto' ? (
                <button
                  onClick={handleEnviarCierre}
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white font-extrabold text-xs py-3 rounded-xl shadow-lg shadow-amber-950 flex items-center justify-center gap-2"
                >
                  <Send className="w-4 h-4" />
                  Enviar Cierre de Caja al Supervisor
                </button>
              ) : cierreCaja.estado === 'pendiente_revision' ? (
                <div className="bg-amber-500/10 border border-amber-500/30 p-3 rounded-xl text-center text-xs text-amber-300 font-semibold">
                  ⏳ Cierre enviado. En espera de aprobación por el Supervisor.
                </div>
              ) : (
                <div className="bg-emerald-500/10 border border-emerald-500/30 p-3 rounded-xl text-center text-xs text-emerald-300 font-bold">
                  ✓ Cuadre de caja verificado y aprobado por el Supervisor.
                </div>
              )}
            </div>
          </div>

          {/* Registrar Gasto en Calle (Gasolina, parqueadero, etc.) */}
          {cierreCaja.estado === 'abierto' && (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md">
              <h4 className="font-bold text-xs text-slate-300 uppercase tracking-wider mb-2">
                Registrar Gasto de Calle
              </h4>
              <form onSubmit={handleAgregarGasto} className="space-y-2.5">
                <input
                  type="text"
                  placeholder="Concepto (Ej. Gasolina moto, pinchada...)"
                  value={nuevoGastoConcepto}
                  onChange={(e) => setNuevoGastoConcepto(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    step="1000"
                    value={nuevoGastoMonto}
                    onChange={(e) => setNuevoGastoMonto(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-slate-700 hover:bg-slate-600 text-white font-bold text-xs px-4 rounded-lg"
                  >
                    + Registrar Gasto
                  </button>
                </div>
              </form>

              {cierreCaja.gastos_detalle && cierreCaja.gastos_detalle.length > 0 && (
                <div className="mt-3 pt-2 border-t border-slate-800 space-y-1">
                  <span className="text-[10px] text-slate-500 uppercase font-semibold">Gastos de hoy:</span>
                  {cierreCaja.gastos_detalle.map((g, i) => (
                    <div key={i} className="flex justify-between text-xs text-slate-300">
                      <span>• {g.concepto}</span>
                      <span className="font-mono text-rose-400">-{formatMoney(g.monto)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* MODALES */}
      {selectedForPayment && (
        <PaymentModal
          prestamo={selectedForPayment.prestamo}
          cliente={selectedForPayment.cliente}
          cuota={selectedForPayment.cuota}
          onClose={() => setSelectedForPayment(null)}
        />
      )}

      {showNewLoanModal && (
        <NewLoanModal onClose={() => setShowNewLoanModal(false)} />
      )}

    </div>
  );
}

function CheckCircle(props: any) {
  return (
    <svg {...props} fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}
