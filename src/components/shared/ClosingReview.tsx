'use client';

import React, { useState } from 'react';
import { CierreCaja, RegistroPago } from '@/types';
import { formatMoney, formatDate, getEstadoCierreBadge } from '@/lib/utils';
import { StatusBadge, BadgeVariant } from './StatusBadge';
import { ConfirmDialog } from './ConfirmDialog';
import { AlertTriangle, ChevronDown, ChevronUp, Loader2 } from 'lucide-react';

interface ClosingReviewProps {
  cierre: CierreCaja;
  pagosRelacionados: RegistroPago[];
  onApprove: (cierreId: string, obs?: string) => Promise<void>;
  onReject: (cierreId: string, motivo: string) => Promise<void>;
}

export function ClosingReview({
  cierre,
  pagosRelacionados,
  onApprove,
  onReject,
}: ClosingReviewProps) {
  const [expanded, setExpanded] = useState(cierre.diferencia !== 0);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [motivoRechazo, setMotivoRechazo] = useState('');
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const badge = getEstadoCierreBadge(cierre.estado);
  const badgeVariant: Record<string, BadgeVariant> = {
    abierto: 'info',
    pendiente_revision: 'pending',
    aprobado: 'success',
    rechazado: 'danger',
  };

  const hasDiff = cierre.diferencia !== 0;

  const handleConfirmApprove = async () => {
    setIsLoading(true);
    try {
      await onApprove(cierre.id, 'Arqueo verificado y aprobado en oficina');
      setShowApproveConfirm(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmReject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!motivoRechazo.trim()) return;
    setIsLoading(true);
    try {
      await onReject(cierre.id, motivoRechazo.trim());
      setShowRejectModal(false);
      setMotivoRechazo('');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`bg-white rounded-[8px] p-4 space-y-3 border ${
        hasDiff ? 'border-[#DC2626]' : 'border-[#D1D5DB]'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="text-[16px] font-semibold text-black">{cierre.cobrador_nombre}</h4>
          <p className="text-[12px] text-[#525252]">
            Fecha: {formatDate(cierre.fecha)} · {pagosRelacionados.length} movimiento(s)
          </p>
        </div>
        <StatusBadge label={badge.label} variant={badgeVariant[cierre.estado] || 'neutral'} />
      </div>

      {/* Resumen esperado vs declarado */}
      <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-2.5 text-center text-[12px]">
        <div>
          <span className="text-[#525252] block">Esperado</span>
          <strong className="text-[14px] text-black tabular-nums">
            {formatMoney(cierre.efectivo_esperado)}
          </strong>
        </div>
        <div>
          <span className="text-[#525252] block">Declarado</span>
          <strong className="text-[14px] text-black tabular-nums">
            {formatMoney(cierre.efectivo_entregado)}
          </strong>
        </div>
        <div>
          <span className="text-[#525252] block">Diferencia</span>
          <strong
            className={`text-[14px] tabular-nums ${
              cierre.diferencia === 0
                ? 'text-[#15803D]'
                : cierre.diferencia < 0
                ? 'text-[#DC2626]'
                : 'text-[#2563EB]'
            }`}
          >
            {formatMoney(cierre.diferencia)}
          </strong>
        </div>
      </div>

      {hasDiff && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[6px] p-2.5 flex items-center gap-2 text-[12px] text-[#DC2626] font-medium">
          <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
          <span>Este cierre presenta una diferencia de {formatMoney(cierre.diferencia)}. Verifica antes de aprobar.</span>
        </div>
      )}

      {/* Desglose de fórmula y movimientos */}
      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[13px] font-medium text-[#2563EB]"
      >
        <span>{expanded ? 'Ocultar fórmula y movimientos' : 'Ver fórmula y movimientos'}</span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" strokeWidth={2} />
        ) : (
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
        )}
      </button>

      {expanded && (
        <div className="space-y-3 pt-2 border-t border-[#E5E7EB] text-[13px]">
          <div className="space-y-1">
            <div className="flex justify-between">
              <span className="text-[#525252]">Efectivo inicial:</span>
              <span className="font-medium text-black tabular-nums">{formatMoney(cierre.base_inicial)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#15803D]">+ Recaudado efectivo:</span>
              <span className="font-medium text-[#15803D] tabular-nums">
                {formatMoney(cierre.total_cobrado_efectivo ?? cierre.total_cobrado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#DC2626]">- Desembolsos:</span>
              <span className="font-medium text-[#DC2626] tabular-nums">
                -{formatMoney(cierre.total_desembolsado)}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#DC2626]">- Gastos:</span>
              <span className="font-medium text-[#DC2626] tabular-nums">
                -{formatMoney(cierre.total_gastos)}
              </span>
            </div>
          </div>

          {cierre.observaciones && (
            <div className="bg-[#F7F8FA] p-2.5 rounded-[6px] border border-[#E5E7EB] text-[12px]">
              <strong className="text-black">Observaciones:</strong> {cierre.observaciones}
            </div>
          )}

          {pagosRelacionados.length > 0 && (
            <div>
              <p className="text-[12px] font-semibold text-black mb-1">Movimientos individuales:</p>
              <div className="max-h-40 overflow-y-auto divide-y divide-[#E5E7EB] border border-[#E5E7EB] rounded-[6px]">
                {pagosRelacionados.map((pg) => (
                  <div key={pg.id} className="px-3 py-2 flex justify-between text-[12px]">
                    <span className="text-[#525252]">
                      {pg.hora_pago} · {pg.tipo === 'no_pago' ? 'No pagó' : pg.metodo_pago || 'Efectivo'}
                    </span>
                    <span className="font-semibold text-black tabular-nums">{formatMoney(pg.monto)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones si está pendiente de revisión */}
      {cierre.estado === 'pendiente_revision' && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          <button
            type="button"
            onClick={() => setShowRejectModal(true)}
            className="h-11 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-semibold"
          >
            RECHAZAR CIERRE
          </button>
          <button
            type="button"
            onClick={() => setShowApproveConfirm(true)}
            className="h-11 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[13px] font-semibold"
          >
            APROBAR CIERRE
          </button>
        </div>
      )}

      <ConfirmDialog
        isOpen={showApproveConfirm}
        title="Aprobar arqueo de caja"
        message={`¿Confirmas haber recibido ${formatMoney(cierre.efectivo_entregado)} de ${cierre.cobrador_nombre}?`}
        confirmLabel="Aprobar cierre"
        variant="success"
        isLoading={isLoading}
        onConfirm={handleConfirmApprove}
        onCancel={() => setShowApproveConfirm(false)}
      />

      {showRejectModal && (
        <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
          <form
            onSubmit={handleConfirmReject}
            className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-sm w-full p-5 space-y-3"
          >
            <h3 className="text-[16px] font-semibold text-black">Rechazar arqueo de caja</h3>
            <p className="text-[13px] text-[#525252]">
              Indica la explicación obligatoria para que el cobrador realice la corrección:
            </p>
            <textarea
              rows={3}
              value={motivoRechazo}
              onChange={(e) => setMotivoRechazo(e.target.value)}
              placeholder="Ej. Faltante sin justificar, falta recibo de gasolina..."
              className="w-full p-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              required
            />
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setShowRejectModal(false)}
                className="h-11 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isLoading || !motivoRechazo.trim()}
                className="h-11 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[13px] font-semibold flex items-center justify-center gap-1 disabled:opacity-50"
              >
                {isLoading && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                <span>Rechazar</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
