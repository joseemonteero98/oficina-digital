'use client';

import React from 'react';
import { Usuario } from '@/types';
import { formatMoney } from '@/lib/utils';
import { StatusBadge, BadgeVariant } from './StatusBadge';
import { ChevronRight } from 'lucide-react';

export interface CollectorSummaryData {
  usuario: Usuario;
  rutasLabel: string;
  estadoJornada: 'En ruta' | 'Sin actividad' | 'En cierre' | 'Cerrado';
  clientesProgramados: number;
  clientesCobrados: number;
  recaudoAcumulado: number;
  desembolsosRealizados: number;
  ultimaActividad: string;
}

interface CollectorStatusCardProps {
  data: CollectorSummaryData;
  onSelect: () => void;
}

export function CollectorStatusCard({ data, onSelect }: CollectorStatusCardProps) {
  const variantByStatus: Record<string, BadgeVariant> = {
    'En ruta': 'info',
    'Sin actividad': 'neutral',
    'En cierre': 'pending',
    'Cerrado': 'success',
  };

  const porcentaje =
    data.clientesProgramados > 0
      ? Math.round((data.clientesCobrados / data.clientesProgramados) * 100)
      : 0;

  return (
    <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h4 className="text-[16px] font-semibold text-black truncate">
            {data.usuario.nombre_completo}
          </h4>
          <p className="text-[12px] text-[#525252] truncate">{data.rutasLabel}</p>
        </div>
        <StatusBadge
          label={data.estadoJornada}
          variant={variantByStatus[data.estadoJornada] || 'neutral'}
        />
      </div>

      {/* Progreso de cobro */}
      <div className="space-y-1">
        <div className="flex justify-between text-[12px]">
          <span className="text-[#525252]">Progreso de ruta</span>
          <span className="font-semibold text-black">
            {data.clientesCobrados} de {data.clientesProgramados} clientes cobrados ({porcentaje}%)
          </span>
        </div>
        <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
          <div
            className="h-full bg-[#15803D] transition-all"
            style={{ width: `${Math.min(100, porcentaje)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-2.5 text-[12px]">
        <div>
          <span className="text-[#525252] block">Recaudo acumulado</span>
          <strong className="text-[15px] text-[#15803D] tabular-nums">
            {formatMoney(data.recaudoAcumulado)}
          </strong>
        </div>
        <div>
          <span className="text-[#525252] block">Desembolsos</span>
          <strong className="text-[15px] text-black tabular-nums">
            {formatMoney(data.desembolsosRealizados)}
          </strong>
        </div>
      </div>

      <div className="flex items-center justify-between pt-1">
        <span className="text-[12px] text-[#525252]">Última actividad: {data.ultimaActividad}</span>
        <button
          type="button"
          onClick={onSelect}
          className="h-9 px-3 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-[#2563EB] border border-[#D1D5DB] text-[12px] font-semibold flex items-center gap-1"
        >
          <span>Ver detalle</span>
          <ChevronRight className="w-3.5 h-3.5" strokeWidth={2} />
        </button>
      </div>
    </div>
  );
}
