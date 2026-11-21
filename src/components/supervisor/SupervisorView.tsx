'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoPrestamoBadge } from '@/lib/utils';
import { Prestamo } from '@/types';
import {
  Shield,
  CheckCircle2,
  XCircle,
  Clock,
  Bike,
  Wallet,
  Search,
  MapPin,
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

  const [activeTab, setActiveTab] = useState<'autorizaciones' | 'cobradores' | 'cierres'>('autorizaciones');
  const [rechazoModalPrestamoId, setRechazoModalPrestamoId] = useState<string | null>(null);
  const [motivoRechazo, setMotivoRechazo] = useState<string>('');

  const currentOffice = oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];

  const solicitudesPendientes = prestamos.filter((p) => p.estado === 'pendiente');
  const cobradores = usuarios.filter((u) => u.rol === 'cobrador');

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
    <div className="max-w-2xl mx-auto pb-20 pt-1 px-3 sm:px-0 space-y-4">
      
      {/* Encabezado Supervisor */}
      <div className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
              <Shield className="w-4 h-4 text-blue-700" />
              <span>Bandeja de Supervisión</span>
            </div>
            <h2 className="text-base font-black text-black mt-0.5">
              Oficina Central Valledupar
            </h2>
            <p className="text-xs font-semibold text-gray-600">
              Supervisor a cargo: Javier Ramírez
            </p>
          </div>

          {solicitudesPendientes.length > 0 && (
            <span className="bg-amber-100 text-amber-900 border-2 border-amber-400 px-3 py-1 rounded-xl text-xs font-black animate-pulse">
              {solicitudesPendientes.length} Por Autorizar
            </span>
          )}
        </div>
      </div>

      {/* Selector de pestañas */}
      <div className="flex bg-gray-100 p-1 rounded-xl border border-gray-300 text-xs font-black">
        <button
          onClick={() => setActiveTab('autorizaciones')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'autorizaciones'
              ? 'bg-black text-white shadow-xs'
              : 'text-gray-700 hover:text-black'
          }`}
        >
          Autorizaciones ({solicitudesPendientes.length})
        </button>

        <button
          onClick={() => setActiveTab('cobradores')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'cobradores'
              ? 'bg-black text-white shadow-xs'
              : 'text-gray-700 hover:text-black'
          }`}
        >
          Cobradores en Ruta ({cobradores.length})
        </button>

        <button
          onClick={() => setActiveTab('cierres')}
          className={`flex-1 py-2 rounded-lg transition-all ${
            activeTab === 'cierres'
              ? 'bg-black text-white shadow-xs'
              : 'text-gray-700 hover:text-black'
          }`}
        >
          Arqueo de Caja
        </button>
      </div>

      {/* TAB 1: BANDEJA DE AUTORIZACIONES */}
      {activeTab === 'autorizaciones' && (
        <div className="space-y-3">
          {solicitudesPendientes.length === 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center text-gray-600">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-black text-black text-sm">No hay solicitudes pendientes</p>
              <p className="text-xs text-gray-500 mt-1">Todos los préstamos en Valledupar están verificados.</p>
            </div>
          ) : (
            solicitudesPendientes.map((p) => {
              const cliente = clientes.find((c) => c.id === p.cliente_id);

              return (
                <div
                  key={p.id}
                  className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs space-y-3"
                >
                  <div className="flex justify-between items-start pb-2 border-b border-gray-200">
                    <div>
                      <span className="text-[10px] font-black uppercase text-amber-900 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded">
                        {p.codigo}
                      </span>
                      <h3 className="text-base font-black text-black mt-1">
                        {cliente?.nombre_completo}
                      </h3>
                      <p className="text-xs font-bold text-gray-700">
                        {cliente?.negocio} • {cliente?.direccion}
                      </p>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-gray-500 block">Solicitado</span>
                      <span className="text-lg font-black text-black tabular-nums">
                        {formatMoney(p.capital)}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl border border-gray-200 text-center text-xs">
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Plan</span>
                      <span className="font-black text-black">{p.num_cuotas} {p.frecuencia}s</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Cuota</span>
                      <span className="font-black text-black">{formatMoney(p.valor_cuota)}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-gray-500 font-bold block">Total a Cobrar</span>
                      <span className="font-black text-black">{formatMoney(p.total_a_pagar)}</span>
                    </div>
                  </div>

                  {p.notas && (
                    <p className="text-xs text-gray-700 bg-gray-50 p-2.5 rounded-lg border border-gray-200">
                      <strong>Informe Cobrador:</strong> {p.notas}
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      onClick={() => setRechazoModalPrestamoId(p.id)}
                      className="py-2.5 rounded-xl text-xs font-black text-rose-800 bg-rose-50 hover:bg-rose-100 border border-rose-300"
                    >
                      Rechazar
                    </button>

                    <button
                      onClick={() => handleAprobar(p)}
                      className="py-2.5 rounded-xl text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 shadow-xs"
                    >
                      ✓ Aprobar Préstamo
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 2: COBRADORES EN CALLE */}
      {activeTab === 'cobradores' && (
        <div className="space-y-3">
          {cobradores.map((cob) => (
            <div key={cob.id} className="bg-white border-2 border-gray-300 rounded-2xl p-4 shadow-xs space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-sm text-black">{cob.nombre_completo}</h4>
                  <p className="text-xs font-bold text-gray-600">Ruta 1: La Nevada / Divino Niño</p>
                </div>
                <span className="text-xs font-black bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded">
                  En Ruta
                </span>
              </div>

              <div className="grid grid-cols-3 gap-2 bg-gray-50 p-2.5 rounded-xl border border-gray-200 text-center text-xs">
                <div>
                  <span className="text-[10px] text-gray-500 block">Cobrado</span>
                  <span className="font-black text-black">{formatMoney(cierreCaja.total_cobrado)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">Prestado</span>
                  <span className="font-black text-black">{formatMoney(cierreCaja.total_desembolsado)}</span>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block">En Mano</span>
                  <span className="font-black text-black">{formatMoney(cierreCaja.efectivo_esperado)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: CIERRES DE CAJA */}
      {activeTab === 'cierres' && (
        <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 shadow-xs space-y-4 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-gray-200">
            <h4 className="font-black text-sm text-black">Arqueo de Caja del Día</h4>
            <span className="font-bold text-gray-600">Brayan Martínez</span>
          </div>

          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-gray-600">Base inicial de salida:</span>
              <span className="font-bold text-black">{formatMoney(cierreCaja.base_inicial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-emerald-800 font-bold">Total cobrado en ruta:</span>
              <span className="font-black text-black">{formatMoney(cierreCaja.total_cobrado)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-rose-800 font-bold">Gastos autorizados:</span>
              <span className="font-black text-black">-{formatMoney(cierreCaja.total_gastos)}</span>
            </div>
            <div className="flex justify-between pt-2 text-sm font-black border-t border-gray-200">
              <span className="text-black">Efectivo Físico a Recibir:</span>
              <span className="text-black text-base">{formatMoney(cierreCaja.efectivo_entregado)}</span>
            </div>
          </div>

          {cierreCaja.estado === 'pendiente_revision' && (
            <button
              onClick={() => {
                if (confirm(`¿Confirmas recibir físicamente ${formatMoney(cierreCaja.efectivo_entregado)} en la oficina?`)) {
                  aprobarCierreCaja(true, 'Recibido en oficina de Valledupar');
                }
              }}
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs py-3 rounded-xl shadow-xs"
            >
              ✓ Recibir Efectivo y Aprobar Cuadre
            </button>
          )}
        </div>
      )}

      {/* Modal Rechazo */}
      {rechazoModalPrestamoId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 max-w-sm w-full space-y-3">
            <h4 className="font-black text-sm text-black">Rechazar Solicitud</h4>
            <textarea
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Indica el motivo del rechazo..."
              rows={3}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-bold text-black focus:outline-none focus:border-black"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setRechazoModalPrestamoId(null)}
                className="px-3 py-1.5 text-xs font-bold text-gray-600 hover:text-black"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmarRechazo}
                className="px-4 py-1.5 bg-rose-700 hover:bg-rose-800 text-white font-black text-xs rounded-lg"
              >
                Confirmar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
