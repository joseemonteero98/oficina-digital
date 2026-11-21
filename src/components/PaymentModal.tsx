'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Cliente, Cuota, TipoPago } from '@/types';
import { formatMoney } from '@/lib/utils';
import { X, CheckCircle2, AlertCircle, Banknote } from 'lucide-react';
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

  const handleSubmit = async (e: React.FormEvent) => {
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
      await registrarCobro({
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
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-gray-300 rounded-t-3xl sm:rounded-2xl max-w-md w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800">
              Registrar Cobro en Calle
            </span>
            <h3 className="text-base font-black text-black truncate max-w-[280px]">
              {cliente.nombre_completo}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black p-1 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Resumen del Préstamo */}
        <div className="px-5 py-3 bg-white border-b border-gray-200 flex items-center justify-between text-xs">
          <div>
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Préstamo</span>
            <span className="font-black text-black">{prestamo.codigo}</span>
          </div>
          <div className="text-right">
            <span className="text-gray-500 block text-[10px] uppercase font-bold">Saldo Restante</span>
            <span className="font-black text-base text-black tabular-nums">
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
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                tipoPago === 'cuota_completa'
                  ? 'bg-emerald-50 border-emerald-600 text-emerald-950 font-black shadow-xs'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Banknote className="w-5 h-5 mx-auto mb-1 text-emerald-700" />
              <span className="text-xs block font-bold">Cuota Completa</span>
              <span className="text-xs font-black text-black tabular-nums block mt-0.5">
                {formatMoney(valorSugerido)}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('abono')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                tipoPago === 'abono'
                  ? 'bg-blue-50 border-blue-600 text-blue-950 font-black shadow-xs'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <CheckCircle2 className="w-5 h-5 mx-auto mb-1 text-blue-700" />
              <span className="text-xs block font-bold">Abono Parcial</span>
              <span className="text-[10px] text-gray-600 block mt-0.5 font-bold">Otro valor</span>
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('no_pago')}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                tipoPago === 'no_pago'
                  ? 'bg-rose-50 border-rose-600 text-rose-950 font-black shadow-xs'
                  : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <AlertCircle className="w-5 h-5 mx-auto mb-1 text-rose-700" />
              <span className="text-xs block font-bold">No Pagó</span>
              <span className="text-[10px] text-gray-600 block mt-0.5 font-bold">Motivo</span>
            </button>
          </div>

          {/* Campo de Monto Personalizado */}
          {tipoPago === 'abono' && (
            <div className="bg-gray-50 p-4 rounded-xl border border-gray-300 space-y-2">
              <label className="block text-xs font-black text-black">
                Monto que el cliente entrega hoy ($)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-gray-600 font-black text-sm">$</span>
                <input
                  type="number"
                  step="1000"
                  min="1000"
                  max={prestamo.saldo_pendiente}
                  value={montoCustom}
                  onChange={(e) => setMontoCustom(Number(e.target.value))}
                  className="w-full pl-9 pr-3 py-2 bg-white border-2 border-gray-300 rounded-xl text-black font-mono text-base font-black focus:outline-none focus:border-black"
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
                    className="flex-1 text-xs font-bold bg-white hover:bg-gray-100 text-black py-1.5 rounded-lg border border-gray-300"
                  >
                    +{formatMoney(val)}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Motivo cuando es "No Pago" */}
          {tipoPago === 'no_pago' && (
            <div className="bg-rose-50 p-4 rounded-xl border border-rose-300 space-y-2">
              <label className="block text-xs font-black text-rose-950">
                Motivo del no-pago:
              </label>
              <select
                value={motivoNoPago}
                onChange={(e) => setMotivoNoPago(e.target.value)}
                className="w-full bg-white border border-rose-400 rounded-xl p-2.5 text-xs font-bold text-black focus:outline-none focus:border-black"
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
            <label className="block text-xs font-bold text-gray-700 mb-1">
              Nota u observación adicional (opcional)
            </label>
            <input
              type="text"
              value={nota}
              onChange={(e) => setNota(e.target.value)}
              placeholder="Ej. Dejó el dinero con la vecina / paga mañana..."
              className="w-full bg-white border border-gray-300 rounded-xl px-3 py-2 text-xs font-semibold text-black placeholder-gray-500 focus:outline-none focus:border-black"
            />
          </div>

          {/* Botón de Confirmación Grande */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-4 px-4 rounded-xl font-black text-sm text-white shadow-xs flex items-center justify-center gap-2 transition-transform active:scale-[0.98] ${
                tipoPago === 'no_pago'
                  ? 'bg-rose-700 hover:bg-rose-800'
                  : 'bg-emerald-600 hover:bg-emerald-700'
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
