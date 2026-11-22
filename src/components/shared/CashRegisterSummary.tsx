'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, getEstadoCierreBadge } from '@/lib/utils';
import { StatusBadge, BadgeVariant } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { ChevronDown, ChevronUp, Lock } from 'lucide-react';

export function CashRegisterSummary() {
  const { cierreCaja, pagos, prestamos, enviarCierreCaja, showToast } = useApp();

  const [dineroFisico, setDineroFisico] = useState<string>(String(cierreCaja.efectivo_esperado));
  const [observaciones, setObservaciones] = useState<string>('');
  const [showDetalleMovimientos, setShowDetalleMovimientos] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const pagosHoy = pagos.filter((p) => p.tipo !== 'no_pago');
  const pagosEfectivo = pagosHoy.filter((p) => p.metodo_pago !== 'transferencia');
  const pagosTransferencia = pagosHoy.filter((p) => p.metodo_pago === 'transferencia');

  const recaudosEfectivo =
    cierreCaja.total_cobrado_efectivo !== undefined
      ? cierreCaja.total_cobrado_efectivo
      : pagosEfectivo.reduce((acc, p) => acc + p.monto, 0);

  const recaudosTransferencia =
    cierreCaja.total_cobrado_transferencia !== undefined
      ? cierreCaja.total_cobrado_transferencia
      : pagosTransferencia.reduce((acc, p) => acc + p.monto, 0);

  const entradasTotalesEfectivo = recaudosEfectivo;
  const salidasTotalesEfectivo = cierreCaja.total_desembolsado + cierreCaja.total_gastos;
  const efectivoEsperado = cierreCaja.efectivo_esperado;

  const montoFisicoNum = Number(dineroFisico) || 0;
  const diferencia = montoFisicoNum - efectivoEsperado;

  const badge = getEstadoCierreBadge(cierreCaja.estado);
  const badgeVariant: Record<string, BadgeVariant> = {
    abierto: 'info',
    pendiente_revision: 'pending',
    aprobado: 'success',
    rechazado: 'danger',
  };

  const isLocked = cierreCaja.estado === 'pendiente_revision' || cierreCaja.estado === 'aprobado';

  const handleSubmitRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!observaciones.trim()) {
      showToast('error', 'Las observaciones del cierre son obligatorias.');
      return;
    }
    if (diferencia !== 0 && observaciones.trim().length < 5) {
      showToast('error', 'Explica brevemente el motivo de la diferencia en caja.');
      return;
    }
    setShowConfirm(true);
  };

  const handleConfirmSend = async () => {
    setIsSubmitting(true);
    try {
      await enviarCierreCaja(montoFisicoNum, observaciones.trim());
      setShowConfirm(false);
    } catch {
      setIsSubmitting(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-[22px] font-semibold text-black">Mi caja</h2>
          <p className="text-[12px] text-[#525252]">Jornada {formatDate(cierreCaja.fecha)}</p>
        </div>
        <StatusBadge label={badge.label} variant={badgeVariant[cierreCaja.estado] || 'neutral'} />
      </div>

      {cierreCaja.estado === 'rechazado' && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[8px] p-3 text-[13px] text-[#DC2626]">
          <strong>Cierre rechazado por supervisor:</strong> {cierreCaja.observaciones || 'Revisa los montos e intenta de nuevo.'}
        </div>
      )}

      {/* Tres bloques de información */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-3">
          <span className="text-[11px] font-medium text-[#525252] block">Efectivo inicial</span>
          <span className="text-[15px] sm:text-[16px] font-bold text-black tabular-nums mt-0.5 block">
            {formatMoney(cierreCaja.base_inicial)}
          </span>
        </div>

        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-3">
          <span className="text-[11px] font-medium text-[#525252] block">Entradas del día</span>
          <span className="text-[15px] sm:text-[16px] font-bold text-[#15803D] tabular-nums mt-0.5 block">
            +{formatMoney(entradasTotalesEfectivo)}
          </span>
        </div>

        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-3">
          <span className="text-[11px] font-medium text-[#525252] block">Salidas del día</span>
          <span className="text-[15px] sm:text-[16px] font-bold text-[#DC2626] tabular-nums mt-0.5 block">
            -{formatMoney(salidasTotalesEfectivo)}
          </span>
        </div>
      </div>

      {/* Fórmula visual clara de Efectivo Esperado */}
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2 text-[14px]">
        <p className="text-[12px] font-semibold uppercase tracking-wider text-[#525252]">
          Fórmula de efectivo esperado
        </p>

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <span className="text-[#525252]">Efectivo inicial (Base):</span>
            <span className="font-semibold text-black tabular-nums">{formatMoney(cierreCaja.base_inicial)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#15803D]">+ Recaudos en efectivo:</span>
            <span className="font-semibold text-[#15803D] tabular-nums">{formatMoney(recaudosEfectivo)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#DC2626]">- Desembolsos en efectivo:</span>
            <span className="font-semibold text-[#DC2626] tabular-nums">-{formatMoney(cierreCaja.total_desembolsado)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[#DC2626]">- Gastos descontables de caja:</span>
            <span className="font-semibold text-[#DC2626] tabular-nums">-{formatMoney(cierreCaja.total_gastos)}</span>
          </div>
        </div>

        <div className="pt-3 mt-2 border-t border-[#D1D5DB] flex items-baseline justify-between">
          <span className="text-[14px] font-semibold text-black">EFECTIVO ESPERADO:</span>
          <span className="text-[24px] font-bold text-black tabular-nums">
            {formatMoney(efectivoEsperado)}
          </span>
        </div>

        {recaudosTransferencia > 0 && (
          <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-[6px] p-2.5 flex justify-between text-[12px] text-[#2563EB]">
            <span>Recaudos por transferencia (no suman a efectivo físico):</span>
            <strong className="tabular-nums">{formatMoney(recaudosTransferencia)}</strong>
          </div>
        )}
      </div>

      {/* Detalle del movimiento de caja desplegable */}
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] overflow-hidden">
        <button
          type="button"
          onClick={() => setShowDetalleMovimientos(!showDetalleMovimientos)}
          className="w-full px-4 py-3 flex items-center justify-between text-[14px] font-semibold text-black hover:bg-[#F7F8FA]"
        >
          <span>Detalle del movimiento de caja</span>
          {showDetalleMovimientos ? (
            <ChevronUp className="w-4 h-4 text-[#525252]" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#525252]" strokeWidth={2} />
          )}
        </button>

        {showDetalleMovimientos && (
          <div className="px-4 pb-4 pt-2 border-t border-[#E5E7EB] space-y-2 text-[13px]">
            <div className="flex justify-between">
              <span className="text-[#525252]">Total recaudado en efectivo ({pagosEfectivo.length} cobros):</span>
              <strong className="text-black tabular-nums">{formatMoney(recaudosEfectivo)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Total recaudado por transferencias ({pagosTransferencia.length} cobros):</span>
              <strong className="text-black tabular-nums">{formatMoney(recaudosTransferencia)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Total desembolsado ({prestamos.filter((p) => p.estado === 'activo' && p.fecha_desembolso === cierreCaja.fecha).length}):</span>
              <strong className="text-black tabular-nums">{formatMoney(cierreCaja.total_desembolsado)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Total gastos ({(cierreCaja.gastos_detalle || []).length}):</span>
              <strong className="text-black tabular-nums">{formatMoney(cierreCaja.total_gastos)}</strong>
            </div>

            {(cierreCaja.gastos_detalle || []).length > 0 && (
              <div className="pt-2 border-t border-[#E5E7EB]">
                <p className="text-[12px] font-semibold text-black mb-1">Gastos registrados:</p>
                <ul className="space-y-1 text-[12px] text-[#525252]">
                  {(cierreCaja.gastos_detalle || []).map((g) => (
                    <li key={g.id} className="flex justify-between">
                      <span>{g.tipo} · {g.concepto}</span>
                      <span className="text-black font-medium tabular-nums">-{formatMoney(g.monto)}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Campo físico y envío de cierre */}
      {isLocked ? (
        <div className="bg-[#F7F8FA] border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
          <div className="flex items-center gap-2 text-black font-semibold text-[14px]">
            <Lock className="w-4 h-4 text-[#525252]" strokeWidth={2} />
            <span>
              {cierreCaja.estado === 'pendiente_revision'
                ? 'PENDIENTE DE REVISIÓN POR SUPERVISOR'
                : 'CIERRE DE JORNADA APROBADO'}
            </span>
          </div>
          <div className="text-[13px] text-[#525252] space-y-1">
            <p>Efectivo declarado: <strong className="text-black">{formatMoney(cierreCaja.efectivo_entregado)}</strong></p>
            <p>Diferencia: <strong className="text-black">{formatMoney(cierreCaja.diferencia)}</strong></p>
            {cierreCaja.observaciones && <p>Observaciones: {cierreCaja.observaciones}</p>}
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmitRequest} className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
          <div>
            <label htmlFor="dinero-fisico" className="block text-[14px] font-semibold text-black mb-1.5">
              ¿Cuánto dinero tienes físicamente?
            </label>
            <input
              id="dinero-fisico"
              type="number"
              inputMode="numeric"
              min={0}
              step={1000}
              value={dineroFisico}
              onChange={(e) => setDineroFisico(e.target.value)}
              className="w-full h-12 px-3.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[20px] font-bold text-black tabular-nums focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          {/* Diferencia automática */}
          <div
            className={`rounded-[6px] p-3 border flex items-center justify-between text-[14px] font-semibold ${
              diferencia === 0
                ? 'bg-[#F0FDF4] border-[#86EFAC] text-[#15803D]'
                : diferencia < 0
                ? 'bg-[#FEF2F2] border-[#FCA5A5] text-[#DC2626]'
                : 'bg-[#EFF6FF] border-[#93C5FD] text-[#2563EB]'
            }`}
          >
            <span>
              {diferencia === 0
                ? 'Caja cuadrada'
                : diferencia < 0
                ? `Faltante de ${formatMoney(Math.abs(diferencia))}`
                : `Sobrante de ${formatMoney(diferencia)}`}
            </span>
            <span className="tabular-nums">{formatMoney(diferencia)}</span>
          </div>

          <div>
            <label htmlFor="cierre-obs" className="block text-[13px] font-semibold text-black mb-1">
              Observaciones del cierre *
            </label>
            <textarea
              id="cierre-obs"
              rows={2}
              value={observaciones}
              onChange={(e) => setObservaciones(e.target.value)}
              placeholder={
                diferencia !== 0
                  ? 'Obligatorio: explica el motivo del faltante o sobrante...'
                  : 'Ej. Entrega completa de jornada en Valledupar...'
              }
              className="w-full p-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black focus:outline-none focus:border-[#2563EB]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold"
          >
            ENVIAR CIERRE AL SUPERVISOR
          </button>
        </form>
      )}

      <ConfirmDialog
        isOpen={showConfirm}
        title="Confirmar cierre de jornada"
        message={`Vas a enviar tu arqueo declarando ${formatMoney(montoFisicoNum)} en efectivo físico${
          diferencia !== 0 ? ` (diferencia de ${formatMoney(diferencia)})` : ''
        }. Una vez enviado quedará bloqueado para edición.`}
        confirmLabel="Enviar cierre"
        cancelLabel="Volver"
        variant="primary"
        isLoading={isSubmitting}
        onConfirm={handleConfirmSend}
        onCancel={() => setShowConfirm(false)}
      />
    </div>
  );
}
