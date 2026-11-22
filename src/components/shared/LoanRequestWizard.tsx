'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { FrecuenciaPago, TipoInteres, TipoDocumento, SimulacionPrestamo } from '@/types';
import { formatMoney, formatDate, getFrecuenciaLabel } from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { SearchInput } from './SearchInput';
import { LoanSimulator } from './LoanSimulator';
import { UserPlus, ArrowLeft, ArrowRight, CheckCircle2, HelpCircle, Loader2 } from 'lucide-react';

interface LoanRequestWizardProps {
  onSuccessDone: () => void;
  onCancel: () => void;
}

const BARRIOS_VALLEDUPAR = [
  'LA NEVADA',
  'DIVINO NIÑO',
  'LOS FUNDADORES',
  '12 DE OCTUBRE',
  'CENTRO',
  'MERCADO PÚBLICO',
  'OTRO SECTOR',
];

export function LoanRequestWizard({ onSuccessDone, onCancel }: LoanRequestWizardProps) {
  const {
    clientes,
    rutas,
    oficinas,
    selectedOficinaId,
    currentUser,
    crearCliente,
    simularPrestamoBackend,
    crearSolicitudPrestamo,
    showToast,
  } = useApp();

  const activeOffice = oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];

  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5>(1);

  // Paso 1: Cliente
  const [searchCliente, setSearchCliente] = useState('');
  const [clienteId, setClienteId] = useState<string>('');
  const [showNewClientForm, setShowNewClientForm] = useState(false);
  const [isSavingClient, setIsSavingClient] = useState(false);

  const [nuevoNombre, setNuevoNombre] = useState('');
  const [nuevoTipoDoc, setNuevoTipoDoc] = useState<TipoDocumento>('CC');
  const [nuevoDoc, setNuevoDoc] = useState('');
  const [nuevoTel, setNuevoTel] = useState('');
  const [nuevaDir, setNuevaDir] = useState('');
  const [nuevoBarrio, setNuevoBarrio] = useState('LA NEVADA');
  const [nuevaRef, setNuevaRef] = useState('');
  const [nuevoNegocio, setNuevoNegocio] = useState('');
  const [nuevasObs, setNuevasObs] = useState('');

  // Paso 2: Condiciones
  const [capital, setCapital] = useState<number>(1000000);
  const [tipoInteres, setTipoInteres] = useState<TipoInteres>('fijo');
  const [tasaInteres, setTasaInteres] = useState<number>(activeOffice?.tasa_interes_defecto || 20);
  const [frecuencia, setFrecuencia] = useState<FrecuenciaPago>('diario');
  const [numCuotas, setNumCuotas] = useState<number>(24);
  const [excluirDomingos, setExcluirDomingos] = useState<boolean>(activeOffice?.excluir_domingos ?? true);
  const [fechaPrimerCobro, setFechaPrimerCobro] = useState<string>(() => getTodayString());
  const [notas, setNotas] = useState<string>('');
  const [showInteresHelp, setShowInteresHelp] = useState(false);

  // Paso 3: Simulación desde el backend
  const [simulacion, setSimulacion] = useState<SimulacionPrestamo | null>(null);
  const [simLoading, setSimLoading] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [isSubmittingLoan, setIsSubmittingLoan] = useState(false);

  const runSimulation = useCallback(async () => {
    setSimLoading(true);
    setSimError(null);
    try {
      const res = await simularPrestamoBackend({
        capital: Number(capital) || 0,
        tasa_interes: Number(tasaInteres) || 0,
        tipo_interes: tipoInteres,
        frecuencia,
        num_cuotas: Number(numCuotas) || 1,
        excluir_domingos: excluirDomingos,
        fecha_primer_cobro: fechaPrimerCobro,
      });
      setSimulacion(res);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'No se pudo obtener la simulación del servidor.';
      setSimError(msg);
    } finally {
      setSimLoading(false);
    }
  }, [capital, tasaInteres, tipoInteres, frecuencia, numCuotas, excluirDomingos, fechaPrimerCobro, simularPrestamoBackend]);

  useEffect(() => {
    if (step !== 3 && step !== 4) return;
    let active = true;
    simularPrestamoBackend({
      capital: Number(capital) || 0,
      tasa_interes: Number(tasaInteres) || 0,
      tipo_interes: tipoInteres,
      frecuencia,
      num_cuotas: Number(numCuotas) || 1,
      excluir_domingos: excluirDomingos,
      fecha_primer_cobro: fechaPrimerCobro,
    })
      .then((res) => {
        if (active) {
          setSimulacion(res);
          setSimError(null);
          setSimLoading(false);
        }
      })
      .catch((err: unknown) => {
        if (active) {
          const msg = err instanceof Error ? err.message : 'No se pudo obtener la simulación del servidor.';
          setSimError(msg);
          setSimLoading(false);
        }
      });
    return () => {
      active = false;
    };
  }, [step, capital, tasaInteres, tipoInteres, frecuencia, numCuotas, excluirDomingos, fechaPrimerCobro, simularPrestamoBackend]);

  const filteredClientes = clientes.filter((c) => {
    if (!searchCliente.trim()) return true;
    const q = searchCliente.toLowerCase();
    return (
      c.nombre_completo.toLowerCase().includes(q) ||
      c.documento.toLowerCase().includes(q) ||
      c.telefono.toLowerCase().includes(q)
    );
  });

  const selectedCliente = clientes.find((c) => c.id === clienteId);

  const handleSaveNewClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoNombre.trim() || !nuevoDoc.trim() || !nuevoTel.trim() || !nuevaDir.trim()) {
      showToast('error', 'Completa todos los campos obligatorios del cliente.');
      return;
    }

    const exists = clientes.some((c) => c.documento.trim() === nuevoDoc.trim());
    if (exists) {
      showToast('error', 'Ya existe un cliente registrado con ese número de documento.');
      return;
    }

    setIsSavingClient(true);
    try {
      const matchingRuta = rutas.find((r) => r.nombre.toUpperCase().includes(nuevoBarrio)) || rutas[0];
      const creado = await crearCliente({
        oficina_id: activeOffice.id,
        ruta_id: matchingRuta?.id || null,
        cobrador_id: currentUser.id,
        nombre_completo: nuevoNombre.trim(),
        tipo_documento: nuevoTipoDoc,
        documento: nuevoDoc.trim(),
        telefono: nuevoTel.trim(),
        direccion: `${nuevaDir.trim()}, ${nuevoBarrio}`,
        barrio: nuevoBarrio,
        referencia_ubicacion: nuevaRef.trim() || undefined,
        negocio: nuevoNegocio.trim() || undefined,
        alias: nuevoBarrio,
        notas: nuevasObs.trim() || undefined,
        activo: true,
      });
      setClienteId(creado.id);
      setShowNewClientForm(false);
      setStep(2);
    } catch {
      // handled by toast
    } finally {
      setIsSavingClient(false);
    }
  };

  const handleEnviarSolicitud = async () => {
    if (!clienteId || isSubmittingLoan) return;
    setIsSubmittingLoan(true);
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
        notas: notas.trim() || undefined,
      });
      setStep(5);
    } catch {
      setIsSubmittingLoan(false);
    }
  };

  // Pantalla de confirmación final (Paso 5)
  if (step === 5) {
    return (
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#86EFAC] flex items-center justify-center mx-auto text-[#15803D]">
          <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
        </div>
        <div className="space-y-1">
          <h2 className="text-[20px] font-semibold text-black">Solicitud enviada al supervisor</h2>
          <p className="text-[14px] text-[#525252]">
            Cliente: <strong className="text-black">{selectedCliente?.nombre_completo}</strong>
          </p>
        </div>
        <div className="inline-block px-3 py-1 rounded-[6px] bg-[#FFFBEB] border border-[#FCD34D] text-[#D97706] text-[12px] font-semibold">
          PENDIENTE DE APROBACIÓN
        </div>
        <p className="text-[13px] text-[#525252]">
          No podrás entregar el dinero hasta que un supervisor autorice la solicitud.
        </p>
        <div className="pt-2">
          <button
            type="button"
            onClick={onSuccessDone}
            className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold"
          >
            Ir a Mis préstamos
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Encabezado y progreso de 4 pasos */}
      <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-[18px] font-semibold text-black">Nuevo préstamo</h2>
          <span className="text-[12px] font-medium text-[#525252]">Paso {step} de 4</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[
            { n: 1, label: 'Cliente' },
            { n: 2, label: 'Condiciones' },
            { n: 3, label: 'Simulador' },
            { n: 4, label: 'Enviar' },
          ].map((s) => (
            <div key={s.n} className="space-y-1">
              <div
                className={`h-1.5 rounded-full ${
                  step >= s.n ? 'bg-[#2563EB]' : 'bg-[#E5E7EB]'
                }`}
              />
              <span
                className={`block text-[11px] text-center ${
                  step === s.n ? 'font-semibold text-[#2563EB]' : 'text-[#525252]'
                }`}
              >
                {s.label}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* PASO 1: CLIENTE */}
      {step === 1 && (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-black">1. Seleccionar cliente</h3>
            <button
              type="button"
              onClick={() => setShowNewClientForm(!showNewClientForm)}
              className="h-10 px-3 rounded-[6px] bg-[#EFF6FF] text-[#2563EB] border border-[#93C5FD] text-[13px] font-semibold flex items-center gap-1.5"
            >
              <UserPlus className="w-4 h-4" strokeWidth={2} />
              <span>{showNewClientForm ? 'Buscar existente' : '+ Nuevo cliente'}</span>
            </button>
          </div>

          {showNewClientForm ? (
            <form onSubmit={handleSaveNewClient} className="space-y-3">
              <div>
                <label htmlFor="cli-nombre" className="block text-[12px] font-medium text-[#525252] mb-1">
                  Nombre completo *
                </label>
                <input
                  id="cli-nombre"
                  type="text"
                  value={nuevoNombre}
                  onChange={(e) => setNuevoNombre(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label htmlFor="cli-tipodoc" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Tipo doc *
                  </label>
                  <select
                    id="cli-tipodoc"
                    value={nuevoTipoDoc}
                    onChange={(e) => setNuevoTipoDoc(e.target.value as TipoDocumento)}
                    className="w-full h-11 px-2 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  >
                    <option value="CC">CC</option>
                    <option value="CE">CE</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">PAS</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label htmlFor="cli-doc" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Número de documento *
                  </label>
                  <input
                    id="cli-doc"
                    type="text"
                    value={nuevoDoc}
                    onChange={(e) => setNuevoDoc(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-tel" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    id="cli-tel"
                    type="tel"
                    value={nuevoTel}
                    onChange={(e) => setNuevoTel(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                    required
                  />
                </div>
                <div>
                  <label htmlFor="cli-barrio" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Barrio / Sector *
                  </label>
                  <select
                    id="cli-barrio"
                    value={nuevoBarrio}
                    onChange={(e) => setNuevoBarrio(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  >
                    {BARRIOS_VALLEDUPAR.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="cli-dir" className="block text-[12px] font-medium text-[#525252] mb-1">
                  Dirección *
                </label>
                <input
                  id="cli-dir"
                  type="text"
                  value={nuevaDir}
                  onChange={(e) => setNuevaDir(e.target.value)}
                  placeholder="Ej. Calle 6 # 42-15"
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="cli-ref" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Referencia de ubicación
                  </label>
                  <input
                    id="cli-ref"
                    type="text"
                    value={nuevaRef}
                    onChange={(e) => setNuevaRef(e.target.value)}
                    placeholder="Ej. Frente al parque"
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  />
                </div>
                <div>
                  <label htmlFor="cli-negocio" className="block text-[12px] font-medium text-[#525252] mb-1">
                    Negocio / Actividad
                  </label>
                  <input
                    id="cli-negocio"
                    type="text"
                    value={nuevoNegocio}
                    onChange={(e) => setNuevoNegocio(e.target.value)}
                    placeholder="Ej. Tienda de abarrotes"
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="cli-obs" className="block text-[12px] font-medium text-[#525252] mb-1">
                  Observaciones
                </label>
                <input
                  id="cli-obs"
                  type="text"
                  value={nuevasObs}
                  onChange={(e) => setNuevasObs(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                />
              </div>

              <button
                type="submit"
                disabled={isSavingClient}
                className="w-full h-12 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {isSavingClient && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                <span>Guardar cliente y continuar</span>
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <SearchInput
                id="buscar-cliente-wizard"
                value={searchCliente}
                onChange={setSearchCliente}
                placeholder="Buscar cliente por nombre, cédula o teléfono"
              />

              <div className="max-h-72 overflow-y-auto border border-[#E5E7EB] rounded-[6px] divide-y divide-[#E5E7EB]">
                {filteredClientes.length === 0 ? (
                  <div className="p-4 text-center text-[13px] text-[#525252]">
                    No se encontraron clientes. Usa &quot;+ Nuevo cliente&quot; para registrarlo.
                  </div>
                ) : (
                  filteredClientes.map((c) => {
                    const isSelected = clienteId === c.id;
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setClienteId(c.id)}
                        className={`w-full text-left p-3 flex items-center justify-between transition-colors ${
                          isSelected ? 'bg-[#EFF6FF]' : 'bg-white hover:bg-[#F7F8FA]'
                        }`}
                      >
                        <div>
                          <p className="text-[14px] font-semibold text-black">{c.nombre_completo}</p>
                          <p className="text-[12px] text-[#525252]">
                            Doc: {c.documento} · {c.telefono} · {c.barrio || c.direccion}
                          </p>
                        </div>
                        <span
                          className={`text-[12px] font-semibold px-2.5 py-1 rounded-md border ${
                            isSelected
                              ? 'bg-[#2563EB] text-white border-[#2563EB]'
                              : 'bg-white text-[#525252] border-[#D1D5DB]'
                          }`}
                        >
                          {isSelected ? 'Seleccionado' : 'Elegir'}
                        </span>
                      </button>
                    );
                  })
                )}
              </div>

              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={onCancel}
                  className="h-12 px-4 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[14px] font-medium"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={!clienteId}
                  onClick={() => setStep(2)}
                  className="flex-1 h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
                >
                  <span>Continuar a condiciones</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* PASO 2: CONDICIONES */}
      {step === 2 && (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-black">2. Condiciones del préstamo</h3>
            <span className="text-[12px] text-[#525252] font-medium truncate max-w-[160px]">
              {selectedCliente?.nombre_completo}
            </span>
          </div>

          <div>
            <label htmlFor="cond-capital" className="block text-[14px] font-semibold text-black mb-1">
              Monto solicitado
            </label>
            <input
              id="cond-capital"
              type="number"
              inputMode="numeric"
              min={50000}
              step={50000}
              value={capital}
              onChange={(e) => setCapital(Number(e.target.value))}
              className="w-full h-12 px-3.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[18px] font-bold text-black tabular-nums"
            />
            <div className="grid grid-cols-4 gap-1.5 mt-2">
              {[300000, 500000, 1000000, 2000000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setCapital(v)}
                  className="h-9 bg-[#F7F8FA] hover:bg-[#E5E7EB] border border-[#D1D5DB] rounded-[6px] text-[12px] font-medium text-black"
                >
                  {formatMoney(v)}
                </button>
              ))}
            </div>
          </div>

          {/* Tipo de interés con ayuda contextual */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[14px] font-semibold text-black">Tipo de interés</span>
              <button
                type="button"
                onClick={() => setShowInteresHelp(!showInteresHelp)}
                className="text-[12px] font-medium text-[#2563EB] flex items-center gap-1"
              >
                <HelpCircle className="w-3.5 h-3.5" strokeWidth={2} />
                <span>¿Cuál es la diferencia?</span>
              </button>
            </div>

            {showInteresHelp && (
              <div className="mb-2 bg-[#EFF6FF] border border-[#93C5FD] rounded-[6px] p-3 text-[12px] text-black space-y-1">
                <p>
                  <strong>A. Interés fijo simple:</strong> Se cobra un porcentaje fijo sobre el capital total prestado y se divide en cuotas iguales (ej. presta $ 1.000.000 al 20% por el préstamo = paga $ 1.200.000).
                </p>
                <p>
                  <strong>B. Interés sobre saldo:</strong> Se aplica la tasa periódica sobre el saldo de capital pendiente en cada cuota amortizada.
                </p>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setTipoInteres('fijo')}
                className={`p-3 rounded-[6px] border text-left ${
                  tipoInteres === 'fijo'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-black'
                    : 'bg-white border-[#D1D5DB] text-[#525252]'
                }`}
              >
                <span className="block text-[13px] font-semibold text-black">Interés fijo simple</span>
                <span className="block text-[11px] text-[#525252]">Tasa total sobre el préstamo</span>
              </button>

              <button
                type="button"
                onClick={() => setTipoInteres('sobre_saldo')}
                className={`p-3 rounded-[6px] border text-left ${
                  tipoInteres === 'sobre_saldo'
                    ? 'bg-[#EFF6FF] border-[#2563EB] text-black'
                    : 'bg-white border-[#D1D5DB] text-[#525252]'
                }`}
              >
                <span className="block text-[13px] font-semibold text-black">Interés sobre saldo</span>
                <span className="block text-[11px] text-[#525252]">Tasa por periodo sobre saldo</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="cond-tasa" className="block text-[12px] font-medium text-[#525252] mb-1">
                {tipoInteres === 'fijo' ? 'Tasa por préstamo (%)' : 'Tasa por cuota / periodo (%)'}
              </label>
              <input
                id="cond-tasa"
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={tasaInteres}
                onChange={(e) => setTasaInteres(Number(e.target.value))}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] font-semibold text-black"
              />
            </div>

            <div>
              <label htmlFor="cond-frec" className="block text-[12px] font-medium text-[#525252] mb-1">
                Frecuencia de pago
              </label>
              <select
                id="cond-frec"
                value={frecuencia}
                onChange={(e) => {
                  const freq = e.target.value as FrecuenciaPago;
                  setFrecuencia(freq);
                  if (freq === 'diario') setNumCuotas(24);
                  if (freq === 'semanal') setNumCuotas(8);
                  if (freq === 'quincenal') setNumCuotas(4);
                  if (freq === 'mensual') setNumCuotas(2);
                }}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              >
                <option value="diario">Diaria</option>
                <option value="semanal">Semanal</option>
                <option value="quincenal">Quincenal</option>
                <option value="mensual">Mensual</option>
              </select>
            </div>

            <div>
              <label htmlFor="cond-cuotas" className="block text-[12px] font-medium text-[#525252] mb-1">
                Número de cuotas
              </label>
              <input
                id="cond-cuotas"
                type="number"
                min={1}
                max={180}
                value={numCuotas}
                onChange={(e) => setNumCuotas(Number(e.target.value))}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] font-semibold text-black"
              />
            </div>

            <div>
              <label htmlFor="cond-fecha" className="block text-[12px] font-medium text-[#525252] mb-1">
                Fecha desembolso / inicio
              </label>
              <input
                id="cond-fecha"
                type="date"
                value={fechaPrimerCobro}
                onChange={(e) => setFechaPrimerCobro(e.target.value)}
                className="w-full h-11 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              />
            </div>
          </div>

          {/* Switch de exclusión de domingos */}
          <div className="flex items-center justify-between bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3">
            <div>
              <span className="text-[14px] font-medium text-black block">Excluir domingos</span>
              <span className="text-[12px] text-[#525252]">No programar vencimientos los días domingo</span>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={excluirDomingos}
              onClick={() => setExcluirDomingos(!excluirDomingos)}
              className={`w-12 h-7 rounded-full transition-colors p-0.5 ${
                excluirDomingos ? 'bg-[#15803D]' : 'bg-[#D1D5DB]'
              }`}
            >
              <span
                className={`block w-6 h-6 rounded-full bg-white transition-transform ${
                  excluirDomingos ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="h-12 px-4 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[14px] font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              disabled={capital <= 0 || numCuotas <= 0}
              onClick={() => setStep(3)}
              className="flex-1 h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Simular cuotas</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 3: SIMULADOR DE CUOTAS (BACKEND) */}
      {step === 3 && (
        <div className="space-y-4">
          <LoanSimulator
            simulacion={simulacion}
            isLoading={simLoading}
            error={simError}
            onRetry={runSimulation}
          />

          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="h-12 px-4 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[14px] font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>Ajustar</span>
            </button>
            <button
              type="button"
              disabled={!simulacion || simLoading}
              onClick={() => setStep(4)}
              className="flex-1 h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              <span>Revisar y enviar</span>
              <ArrowRight className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>
      )}

      {/* PASO 4: REVISIÓN Y ENVÍO */}
      {step === 4 && (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
          <h3 className="text-[16px] font-semibold text-black border-b border-[#E5E7EB] pb-2">
            4. Revisión de solicitud
          </h3>

          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3.5 space-y-2 text-[14px]">
            <div className="flex justify-between">
              <span className="text-[#525252]">Cliente:</span>
              <strong className="text-black">{selectedCliente?.nombre_completo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Monto solicitado:</span>
              <strong className="text-black tabular-nums">{formatMoney(simulacion?.capital ?? capital)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Interés ({tipoInteres === 'fijo' ? 'Fijo simple' : 'Sobre saldo'} · {tasaInteres}%):</span>
              <strong className="text-black tabular-nums">{formatMoney(simulacion?.total_interes)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Frecuencia y cuotas:</span>
              <strong className="text-black">
                {getFrecuenciaLabel(frecuencia)} · {numCuotas} cuotas
              </strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Valor de cuota:</span>
              <strong className="text-[#2563EB] tabular-nums">{formatMoney(simulacion?.valor_cuota)}</strong>
            </div>
            <div className="flex justify-between pt-2 border-t border-[#D1D5DB]">
              <span className="font-semibold text-black">Total a pagar:</span>
              <strong className="text-[18px] font-bold text-black tabular-nums">
                {formatMoney(simulacion?.total_a_pagar)}
              </strong>
            </div>
            <div className="flex justify-between text-[12px]">
              <span className="text-[#525252]">Fecha prevista primer cobro:</span>
              <span className="font-medium text-black">{formatDate(fechaPrimerCobro)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="req-notas" className="block text-[12px] font-medium text-[#525252] mb-1">
              Observaciones para el supervisor (opcional)
            </label>
            <textarea
              id="req-notas"
              rows={2}
              value={notas}
              onChange={(e) => setNotas(e.target.value)}
              placeholder="Ej. Negocio verificado en el sitio, buenas referencias..."
              className="w-full p-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
            />
          </div>

          <div className="flex gap-2">
            <button
              type="button"
              disabled={isSubmittingLoan}
              onClick={() => setStep(3)}
              className="h-12 px-4 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[14px] font-medium flex items-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" strokeWidth={2} />
              <span>Atrás</span>
            </button>
            <button
              type="button"
              disabled={isSubmittingLoan || !simulacion}
              onClick={handleEnviarSolicitud}
              className="flex-1 h-12 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {isSubmittingLoan && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              <span>ENVIAR SOLICITUD</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
