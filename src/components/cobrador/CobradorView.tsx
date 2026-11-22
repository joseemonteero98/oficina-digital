'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Cliente, Cuota, MetodoPago, RegistroPago } from '@/types';
import { formatMoney, formatDate, formatLongDate, getFrecuenciaLabel } from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterBar } from '@/components/shared/FilterBar';
import { CustomerCard } from '@/components/shared/CustomerCard';
import { LoanCard } from '@/components/shared/LoanCard';
import { PaymentModal } from '@/components/shared/PaymentModal';
import { LoanRequestWizard } from '@/components/shared/LoanRequestWizard';
import { CashRegisterSummary } from '@/components/shared/CashRegisterSummary';
import { ExpenseForm } from '@/components/shared/ExpenseForm';
import { EmptyState } from '@/components/shared/EmptyState';
import { LoadingState } from '@/components/shared/LoadingState';
import { StatusBadge } from '@/components/shared/StatusBadge';
import {
  Search,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  CalendarCheck,
} from 'lucide-react';

const SECTOR_ORDER = [
  'LA NEVADA',
  'DIVINO NIÑO',
  'LOS FUNDADORES',
  '12 DE OCTUBRE',
  'CENTRO',
  'MERCADO PÚBLICO',
];

export function CobradorView() {
  const {
    activeSection,
    setActiveSection,
    prestamos,
    clientes,
    rutas,
    pagos,
    isLoadingBootstrap,
    isEmptyDb,
    cargarDatosEjemplo,
    desembolsarPrestamo,
    actualizarCliente,
    setActiveReceipt,
  } = useApp();

  // Estado de Cobros de hoy
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'todos' | 'pendientes' | 'pagados' | 'no_pagados'>('todos');
  const [sectorFilter, setSectorFilter] = useState<string>('todos');
  const [collapsedSectors, setCollapsedSectors] = useState<Record<string, boolean>>({});
  const [selectedForPayment, setSelectedForPayment] = useState<{
    prestamo: Prestamo;
    cliente: Cliente;
    cuota?: Cuota;
  } | null>(null);

  // Estado de Mis Préstamos
  const [prestamosTab, setPrestamosTab] = useState<'pendientes' | 'aprobados' | 'desembolsados' | 'rechazados'>('aprobados');
  const [disburseTarget, setDisburseTarget] = useState<Prestamo | null>(null);
  const [disburseMethod, setDisburseMethod] = useState<MetodoPago>('efectivo');
  const [disburseConfirmedCheck, setDisburseConfirmedCheck] = useState(false);
  const [isDisbursing, setIsDisbursing] = useState(false);
  const [disburseReceipt, setDisburseReceipt] = useState<Prestamo | null>(null);

  // Estado de Mis Clientes
  const [clientSearch, setClientSearch] = useState('');
  const [selectedClient, setSelectedClient] = useState<Cliente | null>(null);
  const [clientDetailTab, setClientDetailTab] = useState<'info' | 'prestamos' | 'pagos' | 'observaciones'>('info');
  const [editClientTel, setEditClientTel] = useState('');
  const [editClientDir, setEditClientDir] = useState('');
  const [editClientNegocio, setEditClientNegocio] = useState('');
  const [isSavingClientEdit, setIsSavingClientEdit] = useState(false);

  // Estado de Historial de recaudos
  const [historyFilter, setHistoryFilter] = useState<'todos' | 'efectivo' | 'transferencia' | 'no_pago'>('todos');

  const today = getTodayString();

  // =========================================================================
  // DATOS DE COBROS DE HOY AGRUPADOS POR BARRIO / RUTA
  // =========================================================================
  const cobrosItems = useMemo(() => {
    return prestamos
      .filter((p) => p.estado === 'activo' || p.estado === 'mora')
      .map((p) => {
        const cliente = clientes.find((c) => c.id === p.cliente_id);
        if (!cliente) return null;

        const cuotaHoy = (p.cuotas || []).find((c) => c.estado !== 'pagada');
        const pagosPrestamo = pagos.filter((pg) => pg.prestamo_id === p.id);
        const pagadoHoy = pagosPrestamo.find(
          (pg) => pg.fecha_pago === today && pg.tipo !== 'no_pago'
        );
        const noPagoHoy = pagosPrestamo.find(
          (pg) => pg.fecha_pago === today && pg.tipo === 'no_pago'
        );

        const rutaObj = rutas.find((r) => r.id === cliente.ruta_id);
        const sectorName = (
          cliente.barrio ||
          cliente.alias ||
          rutaObj?.nombre ||
          'VALLEDUPAR'
        ).toUpperCase();

        const isPaidToday = Boolean(pagadoHoy && pagadoHoy.tipo === 'cuota_completa') || (cuotaHoy === undefined);
        const isNoPayToday = !isPaidToday && Boolean(noPagoHoy);

        return {
          prestamo: p,
          cliente,
          cuotaHoy,
          pagadoHoy,
          noPagoHoy,
          recibosPrestamo: pagosPrestamo,
          sectorName,
          isPaidToday,
          isNoPayToday,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)
      .sort((a, b) => a.cliente.orden_ruta - b.cliente.orden_ruta);
  }, [prestamos, clientes, pagos, rutas, today]);

  const availableSectors = useMemo(() => {
    const set = new Set<string>(cobrosItems.map((i) => i.sectorName));
    const ordered = SECTOR_ORDER.filter((s) => set.has(s));
    const others = Array.from(set).filter((s) => !SECTOR_ORDER.includes(s));
    return [...ordered, ...others];
  }, [cobrosItems]);

  const filteredCobros = useMemo(() => {
    return cobrosItems.filter((item) => {
      if (statusFilter === 'pendientes' && (item.isPaidToday || item.isNoPayToday)) return false;
      if (statusFilter === 'pagados' && !item.isPaidToday) return false;
      if (statusFilter === 'no_pagados' && !item.isNoPayToday) return false;
      if (sectorFilter !== 'todos' && item.sectorName !== sectorFilter) return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matches =
          item.cliente.nombre_completo.toLowerCase().includes(q) ||
          item.cliente.documento.toLowerCase().includes(q) ||
          item.cliente.telefono.toLowerCase().includes(q) ||
          item.cliente.direccion.toLowerCase().includes(q) ||
          item.prestamo.codigo.toLowerCase().includes(q);
        if (!matches) return false;
      }
      return true;
    });
  }, [cobrosItems, statusFilter, sectorFilter, searchQuery]);

  const groupedCobros = useMemo(() => {
    const map = new Map<string, typeof filteredCobros>();
    for (const item of filteredCobros) {
      const arr = map.get(item.sectorName) || [];
      arr.push(item);
      map.set(item.sectorName, arr);
    }
    const keys = Array.from(map.keys()).sort((a, b) => {
      const idxA = SECTOR_ORDER.indexOf(a);
      const idxB = SECTOR_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
    return keys.map((sector) => ({
      sector,
      items: map.get(sector)!,
    }));
  }, [filteredCobros]);

  const handleOpenClientDetail = (c: Cliente) => {
    setSelectedClient(c);
    setClientDetailTab('info');
    setEditClientTel(c.telefono);
    setEditClientDir(c.direccion);
    setEditClientNegocio(c.negocio || '');
  };

  const handleSaveClientEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    setIsSavingClientEdit(true);
    try {
      await actualizarCliente(selectedClient.id, {
        telefono: editClientTel.trim(),
        direccion: editClientDir.trim(),
        negocio: editClientNegocio.trim(),
      });
      setSelectedClient({
        ...selectedClient,
        telefono: editClientTel.trim(),
        direccion: editClientDir.trim(),
        negocio: editClientNegocio.trim(),
      });
    } finally {
      setIsSavingClientEdit(false);
    }
  };

  const handleConfirmDisburse = async () => {
    if (!disburseTarget || !disburseConfirmedCheck || isDisbursing) return;
    setIsDisbursing(true);
    try {
      await desembolsarPrestamo(disburseTarget.id, disburseMethod);
      const completed = disburseTarget;
      setDisburseTarget(null);
      setDisburseConfirmedCheck(false);
      setDisburseReceipt(completed);
    } catch {
      // handled in store
    } finally {
      setIsDisbursing(false);
    }
  };

  if (isLoadingBootstrap) {
    return <LoadingState message="Cargando ruta de cobro..." />;
  }

  // =========================================================================
  // PANTALLA 1: COBROS DE HOY (INICIAL SIN TARJETAS NI RUIDO SUPERIOR)
  // =========================================================================
  if (activeSection === 'cobros_hoy') {
    return (
      <div className="space-y-4 pb-16">
        {/* Encabezado limpio */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <h2 className="text-[22px] font-semibold text-black leading-tight">Cobros de hoy</h2>
            <p className="text-[12px] text-[#525252] mt-0.5">{formatLongDate()}</p>
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => setShowSearchBar(!showSearchBar)}
              aria-label="Mostrar u ocultar búsqueda"
              className={`w-10 h-10 rounded-[6px] border flex items-center justify-center ${
                showSearchBar
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
                  : 'bg-white text-black border-[#D1D5DB]'
              }`}
            >
              <Search className="w-4 h-4" strokeWidth={2} />
            </button>
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              aria-label="Mostrar u ocultar filtros"
              className={`w-10 h-10 rounded-[6px] border flex items-center justify-center ${
                showFilters || statusFilter !== 'todos' || sectorFilter !== 'todos'
                  ? 'bg-[#EFF6FF] text-[#2563EB] border-[#93C5FD]'
                  : 'bg-white text-black border-[#D1D5DB]'
              }`}
            >
              <SlidersHorizontal className="w-4 h-4" strokeWidth={2} />
            </button>
          </div>
        </div>

        {/* Barra de búsqueda */}
        {showSearchBar && (
          <SearchInput
            id="cobros-hoy-search"
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="Buscar cliente, cédula o teléfono..."
          />
        )}

        {/* Filtros compactos */}
        {showFilters && (
          <FilterBar
            options={[
              { id: 'todos', label: 'Todos', count: cobrosItems.length },
              {
                id: 'pendientes',
                label: 'Pendientes',
                count: cobrosItems.filter((i) => !i.isPaidToday && !i.isNoPayToday).length,
              },
              {
                id: 'pagados',
                label: 'Pagados',
                count: cobrosItems.filter((i) => i.isPaidToday).length,
              },
              {
                id: 'no_pagados',
                label: 'No pagados',
                count: cobrosItems.filter((i) => i.isNoPayToday).length,
              },
            ]}
            selectedId={statusFilter}
            onSelect={(id) => setStatusFilter(id as 'todos' | 'pendientes' | 'pagados' | 'no_pagados')}
            secondarySelect={{
              label: 'Filtrar por barrio',
              value: sectorFilter,
              onChange: setSectorFilter,
              options: [
                { value: 'todos', label: 'Todos los barrios' },
                ...availableSectors.map((s) => ({ value: s, label: s })),
              ],
            }}
          />
        )}

        {/* Lista agrupada por barrio o estado vacío */}
        {groupedCobros.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No tienes cobros pendientes para hoy."
            description={
              isEmptyDb
                ? 'Tu base de datos está lista y vacía. Puedes registrar un préstamo nuevo o cargar una ruta de ejemplo en Valledupar.'
                : 'No hay clientes que coincidan con el filtro seleccionado.'
            }
            actionLabel="Nuevo préstamo"
            onAction={() => setActiveSection('nuevo_prestamo')}
            secondaryActionLabel={isEmptyDb ? 'Cargar ruta ejemplo Valledupar' : undefined}
            onSecondaryAction={isEmptyDb ? cargarDatosEjemplo : undefined}
          />
        ) : (
          <div className="space-y-4">
            {groupedCobros.map(({ sector, items }) => {
              const isCollapsed = Boolean(collapsedSectors[sector]);
              const paidCount = items.filter((i) => i.isPaidToday).length;

              return (
                <section key={sector} className="space-y-2.5">
                  <button
                    type="button"
                    onClick={() =>
                      setCollapsedSectors((prev) => ({ ...prev, [sector]: !prev[sector] }))
                    }
                    className="w-full px-3 py-2 bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] flex items-center justify-between text-left"
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold uppercase tracking-wider text-black">
                        {sector} ({items.length})
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-[12px] text-[#525252]">
                      <span>
                        {paidCount}/{items.length} cobrados
                      </span>
                      {isCollapsed ? (
                        <ChevronDown className="w-4 h-4" strokeWidth={2} />
                      ) : (
                        <ChevronUp className="w-4 h-4" strokeWidth={2} />
                      )}
                    </div>
                  </button>

                  {!isCollapsed && (
                    <div className="space-y-3">
                      {items.map((item) => (
                        <CustomerCard
                          key={item.prestamo.id}
                          cliente={item.cliente}
                          prestamo={item.prestamo}
                          cuotaHoy={item.cuotaHoy}
                          pagadoHoy={item.pagadoHoy}
                          noPagoHoy={item.noPagoHoy}
                          recibosPrestamo={item.recibosPrestamo}
                          onCobrar={() =>
                            setSelectedForPayment({
                              prestamo: item.prestamo,
                              cliente: item.cliente,
                              cuota: item.cuotaHoy,
                            })
                          }
                          onVerComprobante={(pago) =>
                            setActiveReceipt({
                              pago,
                              prestamo: item.prestamo,
                              cliente: item.cliente,
                            })
                          }
                        />
                      ))}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}

        {selectedForPayment && (
          <PaymentModal
            prestamo={selectedForPayment.prestamo}
            cliente={selectedForPayment.cliente}
            cuota={selectedForPayment.cuota}
            onClose={() => setSelectedForPayment(null)}
          />
        )}
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 2: MIS PRÉSTAMOS (PENDIENTES / APROBADOS / DESEMBOLSADOS / RECHAZADOS)
  // =========================================================================
  if (activeSection === 'mis_prestamos') {
    const pendientes = prestamos.filter((p) => p.estado === 'pendiente');
    const aprobados = prestamos.filter((p) => p.estado === 'aprobado');
    const desembolsados = prestamos.filter(
      (p) => p.estado === 'activo' || p.estado === 'mora' || p.estado === 'pagado'
    );
    const rechazados = prestamos.filter((p) => p.estado === 'rechazado');

    const currentList =
      prestamosTab === 'pendientes'
        ? pendientes
        : prestamosTab === 'aprobados'
        ? aprobados
        : prestamosTab === 'desembolsados'
        ? desembolsados
        : rechazados;

    // Vista de desembolso paso a paso
    if (disburseTarget) {
      const cli = clientes.find((c) => c.id === disburseTarget.cliente_id);
      return (
        <div className="space-y-4 pb-16">
          <button
            type="button"
            onClick={() => {
              setDisburseTarget(null);
              setDisburseConfirmedCheck(false);
            }}
            className="h-10 px-3 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Volver a Mis préstamos</span>
          </button>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-5 space-y-4">
            <h2 className="text-[18px] font-semibold text-black border-b border-[#E5E7EB] pb-2">
              Desembolsar préstamo aprobado
            </h2>

            <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-4 space-y-2 text-[14px]">
              <div className="flex justify-between">
                <span className="text-[#525252]">Cliente:</span>
                <strong className="text-black">{cli?.nombre_completo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">Préstamo:</span>
                <strong className="text-black">{disburseTarget.codigo}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-[#525252]">Condiciones aprobadas:</span>
                <strong className="text-black">
                  {disburseTarget.num_cuotas} cuotas {getFrecuenciaLabel(disburseTarget.frecuencia)}s de{' '}
                  {formatMoney(disburseTarget.valor_cuota)}
                </strong>
              </div>
              <div className="flex justify-between pt-2 border-t border-[#D1D5DB]">
                <span className="font-semibold text-black">Monto a entregar:</span>
                <strong className="text-[22px] font-bold text-[#2563EB] tabular-nums">
                  {formatMoney(disburseTarget.capital)}
                </strong>
              </div>
            </div>

            <div>
              <span className="block text-[13px] font-semibold text-black mb-1.5">Método de entrega</span>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDisburseMethod('efectivo')}
                  className={`h-11 rounded-[6px] text-[14px] font-medium border ${
                    disburseMethod === 'efectivo'
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-semibold'
                      : 'bg-white text-black border-[#D1D5DB]'
                  }`}
                >
                  Efectivo
                </button>
                <button
                  type="button"
                  onClick={() => setDisburseMethod('transferencia')}
                  className={`h-11 rounded-[6px] text-[14px] font-medium border ${
                    disburseMethod === 'transferencia'
                      ? 'bg-[#EFF6FF] text-[#2563EB] border-[#2563EB] font-semibold'
                      : 'bg-white text-black border-[#D1D5DB]'
                  }`}
                >
                  Transferencia
                </button>
              </div>
            </div>

            <label className="flex items-start gap-2.5 p-3 bg-[#EFF6FF] border border-[#93C5FD] rounded-[6px] cursor-pointer text-[13px] text-black font-medium">
              <input
                type="checkbox"
                checked={disburseConfirmedCheck}
                onChange={(e) => setDisburseConfirmedCheck(e.target.checked)}
                className="mt-0.5 w-4 h-4 accent-[#2563EB]"
              />
              <span>
                Confirmo que entregué {formatMoney(disburseTarget.capital)} a {cli?.nombre_completo}
              </span>
            </label>

            <button
              type="button"
              disabled={!disburseConfirmedCheck || isDisbursing}
              onClick={handleConfirmDisburse}
              className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2 disabled:opacity-40"
            >
              {isDisbursing && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
              <span>CONFIRMAR DESEMBOLSO</span>
            </button>
          </div>
        </div>
      );
    }

    // Comprobante de desembolso exitoso
    if (disburseReceipt) {
      const cli = clientes.find((c) => c.id === disburseReceipt.cliente_id);
      return (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-6 text-center space-y-4">
          <div className="w-12 h-12 rounded-full bg-[#F0FDF4] border border-[#86EFAC] flex items-center justify-center mx-auto text-[#15803D]">
            <CheckCircle2 className="w-6 h-6" strokeWidth={2} />
          </div>
          <h2 className="text-[20px] font-semibold text-black">Comprobante de desembolso</h2>
          <div className="bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-4 text-left text-[13px] space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#525252]">Préstamo:</span>
              <strong className="text-black">{disburseReceipt.codigo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Cliente:</span>
              <strong className="text-black">{cli?.nombre_completo}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Capital entregado:</span>
              <strong className="text-[#15803D] tabular-nums">{formatMoney(disburseReceipt.capital)}</strong>
            </div>
            <div className="flex justify-between">
              <span className="text-[#525252]">Calendario activado:</span>
              <strong className="text-black">
                {disburseReceipt.num_cuotas} cuotas ({getFrecuenciaLabel(disburseReceipt.frecuencia)})
              </strong>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => {
                setDisburseReceipt(null);
                setActiveSection('cobros_hoy');
              }}
              className="h-11 rounded-[6px] bg-[#15803D] text-white text-[13px] font-semibold"
            >
              Ir a Cobros de hoy
            </button>
            <button
              type="button"
              onClick={() => setDisburseReceipt(null)}
              className="h-11 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium"
            >
              Seguir en Mis préstamos
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-black">Mis préstamos</h2>
          <button
            type="button"
            onClick={() => setActiveSection('nuevo_prestamo')}
            className="h-10 px-3.5 rounded-[6px] bg-[#2563EB] text-white text-[13px] font-semibold"
          >
            + Nuevo
          </button>
        </div>

        <FilterBar
          selectedId={prestamosTab}
          onSelect={(id) => setPrestamosTab(id as 'pendientes' | 'aprobados' | 'desembolsados' | 'rechazados')}
          options={[
            { id: 'aprobados', label: 'Aprobados', count: aprobados.length },
            { id: 'pendientes', label: 'Pendientes', count: pendientes.length },
            { id: 'desembolsados', label: 'Desembolsados', count: desembolsados.length },
            { id: 'rechazados', label: 'Rechazados', count: rechazados.length },
          ]}
        />

        {currentList.length === 0 ? (
          <EmptyState title="No hay préstamos en esta categoría." />
        ) : (
          <div className="space-y-3">
            {currentList.map((p) => (
              <LoanCard
                key={p.id}
                prestamo={p}
                actionSlot={
                  p.estado === 'aprobado' ? (
                    <div className="bg-[#EFF6FF] border border-[#93C5FD] rounded-[6px] p-3 space-y-2">
                      <p className="text-[12px] font-semibold text-[#2563EB]">
                        Préstamo aprobado · Listo para entrega
                      </p>
                      <button
                        type="button"
                        onClick={() => {
                          setDisburseTarget(p);
                          setDisburseMethod('efectivo');
                          setDisburseConfirmedCheck(false);
                        }}
                        className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold"
                      >
                        ENTREGAR DINERO
                      </button>
                    </div>
                  ) : undefined
                }
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 3: NUEVO PRÉSTAMO
  // =========================================================================
  if (activeSection === 'nuevo_prestamo') {
    return (
      <div className="pb-16">
        <LoanRequestWizard
          onSuccessDone={() => setActiveSection('mis_prestamos')}
          onCancel={() => setActiveSection('cobros_hoy')}
        />
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 4: MIS CLIENTES
  // =========================================================================
  if (activeSection === 'mis_clientes') {
    if (selectedClient) {
      const clientLoans = prestamos.filter((p) => p.cliente_id === selectedClient.id);
      const clientPayments = pagos.filter((pg) => pg.cliente_id === selectedClient.id);

      return (
        <div className="space-y-4 pb-16">
          <button
            type="button"
            onClick={() => setSelectedClient(null)}
            className="h-10 px-3 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Volver a Mis clientes</span>
          </button>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <h2 className="text-[20px] font-semibold text-black">{selectedClient.nombre_completo}</h2>
            <p className="text-[13px] text-[#525252]">
              Doc: {selectedClient.documento} · {selectedClient.barrio || selectedClient.direccion}
            </p>
          </div>

          <FilterBar
            selectedId={clientDetailTab}
            onSelect={(id) => setClientDetailTab(id as 'info' | 'prestamos' | 'pagos' | 'observaciones')}
            options={[
              { id: 'info', label: 'Información' },
              { id: 'prestamos', label: 'Préstamos', count: clientLoans.length },
              { id: 'pagos', label: 'Historial de pagos', count: clientPayments.length },
              { id: 'observaciones', label: 'Observaciones' },
            ]}
          />

          {clientDetailTab === 'info' && (
            <form
              onSubmit={handleSaveClientEdit}
              className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3"
            >
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={editClientTel}
                  onChange={(e) => setEditClientTel(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Dirección</label>
                <input
                  type="text"
                  value={editClientDir}
                  onChange={(e) => setEditClientDir(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Negocio</label>
                <input
                  type="text"
                  value={editClientNegocio}
                  onChange={(e) => setEditClientNegocio(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                />
              </div>
              <button
                type="submit"
                disabled={isSavingClientEdit}
                className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold"
              >
                {isSavingClientEdit ? 'Guardando...' : 'Guardar cambios'}
              </button>
            </form>
          )}

          {clientDetailTab === 'prestamos' && (
            <div className="space-y-3">
              {clientLoans.length === 0 ? (
                <EmptyState title="Este cliente no tiene préstamos registrados." />
              ) : (
                clientLoans.map((p) => <LoanCard key={p.id} prestamo={p} />)
              )}
            </div>
          )}

          {clientDetailTab === 'pagos' && (
            <div className="bg-white border border-[#D1D5DB] rounded-[8px] divide-y divide-[#E5E7EB]">
              {clientPayments.length === 0 ? (
                <div className="p-6 text-center text-[13px] text-[#525252]">
                  Sin pagos registrados todavía.
                </div>
              ) : (
                clientPayments.map((pg) => (
                  <div key={pg.id} className="p-3.5 flex items-center justify-between text-[13px]">
                    <div>
                      <p className="font-semibold text-black">
                        {pg.tipo === 'no_pago' ? `No pagó (${pg.motivo_no_pago})` : pg.metodo_pago === 'transferencia' ? 'Transferencia' : 'Efectivo'}
                      </p>
                      <p className="text-[12px] text-[#525252]">
                        {formatDate(pg.fecha_pago)} · {pg.hora_pago}
                      </p>
                    </div>
                    <span className="font-bold text-black tabular-nums">{formatMoney(pg.monto)}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {clientDetailTab === 'observaciones' && (
            <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 text-[14px] text-[#525252]">
              {selectedClient.notas || selectedClient.referencia_ubicacion || 'Sin observaciones registradas.'}
            </div>
          )}
        </div>
      );
    }

    const filteredClients = clientes.filter((c) => {
      if (!clientSearch.trim()) return true;
      const q = clientSearch.toLowerCase();
      return (
        c.nombre_completo.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        c.telefono.toLowerCase().includes(q) ||
        (c.barrio && c.barrio.toLowerCase().includes(q)) ||
        c.direccion.toLowerCase().includes(q)
      );
    });

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Mis clientes</h2>

        <SearchInput
          id="clientes-search"
          value={clientSearch}
          onChange={setClientSearch}
          placeholder="Buscar por nombre, cédula, teléfono o barrio..."
        />

        {filteredClients.length === 0 ? (
          <EmptyState title="No se encontraron clientes." />
        ) : (
          <div className="space-y-2.5">
            {filteredClients.map((c) => {
              const loans = prestamos.filter(
                (p) => p.cliente_id === c.id && (p.estado === 'activo' || p.estado === 'mora')
              );
              const saldoTotal = loans.reduce((acc, p) => acc + p.saldo_pendiente, 0);
              const hasMora = loans.some((p) => p.estado === 'mora');

              return (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => handleOpenClientDetail(c)}
                  className="w-full text-left bg-white border border-[#D1D5DB] hover:border-[#2563EB] rounded-[8px] p-4 space-y-2"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-[16px] font-semibold text-black">{c.nombre_completo}</h3>
                      <p className="text-[12px] text-[#525252]">
                        {c.telefono} · {c.barrio || c.direccion}
                      </p>
                    </div>
                    <StatusBadge
                      label={hasMora ? 'En mora' : loans.length > 0 ? 'Activo' : 'Sin crédito'}
                      variant={hasMora ? 'danger' : loans.length > 0 ? 'success' : 'neutral'}
                    />
                  </div>
                  <div className="flex justify-between text-[13px] pt-1 border-t border-[#E5E7EB]">
                    <span className="text-[#525252]">Préstamos activos: <strong className="text-black">{loans.length}</strong></span>
                    <span className="text-[#525252]">Saldo: <strong className="text-black tabular-nums">{formatMoney(saldoTotal)}</strong></span>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 5: GASTOS DE CALLE
  // =========================================================================
  if (activeSection === 'gastos_calle') {
    return (
      <div className="pb-16">
        <ExpenseForm />
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 6: ARQUEO Y CIERRE DE CAJA
  // =========================================================================
  if (activeSection === 'arqueo_cierre') {
    return (
      <div className="pb-16">
        <CashRegisterSummary />
      </div>
    );
  }

  // =========================================================================
  // PANTALLA 7: HISTORIAL DE RECAUDOS
  // =========================================================================
  const filteredPagos = pagos.filter((pg) => {
    if (historyFilter === 'efectivo') return pg.tipo !== 'no_pago' && pg.metodo_pago !== 'transferencia';
    if (historyFilter === 'transferencia') return pg.tipo !== 'no_pago' && pg.metodo_pago === 'transferencia';
    if (historyFilter === 'no_pago') return pg.tipo === 'no_pago';
    return true;
  });

  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-[22px] font-semibold text-black">Historial de recaudos</h2>

      <FilterBar
        selectedId={historyFilter}
        onSelect={(id) => setHistoryFilter(id as 'todos' | 'efectivo' | 'transferencia' | 'no_pago')}
        options={[
          { id: 'todos', label: 'Todos', count: pagos.length },
          { id: 'efectivo', label: 'Efectivo' },
          { id: 'transferencia', label: 'Transferencia' },
          { id: 'no_pago', label: 'No pagos' },
        ]}
      />

      {filteredPagos.length === 0 ? (
        <EmptyState title="Aún no has registrado recaudos en esta jornada." />
      ) : (
        <div className="space-y-2.5">
          {filteredPagos.map((pg: RegistroPago) => {
            const p = prestamos.find((item) => item.id === pg.prestamo_id);
            const cli = clientes.find((c) => c.id === pg.cliente_id);

            return (
              <div
                key={pg.id}
                className="bg-white border border-[#D1D5DB] rounded-[8px] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-[15px] font-semibold text-black truncate">
                    {cli?.nombre_completo || 'Cliente'}
                  </p>
                  <p className="text-[12px] text-[#525252]">
                    {formatDate(pg.fecha_pago)} · {pg.hora_pago} ·{' '}
                    {pg.tipo === 'no_pago'
                      ? `No pagó (${pg.motivo_no_pago})`
                      : pg.metodo_pago === 'transferencia'
                      ? 'Transferencia'
                      : 'Efectivo'}
                  </p>
                </div>

                <div className="text-right shrink-0 flex items-center gap-2">
                  <div>
                    <p
                      className={`text-[15px] font-bold tabular-nums ${
                        pg.tipo === 'no_pago' ? 'text-[#DC2626]' : 'text-[#15803D]'
                      }`}
                    >
                      {formatMoney(pg.monto)}
                    </p>
                    <p className="text-[11px] text-[#525252]">{p?.codigo}</p>
                  </div>
                  {pg.tipo !== 'no_pago' && p && cli && (
                    <button
                      type="button"
                      onClick={() => setActiveReceipt({ pago: pg, prestamo: p, cliente: cli })}
                      aria-label="Ver comprobante"
                      className="w-9 h-9 rounded-[6px] border border-[#D1D5DB] flex items-center justify-center text-black hover:bg-[#F7F8FA]"
                    >
                      <FileText className="w-4 h-4" strokeWidth={2} />
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
