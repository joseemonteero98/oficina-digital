'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Cliente, Cuota, TipoPago, MetodoPago } from '@/types';
import { formatMoney } from '@/lib/utils';
import { X, Loader2 } from 'lucide-react';
import { ConfirmDialog } from './ConfirmDialog';

interface PaymentModalProps {
  prestamo: Prestamo;
  cliente: Cliente;
  cuota?: Cuota;
  onClose: () => void;
}

const MOTIVOS_NO_PAGO = [
  'No tenía dinero',
  'No estaba en casa',
  'Negocio cerrado',
  'Cliente no localizado',
  'Se negó a pagar',
  'Prometió pagar después',
  'Otro',
];

export function PaymentModal({ prestamo, cliente, cuota, onClose }: PaymentModalProps) {
  const { registrarCobro, showToast } = useApp();

  const valorCuotaProgramada = cuota
    ? Math.max(0, cuota.monto_total - cuota.monto_pagado)
    : Math.min(prestamo.valor_cuota, prestamo.saldo_pendiente);

  const valorExigible = Math.min(valorCuotaProgramada, prestamo.saldo_pendiente);

  const [tipoPago, setTipoPago] = useState<TipoPago>('cuota_completa');
  const [metodoPago, setMetodoPago] = useState<MetodoPago>('efectivo');
  const [montoAbono, setMontoAbono] = useState<string>(
    String(Math.min(Math.round(valorExigible / 2 / 1000) * 1000 || 10000, prestamo.saldo_pendiente))
  );
  const [motivoSeleccionado, setMotivoSeleccionado] = useState<string>(MOTIVOS_NO_PAGO[0]);
  const [observacionOtro, setObservacionOtro] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showConfirm, setShowConfirm] = useState<boolean>(false);

  const montoNumericoAbono = Number(montoAbono) || 0;
  const montoFinal =
    tipoPago === 'cuota_completa'
      ? valorExigible
      : tipoPago === 'abono'
      ? montoNumericoAbono
      : 0;

  const restanteCuota = Math.max(0, valorExigible - montoNumericoAbono);
  const saldoDespuesEstimado = Math.max(0, prestamo.saldo_pendiente - montoNumericoAbono);

  const handleRequestAction = (e: React.FormEvent) => {
    e.preventDefault();

    if (tipoPago !== 'no_pago') {
      if (montoFinal <= 0) {
        showToast('error', 'El monto recibido debe ser mayor a cero.');
        return;
      }
      if (montoFinal > prestamo.saldo_pendiente) {
        showToast('error', 'El valor recibido no puede superar el saldo pendiente del préstamo.');
        return;
      }
      // Confirmación breve obligatoria para movimientos monetarios
      setShowConfirm(true);
    } else {
      if (motivoSeleccionado === 'Otro' && !observacionOtro.trim()) {
        showToast('error', 'Escribe la observación del motivo.');
        return;
      }
      ejecutarRegistro();
    }
  };

  const ejecutarRegistro = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    try {
      await registrarCobro({
        prestamo_id: prestamo.id,
        cuota_id: cuota?.id,
        monto: montoFinal,
        tipo: tipoPago,
        metodo_pago: tipoPago === 'no_pago' ? undefined : metodoPago,
        motivoNoPago: tipoPago === 'no_pago' ? motivoSeleccionado : undefined,
        nota: tipoPago === 'no_pago' && motivoSeleccionado === 'Otro' ? observacionOtro.trim() : undefined,
      });
      setShowConfirm(false);
      onClose();
    } catch {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center sm:p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-[#D1D5DB] rounded-t-[12px] sm:rounded-[8px] max-w-md w-full max-h-[90vh] flex flex-col overflow-hidden"
      >
        {/* Encabezado */}
        <div className="px-4 py-3.5 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-start justify-between gap-2 shrink-0">
          <div className="min-w-0">
            <h2 className="text-[16px] font-semibold text-black">Registrar cobro</h2>
            <p className="text-[14px] font-semibold text-black truncate mt-0.5">
              {cliente.nombre_completo}
            </p>
            <p className="text-[12px] text-[#525252] mt-0.5">
              Cuota programada: <strong className="text-black">{formatMoney(valorExigible)}</strong> · Saldo pendiente:{' '}
              <strong className="text-black">{formatMoney(prestamo.saldo_pendiente)}</strong>
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="w-9 h-9 rounded-[6px] flex items-center justify-center text-[#525252] hover:text-black hover:bg-[#E5E7EB]"
          >
            <X className="w-5 h-5" strokeWidth={2} />
          </button>
        </div>

        {/* Contenido desplazable */}
        <form id="form-cobro" onSubmit={handleRequestAction} className="p-4 overflow-y-auto flex-1 space-y-4">
          {/* Selector segmentado de operación */}
          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => setTipoPago('cuota_completa')}
              className={`h-12 px-2 rounded-[6px] text-[12px] font-semibold border transition-colors ${
                tipoPago === 'cuota_completa'
                  ? 'bg-[#F0FDF4] text-[#15803D] border-[#15803D]'
                  : 'bg-white text-black border-[#D1D5DB] hover:bg-[#F7F8FA]'
              }`}
            >
              PAGO COMPLETO
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('abono')}
              className={`h-12 px-2 rounded-[6px] text-[12px] font-semibold border transition-colors ${
                tipoPago === 'abono'
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB]'
                  : 'bg-white text-black border-[#D1D5DB] hover:bg-[#F7F8FA]'
              }`}
            >
              ABONO PARCIAL
            </button>

            <button
              type="button"
              onClick={() => setTipoPago('no_pago')}
              className={`h-12 px-2 rounded-[6px] text-[12px] font-semibold border transition-colors ${
                tipoPago === 'no_pago'
                  ? 'bg-[#FEF2F2] text-[#DC2626] border-[#DC2626]'
                  : 'bg-white text-black border-[#D1D5DB] hover:bg-[#F7F8FA]'
              }`}
            >
              NO PAGÓ
            </button>
          </div>

          {/* CASO A: PAGO COMPLETO */}
          {tipoPago === 'cuota_completa' && (
            <div className="space-y-3">
              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] p-4 space-y-1">
                <span className="text-[12px] text-[#525252] block">Valor de la cuota</span>
                <p className="text-[26px] font-bold text-black tabular-nums">
                  {formatMoney(valorExigible)}
                </p>
                <span className="text-[12px] text-[#15803D] font-medium block">
                  Valor recibido prellenado para cobro total de la cuota
                </span>
              </div>
            </div>
          )}

          {/* CASO B: ABONO PARCIAL */}
          {tipoPago === 'abono' && (
            <div className="space-y-3">
              <div className="flex justify-between text-[12px] text-[#525252]">
                <span>Valor exigible de la cuota:</span>
                <strong className="text-black tabular-nums">{formatMoney(valorExigible)}</strong>
              </div>

              <div>
                <label htmlFor="abono-monto" className="block text-[14px] font-semibold text-black mb-1.5">
                  ¿Cuánto recibiste?
                </label>
                <input
                  id="abono-monto"
                  type="number"
                  inputMode="numeric"
                  min={1000}
                  max={prestamo.saldo_pendiente}
                  step={500}
                  value={montoAbono}
                  onChange={(e) => setMontoAbono(e.target.value)}
                  className="w-full h-12 px-3.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[20px] font-bold text-black tabular-nums focus:outline-none focus:border-[#2563EB]"
                  required
                />
              </div>

              <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] p-3 space-y-1.5 text-[13px]">
                <div className="flex justify-between">
                  <span className="text-[#525252]">Valor recibido:</span>
                  <strong className="text-black tabular-nums">{formatMoney(montoNumericoAbono)}</strong>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#525252]">Restante de esta cuota:</span>
                  <strong className="text-[#2563EB] tabular-nums">{formatMoney(restanteCuota)}</strong>
                </div>
                <div className="flex justify-between pt-1 border-t border-[#E5E7EB]">
                  <span className="text-[#525252]">Nuevo saldo del préstamo:</span>
                  <strong className="text-black tabular-nums">{formatMoney(saldoDespuesEstimado)}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Selector de método de pago para Caso A y B */}
          {tipoPago !== 'no_pago' && (
            <div>
              <span className="block text-[12px] font-medium text-[#525252] mb-1.5">
                Método de pago
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setMetodoPago('efectivo')}
                  className={`h-11 rounded-[6px] text-[14px] font-medium border ${
                    metodoPago === 'efectivo'
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-semibold'
                      : 'bg-white text-black border-[#D1D5DB]'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setMetodoPago('transferencia')}
                  className={`h-11 rounded-[6px] text-[14px] font-medium border ${
                    metodoPago === 'transferencia'
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-semibold'
                      : 'bg-white text-black border-[#D1D5DB]'
                  }`}
                >
                  Transferencia
                </button>
              </div>
            </div>
          )}

          {/* CASO C: NO PAGÓ */}
          {tipoPago === 'no_pago' && (
            <div className="space-y-3">
              <div>
                <label htmlFor="motivo-nopago" className="block text-[14px] font-semibold text-black mb-1.5">
                  Motivo de no pago
                </label>
                <select
                  id="motivo-nopago"
                  value={motivoSeleccionado}
                  onChange={(e) => setMotivoSeleccionado(e.target.value)}
                  className="w-full h-12 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black focus:outline-none focus:border-[#2563EB]"
                >
                  {MOTIVOS_NO_PAGO.map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>

              {motivoSeleccionado === 'Otro' && (
                <div>
                  <label htmlFor="obs-nopago" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Observaciones
                  </label>
                  <textarea
                    id="obs-nopago"
                    rows={3}
                    value={observacionOtro}
                    onChange={(e) => setObservacionOtro(e.target.value)}
                    placeholder="Describe el motivo..."
                    className="w-full p-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black focus:outline-none focus:border-[#2563EB]"
                    required
                  />
                </div>
              )}
            </div>
          )}
        </form>

        {/* Botones fijos abajo */}
        <div className="p-4 bg-[#F7F8FA] border-t border-[#E5E7EB] shrink-0">
          <button
            type="submit"
            form="form-cobro"
            disabled={isSubmitting}
            className={`w-full h-12 rounded-[6px] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50 ${
              tipoPago === 'cuota_completa'
                ? 'bg-[#15803D] hover:bg-[#166534]'
                : tipoPago === 'abono'
                ? 'bg-[#2563EB] hover:bg-[#1D4ED8]'
                : 'bg-[#DC2626] hover:bg-[#B91C1C]'
            }`}
          >
            {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            <span>
              {tipoPago === 'cuota_completa'
                ? 'CONFIRMAR COBRO'
                : tipoPago === 'abono'
                ? 'REGISTRAR ABONO'
                : 'REGISTRAR NO PAGO'}
            </span>
          </button>
        </div>
      </div>

      {/* Confirmación breve antes de movimiento monetario */}
      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirmar operación"
        message={`Vas a registrar un ${tipoPago === 'abono' ? 'abono' : 'pago'} de ${formatMoney(
          montoFinal
        )} (${metodoPago === 'transferencia' ? 'Transferencia' : 'Efectivo'}) a ${cliente.nombre_completo}.`}
        confirmLabel="Confirmar"
        cancelLabel="Volver"
        variant={tipoPago === 'abono' ? 'primary' : 'success'}
        isLoading={isSubmitting}
        onConfirm={ejecutarRegistro}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
