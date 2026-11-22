'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate, maskDocument } from '@/lib/utils';
import { CheckCircle2, Share2, FileText, ArrowLeft, Printer, X } from 'lucide-react';

export function PaymentReceipt() {
  const { activeReceipt, setActiveReceipt, oficinas, currentUser } = useApp();
  const [showPrintableModal, setShowPrintableModal] = useState(false);

  if (!activeReceipt) return null;

  const { pago, prestamo, cliente } = activeReceipt;
  const oficina = oficinas.find((o) => o.id === prestamo.oficina_id) || oficinas[0];
  const comprobanteNumero = `RC-${pago.id.slice(-6).toUpperCase()}`;

  const tipoLabel =
    pago.tipo === 'cuota_completa'
      ? 'Pago completo de cuota'
      : pago.tipo === 'abono'
      ? 'Abono parcial'
      : 'Registro de no pago';

  const mensajeWhatsApp = [
    `*COMPROBANTE DE PAGO*`,
    `Oficina: ${oficina?.nombre || 'Oficina Central Valledupar'}`,
    `Comprobante: #${comprobanteNumero}`,
    `Movimiento ID: ${pago.id}`,
    `Fecha: ${formatDate(pago.fecha_pago)} ${pago.hora_pago}`,
    `Cliente: ${cliente.nombre_completo}`,
    `Documento: ${maskDocument(cliente.documento)}`,
    `Préstamo: ${prestamo.codigo}`,
    `Operación: ${tipoLabel}`,
    `Método: ${pago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}`,
    `Valor recibido: ${formatMoney(pago.monto)}`,
    `Saldo pendiente: ${formatMoney(pago.saldo_restante_despues)}`,
    pago.proxima_fecha_pago ? `Próxima fecha: ${formatDate(pago.proxima_fecha_pago)}` : '',
    `Cobrador: ${prestamo.cobrador_nombre || currentUser.nombre_completo}`,
  ]
    .filter(Boolean)
    .join('\n');

  const handleShareWhatsApp = () => {
    const cleanPhone = cliente.telefono.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `57${cleanPhone}` : '';
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4">
      <div
        role="dialog"
        aria-modal="true"
        className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-md w-full max-h-[92vh] flex flex-col overflow-hidden"
      >
        {/* Cabecera limpia */}
        <div className="px-5 py-4 bg-[#F0FDF4] border-b border-[#86EFAC] flex items-center gap-3">
          <CheckCircle2 className="w-6 h-6 text-[#15803D] shrink-0" strokeWidth={2} />
          <div>
            <h2 className="text-[16px] font-semibold text-black">Pago registrado correctamente</h2>
            <p className="text-[12px] text-[#525252]">Comprobante #{comprobanteNumero}</p>
          </div>
        </div>

        {/* Detalle del comprobante */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3 text-[13px]">
          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[8px] p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-[#525252]">Oficina:</span>
              <span className="font-semibold text-black">{oficina?.nombre || 'Oficina Central Valledupar'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Número de comprobante:</span>
              <span className="font-semibold text-black">#{comprobanteNumero}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Cliente:</span>
              <span className="font-semibold text-black">{cliente.nombre_completo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Identificación:</span>
              <span className="font-medium text-black">{maskDocument(cliente.documento)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Fecha y hora:</span>
              <span className="font-medium text-black">{formatDate(pago.fecha_pago)} · {pago.hora_pago}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Cobrador:</span>
              <span className="font-medium text-black">{prestamo.cobrador_nombre || currentUser.nombre_completo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Préstamo:</span>
              <span className="font-semibold text-black">{prestamo.codigo}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Tipo de operación:</span>
              <span className="font-medium text-black">{tipoLabel}</span>
            </div>

            <div className="pt-2 mt-2 border-t border-[#D1D5DB] flex justify-between items-baseline">
              <span className="font-semibold text-black">Valor recibido:</span>
              <span className="text-[22px] font-bold text-[#15803D] tabular-nums">
                {formatMoney(pago.monto)}
              </span>
            </div>

            <div className="flex justify-between">
              <span className="text-[#525252]">Saldo pendiente:</span>
              <span className="font-bold text-black tabular-nums">
                {formatMoney(pago.saldo_restante_despues)}
              </span>
            </div>

            {pago.proxima_fecha_pago && (
              <div className="flex justify-between">
                <span className="text-[#525252]">Próxima fecha de pago:</span>
                <span className="font-medium text-black">{formatDate(pago.proxima_fecha_pago)}</span>
              </div>
            )}

            <div className="pt-2 border-t border-[#E5E7EB] text-[11px] text-[#8A8A8A]">
              ID movimiento: <span className="font-mono">{pago.id}</span>
            </div>
          </div>
        </div>

        {/* Botones */}
        <div className="p-4 bg-[#F7F8FA] border-t border-[#E5E7EB] space-y-2">
          <button
            type="button"
            onClick={handleShareWhatsApp}
            className="w-full h-12 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" strokeWidth={2} />
            <span>COMPARTIR POR WHATSAPP</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setShowPrintableModal(true)}
              className="h-11 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <FileText className="w-4 h-4" strokeWidth={2} />
              <span>VER COMPROBANTE</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveReceipt(null)}
              className="h-11 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[13px] font-medium flex items-center justify-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>VOLVER A COBROS</span>
            </button>
          </div>
        </div>
      </div>

      {/* Vista imprimible del comprobante */}
      {showPrintableModal && (
        <div className="fixed inset-0 z-[70] bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-xs w-full p-5 space-y-4">
            <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
              <span className="text-[14px] font-semibold text-black">Vista imprimible</span>
              <button
                type="button"
                onClick={() => setShowPrintableModal(false)}
                className="text-[#525252] hover:text-black"
              >
                <X className="w-5 h-5" strokeWidth={2} />
              </button>
            </div>
            <div className="font-mono text-[12px] text-black space-y-1.5 border border-[#D1D5DB] p-3 rounded-[6px] bg-white">
              <p className="text-center font-bold uppercase">{oficina?.nombre}</p>
              <p className="text-center text-[11px] text-[#525252]">Valledupar, Cesar · Tel: {oficina?.telefono}</p>
              <hr className="border-dashed border-[#9CA3AF] my-1.5" />
              <p>Comprobante: #{comprobanteNumero}</p>
              <p>Fecha: {formatDate(pago.fecha_pago)} {pago.hora_pago}</p>
              <p>Cliente: {cliente.nombre_completo}</p>
              <p>Doc: {maskDocument(cliente.documento)}</p>
              <p>Préstamo: {prestamo.codigo}</p>
              <hr className="border-dashed border-[#9CA3AF] my-1.5" />
              <p className="text-center font-bold text-[15px]">RECIBIDO: {formatMoney(pago.monto)}</p>
              <p className="text-center text-[11px]">({pago.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'})</p>
              <hr className="border-dashed border-[#9CA3AF] my-1.5" />
              <p className="font-bold">SALDO PENDIENTE: {formatMoney(pago.saldo_restante_despues)}</p>
              <p className="text-[10px] text-[#525252] pt-1">Cobrador: {prestamo.cobrador_nombre || currentUser.nombre_completo}</p>
            </div>
            <button
              type="button"
              onClick={handlePrint}
              className="w-full h-11 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
            >
              <Printer className="w-4 h-4" strokeWidth={2} />
              <span>Imprimir / Guardar PDF</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
