'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Cliente, Cuota, TipoPago } from '@/types';
import { formatMoney } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Banknote, Calendar, User } from 'lucide-react';
import confetti from 'canvas-confetti';

interface PaymentModalProps {
  prestamo: Prestamo;
  cliente: Cliente;
  cuota?: Cuota;
  onClose: () => void;
}

export function PaymentModal({ prestamo, cliente, cuota, onClose }: PaymentModalProps) {
  const { registrarCobro } = useApp();

  const valorSugerido = cuota ? (cuota.monto_total - cuota.monto_pagado) : prestamo.valor_cuota;
  const [tipoPago, setTipoPago] = useState<TipoPago>('cuota_completa');
  const [montoCustom, setMontoCustom] = useState<number>(valorSugerido);
  const [motivoNoPago, setMotivoNoPago] = useState<string>('Sin dinero en el momento');
  const [nota, setNota] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    let montoFinal = 0;
    if (tipoPago === 'cuota_completa') {
      montoFinal = valorSugerido;
    } else if (tipoPago === 'abono') {
      montoFinal = Number(montoCustom) || 0;
    } else {
      montoFinal = 0;
    }

    if (tipoPago !== 'no_pago' && montoFinal <= 0) {
      alert('Ingresa un monto válido mayor a cero');
      setIsSubmitting(false);
      return;
    }

    try {
      registrarCobro({
        prestamo_id: prestamo.id,
        cuota_id: cuota?.id,
        monto: montoFinal,
        tipo: tipoPago,
        motivoNoPago: tipoPago === 'no_pago' ? motivoNoPago : undefined,
        nota: nota || undefined,
      });

      if (tipoPago !== 'no_pago') {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.7 },
        });
      }

      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al procesar cobro');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
              Registrar Cobro en Calle
            </span>
            <h3 className="text-base font-extrabold text-white truncate max-w-[280px]">
              {cliente.nombre_completo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Préstamo */}
        <div className="px-5 py-3 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between text-xs">
          <div>
            <span className="text-slate-400 block text-[10px]">Préstamo</span>
            <span className="font-bold text-slate-200">{prestamo.codigo}</span>
          </div>
          <div className="text-right">
            <span className="text-slate-400 block text-[10px]">Saldo Restante</span>
            <span className="font-extrabold text-amber-400 tabular-nums">
              {formatMoney(prestamo.saldo_pendiente)}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Selector de modo de cobro */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => {
                setTipoPago('cuota_completa');
                setMontoCustom(valorSugerido);
              }}
              className={`p-3 rounded-xl border text-center transition-all ${
                tipoPago === 'cuota_completa'
                  ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold shadow-md shadow-emerald-950/40'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <Banknote className="w-4 h-4 mx-auto mb-1 text-emerald-400" />
              <span className="text-xs block">Cuota Completa</span>
              <span className="text-[11px] font-black text-white tabular-nums block mt-0.5">
                {formatMoney(valorSugerido)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('abono')}
              className={`p-3 rounded-xl border text-center transition-all ${
                tipoPago === 'abono'
                  ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold shadow-md shadow-blue-950/40'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 mx-auto mb-1 text-blue-400" />
              <span className="text-xs block">Abono Parcial</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Otro valor</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('no_pago')}
              className={`p-3 rounded-xl border text-center transition-all ${
                tipoPago === 'no_pago'
                  ? 'bg-rose-600/20 border-rose-500 text-rose-300 font-bold shadow-md shadow-rose-950/40'
                  : 'bg-slate-800/60 border-slate-700 text-slate-400 hover:bg-slate-800'
              }`}
            >
              <AlertCircle className="w-4 h-4 mx-auto mb-1 text-rose-400" />
              <span className="text-xs block">No Pagó</span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Registrar motivo</span>
            </button>
          </div>

          {/* Campo de Monto Personalizado */}
          {tipoPago === 'abono' && (
            <div className="bg-slate-800/60 p-4 rounded-xl border border-slate-700/80 space-y-2">
              <label className="block text-xs font-semibold text-slate-300">
                Monto que el cliente va a pagar hoy ($)
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2.5 text-slate-400 font-bold text-sm">$</span>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max={prestamo.saldo_pendiente}
                  value={montoCustom}
                  onChange={(e) => setMontoCustom(Number(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-slate-900 border border-slate-700 rounded-lg text-white font-mono text-base font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0"
                  required
                />
              </div>

              {/* Botones de sugerencia rápida */}
              <div className="flex gap-1.5 pt-1">
                {[10000, 20000, 50000].map((val) => (
                  <button
                    key={val}
                    type="button"
                    onClick={() => setMontoCustom(val)}
                    className="flex-1 text-[11px] bg-slate-700/80 hover:bg-slate-700 text-slate-200 py-1 rounded border border-slate-600"
                  >
                    +{formatMoney(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Opciones cuando es "No Pago" */}
          {tipoPago === 'no_pago' && (
            <div className="bg-rose-950/20 p-4 rounded-xl border border-rose-800/40 space-y-2">
              <label className="block text-xs font-semibold text-rose-300">
                Motivo del no-pago:
              </label>
              <select
                value={motivoNoPago}
                onChange={(e) => setMotivoNoPago(e.target.value)}
                className="w-full bg-slate-900 border border-rose-800/60 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:ring-2 focus:ring-rose-500"
              >
                <option value="Sin dinero en el momento">No tiene dinero en el momento</option>
                <option value="Local cerrado / Ausente">Negocio o casa cerrada / No estaba</option>
                <option value="Pidió prórroga para la tarde">Pidió prórroga para más tarde</option>
                <option value="Pidió prórroga para mañana">Pidió prórroga para mañana</option>
                <option value="Cliente se niega a pagar">Cliente evasivo / Se niega a pagar</option>
                <option value="Enfermedad o emergencia">Emergencia médica o calamidad</option>
              </select>
            </div>
          )}

          {/* Nota opcional */}
          <div>
            <label className="block text-xs font-medium text-slate-400 mb-1">
              Nota u observación adicional (opcional)
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. Dejó el dinero con la vecina / paga mañana doble..."
              className="w-full bg-slate-800/60 border border-slate-700/80 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            />
          </div>

          {/* Botón de Confirmación Grande */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3.5 px-4 rounded-xl font-extrabold text-sm text-white shadow-xl flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                tipoPago === 'no_pago'
                  ? 'bg-rose-600 hover:bg-rose-500 shadow-rose-950'
                  : 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              {tipoPago === 'no_pago'
                ? 'Registrar No Pago y Guardar'
                : `Confirmar Cobro de ${formatMoney(tipoPago === 'cuota_completa' ? valorSugerido : montoCustom)}`}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
