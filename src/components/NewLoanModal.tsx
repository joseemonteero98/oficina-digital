'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { FrecuenciaPago, TipoInteres } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { simularPrestamo } from '@/lib/calculations';
import { getTodayString } from '@/lib/initialData';
import { X, Calculator, Check } from 'lucide-react';

interface NewLoanModalProps {
  onClose: () => void;
}

export function NewLoanModal({ onClose }: NewLoanModalProps) {
  const { clientes, crearCliente, crearSolicitudPrestamo, selectedOficinaId, rutas, currentUser } = useApp();

  const [clienteId, setClienteId] = useState<string>(clientes[0]?.id || '');
  const [modoCrearCliente, setModoCrearCliente] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoDoc, setNuevoDoc] = useState<string>('');
  const [nuevoTel, setNuevoTel] = useState<string>('');
  const [nuevaDir, setNuevaDir] = useState<string>('');
  const [nuevoNegocio, setNuevoNegocio] = useState<string>('');

  const [capital, setCapital] = useState<number>(500000);
  const [tipoInteres, setTipoInteres] = useState<TipoInteres>('fijo');
  const [tasaInteres, setTasaInteres] = useState<number>(20);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPago>('diario');
  const [numCuotas, setNumCuotas] = useState<number>(24);
  const [excluirDomingos, setExcluirDomingos] = useState<boolean>(true);
  const [fechaPrimerCobro, setFechaPrimerCobro] = useState<string>('2026-02-15');
  const [notas, setNotas] = useState<string>('');
  const [verTablaAmortizacion, setVerTablaAmortizacion] = useState<boolean>(false);

  React.useEffect(() => {
    setFechaPrimerCobro(getTodayString());
  }, []);

  const simulacion = useMemo(() => {
    return simularPrestamo({
      capital: Number(capital) || 0,
      tasa_interes: Number(tasaInteres) || 0,
      tipo_interes: tipoInteres,
      num_cuotas: Number(numCuotas) || 1,
      frecuencia,
      excluir_domingos: excluirDomingos,
      fecha_primer_cobro: fechaPrimerCobro,
    });
  }, [capital, tasaInteres, tipoInteres, numCuotas, frecuencia, excluirDomingos, fechaPrimerCobro]);

  const handleCrearNuevoCliente = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre || !nuevoDoc || !nuevoTel || !nuevaDir) {
      alert('Por favor completa todos los campos del cliente');
      return;
    }
    const creado = await crearCliente({
      oficina_id: selectedOficinaId === 'todas' ? 'ofi-1' : selectedOficinaId,
      ruta_id: rutas[0]?.id || 'ruta-1',
      cobrador_id: currentUser.id,
      nombre_completo: nuevoNombre,
      documento: nuevoDoc,
      telefono: nuevoTel,
      direccion: nuevaDir,
      negocio: nuevoNegocio || undefined,
      activo: true,
    });
    setClienteId(creado.id);
    setModoCrearCliente(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clienteId) {
      alert('Selecciona un cliente para el préstamo');
      return;
    }
    if (capital <= 0) {
      alert('Ingresa un monto de capital válido');
      return;
    }

    try {
      await crearSolicitudPrestamo({
        cliente_id: clienteId,
        capital,
        tasa_interes: tasaInteres,
        tipo_interes: tipoInteres,
        frecuencia,
        num_cuotas: numCuotas,
        excluir_domingos: excluirDomingos,
        fecha_primer_cobro: fechaPrimerCobro,
        notas,
      });

      alert('¡Solicitud de préstamo enviada exitosamente al Supervisor en Valledupar!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear solicitud');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-150">
      <div className="bg-white border-2 border-gray-300 rounded-t-3xl sm:rounded-2xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-4 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-700" />
            <div>
              <h3 className="font-black text-base text-black">Nuevo Préstamo en Valledupar</h3>
              <p className="text-[11px] font-semibold text-gray-500">Pasa a la Oficina para autorización del Supervisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-black p-1 rounded-lg hover:bg-gray-200"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-4 flex-1">

          {/* SECCIÓN 1: CLIENTE */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-300 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black uppercase tracking-wider text-black">
                1. Cliente Solicitante
              </label>
              <button
                type="button"
                onClick={() => setModoCrearCliente(!modoCrearCliente)}
                className="text-xs text-emerald-800 hover:text-emerald-950 font-black"
              >
                {modoCrearCliente ? 'Volver a Seleccionar' : '+ Registrar Nuevo Cliente'}
              </button>
            </div>

            {modoCrearCliente ? (
              <div className="space-y-2.5 pt-1">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Nombre Completo *"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-black"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Cédula / Documento *"
                    value={nuevoDoc}
                    onChange={(e) => setNuevoDoc(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-black"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Celular / WhatsApp *"
                    value={nuevoTel}
                    onChange={(e) => setNuevoTel(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-black"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Negocio (ej. Tienda, Taller...)"
                    value={nuevoNegocio}
                    onChange={(e) => setNuevoNegocio(e.target.value)}
                    className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-black"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Dirección en Valledupar (ej. Calle 6 # 42-15, La Nevada) *"
                  value={nuevaDir}
                  onChange={(e) => setNuevaDir(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-bold text-black"
                  required
                />
                <button
                  type="button"
                  onClick={handleCrearNuevoCliente}
                  className="w-full bg-black hover:bg-gray-800 text-white font-black text-xs py-2.5 rounded-lg"
                >
                  Guardar Cliente y Continuar
                </button>
              </div>
            ) : (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full bg-white border-2 border-gray-300 rounded-xl p-2.5 text-xs font-black text-black"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo} ({c.documento}) {c.negocio ? `— ${c.negocio}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SECCIÓN 2: CAPITAL Y MODALIDAD */}
          <div className="bg-gray-50 p-4 rounded-xl border border-gray-300 space-y-3">
            <label className="text-xs font-black uppercase tracking-wider text-black block">
              2. Monto y Modalidad
            </label>

            <div>
              <div className="flex justify-between text-xs font-bold text-gray-700 mb-1">
                <span>Capital a Prestar:</span>
                <span className="font-black text-black text-sm">{formatMoney(capital)}</span>
              </div>
              <input
                type="number"
                step="50000"
                min="50000"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full bg-white border-2 border-gray-300 rounded-xl px-3 py-2.5 text-base font-black text-black focus:outline-none focus:border-black"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[300000, 500000, 1000000, 2000000].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => setCapital(monto)}
                    className="text-xs font-bold bg-white hover:bg-gray-100 text-black py-1.5 rounded-lg border border-gray-300"
                  >
                    {formatMoney(monto)}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={() => setTipoInteres('fijo')}
                className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all ${
                  tipoInteres === 'fijo'
                    ? 'bg-emerald-50 border-emerald-600 text-black font-black'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <span className="block font-black">Interés Fijo Simple</span>
                <span className="text-[10px] text-gray-600 block mt-0.5">
                  Estándar Paga Diario
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTipoInteres('sobre_saldo')}
                className={`p-2.5 rounded-xl border-2 text-left text-xs transition-all ${
                  tipoInteres === 'sobre_saldo'
                    ? 'bg-blue-50 border-blue-600 text-black font-black'
                    : 'bg-white border-gray-300 text-gray-700'
                }`}
              >
                <span className="block font-black">Sobre Saldo</span>
                <span className="text-[10px] text-gray-600 block mt-0.5">
                  Interés decreciente
                </span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Tasa Interés (%)</label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  max="100"
                  value={tasaInteres}
                  onChange={(e) => setTasaInteres(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Frecuencia</label>
                <select
                  value={frecuencia}
                  onChange={(e) => {
                    const freq = e.target.value as FrecuenciaPago;
                    setFrecuencia(freq);
                    if (freq === 'diario') setNumCuotas(24);
                    if (freq === 'semanal') setNumCuotas(8);
                    if (freq === 'quincenal') setNumCuotas(4);
                    if (freq === 'mensual') setNumCuotas(2);
                  }}
                  className="w-full bg-white border border-gray-300 rounded-lg p-2 text-xs font-bold text-black"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Número de Cuotas</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={numCuotas}
                  onChange={(e) => setNumCuotas(Number(e.target.value))}
                  className="w-full bg-white border border-gray-300 rounded-lg px-3 py-2 text-xs font-black text-black"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">Primer Cobro</label>
                <input
                  type="date"
                  value={fechaPrimerCobro}
                  onChange={(e) => setFechaPrimerCobro(e.target.value)}
                  className="w-full bg-white border border-gray-300 rounded-lg px-2 py-2 text-xs font-bold text-black"
                />
              </div>
            </div>

            {frecuencia === 'diario' && (
              <label className="flex items-center gap-2 text-xs font-bold text-gray-800 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excluirDomingos}
                  onChange={(e) => setExcluirDomingos(e.target.checked)}
                  className="rounded border-gray-400 text-emerald-600 focus:ring-0"
                />
                Excluir domingos (no cobrar los domingos)
              </label>
            )}
          </div>

          {/* RESUMEN DE SIMULACIÓN */}
          <div className="bg-emerald-50 border-2 border-emerald-300 rounded-2xl p-4 space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-emerald-950 block">
              Resumen del Plan de Pagos
            </span>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-gray-600 font-bold block">Interés Total</span>
                <span className="text-xs font-black text-black tabular-nums">
                  {formatMoney(simulacion.total_interes)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border border-emerald-200">
                <span className="text-[10px] text-gray-600 font-bold block">Total a Pagar</span>
                <span className="text-xs font-black text-black tabular-nums">
                  {formatMoney(simulacion.total_a_pagar)}
                </span>
              </div>

              <div className="bg-white p-2.5 rounded-xl border-2 border-emerald-600">
                <span className="text-[10px] text-emerald-900 font-black block">Valor Cuota</span>
                <span className="text-sm font-black text-black tabular-nums">
                  {formatMoney(simulacion.valor_cuota)}
                </span>
              </div>
            </div>
          </div>

          {/* Nota para supervisor */}
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">
              Notas para el Supervisor:
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Negocio visitado en La Nevada, buen historial, capacidad de pago confirmada..."
              rows={2}
              className="w-full bg-white border border-gray-300 rounded-xl p-2.5 text-xs font-semibold text-black placeholder-gray-500 focus:outline-none focus:border-black"
            />
          </div>

        </div>

        {/* Footer con botón de envío */}
        <div className="p-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-3 rounded-xl text-xs font-bold text-gray-600 hover:text-black hover:bg-gray-200"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm py-3.5 px-4 rounded-xl shadow-xs flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          >
            <Check className="w-5 h-5 stroke-[3]" />
            Enviar a Autorización del Supervisor
          </button>
        </div>

      </div>
    </div>
  );
}
