'use client';

import React, { useState } from 'react';
import { useApp } from '@/lib/store';
import { GastoCalle } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { Loader2, Upload } from 'lucide-react';
import { EmptyState } from './EmptyState';

export function ExpenseForm() {
  const { cierreCaja, registrarGastoCaja, showToast } = useApp();

  const [tipo, setTipo] = useState<GastoCalle['tipo']>('Gasolina');
  const [valor, setValor] = useState<string>('');
  const [descripcion, setDescripcion] = useState<string>('');
  const [soporteNombre, setSoporteNombre] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLocked = cierreCaja.estado === 'pendiente_revision' || cierreCaja.estado === 'aprobado';
  const gastos = cierreCaja.gastos_detalle || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const monto = Number(valor);
    if (!descripcion.trim() || !monto || monto <= 0) {
      showToast('error', 'Ingresa una descripción y un valor mayor a cero.');
      return;
    }

    setIsSubmitting(true);
    try {
      await registrarGastoCaja({
        tipo,
        concepto: descripcion.trim(),
        monto,
        soporte_nombre: soporteNombre || undefined,
      });
      setValor('');
      setDescripcion('');
      setSoporteNombre('');
    } catch {
      // handled by store toast
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
        <div>
          <h2 className="text-[18px] font-semibold text-black">Registrar gasto de calle</h2>
          <p className="text-[12px] text-[#525252]">
            Se asocia automáticamente a tu oficina y arqueo de hoy.
          </p>
        </div>

        {isLocked ? (
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-[6px] p-3 text-[13px] text-[#D97706]">
            La caja del día ya fue enviada a revisión; no puedes agregar gastos adicionales hoy.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="gasto-tipo" className="block text-[12px] font-medium text-[#525252] mb-1">
                  Tipo de gasto
                </label>
                <select
                  id="gasto-tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value as GastoCalle['tipo'])}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                >
                  <option value="Gasolina">Gasolina</option>
                  <option value="Transporte">Transporte</option>
                  <option value="Alimentación">Alimentación</option>
                  <option value="Otros">Otros</option>
                </select>
              </div>

              <div>
                <label htmlFor="gasto-valor" className="block text-[12px] font-medium text-[#525252] mb-1">
                  Valor ($)
                </label>
                <input
                  id="gasto-valor"
                  type="number"
                  inputMode="numeric"
                  min={500}
                  step={500}
                  value={valor}
                  onChange={(e) => setValor(e.target.value)}
                  placeholder="15000"
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] font-semibold text-black tabular-nums"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="gasto-desc" className="block text-[12px] font-medium text-[#525252] mb-1">
                Descripción
              </label>
              <input
                id="gasto-desc"
                type="text"
                value={descripcion}
                onChange={(e) => setDescripcion(e.target.value)}
                placeholder="Ej. Tanqueo moto ruta La Nevada"
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                required
              />
            </div>

            <div>
              <label htmlFor="gasto-soporte" className="block text-[12px] font-medium text-[#525252] mb-1">
                Foto del soporte (opcional)
              </label>
              <label
                htmlFor="gasto-soporte"
                className="h-11 px-3 bg-[#F7F8FA] border border-[#D1D5DB] rounded-[6px] flex items-center gap-2 text-[13px] text-[#525252] cursor-pointer hover:bg-[#E5E7EB]/50"
              >
                <Upload className="w-4 h-4" strokeWidth={2} />
                <span className="truncate">{soporteNombre || 'Adjuntar foto de recibo (opcional)'}</span>
                <input
                  id="gasto-soporte"
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) setSoporteNombre(file.name);
                  }}
                />
              </label>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              <span>REGISTRAR GASTO</span>
            </button>
          </form>
        )}
      </div>

      {/* Listado de gastos del día */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-[14px] font-semibold text-black">Gastos de la jornada</h3>
          <span className="text-[14px] font-bold text-[#DC2626] tabular-nums">
            Total: {formatMoney(cierreCaja.total_gastos)}
          </span>
        </div>

        {gastos.length === 0 ? (
          <EmptyState title="No tienes gastos registrados hoy." />
        ) : (
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] divide-y divide-[#E5E7EB]">
            {gastos.map((g) => (
              <div key={g.id} className="p-3.5 flex items-center justify-between gap-2 text-[13px]">
                <div>
                  <p className="font-semibold text-black">
                    {g.tipo} · {g.concepto}
                  </p>
                  <p className="text-[12px] text-[#525252]">
                    {formatDate(g.fecha)} · {g.hora}
                    {g.soporte_nombre ? ` · Soporte: ${g.soporte_nombre}` : ''}
                  </p>
                </div>
                <span className="font-bold text-[#DC2626] tabular-nums">-{formatMoney(g.monto)}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
