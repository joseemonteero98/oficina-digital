'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { FrecuenciaPago, TipoInteres } from '@/types';
import { formatMoney, formatDate } from '@/lib/utils';
import { simularPrestamo } from '@/lib/calculations';
import { getTodayString } from '@/lib/initialData';
import { X, Calculator, Plus, UserPlus, Check, ChevronRight, HelpCircle } from 'lucide-react';

interface NewLoanModalProps {
  onClose: () => void;
}

export function NewLoanModal({ onClose }: NewLoanModalProps) {
  const { clientes, crearCliente, crearSolicitudPrestamo, selectedOficinaId, rutas, currentUser } = useApp();

  // Paso 1: Selección o creación de cliente
  const [clienteId, setClienteId] = useState<string>(clientes[0]?.id || '');
  const [modoCrearCliente, setModoCrearCliente] = useState<boolean>(false);
  const [nuevoNombre, setNuevoNombre] = useState<string>('');
  const [nuevoDoc, setNuevoDoc] = useState<string>('');
  const [nuevoTel, setNuevoTel] = useState<string>('');
  const [nuevaDir, setNuevaDir] = useState<string>('');
  const [nuevoNegocio, setNuevoNegocio] = useState<string>('');

  // Paso 2: Parámetros del préstamo
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

  // Simulación en tiempo real
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

      alert('¡Solicitud de préstamo enviada exitosamente al Supervisor para su autorización!');
      onClose();
    } catch (err: any) {
      alert(err.message || 'Error al crear solicitud');
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center sm:p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-t-3xl sm:rounded-2xl max-w-xl w-full overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
        
        {/* Cabecera */}
        <div className="px-5 py-3.5 bg-slate-800/80 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Calculator className="w-5 h-5 text-emerald-400" />
            <div>
              <h3 className="font-bold text-base text-white">Nueva Solicitud de Préstamo</h3>
              <p className="text-[11px] text-slate-400">Pasa a la Oficina para autorización del Supervisor</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5 flex-1">

          {/* SECCIÓN 1: CLIENTE */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60">
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-bold uppercase tracking-wider text-slate-300">
                1. Cliente Solicitante
              </label>
              <button
                type="button"
                onClick={() => setModoCrearCliente(!modoCrearCliente)}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-semibold flex items-center gap-1"
              >
                {modoCrearCliente ? 'Volver a Seleccionar' : '+ Registrar Nuevo Cliente'}
              </button>
            </div>

            {modoCrearCliente ? (
              <div className="space-y-3 pt-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <input
                    type="text"
                    placeholder="Nombre Completo *"
                    value={nuevoNombre}
                    onChange={(e) => setNuevoNombre(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Cédula / Documento *"
                    value={nuevoDoc}
                    onChange={(e) => setNuevoDoc(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="tel"
                    placeholder="Celular / WhatsApp *"
                    value={nuevoTel}
                    onChange={(e) => setNuevoTel(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                    required
                  />
                  <input
                    type="text"
                    placeholder="Negocio (Ej. Tienda, Taller...)"
                    value={nuevoNegocio}
                    onChange={(e) => setNuevoNegocio(e.target.value)}
                    className="bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Dirección del Negocio o Vivienda *"
                  value={nuevaDir}
                  onChange={(e) => setNuevaDir(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white"
                  required
                />
                <button
                  type="button"
                  onClick={handleCrearNuevoCliente}
                  className="w-full bg-emerald-700 hover:bg-emerald-600 text-white font-bold text-xs py-2 rounded-lg"
                >
                  Guardar Cliente y Continuar
                </button>
              </div>
            ) : (
              <select
                value={clienteId}
                onChange={(e) => setClienteId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
              >
                {clientes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nombre_completo} ({c.documento}) {c.negocio ? `— ${c.negocio}` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* SECCIÓN 2: CAPITAL Y MODO DE INTERÉS */}
          <div className="bg-slate-800/50 p-4 rounded-xl border border-slate-700/60 space-y-3">
            <label className="text-xs font-bold uppercase tracking-wider text-slate-300 block">
              2. Monto y Tipo de Cálculo
            </label>

            <div>
              <div className="flex justify-between text-xs text-slate-400 mb-1">
                <span>Capital a Prestar:</span>
                <span className="font-extrabold text-white text-sm">{formatMoney(capital)}</span>
              </div>
              <input
                type="number"
                step="50000"
                min="50000"
                value={capital}
                onChange={(e) => setCapital(Number(e.target.value))}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm font-bold text-white focus:ring-1 focus:ring-emerald-500"
              />
              <div className="grid grid-cols-4 gap-1.5 mt-2">
                {[300000, 500000, 1000000, 2000000].map((monto) => (
                  <button
                    key={monto}
                    type="button"
                    onClick={() => setCapital(monto)}
                    className="text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 py-1 rounded border border-slate-700"
                  >
                    {formatMoney(monto)}
                  </button>
                ))}
              </div>
            </div>

            {/* Selector de modo de interés (Fijo vs Sobre Saldo) */}
            <div>
              <span className="text-xs font-medium text-slate-300 block mb-1.5">
                Modalidad de Interés:
              </span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setTipoInteres('fijo')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    tipoInteres === 'fijo'
                      ? 'bg-emerald-600/20 border-emerald-500 text-emerald-300 font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="block font-bold">Interés Fijo Simple</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Estándar Paga Diario (Cuotas iguales fijas)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setTipoInteres('sobre_saldo')}
                  className={`p-2.5 rounded-lg border text-left text-xs transition-all ${
                    tipoInteres === 'sobre_saldo'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-900 border-slate-700 text-slate-400'
                  }`}
                >
                  <span className="block font-bold">Sobre Saldo</span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    Amortizado (Interés decreciente sobre capital)
                  </span>
                </button>
              </div>
            </div>

            {/* Tasa de Interés */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Tasa de Interés (%)</label>
                <div className="relative">
                  <input
                    type="number"
                    step="1"
                    min="1"
                    max="100"
                    value={tasaInteres}
                    onChange={(e) => setTasaInteres(Number(e.target.value))}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white pr-7"
                  />
                  <span className="absolute right-2.5 top-1.5 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Frecuencia de Cobro</label>
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
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-xs text-white"
                >
                  <option value="diario">Diario</option>
                  <option value="semanal">Semanal</option>
                  <option value="quincenal">Quincenal</option>
                  <option value="mensual">Mensual</option>
                </select>
              </div>
            </div>

            {/* Cantidad de cuotas y opciones */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">Número de Cuotas</label>
                <input
                  type="number"
                  min="1"
                  max="120"
                  value={numCuotas}
                  onChange={(e) => setNumCuotas(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-1.5 text-xs font-bold text-white"
                />
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1">Primer Cobro</label>
                <input
                  type="date"
                  value={fechaPrimerCobro}
                  onChange={(e) => setFechaPrimerCobro(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2 py-1.5 text-xs text-white"
                />
              </div>
            </div>

            {frecuencia === 'diario' && (
              <label className="flex items-center gap-2 text-xs text-slate-300 pt-1 cursor-pointer">
                <input
                  type="checkbox"
                  checked={excluirDomingos}
                  onChange={(e) => setExcluirDomingos(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-emerald-500 focus:ring-0"
                />
                Excluir domingos (no cobrar ni contar cuota los domingos)
              </label>
            )}
          </div>

          {/* SECCIÓN 3: RESULTADOS DE LA SIMULACIÓN EN TIEMPO REAL */}
          <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-400">
                Resumen del Plan de Pagos
              </span>
              <button
                type="button"
                onClick={() => setVerTablaAmortizacion(!verTablaAmortizacion)}
                className="text-[11px] text-emerald-400 underline font-medium"
              >
                {verTablaAmortizacion ? 'Ocultar Calendario' : 'Ver Fechas de Cuotas'}
              </button>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total Interés</span>
                <span className="text-xs font-bold text-emerald-400 tabular-nums">
                  {formatMoney(simulacion.total_interes)}
                </span>
              </div>

              <div className="bg-slate-900/80 p-2.5 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">Total a Pagar</span>
                <span className="text-xs font-extrabold text-white tabular-nums">
                  {formatMoney(simulacion.total_a_pagar)}
                </span>
              </div>

              <div className="bg-emerald-600/20 p-2.5 rounded-lg border border-emerald-500/40">
                <span className="text-[10px] text-emerald-300 font-bold block">Valor Cuota</span>
                <span className="text-sm font-black text-emerald-400 tabular-nums">
                  {formatMoney(simulacion.valor_cuota)}
                </span>
              </div>
            </div>

            {/* Desglose de cuotas si el usuario quiere auditar */}
            {verTablaAmortizacion && (
              <div className="mt-3 max-h-40 overflow-y-auto border border-slate-800 rounded-lg text-[10px]">
                <table className="w-full text-left">
                  <thead className="bg-slate-800 text-slate-300 sticky top-0">
                    <tr>
                      <th className="p-1.5">#</th>
                      <th className="p-1.5">Fecha</th>
                      <th className="p-1.5 text-right">Cuota</th>
                      <th className="p-1.5 text-right">Saldo Restante</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-slate-300">
                    {simulacion.cuotas_simuladas.map((c) => (
                      <tr key={c.numero} className="hover:bg-slate-800/40">
                        <td className="p-1.5 font-bold">{c.numero}</td>
                        <td className="p-1.5">{formatDate(c.fecha)}</td>
                        <td className="p-1.5 text-right font-bold text-white">{formatMoney(c.monto_total)}</td>
                        <td className="p-1.5 text-right text-slate-400">{formatMoney(c.saldo_restante)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Notas para el Supervisor */}
          <div>
            <label className="text-xs font-medium text-slate-400 block mb-1">
              Notas u observaciones para el Supervisor:
            </label>
            <textarea
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Cliente con negocio propio hace 3 años, buen historial, se verificó el local..."
              rows={2}
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-xs text-white focus:ring-1 focus:ring-emerald-500"
            />
          </div>

        </div>

        {/* Footer con botón de envío */}
        <div className="p-4 bg-slate-800/80 border-t border-slate-700/80 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800"
          >
            Cancelar
          </button>

          <button
            type="button"
            onClick={handleSubmit}
            className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs py-3 px-4 rounded-xl shadow-lg shadow-emerald-950 flex items-center justify-center gap-2 transition-transform active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Enviar a Autorización del Supervisor
          </button>
        </div>

      </div>
    </div>
  );
}
