'use client';

import React, { useState } from 'react';
import { Cliente, Cuota, Prestamo, RegistroPago } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { Phone, MessageCircle, ChevronDown, ChevronUp, FileText } from 'lucide-react';
import { StatusBadge, BadgeVariant } from './StatusBadge';

interface CustomerCardProps {
  cliente: Cliente;
  prestamo: Prestamo;
  cuotaHoy?: Cuota;
  pagadoHoy?: RegistroPago;
  noPagoHoy?: RegistroPago;
  recibosPrestamo: RegistroPago[];
  onCobrar: () => void;
  onVerComprobante: (pago: RegistroPago) => void;
}

export function CustomerCard({
  cliente,
  prestamo,
  cuotaHoy,
  pagadoHoy,
  noPagoHoy,
  recibosPrestamo,
  onCobrar,
  onVerComprobante,
}: CustomerCardProps) {
  const [expanded, setExpanded] = useState(false);

  const valorCuotaProgramada = cuotaHoy ? cuotaHoy.monto_total : prestamo.valor_cuota;
  const montoPagadoEnCuota = cuotaHoy ? cuotaHoy.monto_pagado : 0;
  const faltaCuota = Math.max(0, valorCuotaProgramada - montoPagadoEnCuota);

  const yaPagoCompletoHoy =
    Boolean(pagadoHoy && pagadoHoy.tipo === 'cuota_completa') ||
    (cuotaHoy?.estado === 'pagada');

  const tieneAbono =
    !yaPagoCompletoHoy &&
    (cuotaHoy?.estado === 'parcial' || montoPagadoEnCuota > 0 || pagadoHoy?.tipo === 'abono');

  const marcoNoPagoHoy = !yaPagoCompletoHoy && !tieneAbono && Boolean(noPagoHoy);

  let statusLabel = 'Pendiente';
  let statusVariant: BadgeVariant = 'pending';

  if (yaPagoCompletoHoy) {
    statusLabel = 'Pagado';
    statusVariant = 'success';
  } else if (tieneAbono) {
    statusLabel = 'Abono';
    statusVariant = 'info';
  } else if (marcoNoPagoHoy) {
    statusLabel = 'No pagó';
    statusVariant = 'danger';
  }

  const cuotasVencidasCount = (prestamo.cuotas || []).filter(
    (c) => c.estado === 'atrasada'
  ).length;

  const proximaCuota = (prestamo.cuotas || []).find((c) => c.estado !== 'pagada');

  const cleanPhone = cliente.telefono.replace(/\D/g, '');
  const waHref = `https://wa.me/${cleanPhone.length >= 10 ? `57${cleanPhone}` : cleanPhone}`;

  return (
    <article className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
      {/* Primera línea: Nombre completo + indicador de estado */}
      <div className="flex items-start justify-between gap-2">
        <button
          type="button"
          onClick={() => setExpanded(!expanded)}
          className="text-left flex items-center gap-1.5 min-w-0 flex-1 group"
          aria-expanded={expanded}
        >
          <span className="text-[16px] font-semibold text-black leading-snug truncate group-hover:underline">
            {cliente.nombre_completo}
          </span>
          {expanded ? (
            <ChevronUp className="w-4 h-4 text-[#525252] shrink-0" strokeWidth={2} />
          ) : (
            <ChevronDown className="w-4 h-4 text-[#525252] shrink-0" strokeWidth={2} />
          )}
        </button>

        <StatusBadge label={statusLabel} variant={statusVariant} />
      </div>

      {/* Segunda línea: Dirección / referencia y teléfono opcional */}
      <div className="text-[12px] text-[#525252] space-y-0.5">
        <p className="text-black font-medium">
          {cliente.direccion}
          {cliente.negocio ? ` · ${cliente.negocio}` : ''}
        </p>
        {cliente.telefono && <p>Tel: {cliente.telefono}</p>}
      </div>

      {/* Tercera línea: Cuota de hoy (mayor jerarquía) + Saldo pendiente */}
      <div className="flex items-baseline justify-between gap-2 pt-1 border-t border-[#E5E7EB]">
        <div>
          <span className="text-[12px] font-medium text-[#525252] block">Cuota de hoy</span>
          <span className="text-[22px] font-bold text-black tabular-nums leading-tight">
            {formatMoney(faltaCuota > 0 ? faltaCuota : valorCuotaProgramada)}
          </span>
          {tieneAbono && (
            <p className="text-[12px] font-medium text-[#2563EB] mt-0.5">
              Abonó {formatMoney(montoPagadoEnCuota)} / Falta {formatMoney(faltaCuota)}
            </p>
          )}
          {marcoNoPagoHoy && noPagoHoy?.motivo_no_pago && (
            <p className="text-[12px] font-medium text-[#DC2626] mt-0.5">
              Motivo: {noPagoHoy.motivo_no_pago}
            </p>
          )}
        </div>

        <div className="text-right">
          <span className="text-[12px] text-[#525252] block">Saldo pendiente</span>
          <span className="text-[14px] font-semibold text-[#525252] tabular-nums">
            {formatMoney(prestamo.saldo_pendiente)}
          </span>
        </div>
      </div>

      {/* Cuarta línea: Acciones (60% Cobrar / 18% Llamar / 22% WhatsApp) */}
      {yaPagoCompletoHoy ? (
        <div className="flex items-center gap-2 pt-1">
          <div className="flex-1 h-11 rounded-[6px] bg-[#F0FDF4] border border-[#86EFAC] text-[#15803D] text-[14px] font-semibold flex items-center justify-center">
            PAGADO
          </div>
          {pagadoHoy && (
            <button
              type="button"
              onClick={() => onVerComprobante(pagadoHoy)}
              className="h-11 px-4 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" strokeWidth={2} />
              <span>Comprobante</span>
            </button>
          )}
        </div>
      ) : (
        <div className="flex items-center gap-2 pt-1">
          <button
            type="button"
            onClick={onCobrar}
            className="w-[60%] h-12 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[14px] font-semibold flex items-center justify-center transition-colors"
          >
            COBRAR
          </button>

          <a
            href={`tel:${cleanPhone}`}
            aria-label={`Llamar a ${cliente.nombre_completo}`}
            className="w-[18%] h-12 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[12px] font-medium flex items-center justify-center"
          >
            <Phone className="w-4 h-4" strokeWidth={2} />
          </a>

          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`WhatsApp a ${cliente.nombre_completo}`}
            className="w-[22%] h-12 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[12px] font-medium flex items-center justify-center gap-1"
          >
            <MessageCircle className="w-4 h-4 text-[#15803D]" strokeWidth={2} />
            <span className="hidden xs:inline sm:inline">WA</span>
          </a>
        </div>
      )}

      {/* Información adicional desplegable */}
      {expanded && (
        <div className="pt-3 border-t border-[#E5E7EB] text-[12px] text-[#525252] space-y-2">
          <div className="grid grid-cols-2 gap-2 bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
            <div>
              <span className="block text-[11px]">Número de préstamo</span>
              <span className="font-semibold text-black">{prestamo.codigo}</span>
            </div>
            <div>
              <span className="block text-[11px]">Desembolso</span>
              <span className="font-semibold text-black">{formatDate(prestamo.fecha_desembolso || prestamo.fecha_solicitud)}</span>
            </div>
            <div>
              <span className="block text-[11px]">Capital inicial</span>
              <span className="font-semibold text-black tabular-nums">{formatMoney(prestamo.capital)}</span>
            </div>
            <div>
              <span className="block text-[11px]">Total pactado</span>
              <span className="font-semibold text-black tabular-nums">{formatMoney(prestamo.total_a_pagar)}</span>
            </div>
            <div>
              <span className="block text-[11px]">Cuota pactada</span>
              <span className="font-semibold text-black tabular-nums">{formatMoney(prestamo.valor_cuota)}</span>
            </div>
            <div>
              <span className="block text-[11px]">Próxima fecha</span>
              <span className="font-semibold text-black">
                {proximaCuota ? formatDate(proximaCuota.fecha_vencimiento) : 'Al día'}
              </span>
            </div>
            <div>
              <span className="block text-[11px]">Cuotas vencidas</span>
              <span className={`font-semibold ${cuotasVencidasCount > 0 ? 'text-[#DC2626]' : 'text-black'}`}>
                {cuotasVencidasCount}
              </span>
            </div>
            <div>
              <span className="block text-[11px]">Total recaudado</span>
              <span className="font-semibold text-[#15803D] tabular-nums">{formatMoney(prestamo.total_recaudado)}</span>
            </div>
          </div>

          {recibosPrestamo.length > 0 && (
            <div>
              <p className="font-semibold text-black mb-1">Historial reciente de pagos</p>
              <ul className="space-y-1">
                {recibosPrestamo.slice(0, 3).map((r) => (
                  <li key={r.id} className="flex justify-between items-center py-1 border-b border-[#E5E7EB] last:border-0">
                    <span>
                      {formatDate(r.fecha_pago)} · {r.tipo === 'no_pago' ? `No pagó (${r.motivo_no_pago})` : r.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                    </span>
                    <span className="font-semibold text-black tabular-nums">{formatMoney(r.monto)}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </article>
  );
}
