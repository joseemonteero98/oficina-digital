'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate } from '@/lib/utils';
import { Prestamo, Cliente, Cuota } from '@/types';
import {
  Phone,
  MessageCircle,
  MapPin,
  CheckCircle2,
  Wallet,
  ArrowRight,
  Search,
  Sparkles,
} from 'lucide-react';
import { PaymentModal } from '@/components/PaymentModal';

interface CobradorViewProps {
  onOpenNewLoan: () => void;
  activeSubTab?: 'ruta' | 'caja';
}

export function CobradorView({ onOpenNewLoan, activeSubTab = 'ruta' }: CobradorViewProps) {
  const {
    prestamos,
    clientes,
    cierreCaja,
    registrarGastoCaja,
    enviarCierreCaja,
    desembolsarPrestamo,
  } = useApp();

  const [vistaInterna, setVistaInterna] = useState<'ruta' | 'caja'>(activeSubTab);
  const [busqueda, setBusqueda] = useState<string>('');
  const [selectedForPayment, setSelectedForPayment] = useState<{
    prestamo: Prestamo;
    cliente: Cliente;
    cuota?: Cuota;
  } | null>(null);

  // Estados de Caja
  const [nuevoGastoConcepto, setNuevoGastoConcepto] = useState('');
  const [nuevoGastoMonto, setNuevoGastoMonto] = useState('');
  const [cierreObservaciones, setCierreObservaciones] = useState('');

  // Préstamos asignados
  const misPrestamos = prestamos;

  // Lista de clientes por cobrar hoy en Valledupar
  const cobrosDeHoy = misPrestamos
    .filter((p) => p.estado === 'activo' || p.estado === 'mora')
    .map((p) => {
      const cliente = clientes.find((c) => c.id === p.cliente_id)!;
      const cuotaPendiente = (p.cuotas || []).find(
        (c) => c.estado === 'pendiente' || c.estado === 'parcial' || c.estado === 'atrasada'
      );
      return {
        prestamo: p,
        cliente,
        cuota: cuotaPendiente,
      };
    })
    .filter((item) => {
      if (!item.cliente) return false;
      if (!busqueda.trim()) return true;
      const query = busqueda.toLowerCase();
      return (
        item.cliente.nombre_completo.toLowerCase().includes(query) ||
        item.cliente.direccion.toLowerCase().includes(query) ||
        (item.cliente.negocio && item.cliente.negocio.toLowerCase().includes(query))
      );
    });

  // Préstamos aprobados por el supervisor esperando entrega de dinero
  const aprobadosParaEntrega = misPrestamos.filter((p) => p.estado === 'aprobado');

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
      alert('¡Cierre de caja enviado al Supervisor para su revisión en oficina!');
    }
  };

  return (
    <div className="max-w-2xl mx-auto pb-20 pt-1 px-3 sm:px-0">
      
      {/* Alerta si hay préstamo autorizado listo para entregar efectivo */}
      {aprobadosParaEntrega.length > 0 && (
        <div className="mb-3 p-3.5 bg-blue-50 border-2 border-blue-400 rounded-2xl flex items-center justify-between shadow-xs">
          <div>
            <div className="flex items-center gap-1.5 text-blue-900 font-black text-xs">
              <Sparkles className="w-4 h-4 text-blue-700" />
              <span>{aprobadosParaEntrega.length} Préstamo Autorizado Listo</span>
            </div>
            <p className="text-[11px] font-semibold text-blue-800 mt-0.5">
              Autorizado por Supervisor. Entrega el dinero al cliente en la calle.
            </p>
          </div>
          <button
            onClick={() => {
              const p = aprobadosParaEntrega[0];
              const cliente = clientes.find((c) => c.id === p.cliente_id);
              if (confirm(`¿Entregar ${formatMoney(p.capital)} en efectivo a ${cliente?.nombre_completo}?`)) {
                desembolsarPrestamo(p.id);
              }
            }}
            className="bg-blue-700 hover:bg-blue-800 text-white font-extrabold text-xs py-2 px-3 rounded-xl shadow-xs shrink-0"
          >
            Entregar $
          </button>
        </div>
      )}

      {/* Selector de subvista: Ruta o Caja */}
      <div className="flex gap-2 mb-3">
        <button
          onClick={() => setVistaInterna('ruta')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition-all ${
            vistaInterna === 'ruta'
              ? 'bg-black text-white border-black shadow-xs'
              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Ruta de Cobro ({cobrosDeHoy.length})
        </button>

        <button
          onClick={() => setVistaInterna('caja')}
          className={`flex-1 py-2.5 text-xs font-black rounded-xl border transition-all ${
            vistaInterna === 'caja'
              ? 'bg-black text-white border-black shadow-xs'
              : 'bg-white text-gray-800 border-gray-300 hover:bg-gray-50'
          }`}
        >
          Arqueo de Caja ({formatMoney(efectivoEnMano)})
        </button>
      </div>

      {/* ============================================================== */}
      {/* SECCIÓN 1: RUTA DE COBRO DEL DÍA (ALTO CONTRASTE LUZ SOLAR)   */}
      {/* ============================================================== */}
      {vistaInterna === 'ruta' && (
        <div className="space-y-3">
          
          {/* Buscador Rápido de Calle */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-gray-500" />
            <input
              type="text"
              placeholder="Buscar cliente, negocio o barrio (ej. La Nevada)..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-white border-2 border-gray-300 rounded-xl pl-10 pr-4 py-2.5 text-sm font-bold text-black placeholder-gray-500 focus:outline-none focus:border-black"
            />
          </div>

          {cobrosDeHoy.length === 0 ? (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-8 text-center text-gray-600">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
              <p className="font-extrabold text-base text-black">¡Ruta al día!</p>
              <p className="text-xs text-gray-600 mt-1">
                No hay más cobros pendientes en la ruta de hoy.
              </p>
            </div>
          ) : (
            cobrosDeHoy.map(({ prestamo, cliente, cuota }, idx) => {
              const valorCobro = cuota ? (cuota.monto_total - cuota.monto_pagado) : prestamo.valor_cuota;
              const isMora = prestamo.estado === 'mora' || cuota?.estado === 'atrasada';

              return (
                <div
                  key={prestamo.id}
                  className={`bg-white border-2 rounded-2xl p-4 shadow-xs transition-all ${
                    isMora ? 'border-rose-400 bg-rose-50/20' : 'border-gray-300 hover:border-black'
                  }`}
                >
                  {/* Encabezado del cliente */}
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div className="flex items-start gap-2.5">
                      <span className="w-7 h-7 rounded-full bg-gray-900 text-white font-black text-xs flex items-center justify-center shrink-0 mt-0.5">
                        {idx + 1}
                      </span>
                      <div>
                        <h3 className="font-black text-base text-black leading-tight">
                          {cliente.nombre_completo}
                        </h3>
                        <p className="text-xs font-bold text-emerald-900 mt-0.5">
                          {cliente.negocio || cliente.alias || 'Negocio particular'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-gray-600 block">
                        Cuota de hoy
                      </span>
                      <span className="font-black text-lg text-black tabular-nums block leading-tight">
                        {formatMoney(valorCobro)}
                      </span>
                    </div>
                  </div>

                  {/* Dirección en Valledupar y saldo */}
                  <div className="text-xs text-gray-700 py-2 border-t border-b border-gray-200 space-y-1 my-2">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-900 shrink-0" />
                      <span className="font-bold text-black">{cliente.direccion}</span>
                    </div>

                    <div className="flex items-center justify-between text-[11px] pt-0.5">
                      <span className="font-semibold text-gray-600">
                        Saldo restante: <strong className="text-black">{formatMoney(prestamo.saldo_pendiente)}</strong>
                      </span>
                      {isMora && (
                        <span className="text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-800 px-2 py-0.5 rounded border border-rose-300">
                          Atrasado
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Botón Principal de Cobro (Grande y prominente) */}
                  <div className="space-y-2 pt-1">
                    <button
                      onClick={() =>
                        setSelectedForPayment({
                          prestamo,
                          cliente,
                          cuota,
                        })
                      }
                      className="w-full py-3 px-4 rounded-xl font-black text-sm text-white bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] transition-all shadow-xs flex items-center justify-center gap-2"
                    >
                      <span>Cobrar {formatMoney(valorCobro)}</span>
                      <ArrowRight className="w-4 h-4 stroke-[3]" />
                    </button>

                    {/* Botones secundarios (WhatsApp y Llamada) */}
                    <div className="grid grid-cols-2 gap-2">
                      <a
                        href={`https://wa.me/57${cliente.telefono.replace(/\D/g, '')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-emerald-900 border border-gray-300 py-2 rounded-xl text-xs font-bold"
                      >
                        <MessageCircle className="w-3.5 h-3.5 text-emerald-700" />
                        <span>WhatsApp</span>
                      </a>

                      <a
                        href={`tel:${cliente.telefono.replace(/\D/g, '')}`}
                        className="flex items-center justify-center gap-1.5 bg-gray-100 hover:bg-gray-200 text-blue-900 border border-gray-300 py-2 rounded-xl text-xs font-bold"
                      >
                        <Phone className="w-3.5 h-3.5 text-blue-700" />
                        <span>Llamar</span>
                      </a>
                    </div>
                  </div>

                </div>
              );
            })
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SECCIÓN 2: ARQUEO DE CAJA LIMPIO Y SIN RUIDO                   */}
      {/* ============================================================== */}
      {vistaInterna === 'caja' && (
        <div className="space-y-4">
          <div className="bg-white border-2 border-gray-300 rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-gray-200">
              <div>
                <h3 className="font-black text-base text-black flex items-center gap-2">
                  <Wallet className="w-5 h-5 text-amber-600" />
                  Arqueo de Caja del Día
                </h3>
                <span className="text-xs font-semibold text-gray-500">Valledupar, Cesar</span>
              </div>
              <span className="text-xs font-extrabold text-black bg-gray-100 border border-gray-300 px-2.5 py-1 rounded-lg">
                Cobrador: Brayan Martínez
              </span>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-gray-600 font-semibold">(+) Base inicial de salida:</span>
                <span className="font-extrabold text-black tabular-nums">{formatMoney(cierreCaja.base_inicial)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-emerald-700 font-bold">(+) Total cobrado en ruta hoy:</span>
                <span className="font-black text-emerald-700 tabular-nums">{formatMoney(cierreCaja.total_cobrado)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-blue-700 font-semibold">(-) Total prestado / desembolsado:</span>
                <span className="font-extrabold text-blue-700 tabular-nums">-{formatMoney(cierreCaja.total_desembolsado)}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-gray-100">
                <span className="text-rose-700 font-semibold">(-) Gastos (gasolina moto, etc.):</span>
                <span className="font-extrabold text-rose-700 tabular-nums">-{formatMoney(cierreCaja.total_gastos)}</span>
              </div>
              
              <div className="flex justify-between pt-3 text-base font-black border-t-2 border-black">
                <span className="text-black uppercase">Efectivo Físico a Entregar:</span>
                <span className="text-emerald-700 text-lg tabular-nums">{formatMoney(efectivoEnMano)}</span>
              </div>
            </div>

            <div className="pt-2">
              {cierreCaja.estado === 'abierto' ? (
                <button
                  onClick={handleEnviarCierre}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black text-sm py-3.5 rounded-xl shadow-xs active:scale-[0.98] transition-all"
                >
                  Entregar y Cerrar Caja con el Supervisor
                </button>
              ) : (
                <div className="bg-emerald-50 border-2 border-emerald-300 p-3 rounded-xl text-center text-xs font-black text-emerald-900">
                  ✓ Cierre enviado a revisión del Supervisor en Oficina.
                </div>
              )}
            </div>
          </div>

          {/* Registro de Gastos de Calle */}
          {cierreCaja.estado === 'abierto' && (
            <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 space-y-3">
              <h4 className="font-black text-xs uppercase text-gray-800 tracking-wider">
                Registrar Gasto de Calle (Gasolina, Parqueo)
              </h4>
              <form onSubmit={handleAgregarGasto} className="space-y-2">
                <input
                  type="text"
                  placeholder="Concepto (ej. Gasolina moto La Nevada)..."
                  value={nuevoGastoConcepto}
                  onChange={(e) => setNuevoGastoConcepto(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-bold text-black placeholder-gray-500 focus:outline-none focus:border-black"
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Monto ($)"
                    step="1000"
                    value={nuevoGastoMonto}
                    onChange={(e) => setNuevoGastoMonto(e.target.value)}
                    className="flex-1 bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-black text-black placeholder-gray-500 focus:outline-none focus:border-black"
                    required
                  />
                  <button
                    type="submit"
                    className="bg-gray-900 hover:bg-black text-white font-bold text-xs px-4 rounded-xl"
                  >
                    + Registrar
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      )}

      {/* Modal de cobro */}
      {selectedForPayment && (
        <PaymentModal
          prestamo={selectedForPayment.prestamo}
          cliente={selectedForPayment.cliente}
          cuota={selectedForPayment.cuota}
          onClose={() => setSelectedForPayment(null)}
        />
      )}

    </div>
  );
}
