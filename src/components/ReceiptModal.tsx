'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate } from '@/lib/utils';
import { X, Copy, Check, Printer, MessageSquare } from 'lucide-react';

export function ReceiptModal() {
  const { activeReceipt, setActiveReceipt, oficinas } = useApp();
  const [copied, setCopied] = useState(false);

  if (!activeReceipt) return null;

  const { pago, prestamo, cliente } = activeReceipt;
  const oficina = oficinas.find((o) => o.id === prestamo.oficina_id) || oficinas[0];

  // Texto para WhatsApp
  const mensajeWhatsApp = `*COMPROBANTE DE PAGO*
━━━━━━━━━━━━━━━━━━━━
🏢 *${oficina.nombre}*
📍 Valledupar, Cesar
📅 Fecha: ${formatDate(pago.fecha_pago)} - ${pago.hora_pago}
🧾 Recibo N°: #${pago.id.slice(-6).toUpperCase()}
━━━━━━━━━━━━━━━━━━━━
👤 *Cliente:* ${cliente.nombre_completo}
🆔 *Doc:* ${cliente.documento}
🏷️ *Negocio:* ${cliente.negocio || cliente.direccion}

💰 *VALOR RECIBIDO: ${formatMoney(pago.monto)}*
${pago.tipo === 'no_pago' ? `⚠️ Motivo no pago: ${pago.motivo_no_pago}` : ''}

📊 *ESTADO DEL PRÉSTAMO (${prestamo.codigo}):*
• Total a pagar: ${formatMoney(prestamo.total_a_pagar)}
• Total recaudado: ${formatMoney(prestamo.total_recaudado)}
• *SALDO PENDIENTE:* *${formatMoney(prestamo.saldo_pendiente)}*

🛵 Cobrador: Brayan Martínez
¡Gracias por su puntual cumplimiento!
━━━━━━━━━━━━━━━━━━━━`;

  const handleCopy = () => {
    navigator.clipboard.writeText(mensajeWhatsApp);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsApp = () => {
    const cleanPhone = cliente.telefono.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `57${cleanPhone}` : '';
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-gray-300 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabecera */}
        <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-700" />
            <h3 className="font-black text-sm text-black">Comprobante de Pago</h3>
          </div>
          <button
            onClick={() => setActiveReceipt(null)}
            className="text-gray-500 hover:text-black p-1 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tícket térmico limpio */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-amber-50/70 text-black rounded-xl p-4 font-mono text-xs border border-gray-300 space-y-2">
            <div className="text-center pb-3 border-b border-dashed border-gray-400">
              <p className="font-black text-sm uppercase tracking-wider">{oficina.nombre}</p>
              <p className="text-[10px] text-gray-700 font-bold">Valledupar, Cesar • Tel: {oficina.telefono}</p>
              <p className="text-[10px] text-gray-600 mt-1">RECIBO DE CAJA ELECTRÓNICO</p>
              <p className="font-black text-xs mt-0.5">#{pago.id.slice(-6).toUpperCase()}</p>
            </div>

            <div className="py-2 space-y-1 border-b border-dashed border-gray-400 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha:</span>
                <span className="font-bold">{formatDate(pago.fecha_pago)} {pago.hora_pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="font-black">{cliente.nombre_completo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Doc:</span>
                <span className="font-bold">{cliente.documento}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Ubicación:</span>
                <span className="font-bold truncate max-w-[150px]">{cliente.direccion}</span>
              </div>
            </div>

            <div className="py-2.5 border-b border-dashed border-gray-400 text-center">
              <span className="text-[10px] font-bold text-gray-700 uppercase tracking-wider block">
                {pago.tipo === 'no_pago' ? 'REGISTRO DE NO PAGO' : 'MONTO RECIBIDO'}
              </span>
              <p className="text-2xl font-black text-black mt-0.5 tabular-nums">
                {formatMoney(pago.monto)}
              </p>
              {pago.tipo === 'no_pago' && (
                <p className="text-[11px] text-rose-700 font-bold mt-1">
                  Motivo: {pago.motivo_no_pago}
                </p>
              )}
            </div>

            <div className="py-2 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-gray-600">Préstamo N°:</span>
                <span className="font-black">{prestamo.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total a Pagar:</span>
                <span className="font-bold">{formatMoney(prestamo.total_a_pagar)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Total Recaudado:</span>
                <span className="font-bold">{formatMoney(prestamo.total_recaudado)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-gray-300 font-black text-xs">
                <span>SALDO RESTANTE:</span>
                <span className="text-black text-sm">{formatMoney(prestamo.saldo_pendiente)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[9px] text-gray-600 border-t border-dashed border-gray-400">
              <p className="font-bold">Atendido por: Brayan Martínez</p>
              <p className="mt-0.5">Conserve este comprobante como soporte de pago.</p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-3 bg-gray-50 border-t border-gray-200 grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 px-3 rounded-xl text-xs transition-colors shadow-xs"
          >
            <MessageSquare className="w-4 h-4" />
            Enviar WhatsApp
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 bg-gray-200 hover:bg-gray-300 text-black font-bold py-3 px-3 rounded-xl text-xs transition-colors border border-gray-300"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-700" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar Texto'}
          </button>
        </div>

      </div>
    </div>
  );
}
