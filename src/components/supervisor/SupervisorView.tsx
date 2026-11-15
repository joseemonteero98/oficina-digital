'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoPrestamoBadge, getFrecuenciaLabel } from '@/lib/utils';
import { Prestamo } from '@/types';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Bike,
  Wallet,
  AlertTriangle,
  Search,
  Building,
  UserCheck,
  FileText,
  DollarSign,
  ChevronRight,
} from 'lucide-react';

export function SupervisorView() {
  const {
    prestamos,
    clientes,
    usuarios,
    cierreCaja,
    autorizarPrestamo,
    aprobarCierreCaja,
    selectedOficinaId,
    oficinas,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'autorizaciones' | 'cobradores' | 'cierres' | 'cartera'>('autorizaciones');
  const [rechazoModalPrestamoId, setRechazoModalPrestamoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');
  const [busqueda, setBusqueda] = useState<string>('');

  const currentOffice = oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];

  // Solicitudes pendientes de autorización
  const solicitudesPendientes = prestamos.filter((p) => p.estado === 'pendiente');

  // Cobradores de esta oficina
  const cobradores = usuarios.filter((u) => u.rol === 'cobrador');

  // Préstamos de la oficina
  const prestamosOficina = prestamos.filter((p) => {
    if (busqueda.trim() === '') return true;
    const cliente = clientes.find((c) => c.id === p.cliente_id);
    return (
      p.codigo.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente?.nombre_completo.toLowerCase().includes(busqueda.toLowerCase()) ||
      cliente?.documento.includes(busqueda)
    );
  });

  const handleAprobar = (prestamo: Prestamo) => {
    const cliente = clientes.find((c) => c.id === prestamo.cliente_id);
    if (confirm(`¿Autorizar préstamo de ${formatMoney(prestamo.capital)} a ${cliente?.nombre_completo}?`)) {
      autorizarPrestamo(prestamo.id, true);
    }
  };

  const handleConfirmarRechazo = () => {
    if (!rechazoModalPrestamoId || !motivoRechazo.trim()) {
      alert('Ingresa un motivo para el rechazo');
      return;
    }
    autorizarPrestamo(rechazoModalPrestamoId, false, motivoRechazo);
    setRechazoModalPrestamoId(null);
    setMotivoRechazo('');
  };

  return (
    <div className="max-w-4xl mx-auto pb-24 pt-2 px-3 sm:px-6">
      
      {/* BANNER DE IDENTIDAD DE LA OFICINA Y SUPERVISOR */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 border border-slate-700/80 rounded-2xl p-4 sm:p-5 shadow-xl mb-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400 shrink-0">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                  Panel de Supervisión y Aprobaciones
                </span>
              </div>
              <h2 className="text-lg font-black text-white mt-0.5">
                {currentOffice.nombre}
              </h2>
              <p className="text-xs text-slate-400">
                Supervisor a cargo: Javier Ramírez • Ciudad: {currentOffice.ciudad}
              </p>
            </div>
          </div>

          {/* Badges de Alerta */}
          <div className="flex sm:flex-col gap-2">
            {solicitudesPendientes.length > 0 && (
              <div className="bg-amber-500/20 border border-amber-500/40 text-amber-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2 animate-pulse">
                <Clock className="w-4 h-4 shrink-0 text-amber-400" />
                <span>{solicitudesPendientes.length} préstamo(s) por autorizar</span>
              </div>
            )}
            {cierreCaja.estado === 'pendiente_revision' && (
              <div className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-2">
                <Wallet className="w-4 h-4 shrink-0 text-emerald-400" />
                <span>1 Arqueo de caja por aprobar</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PESTAÑAS DE SUPERVISIÓN */}
      <div className="flex bg-slate-900 border border-slate-800 p-1.5 rounded-2xl mb-5 text-xs font-bold overflow-x-auto">
        <button
          onClick={() => setActiveTab('autorizaciones')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'autorizaciones'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Clock className="w-4 h-4" />
          Bandeja de Autorizaciones
          {solicitudesPendientes.length > 0 && (
            <span className="bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full text-[10px] font-black ml-1">
              {solicitudesPendientes.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cobradores')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'cobradores'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Bike className="w-4 h-4" />
          Cobradores de la Oficina ({cobradores.length})
        </button>

        <button
          onClick={() => setActiveTab('cierres')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'cierres'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4" />
          Arqueo de Cajas
          {cierreCaja.estado === 'pendiente_revision' && (
            <span className="w-2 h-2 rounded-full bg-emerald-400 ml-1"></span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('cartera')}
          className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl whitespace-nowrap transition-all ${
            activeTab === 'cartera'
              ? 'bg-blue-600 text-white shadow-md'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          Cartera General ({prestamos.length})
        </button>
      </div>

      {/* CONTENIDO TAB 1: BANDEJA DE AUTORIZACIONES */}
      {activeTab === 'autorizaciones' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Solicitudes Pendientes de Aprobación
            </h3>
            <span className="text-xs text-slate-400">
              Verifica capacidad de pago y antecedentes antes de autorizar
            </span>
          </div>

          {solicitudesPendientes.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-10 text-center text-slate-400">
              <CheckCircle2 className="w-10 h-10 text-emerald-400 mx-auto mb-2" />
              <p className="font-bold text-white">¡No hay solicitudes pendientes!</p>
              <p className="text-xs text-slate-500 mt-1">
                Todas las solicitudes han sido verificadas o los cobradores no han enviado nuevas hoy.
              </p>
            </div>
          ) : (
            solicitudesPendientes.map((p) => {
              const cliente = clientes.find((c) => c.id === p.cliente_id);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4"
                >
                  {/* Encabezado del Préstamo */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                          {p.codigo}
                        </span>
                        <span className="text-xs text-slate-400">
                          Solicitado el {formatDate(p.fecha_solicitud)} por el cobrador <strong className="text-slate-200">{p.cobrador_nombre}</strong>
                        </span>
                      </div>
                      <h4 className="text-base font-black text-white mt-1">
                        {cliente?.nombre_completo}
                      </h4>
                      <p className="text-xs text-slate-400">
                        C.C. {cliente?.documento} • Tel: {cliente?.telefono} • {cliente?.negocio || cliente?.direccion}
                      </p>
                    </div>

                    <div className="text-left sm:text-right">
                      <span className="text-[10px] text-slate-400 block font-semibold">Monto Solicitado</span>
                      <span className="text-xl font-black text-emerald-400 tabular-nums">
                        {formatMoney(p.capital)}
                      </span>
                    </div>
                  </div>

                  {/* Ficha Financiera */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-800/40 p-3 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Modalidad</span>
                      <span className="font-bold text-slate-200">
                        {p.tipo_interes === 'fijo' ? 'Interés Fijo' : 'Sobre Saldo'} ({p.tasa_interes}%)
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Plan de Cobro</span>
                      <span className="font-bold text-slate-200">
                        {p.num_cuotas} cuotas {p.frecuencia}s
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Cuota a Pagar</span>
                      <span className="font-black text-emerald-400 tabular-nums">
                        {formatMoney(p.valor_cuota)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Total con Interés</span>
                      <span className="font-bold text-white tabular-nums">
                        {formatMoney(p.total_a_pagar)}
                      </span>
                    </div>
                  </div>

                  {/* Notas del Cobrador */}
                  {p.notas && (
                    <div className="bg-slate-800/20 p-2.5 rounded-xl border border-slate-800 text-xs text-slate-300">
                      <span className="text-[10px] text-slate-400 font-bold uppercase block mb-0.5">
                        Informe del Cobrador:
                      </span>
                      {p.notas}
                    </div>
                  )}

                  {/* Botones de Decisión del Supervisor */}
                  <div className="flex items-center justify-end gap-3 pt-2">
                    <button
                      onClick={() => setRechazoModalPrestamoId(p.id)}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-rose-400 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      Rechazar Préstamo
                    </button>

                    <button
                      onClick={() => handleAprobar(p)}
                      className="flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-950 transition-transform active:scale-95"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Aprobar y Autorizar Desembolso
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* CONTENIDO TAB 2: COBRADORES EN CALLE */}
      {activeTab === 'cobradores' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-white uppercase tracking-wider">
              Supervisión de Cobradores de la Oficina
            </h3>
            <span className="text-xs text-slate-400">
              Seguimiento operativo en tiempo real
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {cobradores.map((cob) => {
              return (
                <div
                  key={cob.id}
                  className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
                        <Bike className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-extrabold text-sm text-white">{cob.nombre_completo}</h4>
                        <p className="text-xs text-slate-400">{cob.telefono}</p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      En Ruta
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-slate-800/40 p-2.5 rounded-xl text-center text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block">Cobrado Hoy</span>
                      <span className="font-bold text-emerald-400 tabular-nums">
                        {formatMoney(cierreCaja.total_cobrado)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Desembolsado</span>
                      <span className="font-bold text-blue-400 tabular-nums">
                        {formatMoney(cierreCaja.total_desembolsado)}
                      </span>
                    </div>

                    <div>
                      <span className="text-[10px] text-slate-400 block">Efectivo en Mano</span>
                      <span className="font-bold text-amber-400 tabular-nums">
                        {formatMoney(cierreCaja.efectivo_esperado)}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 3: ARQUEOS Y CIERRES DE CAJA */}
      {activeTab === 'cierres' && (
        <div className="space-y-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  Arqueo de Cierre Diario de Campo
                </span>
                <h4 className="text-base font-extrabold text-white">
                  Cobrador: {cierreCaja.cobrador_nombre}
                </h4>
              </div>
              <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${
                cierreCaja.estado === 'aprobado'
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : cierreCaja.estado === 'pendiente_revision'
                  ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                  : 'bg-slate-800 text-slate-400 border-slate-700'
              }`}>
                {cierreCaja.estado === 'aprobado' ? 'Aprobado y Cuadrado' : cierreCaja.estado === 'pendiente_revision' ? 'Enviado por Cobrador' : 'Caja en Operación'}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center text-xs">
              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Base Inicial</span>
                <span className="font-bold text-white tabular-nums">{formatMoney(cierreCaja.base_inicial)}</span>
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Recaudado Hoy</span>
                <span className="font-bold text-emerald-400 tabular-nums">{formatMoney(cierreCaja.total_cobrado)}</span>
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Nuevos Préstamos</span>
                <span className="font-bold text-blue-400 tabular-nums">-{formatMoney(cierreCaja.total_desembolsado)}</span>
              </div>

              <div className="bg-slate-800/40 p-2.5 rounded-xl border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Gastos Campo</span>
                <span className="font-bold text-rose-400 tabular-nums">-{formatMoney(cierreCaja.total_gastos)}</span>
              </div>
            </div>

            {/* Total que debe recibir el supervisor */}
            <div className="bg-emerald-950/20 border border-emerald-500/30 p-4 rounded-xl flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
                  Efectivo Físico que entrega el Cobrador a la Oficina:
                </span>
                <p className="text-xs text-slate-400 mt-0.5">
                  Verifica que los billetes físicos coincidan con el monto registrado.
                </p>
              </div>
              <span className="text-xl font-black text-emerald-400 tabular-nums">
                {formatMoney(cierreCaja.efectivo_entregado)}
              </span>
            </div>

            {/* Botón de aprobación del cuadre */}
            {cierreCaja.estado === 'pendiente_revision' && (
              <div className="pt-2">
                <button
                  onClick={() => {
                    if (confirm(`¿Confirmas que recibiste físicamente ${formatMoney(cierreCaja.efectivo_entregado)} de ${cierreCaja.cobrador_nombre}?`)) {
                      aprobarCierreCaja(true, 'Cuadre verificado y recibido en oficina');
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs py-3 rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-5 h-5" />
                  Aprobar Cuadre y Recibir Dinero en Caja General
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CONTENIDO TAB 4: CARTERA GENERAL */}
      {activeTab === 'cartera' && (
        <div className="space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por cliente, documento o código de préstamo..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>

          <div className="space-y-3">
            {prestamosOficina.map((p) => {
              const cliente = clientes.find((c) => c.id === p.cliente_id);
              const badge = getEstadoPrestamoBadge(p.estado);

              return (
                <div
                  key={p.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-white">{p.codigo}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${badge.bg} ${badge.text} ${badge.border}`}>
                        {badge.label}
                      </span>
                    </div>
                    <p className="font-semibold text-slate-200 mt-1">{cliente?.nombre_completo}</p>
                    <p className="text-[11px] text-slate-400">Cobrador: {p.cobrador_nombre || 'Asignado'}</p>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block">Saldo</span>
                    <span className="font-bold text-amber-400 tabular-nums">
                      {formatMoney(p.saldo_pendiente)}
                    </span>
                    <span className="text-[10px] text-slate-500 block">de {formatMoney(p.total_a_pagar)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* MODAL PARA RECHAZAR PRÉSTAMO */}
      {rechazoModalPrestamoId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 max-w-sm w-full space-y-4">
            <h4 className="font-bold text-sm text-white">Rechazar Solicitud de Préstamo</h4>
            <p className="text-xs text-slate-400">
              Indica la razón del rechazo para que el cobrador sepa el motivo:
            </p>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej. Capacidad de endeudamiento superada, negocio inestable, referencias dudosas..."
              rows={3}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
              required
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRechazoModalPrestamoId(null)}
                className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                className="px-4 py-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs rounded-lg"
              >
                Confirmar Rechazo
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
