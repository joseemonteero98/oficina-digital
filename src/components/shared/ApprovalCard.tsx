'use client';

import React from 'react';
import { Prestamo, Cliente } from '@/types';
import { formatMoney, formatDate, getFrecuenciaLabel } from '@/lib/utils';
import { AlertTriangle, ChevronRight } from 'lucide-react';
import { StatusBadge } from './StatusBadge';

interface ApprovalCardProps {
  prestamo: Prestamo;
  cliente?: Cliente;
  warnings: string[];
  onInspect: () => void;
}

export function ApprovalCard({ prestamo, cliente, warnings, onInspect }: ApprovalCardProps) {
  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[12px] font-semibold text-[#525252]">{prestamo.codigo}</span>
            <span className="text-[12px] text-[#8A8A8A]">·</span>
            <span className="text-[12px] text-[#525252]">Sol. {formatDate(prestamo.fecha_solicitud)}</span>
          </div>
          <h4 className="text-[16px] font-semibold text-black truncate mt-0.5">
            {cliente?.nombre_completo || 'Cliente'}
          </h4>
          <p className="text-[12px] text-[#525252]">
            Doc: {cliente?.documento || '-'} · Tel: {cliente?.telefono || '-'}
          </p>
          <p className="text-[12px] text-[#525252]">
            Cobrador: <strong className="text-black">{prestamo.cobrador_nombre || 'Asignado'}</strong>
          </p>
        </div>

        <div className="text-right shrink-0">
          <StatusBadge label="Pendiente" variant="pending" />
          <p className="text-[20px] font-bold text-black tabular-nums mt-1">
            {formatMoney(prestamo.capital)}
          </p>
        </div>
      </div>

      {/* Condiciones clave */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-2.5 text-[12px]">
        <div>
          <span className="text-[#525252] block">Tipo de interés</span>
          <strong className="text-black">
            {prestamo.tipo_interes === 'fijo' ? 'Fijo' : 'Sobre saldo'} ({prestamo.tasa_interes}%)
          </strong>
        </div>
        <div>
          <span className="text-[#525252] block">Frecuencia</span>
          <strong className="text-black">{getFrecuenciaLabel(prestamo.frecuencia)}</strong>
        </div>
        <div>
          <span className="text-[#525252] block">Cuotas</span>
          <strong className="text-black tabular-nums">
            {prestamo.num_cuotas} x {formatMoney(prestamo.valor_cuota)}
          </strong>
        </div>
        <div>
          <span className="text-[#525252] block">Total a pagar</span>
          <strong className="text-black tabular-nums">{formatMoney(prestamo.total_a_pagar)}</strong>
        </div>
      </div>

      {/* Advertencias automáticas de riesgo */}
      {warnings.length > 0 && (
        <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-[6px] p-2.5 space-y-1">
          {warnings.map((w, i) => (
            <p key={i} className="text-[12px] font-medium text-[#D97706] flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 shrink-0" strokeWidth={2} />
              <span>{w}</span>
            </p>
          ))}
        </div>
      )}

      <button
        type="button"
        onClick={onInspect}
        className="w-full h-11 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-1.5"
      >
        <span>Revisar y decidir</span>
        <ChevronRight className="w-4 h-4" strokeWidth={2} />
      </button>
    </div>
  );
}
