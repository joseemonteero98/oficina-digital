'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { formatMoney, formatDate } from '@/lib/utils';
import { X, Share2, Copy, Check, Printer, MessageSquare } from 'lucide-react';

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
    // Si el cliente tiene teléfono, intentamos enviarlo directo
    const cleanPhone = cliente.telefono.replace(/\D/g, '');
    const phoneParam = cleanPhone.length >= 10 ? `57${cleanPhone}` : '';
    const url = `https://wa.me/${phoneParam}?text=${encodeURIComponent(mensajeWhatsApp)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        
        {/* Cabecera del modal */}
        <div className="px-4 py-3 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Printer className="w-4 h-4 text-emerald-400" />
            <h3 className="font-bold text-sm text-white">Comprobante Digital</h3>
          </div>
          <button
            onClick={() => setActiveReceipt(null)}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tícket estilo papel térmico */}
        <div className="p-4 overflow-y-auto flex-1">
          <div className="bg-amber-50 text-slate-900 rounded-xl p-4 font-mono text-xs shadow-inner border border-amber-200">
            <div className="text-center pb-3 border-b border-dashed border-slate-400">
              <p className="font-extrabold text-sm uppercase tracking-wider">{oficina.nombre}</p>
              <p className="text-[10px] text-slate-600">Tel: {oficina.telefono} • {oficina.ciudad}</p>
              <p className="text-[10px] text-slate-500 mt-1">RECIBO DE CAJA ELECTRÓNICO</p>
              <p className="font-bold text-xs mt-0.5">#{pago.id.slice(-6).toUpperCase()}</p>
            </div>

            <div className="py-2.5 space-y-1 border-b border-dashed border-slate-400 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Fecha:</span>
                <span className="font-semibold">{formatDate(pago.fecha_pago)} {pago.hora_pago}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Cliente:</span>
                <span className="font-bold">{cliente.nombre_completo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Doc:</span>
                <span>{cliente.documento}</span>
              </div>
              {cliente.negocio && (
                <div className="flex justify-between">
                  <span className="text-slate-600">Negocio:</span>
                  <span className="truncate max-w-[150px]">{cliente.negocio}</span>
                </div>
              )}
            </div>

            <div className="py-3 border-b border-dashed border-slate-400 text-center">
              <span className="text-[10px] text-slate-600 uppercase tracking-wider block">
                {pago.tipo === 'no_pago' ? 'REGISTRO DE NO PAGO' : 'MONTO ABONADO'}
              </span>
              <p className="text-xl font-black text-slate-950 mt-0.5">
                {formatMoney(pago.monto)}
              </p>
              {pago.tipo === 'no_pago' && (
                <p className="text-[11px] text-rose-700 font-semibold mt-1">
                  Motivo: {pago.motivo_no_pago}
                </p>
              )}
            </div>

            <div className="py-2.5 space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-600">Préstamo N°:</span>
                <span className="font-bold">{prestamo.codigo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total a Pagar:</span>
                <span>{formatMoney(prestamo.total_a_pagar)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-600">Total Recaudado:</span>
                <span>{formatMoney(prestamo.total_recaudado)}</span>
              </div>
              <div className="flex justify-between pt-1 border-t border-slate-300 font-extrabold text-xs">
                <span>SALDO RESTANTE:</span>
                <span className="text-emerald-800">{formatMoney(prestamo.saldo_pendiente)}</span>
              </div>
            </div>

            <div className="text-center pt-2 text-[9px] text-slate-500 border-t border-dashed border-slate-400">
              <p>Atendido por: Brayan Martínez</p>
              <p className="mt-0.5">Conserve este comprobante como soporte de pago.</p>
            </div>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="p-3 bg-slate-800/80 border-t border-slate-700/80 grid grid-cols-2 gap-2">
          <button
            onClick={handleWhatsApp}
            className="flex items-center justify-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2.5 px-3 rounded-xl text-xs transition-colors shadow-lg shadow-emerald-950"
          >
            <MessageSquare className="w-4 h-4" />
            Enviar WhatsApp
          </button>
          
          <button
            onClick={handleCopy}
            className="flex items-center justify-center gap-1.5 bg-slate-700 hover:bg-slate-600 text-slate-100 font-semibold py-2.5 px-3 rounded-xl text-xs transition-colors"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            {copied ? '¡Copiado!' : 'Copiar Texto'}
          </button>
        </div>

      </div>
    </div>
  );
}
