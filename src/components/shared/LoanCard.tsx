'use client';

import React, { useState } from 'react';
import { Prestamo } from '@/types';
import { formatMoney, formatDate, getEstadoPrestamoBadge, getFrecuenciaLabel } from '@/lib/utils';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { StatusBadge, BadgeVariant } from './StatusBadge';

interface LoanCardProps {
  prestamo: Prestamo;
  actionSlot?: React.ReactNode;
  showCollector?: boolean;
}

export function LoanCard({ prestamo, actionSlot, showCollector = false }: LoanCardProps) {
  const [expanded, setExpanded] = useState(false);

  const badge = getEstadoPrestamoBadge(prestamo.estado);
  const variantMap: Record<string, BadgeVariant> = {
    pendiente: 'pending',
    aprobado: 'info',
    activo: 'success',
    pagado: 'neutral',
    rechazado: 'danger',
    mora: 'danger',
  };

  const cuotasPagadas = (prestamo.cuotas || []).filter((c) => c.estado === 'pagada').length;

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-medium text-[#525252]">{prestamo.codigo}</span>
            <span className="text-[12px] text-[#8A8A8A]">·</span>
            <span className="text-[12px] text-[#525252]">{formatDate(prestamo.fecha_solicitud)}</span>
          </div>
          <h4 className="text-[16px] font-semibold text-black truncate mt-0.5">
            {prestamo.cliente?.nombre_completo || 'Cliente'}
          </h4>
          {showCollector && prestamo.cobrador_nombre && (
            <p className="text-[12px] text-[#525252]">Cobrador: {prestamo.cobrador_nombre}</p>
          )}
        </div>

        <StatusBadge label={badge.label} variant={variantMap[prestamo.estado] || 'neutral'} />
      </div>

      <div className="grid grid-cols-3 gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-2.5 text-center">
        <div>
          <span className="text-[11px] text-[#525252] block">Capital</span>
          <span className="text-[14px] font-semibold text-black tabular-nums">
            {formatMoney(prestamo.capital)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[#525252] block">Cuota ({getFrecuenciaLabel(prestamo.frecuencia)})</span>
          <span className="text-[14px] font-semibold text-black tabular-nums">
            {formatMoney(prestamo.valor_cuota)}
          </span>
        </div>
        <div>
          <span className="text-[11px] text-[#525252] block">Saldo</span>
          <span className="text-[14px] font-bold text-black tabular-nums">
            {formatMoney(prestamo.saldo_pendiente)}
          </span>
        </div>
      </div>

      {prestamo.estado === 'rechazado' && prestamo.motivo_rechazo && (
        <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-[6px] p-2.5 text-[12px] text-[#DC2626]">
          <strong>Motivo del rechazo:</strong> {prestamo.motivo_rechazo}
        </div>
      )}

      <button
        type="button"
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between text-[12px] font-medium text-[#525252] hover:text-black pt-1"
      >
        <span>
          {cuotasPagadas} de {prestamo.num_cuotas} cuotas pagadas · {prestamo.tipo_interes === 'fijo' ? 'Interés fijo' : 'Sobre saldo'} ({prestamo.tasa_interes}%)
        </span>
        {expanded ? (
          <ChevronUp className="w-4 h-4" strokeWidth={2} />
        ) : (
          <ChevronDown className="w-4 h-4" strokeWidth={2} />
        )}
      </button>

      {expanded && (
        <div className="pt-2 border-t border-[#E5E7EB] text-[12px] text-[#525252] grid grid-cols-2 gap-2">
          <div>
            <span>Total pactado: </span>
            <strong className="text-black">{formatMoney(prestamo.total_a_pagar)}</strong>
          </div>
          <div>
            <span>Recaudado: </span>
            <strong className="text-[#15803D]">{formatMoney(prestamo.total_recaudado)}</strong>
          </div>
          <div>
            <span>Primer cobro: </span>
            <strong className="text-black">{formatDate(prestamo.fecha_primer_cobro)}</strong>
          </div>
          <div>
            <span>Última cuota: </span>
            <strong className="text-black">{formatDate(prestamo.fecha_vencimiento_final)}</strong>
          </div>
          {prestamo.notas && (
            <div className="col-span-2 bg-[#F7F8FA] p-2 rounded-[6px] border border-[#E5E7EB]">
              <strong className="text-black">Notas:</strong> {prestamo.notas}
            </div>
          )}
        </div>
      )}

      {actionSlot && <div className="pt-1">{actionSlot}</div>}
    </div>
  );
}
