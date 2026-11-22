'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Cliente } from '@/types';
import {
  formatMoney,
  formatDate,
  getEstadoPrestamoBadge,
  getFrecuenciaLabel,
} from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { ApprovalCard } from '@/components/shared/ApprovalCard';
import { CollectorStatusCard, CollectorSummaryData } from '@/components/shared/CollectorStatusCard';
import { ClosingReview } from '@/components/shared/ClosingReview';
import { LoanCard } from '@/components/shared/LoanCard';
import { DataTable, DataColumn } from '@/components/shared/DataTable';
import { FilterBar } from '@/components/shared/FilterBar';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatusBadge, BadgeVariant } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  ArrowLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Wallet,
  Loader2,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function SupervisorView() {
  const {
    activeSection,
    setActiveSection,
    prestamos,
    clientes,
    usuarios,
    rutas,
    pagos,
    cierreCaja,
    cierres,
    oficinas,
    selectedOficinaId,
    auditLogs,
    autorizarPrestamo,
    aprobarCierreCaja,
  } = useApp();

  const activeOffice =
    oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];

  // Estado para revisión detallada de solicitud
  const [inspectingLoan, setInspectingLoan] = useState<Prestamo | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState(false);
  const [rejectModalMode, setRejectModalMode] = useState<'rechazar' | 'solicitar_ajuste' | null>(null);
  const [motivoTexto, setMotivoTexto] = useState('');
  const [isProcessingDecision, setIsProcessingDecision] = useState(false);

  // Estado para detalle de cobrador en calle
  const [selectedCollectorId, setSelectedCollectorId] = useState<string | null>(null);

  // Estado para cartera
  const [carteraStatusFilter, setCarteraStatusFilter] = useState<'todos' | 'al_dia' | 'mora' | 'finalizados'>('todos');
  const [carteraCobradorFilter, setCarteraCobradorFilter] = useState<string>('todos');
  const [carteraFrecFilter, setCarteraFrecFilter] = useState<string>('todos');
  const [carteraSearch, setCarteraSearch] = useState('');
  const [expandedLoanHistoryId, setExpandedLoanHistoryId] = useState<string | null>(null);

  // Estado para clientes
  const [clientSearch, setClientSearch] = useState('');

  const today = getTodayString();

  // Filtrado por oficina del supervisor
  const officeLoans = useMemo(
    () =>
      prestamos.filter((p) =>
        selectedOficinaId === 'todas' ? true : p.oficina_id === activeOffice?.id
      ),
    [prestamos, selectedOficinaId, activeOffice]
  );

  const officeClients = useMemo(
    () =>
      clientes.filter((c) =>
        selectedOficinaId === 'todas' ? true : c.oficina_id === activeOffice?.id
      ),
    [clientes, selectedOficinaId, activeOffice]
  );

  const officeCollectors = useMemo(
    () =>
      usuarios.filter(
        (u) =>
          u.rol === 'cobrador' &&
          (selectedOficinaId === 'todas' || !u.oficina_id || u.oficina_id === activeOffice?.id)
      ),
    [usuarios, selectedOficinaId, activeOffice]
  );

  // Solicitudes pendientes ordenadas de la más antigua a la más reciente
  const solicitudesPendientes = useMemo(() => {
    return officeLoans
      .filter((p) => p.estado === 'pendiente')
      .sort((a, b) => a.fecha_solicitud.localeCompare(b.fecha_solicitud));
  }, [officeLoans]);

  const arqueosPendientes = useMemo(
    () => cierres.filter((c) => c.estado === 'pendiente_revision'),
    [cierres]
  );

  const recaudoHoy = useMemo(() => {
    const sumPagos = pagos
      .filter((pg) => pg.fecha_pago === today && pg.tipo !== 'no_pago')
      .reduce((acc, pg) => acc + pg.monto, 0);
    return Math.max(sumPagos, cierreCaja.total_cobrado);
  }, [pagos, today, cierreCaja]);

  const desembolsosHoy = useMemo(() => {
    const sumLoans = officeLoans
      .filter((p) => p.fecha_desembolso === today)
      .reduce((acc, p) => acc + p.capital, 0);
    return Math.max(sumLoans, cierreCaja.total_desembolsado);
  }, [officeLoans, today, cierreCaja]);

  // Advertencias de riesgo automáticas por préstamo
  const getWarningsForLoan = (p: Prestamo): string[] => {
    const warnings: string[] = [];
    const clientHistory = officeLoans.filter((l) => l.cliente_id === p.cliente_id && l.id !== p.id);
    if (clientHistory.some((l) => l.estado === 'activo')) {
      warnings.push('El cliente tiene préstamos activos actualmente.');
    }
    if (clientHistory.some((l) => l.estado === 'mora')) {
      warnings.push('El cliente registra cartera en mora.');
    }
    if (clientHistory.some((l) => l.estado === 'rechazado')) {
      warnings.push('El cliente tiene solicitudes previas rechazadas.');
    }
    const tope = activeOffice?.tope_aprobacion_automatica || 2000000;
    if (p.capital > tope) {
      warnings.push(`Supera el tope configurado de la oficina (${formatMoney(tope)}).`);
    }
    return warnings;
  };

  // Resumen de cobradores en calle
  const collectorsData: CollectorSummaryData[] = useMemo(() => {
    return officeCollectors.map((cob) => {
      const cobLoans = officeLoans.filter((p) => p.cobrador_id === cob.id && (p.estado === 'activo' || p.estado === 'mora'));
      const cobPagosHoy = pagos.filter((pg) => pg.cobrador_id === cob.id && pg.fecha_pago === today);
      const cobCierre = cierres.find((c) => c.cobrador_id === cob.id) || cierreCaja;
      const cobRutas = rutas.filter((r) => r.cobrador_id === cob.id).map((r) => r.nombre);

      let estadoJornada: CollectorSummaryData['estadoJornada'] = 'En ruta';
      if (cobCierre.estado === 'pendiente_revision') estadoJornada = 'En cierre';
      else if (cobCierre.estado === 'aprobado') estadoJornada = 'Cerrado';
      else if (cobLoans.length === 0 && cobPagosHoy.length === 0) estadoJornada = 'Sin actividad';

      const cobradosUnicos = new Set(cobPagosHoy.filter((pg) => pg.tipo !== 'no_pago').map((pg) => pg.prestamo_id));

      return {
        usuario: cob,
        rutasLabel: cobRutas.length > 0 ? cobRutas.join(' · ') : 'La Nevada · Los Fundadores · Centro',
        estadoJornada,
        clientesProgramados: cobLoans.length,
        clientesCobrados: cobradosUnicos.size,
        recaudoAcumulado: cobCierre.total_cobrado || cobPagosHoy.reduce((a, b) => a + b.monto, 0),
        desembolsosRealizados: cobCierre.total_desembolsado,
        ultimaActividad: cobPagosHoy[0]?.hora_pago || 'Jornada iniciada',
      };
    });
  }, [officeCollectors, officeLoans, pagos, cierres, cierreCaja, rutas, today]);

  const handleConfirmApprove = async () => {
    if (!inspectingLoan || isProcessingDecision) return;
    setIsProcessingDecision(true);
    try {
      await autorizarPrestamo(inspectingLoan.id, 'aprobar');
      setShowApproveConfirm(false);
      setInspectingLoan(null);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  const handleConfirmRejectOrAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inspectingLoan || !rejectModalMode || !motivoTexto.trim() || isProcessingDecision) return;
    setIsProcessingDecision(true);
    try {
      await autorizarPrestamo(inspectingLoan.id, rejectModalMode, motivoTexto.trim());
      setRejectModalMode(null);
      setMotivoTexto('');
      setInspectingLoan(null);
    } finally {
      setIsProcessingDecision(false);
    }
  };

  // =========================================================================
  // 1. RESUMEN DE OFICINA
  // =========================================================================
  if (activeSection === 'resumen_oficina') {
    return (
      <div className="space-y-5 pb-16">
        <div>
          <h2 className="text-[22px] font-semibold text-black">Operación de hoy</h2>
          <p className="text-[13px] text-[#525252]">{activeOffice?.nombre || 'Oficina Central Valledupar'}</p>
        </div>

        {/* Cuadrícula 2x2 en móvil */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Recaudo del día</span>
            <span className="text-[22px] font-bold text-[#15803D] tabular-nums mt-1 block">
              {formatMoney(recaudoHoy)}
            </span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Desembolsos del día</span>
            <span className="text-[22px] font-bold text-black tabular-nums mt-1 block">
              {formatMoney(desembolsosHoy)}
            </span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Cobradores activos</span>
            <span className="text-[22px] font-bold text-black tabular-nums mt-1 block">
              {officeCollectors.length}
            </span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Cierres pendientes</span>
            <span className="text-[22px] font-bold text-[#D97706] tabular-nums mt-1 block">
              {arqueosPendientes.length}
            </span>
          </div>
        </div>

        {/* Accesos directos a bandejas */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => setActiveSection('solicitudes')}
            className="w-full bg-white border border-[#D1D5DB] hover:border-[#2563EB] rounded-[8px] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#FFFBEB] border border-[#FCD34D] flex items-center justify-center text-[#D97706]">
                <Clock className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="text-[15px] font-semibold text-black">
                Solicitudes pendientes: {solicitudesPendientes.length}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#525252]" strokeWidth={2} />
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('arqueos_pendientes')}
            className="w-full bg-white border border-[#D1D5DB] hover:border-[#2563EB] rounded-[8px] p-4 flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-[6px] bg-[#EFF6FF] border border-[#93C5FD] flex items-center justify-center text-[#2563EB]">
                <Wallet className="w-5 h-5" strokeWidth={2} />
              </div>
              <span className="text-[15px] font-semibold text-black">
                Arqueos por revisar: {arqueosPendientes.length}
              </span>
            </div>
            <ChevronRight className="w-5 h-5 text-[#525252]" strokeWidth={2} />
          </button>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. SOLICITUDES POR APROBAR
  // =========================================================================
  if (activeSection === 'solicitudes') {
    if (inspectingLoan) {
      const cli = clientes.find((c) => c.id === inspectingLoan.cliente_id);
      const clientHistory = officeLoans.filter((l) => l.cliente_id === inspectingLoan.cliente_id && l.id !== inspectingLoan.id);
      const warnings = getWarningsForLoan(inspectingLoan);

      return (
        <div className="space-y-4 pb-24">
          <button
            type="button"
            onClick={() => setInspectingLoan(null)}
            className="h-10 px-3 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Volver a solicitudes</span>
          </button>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-4">
            <div className="flex justify-between items-start border-b border-[#E5E7EB] pb-3">
              <div>
                <span className="text-[12px] font-medium text-[#525252]">{inspectingLoan.codigo}</span>
                <h2 className="text-[20px] font-semibold text-black">{cli?.nombre_completo}</h2>
              </div>
              <StatusBadge label="Pendiente" variant="pending" />
            </div>

            {warnings.length > 0 && (
              <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-[6px] p-3 space-y-1 text-[13px] text-[#D97706]">
                {warnings.map((w, i) => (
                  <p key={i} className="font-medium">• {w}</p>
                ))}
              </div>
            )}

            {/* 1. Datos personales */}
            <div className="space-y-1 text-[13px]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">1. Datos personales</h3>
              <p className="text-black">Documento: <strong>{cli?.documento}</strong> · Tel: <strong>{cli?.telefono}</strong></p>
              <p className="text-black">Dirección: <strong>{cli?.direccion}</strong></p>
              {cli?.negocio && <p className="text-black">Negocio: <strong>{cli.negocio}</strong></p>}
            </div>

            {/* 2. Información financiera del cliente */}
            <div className="space-y-1 text-[13px] pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">2. Información financiera actual</h3>
              <p className="text-black">
                Créditos activos: <strong>{clientHistory.filter((l) => l.estado === 'activo' || l.estado === 'mora').length}</strong> ·{' '}
                Saldo vigente: <strong className="tabular-nums">{formatMoney(clientHistory.reduce((a, l) => a + l.saldo_pendiente, 0))}</strong>
              </p>
            </div>

            {/* 3. Historial de préstamos */}
            <div className="space-y-1.5 text-[13px] pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">3. Historial de préstamos</h3>
              {clientHistory.length === 0 ? (
                <p className="text-[#525252]">Cliente nuevo sin créditos previos.</p>
              ) : (
                <div className="space-y-1">
                  {clientHistory.map((h) => (
                    <div key={h.id} className="flex justify-between bg-[#F7F8FA] p-2 rounded-[6px] border border-[#E5E7EB]">
                      <span>{h.codigo} · {formatMoney(h.capital)}</span>
                      <strong className="uppercase text-[11px]">{h.estado}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 4. Condiciones solicitadas */}
            <div className="space-y-1.5 text-[13px] pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">4. Condiciones solicitadas</h3>
              <div className="grid grid-cols-2 gap-2 bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
                <div>
                  <span className="text-[#525252] block">Monto solicitado</span>
                  <strong className="text-black text-[16px] tabular-nums">{formatMoney(inspectingLoan.capital)}</strong>
                </div>
                <div>
                  <span className="text-[#525252] block">Total a pagar</span>
                  <strong className="text-black text-[16px] tabular-nums">{formatMoney(inspectingLoan.total_a_pagar)}</strong>
                </div>
                <div>
                  <span className="text-[#525252] block">Modalidad / Tasa</span>
                  <strong className="text-black">
                    {inspectingLoan.tipo_interes === 'fijo' ? 'Interés fijo' : 'Sobre saldo'} ({inspectingLoan.tasa_interes}%)
                  </strong>
                </div>
                <div>
                  <span className="text-[#525252] block">Plan de cuotas</span>
                  <strong className="text-black tabular-nums">
                    {inspectingLoan.num_cuotas} cuotas {getFrecuenciaLabel(inspectingLoan.frecuencia)}s de{' '}
                    {formatMoney(inspectingLoan.valor_cuota)}
                  </strong>
                </div>
              </div>
            </div>

            {/* 5. Simulación y calendario */}
            <div className="space-y-1.5 text-[13px] pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">5. Simulación y calendario</h3>
              <div className="max-h-40 overflow-y-auto border border-[#E5E7EB] rounded-[6px]">
                <table className="w-full text-left text-[12px]">
                  <thead className="bg-[#F7F8FA] border-b border-[#E5E7EB] text-[#525252]">
                    <tr>
                      <th className="p-2">Cuota</th>
                      <th className="p-2">Vencimiento</th>
                      <th className="p-2 text-right">Valor</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E5E7EB] text-black">
                    {(inspectingLoan.cuotas || []).map((q) => (
                      <tr key={q.id}>
                        <td className="p-2 font-medium">{q.numero_cuota}</td>
                        <td className="p-2">{formatDate(q.fecha_vencimiento)}</td>
                        <td className="p-2 text-right font-semibold tabular-nums">{formatMoney(q.monto_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 6. Observaciones del cobrador */}
            <div className="space-y-1 text-[13px] pt-2 border-t border-[#E5E7EB]">
              <h3 className="text-[12px] font-semibold uppercase text-[#525252]">6. Observaciones del cobrador</h3>
              <p className="text-black bg-[#F7F8FA] p-2.5 rounded-[6px] border border-[#E5E7EB]">
                {inspectingLoan.notas || 'Sin observaciones adicionales.'}
              </p>
            </div>
          </div>

          {/* Acciones inferiores */}
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => {
                  setRejectModalMode('rechazar');
                  setMotivoTexto('');
                }}
                className="h-12 rounded-[6px] bg-[#DC2626] hover:bg-[#B91C1C] text-white text-[14px] font-semibold"
              >
                RECHAZAR
              </button>
              <button
                type="button"
                onClick={() => setShowApproveConfirm(true)}
                className="h-12 rounded-[6px] bg-[#15803D] hover:bg-[#166534] text-white text-[14px] font-semibold"
              >
                APROBAR
              </button>
            </div>

            <button
              type="button"
              onClick={() => {
                setRejectModalMode('solicitar_ajuste');
                setMotivoTexto('');
              }}
              className="w-full h-11 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[13px] font-medium"
            >
              SOLICITAR AJUSTES
            </button>
          </div>

          <ConfirmDialog
            isOpen={showApproveConfirm}
            title="Confirmar aprobación de préstamo"
            message={`Autorizarás ${formatMoney(inspectingLoan.capital)} para ${cli?.nombre_completo} en ${inspectingLoan.num_cuotas} cuotas de ${formatMoney(inspectingLoan.valor_cuota)}.`}
            confirmLabel="Aprobar préstamo"
            variant="success"
            isLoading={isProcessingDecision}
            onConfirm={handleConfirmApprove}
            onCancel={() => setShowApproveConfirm(false)}
          />

          {rejectModalMode && (
            <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
              <form
                onSubmit={handleConfirmRejectOrAdjust}
                className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-sm w-full p-5 space-y-3"
              >
                <h3 className="text-[16px] font-semibold text-black">
                  {rejectModalMode === 'rechazar' ? 'Rechazar solicitud' : 'Solicitar ajustes al cobrador'}
                </h3>
                <textarea
                  rows={3}
                  value={motivoTexto}
                  onChange={(e) => setMotivoTexto(e.target.value)}
                  placeholder={
                    rejectModalMode === 'rechazar'
                      ? 'Motivo obligatorio del rechazo...'
                      : 'Indica qué condición debe ajustar el cobrador...'
                  }
                  className="w-full p-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setRejectModalMode(null)}
                    className="h-11 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isProcessingDecision || !motivoTexto.trim()}
                    className={`h-11 rounded-[6px] text-white text-[13px] font-semibold flex items-center justify-center gap-1 ${
                      rejectModalMode === 'rechazar' ? 'bg-[#DC2626]' : 'bg-[#2563EB]'
                    }`}
                  >
                    {isProcessingDecision && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                    <span>Confirmar</span>
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Solicitudes por aprobar</h2>

        {solicitudesPendientes.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="No hay solicitudes pendientes de aprobación."
          />
        ) : (
          <div className="space-y-3">
            {solicitudesPendientes.map((p) => (
              <ApprovalCard
                key={p.id}
                prestamo={p}
                cliente={clientes.find((c) => c.id === p.cliente_id)}
                warnings={getWarningsForLoan(p)}
                onInspect={() => setInspectingLoan(p)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3. COBRADORES EN CALLE
  // =========================================================================
  if (activeSection === 'cobradores_calle') {
    if (selectedCollectorId) {
      const colData = collectorsData.find((c) => c.usuario.id === selectedCollectorId);
      const colClients = officeClients.filter((c) => c.cobrador_id === selectedCollectorId);
      const colMovs = pagos.filter((pg) => pg.cobrador_id === selectedCollectorId);
      const colCierre = cierres.find((c) => c.cobrador_id === selectedCollectorId) || cierreCaja;
      const cobEfectivo = colMovs
        .filter((m) => m.tipo !== 'no_pago' && m.metodo_pago !== 'transferencia')
        .reduce((a, b) => a + b.monto, 0);
      const cobTransf = colMovs
        .filter((m) => m.tipo !== 'no_pago' && m.metodo_pago === 'transferencia')
        .reduce((a, b) => a + b.monto, 0);

      return (
        <div className="space-y-4 pb-16">
          <button
            type="button"
            onClick={() => setSelectedCollectorId(null)}
            className="h-10 px-3 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-medium flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" strokeWidth={2} />
            <span>Volver a Cobradores</span>
          </button>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
            <h2 className="text-[18px] font-semibold text-black">{colData?.usuario.nombre_completo}</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[13px]">
              <div className="bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
                <span className="text-[#525252] block">Recaudo efectivo</span>
                <strong className="text-[#15803D] tabular-nums">{formatMoney(Math.max(cobEfectivo, colCierre.total_cobrado_efectivo || 0))}</strong>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
                <span className="text-[#525252] block">Recaudo transferencia</span>
                <strong className="text-[#2563EB] tabular-nums">{formatMoney(Math.max(cobTransf, colCierre.total_cobrado_transferencia || 0))}</strong>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
                <span className="text-[#525252] block">Desembolsos</span>
                <strong className="text-black tabular-nums">{formatMoney(colCierre.total_desembolsado)}</strong>
              </div>
              <div className="bg-[#F7F8FA] p-3 rounded-[6px] border border-[#E5E7EB]">
                <span className="text-[#525252] block">Gastos</span>
                <strong className="text-[#DC2626] tabular-nums">{formatMoney(colCierre.total_gastos)}</strong>
              </div>
              <div className="bg-[#EFF6FF] p-3 rounded-[6px] border border-[#93C5FD]">
                <span className="text-[#2563EB] block font-medium">Caja esperada</span>
                <strong className="text-black tabular-nums">{formatMoney(colCierre.efectivo_esperado)}</strong>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
            <h3 className="text-[14px] font-semibold text-black">Clientes asignados ({colClients.length})</h3>
            <div className="divide-y divide-[#E5E7EB] text-[13px]">
              {colClients.map((c) => (
                <div key={c.id} className="py-2 flex justify-between">
                  <span className="font-medium text-black">{c.nombre_completo}</span>
                  <span className="text-[#525252]">{c.barrio || c.direccion}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
            <h3 className="text-[14px] font-semibold text-black">Movimientos del día ({colMovs.length})</h3>
            {colMovs.length === 0 ? (
              <p className="text-[13px] text-[#525252]">Sin movimientos registrados aún hoy.</p>
            ) : (
              <div className="divide-y divide-[#E5E7EB] text-[13px]">
                {colMovs.map((m) => (
                  <div key={m.id} className="py-2 flex justify-between">
                    <span className="text-[#525252]">
                      {m.hora_pago} · {m.tipo === 'no_pago' ? 'No pagó' : m.metodo_pago || 'Efectivo'}
                    </span>
                    <strong className="text-black tabular-nums">{formatMoney(m.monto)}</strong>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Cobradores en calle</h2>
        {collectorsData.length === 0 ? (
          <EmptyState title="No hay cobradores asignados a esta oficina." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {collectorsData.map((d) => (
              <CollectorStatusCard
                key={d.usuario.id}
                data={d}
                onSelect={() => setSelectedCollectorId(d.usuario.id)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 4. ARQUEOS PENDIENTES
  // =========================================================================
  if (activeSection === 'arqueos_pendientes') {
    const orderedClosings = [...cierres].sort((a, b) =>
      a.estado === 'pendiente_revision' && b.estado !== 'pendiente_revision' ? -1 : 1
    );

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Arqueos pendientes</h2>

        {arqueosPendientes.length === 0 && orderedClosings.length === 0 ? (
          <EmptyState title="No tienes cierres pendientes de revisar." />
        ) : (
          <div className="space-y-3">
            {orderedClosings.map((cierre) => (
              <ClosingReview
                key={cierre.id}
                cierre={cierre}
                pagosRelacionados={pagos.filter((pg) => pg.cobrador_id === cierre.cobrador_id)}
                onApprove={(id, obs) => aprobarCierreCaja(id, true, obs)}
                onReject={(id, motivo) => aprobarCierreCaja(id, false, motivo)}
              />
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. CARTERA
  // =========================================================================
  if (activeSection === 'cartera') {
    const filteredCartera = officeLoans.filter((p) => {
      if (carteraStatusFilter === 'al_dia' && p.estado !== 'activo') return false;
      if (carteraStatusFilter === 'mora' && p.estado !== 'mora') return false;
      if (carteraStatusFilter === 'finalizados' && p.estado !== 'pagado') return false;
      if (carteraCobradorFilter !== 'todos' && p.cobrador_id !== carteraCobradorFilter) return false;
      if (carteraFrecFilter !== 'todos' && p.frecuencia !== carteraFrecFilter) return false;

      if (carteraSearch.trim()) {
        const q = carteraSearch.toLowerCase();
        const cli = clientes.find((c) => c.id === p.cliente_id);
        const matches =
          p.codigo.toLowerCase().includes(q) ||
          (cli?.nombre_completo.toLowerCase().includes(q) ?? false) ||
          (cli?.barrio?.toLowerCase().includes(q) ?? false);
        if (!matches) return false;
      }
      return true;
    });

    const columns: DataColumn<Prestamo>[] = [
      {
        key: 'cliente',
        header: 'Cliente',
        render: (p) => (
          <div>
            <p className="font-semibold text-black">{p.cliente?.nombre_completo || 'Cliente'}</p>
            <p className="text-[12px] text-[#525252]">{p.codigo}</p>
          </div>
        ),
      },
      {
        key: 'cobrador',
        header: 'Cobrador',
        render: (p) => <span className="text-[#525252]">{p.cobrador_nombre || '-'}</span>,
      },
      {
        key: 'capital',
        header: 'Capital',
        align: 'right',
        render: (p) => <span className="font-medium text-black">{formatMoney(p.capital)}</span>,
      },
      {
        key: 'saldo',
        header: 'Saldo pendiente',
        align: 'right',
        render: (p) => <span className="font-bold text-black">{formatMoney(p.saldo_pendiente)}</span>,
      },
      {
        key: 'cuota',
        header: 'Cuota',
        align: 'right',
        render: (p) => (
          <span>
            {formatMoney(p.valor_cuota)} ({getFrecuenciaLabel(p.frecuencia)})
          </span>
        ),
      },
      {
        key: 'estado',
        header: 'Estado',
        align: 'center',
        render: (p) => {
          const b = getEstadoPrestamoBadge(p.estado);
          const v: Record<string, BadgeVariant> = {
            pendiente: 'pending',
            aprobado: 'info',
            activo: 'success',
            pagado: 'neutral',
            rechazado: 'danger',
            mora: 'danger',
          };
          return <StatusBadge label={b.label} variant={v[p.estado] || 'neutral'} />;
        },
      },
    ];

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Cartera</h2>

        <SearchInput
          id="cartera-sup-search"
          value={carteraSearch}
          onChange={setCarteraSearch}
          placeholder="Buscar por cliente, código o barrio..."
        />

        <FilterBar
          selectedId={carteraStatusFilter}
          onSelect={(id) => setCarteraStatusFilter(id as 'todos' | 'al_dia' | 'mora' | 'finalizados')}
          options={[
            { id: 'todos', label: 'Todos', count: officeLoans.length },
            { id: 'al_dia', label: 'Al día' },
            { id: 'mora', label: 'En mora' },
            { id: 'finalizados', label: 'Finalizados' },
          ]}
          secondarySelect={{
            label: 'Filtrar por frecuencia',
            value: carteraFrecFilter,
            onChange: setCarteraFrecFilter,
            options: [
              { value: 'todos', label: 'Todas frecuencias' },
              { value: 'diario', label: 'Diaria' },
              { value: 'semanal', label: 'Semanal' },
              { value: 'quincenal', label: 'Quincenal' },
              { value: 'mensual', label: 'Mensual' },
            ],
          }}
        />

        {officeCollectors.length > 1 && (
          <select
            aria-label="Filtrar por cobrador"
            value={carteraCobradorFilter}
            onChange={(e) => setCarteraCobradorFilter(e.target.value)}
            className="h-10 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[13px] text-black"
          >
            <option value="todos">Todos los cobradores</option>
            {officeCollectors.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nombre_completo}
              </option>
            ))}
          </select>
        )}

        <DataTable
          data={filteredCartera}
          columns={columns}
          keyExtractor={(p) => p.id}
          emptyTitle="No se encontraron préstamos con estos filtros."
          renderMobileCard={(p) => (
            <div className="space-y-2">
              <LoanCard
                prestamo={p}
                showCollector
                actionSlot={
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedLoanHistoryId(expandedLoanHistoryId === p.id ? null : p.id)
                    }
                    className="w-full h-9 rounded-[6px] border border-[#D1D5DB] text-[12px] font-medium text-[#2563EB] flex items-center justify-center gap-1"
                  >
                    <span>
                      {expandedLoanHistoryId === p.id ? 'Ocultar historial financiero' : 'Ver historial financiero'}
                    </span>
                    {expandedLoanHistoryId === p.id ? (
                      <ChevronUp className="w-3.5 h-3.5" strokeWidth={2} />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" strokeWidth={2} />
                    )}
                  </button>
                }
              />
              {expandedLoanHistoryId === p.id && (
                <div className="bg-[#F7F8FA] border border-[#D1D5DB] rounded-[8px] p-3 text-[12px] space-y-1">
                  <p className="font-semibold text-black">Pagos registrados:</p>
                  {pagos.filter((pg) => pg.prestamo_id === p.id).length === 0 ? (
                    <p className="text-[#525252]">Sin pagos registrados aún.</p>
                  ) : (
                    pagos
                      .filter((pg) => pg.prestamo_id === p.id)
                      .map((pg) => (
                        <div key={pg.id} className="flex justify-between">
                          <span>{formatDate(pg.fecha_pago)}</span>
                          <strong className="text-black tabular-nums">{formatMoney(pg.monto)}</strong>
                        </div>
                      ))
                  )}
                </div>
              )}
            </div>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // 6. CLIENTES DE LA OFICINA
  // =========================================================================
  if (activeSection === 'clientes') {
    const filteredCli = officeClients.filter((c) => {
      if (!clientSearch.trim()) return true;
      const q = clientSearch.toLowerCase();
      return (
        c.nombre_completo.toLowerCase().includes(q) ||
        c.documento.toLowerCase().includes(q) ||
        (c.barrio && c.barrio.toLowerCase().includes(q))
      );
    });

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Clientes de la oficina</h2>
        <SearchInput
          id="sup-clientes-search"
          value={clientSearch}
          onChange={setClientSearch}
          placeholder="Buscar cliente por nombre, cédula o barrio..."
        />
        {filteredCli.length === 0 ? (
          <EmptyState title="No se encontraron clientes." />
        ) : (
          <div className="space-y-2.5">
            {filteredCli.map((c: Cliente) => {
              const cliLoans = officeLoans.filter((p) => p.cliente_id === c.id);
              const saldo = cliLoans.reduce((a, p) => a + p.saldo_pendiente, 0);
              return (
                <div key={c.id} className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 flex justify-between items-center">
                  <div>
                    <p className="text-[16px] font-semibold text-black">{c.nombre_completo}</p>
                    <p className="text-[12px] text-[#525252]">Doc: {c.documento} · {c.barrio || c.direccion}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[11px] text-[#525252] block">Saldo total</span>
                    <strong className="text-[14px] text-black tabular-nums">{formatMoney(saldo)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 7. HISTORIAL DE OPERACIONES
  // =========================================================================
  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-[22px] font-semibold text-black">Historial de operaciones</h2>
      {auditLogs.length === 0 ? (
        <EmptyState title="Aún no hay operaciones registradas en esta sesión." />
      ) : (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] divide-y divide-[#E5E7EB]">
          {auditLogs.map((ev) => (
            <div key={ev.id} className="p-3.5 flex items-start justify-between gap-2 text-[13px]">
              <div>
                <p className="font-semibold text-black">{ev.accion}</p>
                <p className="text-[12px] text-[#525252]">{ev.detalle}</p>
                <p className="text-[11px] text-[#8A8A8A] mt-0.5">Usuario: {ev.usuario}</p>
              </div>
              <span className="text-[12px] text-[#525252] shrink-0">
                {formatDate(ev.fecha)} · {ev.hora}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
