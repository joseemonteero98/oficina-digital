'use client';

import React, { useState } from 'react';
import { SimulacionPrestamo } from '@/types';
import { formatMoney, formatDate, getFrecuenciaLabel } from '@/lib/utils';
import { LoadingState } from './LoadingState';
import { ErrorState } from './ErrorState';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface LoanSimulatorProps {
  simulacion: SimulacionPrestamo | null;
  isLoading: boolean;
  error: string | null;
  onRetry?: () => void;
}

export function LoanSimulator({
  simulacion,
  isLoading,
  error,
  onRetry,
}: LoanSimulatorProps) {
  const [expandAll, setExpandAll] = useState(false);

  if (isLoading) {
    return <LoadingState message="Calculando simulación con el servidor..." />;
  }

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (!simulacion) {
    return null;
  }

  const cuotasVisibles = expandAll
    ? simulacion.cuotas_simuladas
    : simulacion.cuotas_simuladas.slice(0, 3);

  return (
    <div className="space-y-4">
      {/* Panel de resultados del backend */}
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
        <h3 className="text-[14px] font-semibold text-black border-b border-[#E5E7EB] pb-2">
          Simulación oficial de cuotas
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3">
            <span className="text-[11px] font-medium text-[#525252] uppercase block">
              Monto solicitado
            </span>
            <span className="text-[16px] font-bold text-black tabular-nums mt-0.5 block">
              {formatMoney(simulacion.capital)}
            </span>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3">
            <span className="text-[11px] font-medium text-[#525252] uppercase block">
              Interés total
            </span>
            <span className="text-[16px] font-bold text-black tabular-nums mt-0.5 block">
              {formatMoney(simulacion.total_interes)}
            </span>
          </div>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3">
            <span className="text-[11px] font-medium text-[#525252] uppercase block">
              Total a pagar
            </span>
            <span className="text-[16px] font-bold text-black tabular-nums mt-0.5 block">
              {formatMoney(simulacion.total_a_pagar)}
            </span>
          </div>

          <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-[6px] p-3">
            <span className="text-[11px] font-semibold text-[#2563EB] uppercase block">
              Valor de cada cuota
            </span>
            <span className="text-[18px] font-bold text-black tabular-nums mt-0.5 block">
              {formatMoney(simulacion.valor_cuota)}
            </span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-2.5">
            <span className="text-[11px] text-[#525252] block">Número de cuotas</span>
            <span className="text-[14px] font-semibold text-black">{simulacion.num_cuotas}</span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-2.5">
            <span className="text-[11px] text-[#525252] block">Frecuencia</span>
            <span className="text-[14px] font-semibold text-black">
              {getFrecuenciaLabel(simulacion.frecuencia)}
            </span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-2.5">
            <span className="text-[11px] text-[#525252] block">Fecha primer pago</span>
            <span className="text-[14px] font-semibold text-black">
              {formatDate(simulacion.fecha_primer_pago)}
            </span>
          </div>

          <div className="bg-white border border-[#E5E7EB] rounded-[6px] p-2.5">
            <span className="text-[11px] text-[#525252] block">Fecha último pago</span>
            <span className="text-[14px] font-semibold text-black">
              {formatDate(simulacion.fecha_ultimo_pago)}
            </span>
          </div>
        </div>

        {simulacion.diferencia_redondeo !== 0 && (
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-[6px] p-2.5 text-[12px] text-[#D97706]">
            Ajuste por redondeo de {formatMoney(simulacion.diferencia_redondeo)} aplicado en la última cuota para cuadrar exactamente {formatMoney(simulacion.total_a_pagar)}.
          </div>
        )}
      </div>

      {/* Tabla compacta del calendario */}
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] overflow-hidden">
        <div className="px-4 py-2.5 bg-[#F7F8FA] border-b border-[#E5E7EB] flex items-center justify-between">
          <span className="text-[13px] font-semibold text-black">
            Calendario de pagos ({simulacion.cuotas_simuladas.length} cuotas)
          </span>
          {simulacion.cuotas_simuladas.length > 3 && (
            <button
              type="button"
              onClick={() => setExpandAll(!expandAll)}
              className="text-[12px] font-semibold text-[#2563EB] flex items-center gap-1"
            >
              <span>{expandAll ? 'Contraer' : 'Ver calendario completo'}</span>
              {expandAll ? (
                <ChevronUp className="w-4 h-4" strokeWidth={2} />
              ) : (
                <ChevronDown className="w-4 h-4" strokeWidth={2} />
              )}
            </button>
          )}
        </div>

        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-[#E5E7EB] text-[#525252]">
              <th className="px-4 py-2 font-medium">Cuota</th>
              <th className="px-4 py-2 font-medium">Fecha</th>
              <th className="px-4 py-2 font-medium text-right">Valor</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#E5E7EB] text-black">
            {cuotasVisibles.map((c) => (
              <tr key={c.numero}>
                <td className="px-4 py-2 font-semibold">{c.numero}</td>
                <td className="px-4 py-2">{formatDate(c.fecha)}</td>
                <td className="px-4 py-2 text-right font-semibold tabular-nums">
                  {formatMoney(c.monto_total)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
