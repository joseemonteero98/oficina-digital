'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Prestamo, Usuario, UserRole } from '@/types';
import {
  formatMoney,
  formatDate,
  getEstadoPrestamoBadge,
  getFrecuenciaLabel,
  exportToCsv,
} from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { DataTable, DataColumn } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { FilterBar } from '@/components/shared/FilterBar';
import { StatusBadge, BadgeVariant } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog';
import {
  Download,
  UserPlus,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Loader2,
  X,
} from 'lucide-react';

export function AdminView() {
  const {
    activeSection,
    setActiveSection,
    oficinas,
    usuarios,
    clientes,
    prestamos,
    pagos,
    cierres,
    cierreCaja,
    selectedOficinaId,
    setSelectedOficinaId,
    auditLogs,
    crearUsuario,
    actualizarUsuario,
    actualizarOficina,
    showToast,
  } = useApp();

  const today = getTodayString();

  // Estado Equipo
  const [teamTab, setTeamTab] = useState<'supervisores' | 'cobradores'>('supervisores');
  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<Usuario | null>(null);
  const [userFormNombre, setUserFormNombre] = useState('');
  const [userFormDoc, setUserFormDoc] = useState('');
  const [userFormTel, setUserFormTel] = useState('');
  const [userFormRol, setUserFormRol] = useState<UserRole>('cobrador');
  const [userFormOfi, setUserFormOfi] = useState(oficinas[0]?.id || '');
  const [userFormSup, setUserFormSup] = useState('');
  const [isSavingUser, setIsSavingUser] = useState(false);
  const [toggleTargetUser, setToggleTargetUser] = useState<Usuario | null>(null);

  // Estado Libro Maestro
  const [masterSearch, setMasterSearch] = useState('');
  const [masterStatusFilter, setMasterStatusFilter] = useState<string>('todos');
  const [expandedMobileLoanId, setExpandedMobileLoanId] = useState<string | null>(null);

  // Estado Clientes
  const [clientSearch, setClientSearch] = useState('');

  // Estado Configuración de Oficina
  const targetOffice =
    oficinas.find((o) => o.id === selectedOficinaId) || oficinas[0];
  const [cfgNombre, setCfgNombre] = useState(targetOffice?.nombre || '');
  const [cfgCiudad, setCfgCiudad] = useState(targetOffice?.ciudad || '');
  const [cfgTelefono, setCfgTelefono] = useState(targetOffice?.telefono || '');
  const [cfgTasa, setCfgTasa] = useState(String(targetOffice?.tasa_interes_defecto ?? 20));
  const [cfgExcluirDom, setCfgExcluirDom] = useState(Boolean(targetOffice?.excluir_domingos ?? true));
  const [cfgTope, setCfgTope] = useState(String(targetOffice?.tope_aprobacion_automatica ?? 2000000));
  const [isSavingConfig, setIsSavingConfig] = useState(false);

  // Filtrado por oficina
  const scopedLoans = useMemo(
    () =>
      prestamos.filter((p) =>
        selectedOficinaId === 'todas' ? true : p.oficina_id === selectedOficinaId
      ),
    [prestamos, selectedOficinaId]
  );

  const scopedClients = useMemo(
    () =>
      clientes.filter((c) =>
        selectedOficinaId === 'todas' ? true : c.oficina_id === selectedOficinaId
      ),
    [clientes, selectedOficinaId]
  );

  const scopedUsers = useMemo(
    () =>
      usuarios.filter((u) =>
        u.rol === 'dueno'
          ? false
          : selectedOficinaId === 'todas' || !u.oficina_id || u.oficina_id === selectedOficinaId
      ),
    [usuarios, selectedOficinaId]
  );

  // KPIs financieros con definiciones claras
  const activeAndMoraLoans = scopedLoans.filter((p) => p.estado === 'activo' || p.estado === 'mora');
  const capitalTotalColocado = activeAndMoraLoans.reduce((acc, p) => acc + p.capital, 0);
  const capitalPendienteRecuperar = activeAndMoraLoans.reduce((acc, p) => {
    const ratioCapital = p.total_a_pagar > 0 ? p.capital / p.total_a_pagar : 1;
    return acc + Math.round(p.saldo_pendiente * ratioCapital);
  }, 0);
  const recaudoDelDia = Math.max(
    pagos.filter((pg) => pg.fecha_pago === today && pg.tipo !== 'no_pago').reduce((a, b) => a + b.monto, 0),
    cierreCaja.total_cobrado
  );
  const carteraVencida = scopedLoans
    .filter((p) => p.estado === 'mora')
    .reduce((acc, p) => acc + p.saldo_pendiente, 0);
  const prestamosActivosCount = activeAndMoraLoans.length;
  const prestamosNuevosPeriodo = scopedLoans.filter((p) => p.fecha_solicitud === today).length;

  const openCreateUserModal = (defaultRole: UserRole) => {
    setEditingUser(null);
    setUserFormNombre('');
    setUserFormDoc('');
    setUserFormTel('');
    setUserFormRol(defaultRole);
    setUserFormOfi(targetOffice?.id || oficinas[0]?.id || '');
    setUserFormSup(usuarios.find((u) => u.rol === 'supervisor')?.id || '');
    setUserModalOpen(true);
  };

  const openEditUserModal = (u: Usuario) => {
    setEditingUser(u);
    setUserFormNombre(u.nombre_completo);
    setUserFormDoc(u.documento || '');
    setUserFormTel(u.telefono);
    setUserFormRol(u.rol);
    setUserFormOfi(u.oficina_id || oficinas[0]?.id || '');
    setUserFormSup(u.supervisor_id || '');
    setUserModalOpen(true);
  };

  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userFormNombre.trim() || (!editingUser && !userFormDoc.trim())) {
      showToast('error', 'Completa nombre y documento.');
      return;
    }
    setIsSavingUser(true);
    try {
      if (editingUser) {
        await actualizarUsuario(editingUser.id, {
          nombre_completo: userFormNombre.trim(),
          telefono: userFormTel.trim(),
          rol: userFormRol,
          oficina_id: userFormOfi || null,
          supervisor_id: userFormRol === 'cobrador' ? userFormSup || null : null,
        });
      } else {
        await crearUsuario({
          nombre_completo: userFormNombre.trim(),
          documento: userFormDoc.trim(),
          telefono: userFormTel.trim(),
          rol: userFormRol,
          oficina_id: userFormOfi || null,
          supervisor_id: userFormRol === 'cobrador' ? userFormSup || null : null,
        });
      }
      setUserModalOpen(false);
    } finally {
      setIsSavingUser(false);
    }
  };

  const handleToggleActiveUser = async () => {
    if (!toggleTargetUser) return;
    await actualizarUsuario(toggleTargetUser.id, { activo: !toggleTargetUser.activo });
    setToggleTargetUser(null);
  };

  const handleSaveOfficeConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetOffice) return;
    setIsSavingConfig(true);
    try {
      await actualizarOficina(targetOffice.id, {
        nombre: cfgNombre.trim(),
        ciudad: cfgCiudad.trim(),
        telefono: cfgTelefono.trim(),
        tasa_interes_defecto: Number(cfgTasa),
        excluir_domingos: cfgExcluirDom,
        tope_aprobacion_automatica: Number(cfgTope),
      });
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleExportLoansCsv = () => {
    exportToCsv(
      `libro-maestro-${today}.csv`,
      [
        'Código',
        'Cliente',
        'Oficina',
        'Cobrador',
        'Desembolso',
        'Capital Inicial',
        'Interés',
        'Total Pactado',
        'Total Recaudado',
        'Saldo Pendiente',
        'Estado',
      ],
      scopedLoans.map((p) => [
        p.codigo,
        p.cliente?.nombre_completo || 'Cliente',
        oficinas.find((o) => o.id === p.oficina_id)?.nombre || '',
        p.cobrador_nombre || '',
        p.fecha_desembolso || p.fecha_solicitud,
        p.capital,
        p.total_interes,
        p.total_a_pagar,
        p.total_recaudado,
        p.saldo_pendiente,
        p.estado,
      ])
    );
    showToast('success', 'Reporte CSV descargado.');
  };

  // =========================================================================
  // 1. RESUMEN ADMINISTRATIVO
  // =========================================================================
  if (activeSection === 'resumen') {
    const officeSummaryRows = oficinas.map((ofi) => {
      const ofiLoans = prestamos.filter((p) => p.oficina_id === ofi.id);
      const mora = ofiLoans.filter((p) => p.estado === 'mora').reduce((a, p) => a + p.saldo_pendiente, 0);
      const activos = ofiLoans.filter((p) => p.estado === 'activo' || p.estado === 'mora').length;
      const recaudo = pagos
        .filter((pg) => pg.oficina_id === ofi.id && pg.fecha_pago === today && pg.tipo !== 'no_pago')
        .reduce((a, b) => a + b.monto, 0);
      return { id: ofi.id, nombre: ofi.nombre, recaudo: Math.max(recaudo, cierreCaja.total_cobrado), mora, activos };
    });

    const collectorRows = scopedUsers
      .filter((u) => u.rol === 'cobrador')
      .map((c) => {
        const cLoans = scopedLoans.filter((p) => p.cobrador_id === c.id);
        const mora = cLoans.filter((p) => p.estado === 'mora').reduce((a, p) => a + p.saldo_pendiente, 0);
        const recaudo = pagos
          .filter((pg) => pg.cobrador_id === c.id && pg.fecha_pago === today && pg.tipo !== 'no_pago')
          .reduce((a, b) => a + b.monto, 0);
        return {
          id: c.id,
          nombre: c.nombre_completo,
          clientes: scopedClients.filter((cl) => cl.cobrador_id === c.id).length,
          recaudo: Math.max(recaudo, cierreCaja.total_cobrado),
          mora,
          activo: c.activo,
        };
      });

    const solicitudesAcumuladas = scopedLoans.filter((p) => p.estado === 'pendiente').length;
    const cierresSinAprobar = cierres.filter((c) => c.estado === 'pendiente_revision').length;
    const clientesMoraCount = scopedLoans.filter((p) => p.estado === 'mora').length;

    return (
      <div className="space-y-6 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-[22px] font-semibold text-black">Resumen administrativo</h2>
            <p className="text-[13px] text-[#525252]">{targetOffice?.nombre || 'Oficinas asignadas'}</p>
          </div>
        </div>

        {/* 6 Indicadores financieros con definiciones claras */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Capital total colocado</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {formatMoney(capitalTotalColocado)}
            </strong>
            <span className="text-[11px] text-[#525252]">Principal activo en calle</span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Capital pendiente por recuperar</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {formatMoney(capitalPendienteRecuperar)}
            </strong>
            <span className="text-[11px] text-[#525252]">Porción de capital sin cobrar</span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Recaudo del día</span>
            <strong className="text-[22px] font-bold text-[#15803D] tabular-nums block mt-1">
              {formatMoney(recaudoDelDia)}
            </strong>
            <span className="text-[11px] text-[#525252]">Ingresos cobrados hoy</span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Cartera vencida</span>
            <strong className="text-[22px] font-bold text-[#DC2626] tabular-nums block mt-1">
              {formatMoney(carteraVencida)}
            </strong>
            <span className="text-[11px] text-[#DC2626]">Saldo total en mora</span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Préstamos activos</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {prestamosActivosCount}
            </strong>
            <span className="text-[11px] text-[#525252]">Al día y en mora</span>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Préstamos nuevos del periodo</span>
            <strong className="text-[22px] font-bold text-[#2563EB] tabular-nums block mt-1">
              {prestamosNuevosPeriodo}
            </strong>
            <span className="text-[11px] text-[#525252]">Solicitudes de hoy</span>
          </div>
        </div>

        {/* Alertas operativas */}
        {(solicitudesAcumuladas > 0 || cierresSinAprobar > 0 || clientesMoraCount > 0) && (
          <div className="bg-[#FFFBEB] border border-[#FCD34D] rounded-[8px] p-4 space-y-2">
            <h3 className="text-[14px] font-semibold text-black flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-[#D97706]" strokeWidth={2} />
              <span>Alertas operativas</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[13px] text-black">
              <p>• Solicitudes acumuladas: <strong>{solicitudesAcumuladas}</strong></p>
              <p>• Cierres sin aprobar: <strong>{cierresSinAprobar}</strong></p>
              <p>• Clientes con mora: <strong>{clientesMoraCount}</strong></p>
            </div>
          </div>
        )}

        {/* Rendimiento por oficina */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-semibold text-black">Rendimiento por oficina</h3>
          <DataTable
            data={officeSummaryRows}
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'nombre', header: 'Oficina', render: (r) => <strong className="text-black">{r.nombre}</strong> },
              { key: 'recaudo', header: 'Recaudo', align: 'right', render: (r) => <span className="text-[#15803D] font-semibold">{formatMoney(r.recaudo)}</span> },
              { key: 'mora', header: 'Cartera vencida', align: 'right', render: (r) => <span className="text-[#DC2626] font-semibold">{formatMoney(r.mora)}</span> },
              { key: 'activos', header: 'Préstamos activos', align: 'right', render: (r) => <strong>{r.activos}</strong> },
            ]}
            renderMobileCard={(r) => (
              <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
                <p className="font-semibold text-black">{r.nombre}</p>
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div><span className="text-[#525252] block">Recaudo</span><strong className="text-[#15803D]">{formatMoney(r.recaudo)}</strong></div>
                  <div><span className="text-[#525252] block">Mora</span><strong className="text-[#DC2626]">{formatMoney(r.mora)}</strong></div>
                  <div><span className="text-[#525252] block">Activos</span><strong>{r.activos}</strong></div>
                </div>
              </div>
            )}
          />
        </div>

        {/* Rendimiento por cobrador */}
        <div className="space-y-2">
          <h3 className="text-[16px] font-semibold text-black">Rendimiento por cobrador</h3>
          <DataTable
            data={collectorRows}
            keyExtractor={(r) => r.id}
            columns={[
              { key: 'nombre', header: 'Cobrador', render: (r) => <strong className="text-black">{r.nombre}</strong> },
              { key: 'clientes', header: 'Clientes', align: 'right', render: (r) => <span>{r.clientes}</span> },
              { key: 'recaudo', header: 'Recaudo', align: 'right', render: (r) => <span className="text-[#15803D] font-semibold">{formatMoney(r.recaudo)}</span> },
              { key: 'mora', header: 'Mora', align: 'right', render: (r) => <span className="text-[#DC2626]">{formatMoney(r.mora)}</span> },
              { key: 'estado', header: 'Estado', align: 'center', render: (r) => <StatusBadge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'neutral'} /> },
            ]}
            renderMobileCard={(r) => (
              <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-black">{r.nombre}</strong>
                  <StatusBadge label={r.activo ? 'Activo' : 'Inactivo'} variant={r.activo ? 'success' : 'neutral'} />
                </div>
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div><span className="text-[#525252] block">Clientes</span><strong>{r.clientes}</strong></div>
                  <div><span className="text-[#525252] block">Recaudo</span><strong className="text-[#15803D]">{formatMoney(r.recaudo)}</strong></div>
                  <div><span className="text-[#525252] block">Mora</span><strong className="text-[#DC2626]">{formatMoney(r.mora)}</strong></div>
                </div>
              </div>
            )}
          />
        </div>
      </div>
    );
  }

  // =========================================================================
  // 2. OFICINAS ASIGNADAS
  // =========================================================================
  if (activeSection === 'oficinas_asignadas') {
    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">Oficinas asignadas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {oficinas.map((o) => (
            <div key={o.id} className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-[16px] font-semibold text-black">{o.nombre}</h3>
                  <p className="text-[12px] text-[#525252]">{o.ciudad} · Tel: {o.telefono}</p>
                </div>
                <StatusBadge label={o.activa ? 'Activa' : 'Inactiva'} variant={o.activa ? 'success' : 'neutral'} />
              </div>
              <div className="text-[13px] text-[#525252] space-y-1">
                <p>Tasa predeterminada: <strong className="text-black">{o.tasa_interes_defecto}%</strong></p>
                <p>Domingos: <strong className="text-black">{o.excluir_domingos ? 'Excluidos' : 'Incluidos'}</strong></p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setSelectedOficinaId(o.id);
                  setActiveSection('configuracion');
                }}
                className="w-full h-10 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-[#2563EB] border border-[#D1D5DB] text-[13px] font-semibold"
              >
                Configurar oficina
              </button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // =========================================================================
  // 3, 4, 5. GESTIÓN DE EQUIPO / SUPERVISORES / COBRADORES
  // =========================================================================
  if (
    activeSection === 'equipo' ||
    activeSection === 'supervisores' ||
    activeSection === 'cobradores'
  ) {
    const activeRoleFilter: UserRole =
      activeSection === 'supervisores'
        ? 'supervisor'
        : activeSection === 'cobradores'
        ? 'cobrador'
        : teamTab === 'supervisores'
        ? 'supervisor'
        : 'cobrador';

    const filteredUsers = scopedUsers.filter((u) => u.rol === activeRoleFilter);

    const userColumns: DataColumn<Usuario>[] = [
      { key: 'nombre', header: 'Nombre', render: (u) => <strong className="text-black">{u.nombre_completo}</strong> },
      {
        key: 'oficina',
        header: 'Oficina',
        render: (u) => oficinas.find((o) => o.id === u.oficina_id)?.nombre || 'Sin asignar',
      },
      { key: 'rol', header: 'Rol', render: (u) => <span className="capitalize">{u.rol}</span> },
      {
        key: 'estado',
        header: 'Estado',
        align: 'center',
        render: (u) => (
          <StatusBadge label={u.activo ? 'Activo' : 'Inactivo'} variant={u.activo ? 'success' : 'danger'} />
        ),
      },
      { key: 'fecha', header: 'Ingreso', render: (u) => formatDate(u.created_at) },
      {
        key: 'acciones',
        header: 'Acciones',
        align: 'right',
        render: (u) => (
          <div className="flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => openEditUserModal(u)}
              className="h-8 px-2.5 rounded-[6px] border border-[#D1D5DB] text-[12px] font-medium text-black hover:bg-[#F7F8FA]"
            >
              Editar
            </button>
            <button
              type="button"
              onClick={() => setToggleTargetUser(u)}
              className="h-8 px-2.5 rounded-[6px] border border-[#D1D5DB] text-[12px] font-medium text-[#DC2626] hover:bg-[#FEF2F2]"
            >
              {u.activo ? 'Desactivar' : 'Activar'}
            </button>
          </div>
        ),
      },
    ];

    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-semibold text-black">
            {activeSection === 'supervisores'
              ? 'Supervisores'
              : activeSection === 'cobradores'
              ? 'Cobradores'
              : 'Equipo de trabajo'}
          </h2>
          <button
            type="button"
            onClick={() => openCreateUserModal(activeRoleFilter)}
            className="h-10 px-3.5 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[13px] font-semibold flex items-center gap-1.5"
          >
            <UserPlus className="w-4 h-4" strokeWidth={2} />
            <span>Crear usuario</span>
          </button>
        </div>

        {activeSection === 'equipo' && (
          <FilterBar
            selectedId={teamTab}
            onSelect={(id) => setTeamTab(id as 'supervisores' | 'cobradores')}
            options={[
              { id: 'supervisores', label: 'Supervisores', count: scopedUsers.filter((u) => u.rol === 'supervisor').length },
              { id: 'cobradores', label: 'Cobradores', count: scopedUsers.filter((u) => u.rol === 'cobrador').length },
            ]}
          />
        )}

        <DataTable
          data={filteredUsers}
          columns={userColumns}
          keyExtractor={(u) => u.id}
          emptyTitle="No hay usuarios registrados en este rol."
          renderMobileCard={(u) => (
            <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2.5">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="text-[16px] font-semibold text-black">{u.nombre_completo}</h4>
                  <p className="text-[12px] text-[#525252]">
                    {u.telefono} · {oficinas.find((o) => o.id === u.oficina_id)?.nombre || 'Sin oficina'}
                  </p>
                </div>
                <StatusBadge label={u.activo ? 'Activo' : 'Inactivo'} variant={u.activo ? 'success' : 'danger'} />
              </div>
              <div className="grid grid-cols-2 gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => openEditUserModal(u)}
                  className="h-10 rounded-[6px] bg-white border border-[#D1D5DB] text-[13px] font-medium text-black"
                >
                  Editar
                </button>
                <button
                  type="button"
                  onClick={() => setToggleTargetUser(u)}
                  className="h-10 rounded-[6px] bg-white border border-[#D1D5DB] text-[13px] font-medium text-[#DC2626]"
                >
                  {u.activo ? 'Desactivar' : 'Activar'}
                </button>
              </div>
            </div>
          )}
        />

        {/* Modal crear/editar usuario */}
        {userModalOpen && (
          <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={handleSaveUser}
              className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-md w-full p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
                <h3 className="text-[16px] font-semibold text-black">
                  {editingUser ? 'Editar usuario' : 'Nuevo integrante'}
                </h3>
                <button type="button" onClick={() => setUserModalOpen(false)}>
                  <X className="w-5 h-5 text-[#525252]" strokeWidth={2} />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Nombre completo *</label>
                <input
                  type="text"
                  value={userFormNombre}
                  onChange={(e) => setUserFormNombre(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
              </div>

              {!editingUser && (
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Cédula / Documento *</label>
                  <input
                    type="text"
                    value={userFormDoc}
                    onChange={(e) => setUserFormDoc(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Teléfono</label>
                <input
                  type="tel"
                  value={userFormTel}
                  onChange={(e) => setUserFormTel(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Rol</label>
                  <select
                    value={userFormRol}
                    onChange={(e) => setUserFormRol(e.target.value as UserRole)}
                    className="w-full h-11 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  >
                    <option value="supervisor">Supervisor</option>
                    <option value="cobrador">Cobrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Oficina</label>
                  <select
                    value={userFormOfi}
                    onChange={(e) => setUserFormOfi(e.target.value)}
                    className="w-full h-11 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  >
                    {oficinas.map((o) => (
                      <option key={o.id} value={o.id}>
                        {o.nombre}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {userFormRol === 'cobrador' && (
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Supervisor responsable</label>
                  <select
                    value={userFormSup}
                    onChange={(e) => setUserFormSup(e.target.value)}
                    className="w-full h-11 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  >
                    <option value="">Sin asignar</option>
                    {usuarios
                      .filter((u) => u.rol === 'supervisor')
                      .map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.nombre_completo}
                        </option>
                      ))}
                  </select>
                </div>
              )}

              <button
                type="submit"
                disabled={isSavingUser}
                className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                {isSavingUser && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                <span>{editingUser ? 'Guardar cambios' : 'Crear usuario'}</span>
              </button>
            </form>
          </div>
        )}

        <ConfirmDialog
          isOpen={Boolean(toggleTargetUser)}
          title={toggleTargetUser?.activo ? 'Desactivar usuario' : 'Activar usuario'}
          message={`¿Confirmas ${toggleTargetUser?.activo ? 'desactivar' : 'activar'} a ${toggleTargetUser?.nombre_completo}?`}
          confirmLabel={toggleTargetUser?.activo ? 'Desactivar' : 'Activar'}
          variant={toggleTargetUser?.activo ? 'danger' : 'success'}
          onConfirm={handleToggleActiveUser}
          onCancel={() => setToggleTargetUser(null)}
        />
      </div>
    );
  }

  // =========================================================================
  // 6. LIBRO MAESTRO DE PRÉSTAMOS (CARTERA)
  // =========================================================================
  if (activeSection === 'cartera') {
    const filteredMaster = scopedLoans.filter((p) => {
      if (masterStatusFilter !== 'todos' && p.estado !== masterStatusFilter) return false;
      if (masterSearch.trim()) {
        const q = masterSearch.toLowerCase();
        const cli = clientes.find((c) => c.id === p.cliente_id);
        return (
          p.codigo.toLowerCase().includes(q) ||
          (cli?.nombre_completo.toLowerCase().includes(q) ?? false) ||
          (p.cobrador_nombre?.toLowerCase().includes(q) ?? false)
        );
      }
      return true;
    });

    const masterColumns: DataColumn<Prestamo>[] = [
      { key: 'codigo', header: 'Código', render: (p) => <strong className="font-mono">{p.codigo}</strong> },
      { key: 'cliente', header: 'Cliente', render: (p) => <span>{p.cliente?.nombre_completo || 'Cliente'}</span> },
      { key: 'oficina', header: 'Oficina', render: (p) => oficinas.find((o) => o.id === p.oficina_id)?.nombre || '-' },
      { key: 'cobrador', header: 'Cobrador', render: (p) => p.cobrador_nombre || '-' },
      { key: 'desembolso', header: 'Desembolso', render: (p) => formatDate(p.fecha_desembolso || p.fecha_solicitud) },
      { key: 'capital', header: 'Capital inicial', align: 'right', render: (p) => formatMoney(p.capital) },
      { key: 'interes', header: 'Interés', align: 'right', render: (p) => formatMoney(p.total_interes) },
      { key: 'pactado', header: 'Total pactado', align: 'right', render: (p) => formatMoney(p.total_a_pagar) },
      { key: 'recaudado', header: 'Recaudado', align: 'right', render: (p) => <span className="text-[#15803D]">{formatMoney(p.total_recaudado)}</span> },
      { key: 'saldo', header: 'Saldo', align: 'right', render: (p) => <strong>{formatMoney(p.saldo_pendiente)}</strong> },
      { key: 'mora', header: 'Mora', align: 'center', render: (p) => (p.estado === 'mora' ? <span className="text-[#DC2626] font-semibold">Sí</span> : '0') },
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
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="text-[22px] font-semibold text-black">Libro maestro de préstamos</h2>
          <button
            type="button"
            onClick={handleExportLoansCsv}
            className="h-10 px-3.5 rounded-[6px] bg-white hover:bg-[#F7F8FA] text-black border border-[#D1D5DB] text-[13px] font-semibold flex items-center justify-center gap-1.5"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            <span>Exportar CSV</span>
          </button>
        </div>

        <SearchInput
          id="admin-master-search"
          value={masterSearch}
          onChange={setMasterSearch}
          placeholder="Búsqueda global por código, cliente o cobrador..."
        />

        <FilterBar
          selectedId={masterStatusFilter}
          onSelect={setMasterStatusFilter}
          options={[
            { id: 'todos', label: 'Todos', count: scopedLoans.length },
            { id: 'activo', label: 'Activos' },
            { id: 'mora', label: 'En mora' },
            { id: 'pendiente', label: 'Pendientes' },
            { id: 'aprobado', label: 'Aprobados' },
            { id: 'pagado', label: 'Finalizados' },
          ]}
        />

        <DataTable
          data={filteredMaster}
          columns={masterColumns}
          keyExtractor={(p) => p.id}
          emptyTitle="No se encontraron préstamos con estos filtros."
          renderMobileCard={(p) => {
            const b = getEstadoPrestamoBadge(p.estado);
            const v: Record<string, BadgeVariant> = {
              pendiente: 'pending',
              aprobado: 'info',
              activo: 'success',
              pagado: 'neutral',
              rechazado: 'danger',
              mora: 'danger',
            };
            const isExp = expandedMobileLoanId === p.id;
            return (
              <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-[12px] text-[#525252]">{p.codigo}</span>
                    <h4 className="text-[16px] font-semibold text-black">{p.cliente?.nombre_completo}</h4>
                  </div>
                  <StatusBadge label={b.label} variant={v[p.estado] || 'neutral'} />
                </div>
                <div className="flex justify-between items-baseline">
                  <span className="text-[12px] text-[#525252]">Saldo pendiente</span>
                  <strong className="text-[18px] font-bold text-black tabular-nums">{formatMoney(p.saldo_pendiente)}</strong>
                </div>
                <button
                  type="button"
                  onClick={() => setExpandedMobileLoanId(isExp ? null : p.id)}
                  className="w-full flex items-center justify-between text-[12px] text-[#2563EB] font-medium pt-1 border-t border-[#E5E7EB]"
                >
                  <span>{isExp ? 'Ocultar detalles' : 'Consultar detalles'}</span>
                  {isExp ? <ChevronUp className="w-4 h-4" strokeWidth={2} /> : <ChevronDown className="w-4 h-4" strokeWidth={2} />}
                </button>
                {isExp && (
                  <div className="text-[12px] text-[#525252] grid grid-cols-2 gap-1.5 pt-1">
                    <p>Cobrador: <strong className="text-black">{p.cobrador_nombre}</strong></p>
                    <p>Capital: <strong className="text-black">{formatMoney(p.capital)}</strong></p>
                    <p>Interés: <strong className="text-black">{formatMoney(p.total_interes)}</strong></p>
                    <p>Recaudado: <strong className="text-[#15803D]">{formatMoney(p.total_recaudado)}</strong></p>
                    <p>Plan: <strong className="text-black">{p.num_cuotas} {getFrecuenciaLabel(p.frecuencia)}s</strong></p>
                    <p>Fecha: <strong className="text-black">{formatDate(p.fecha_desembolso || p.fecha_solicitud)}</strong></p>
                  </div>
                )}
              </div>
            );
          }}
        />
      </div>
    );
  }

  // =========================================================================
  // 7. CLIENTES
  // =========================================================================
  if (activeSection === 'clientes') {
    const filteredClients = scopedClients.filter((c) => {
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
        <h2 className="text-[22px] font-semibold text-black">Clientes</h2>
        <SearchInput
          id="admin-clientes-search"
          value={clientSearch}
          onChange={setClientSearch}
          placeholder="Buscar cliente por nombre, cédula o barrio..."
        />
        {filteredClients.length === 0 ? (
          <EmptyState title="No se encontraron clientes." />
        ) : (
          <div className="space-y-2.5">
            {filteredClients.map((c) => (
              <div key={c.id} className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 flex justify-between items-center">
                <div>
                  <h4 className="text-[15px] font-semibold text-black">{c.nombre_completo}</h4>
                  <p className="text-[12px] text-[#525252]">Doc: {c.documento} · {c.telefono} · {c.barrio || c.direccion}</p>
                </div>
                <span className="text-[12px] font-medium text-[#525252]">{c.negocio || '-'}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 8. REPORTES
  // =========================================================================
  if (activeSection === 'reportes') {
    const byFreq = (['diario', 'semanal', 'quincenal', 'mensual'] as const).map((f) => {
      const list = scopedLoans.filter((p) => p.frecuencia === f);
      return {
        frecuencia: getFrecuenciaLabel(f),
        cantidad: list.length,
        capital: list.reduce((a, p) => a + p.capital, 0),
        saldo: list.reduce((a, p) => a + p.saldo_pendiente, 0),
      };
    });

    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-black">Reportes de cartera</h2>
          <button
            type="button"
            onClick={handleExportLoansCsv}
            className="h-10 px-3.5 rounded-[6px] bg-[#2563EB] text-white text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            <span>Exportar CSV</span>
          </button>
        </div>

        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
          <h3 className="text-[15px] font-semibold text-black">Distribución por frecuencia de pago</h3>
          <div className="space-y-2.5">
            {byFreq.map((row) => (
              <div key={row.frecuencia} className="space-y-1 text-[13px]">
                <div className="flex justify-between">
                  <span className="font-medium text-black">
                    {row.frecuencia} ({row.cantidad} créditos)
                  </span>
                  <span className="font-semibold text-black tabular-nums">{formatMoney(row.capital)}</span>
                </div>
                <div className="h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#2563EB]"
                    style={{
                      width: `${Math.min(
                        100,
                        capitalTotalColocado > 0 ? (row.capital / capitalTotalColocado) * 100 : 0
                      )}%`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 9. CONFIGURACIÓN DE OFICINA (CON VALOR ANTERIOR VS NUEVO)
  // =========================================================================
  if (activeSection === 'configuracion') {
    return (
      <div className="space-y-4 pb-16 max-w-2xl">
        <h2 className="text-[22px] font-semibold text-black">Configuración de oficina</h2>

        <form onSubmit={handleSaveOfficeConfig} className="bg-white border border-[#D1D5DB] rounded-[8px] p-5 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1">Nombre de oficina</label>
              <input
                type="text"
                value={cfgNombre}
                onChange={(e) => setCfgNombre(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1">Ciudad / Dirección</label>
              <input
                type="text"
                value={cfgCiudad}
                onChange={(e) => setCfgCiudad(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              />
            </div>
            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1">Teléfono</label>
              <input
                type="tel"
                value={cfgTelefono}
                onChange={(e) => setCfgTelefono(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1">Tasa predeterminada (%)</label>
              <input
                type="number"
                min={0}
                max={100}
                step={0.5}
                value={cfgTasa}
                onChange={(e) => setCfgTasa(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] font-semibold text-black"
              />
              {Number(cfgTasa) !== targetOffice?.tasa_interes_defecto && (
                <p className="text-[11px] text-[#D97706] mt-1">
                  Anterior: {targetOffice?.tasa_interes_defecto}% → Nuevo: {cfgTasa}%
                </p>
              )}
            </div>

            <div>
              <label className="block text-[12px] font-medium text-[#525252] mb-1">Tope máximo por préstamo ($)</label>
              <input
                type="number"
                step={100000}
                value={cfgTope}
                onChange={(e) => setCfgTope(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] font-semibold text-black tabular-nums"
              />
              {Number(cfgTope) !== (targetOffice?.tope_aprobacion_automatica ?? 2000000) && (
                <p className="text-[11px] text-[#D97706] mt-1">
                  Anterior: {formatMoney(targetOffice?.tope_aprobacion_automatica ?? 2000000)} → Nuevo: {formatMoney(Number(cfgTope))}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center justify-between bg-[#F7F8FA] border border-[#E5E7EB] rounded-[6px] p-3">
            <div>
              <span className="text-[14px] font-medium text-black block">Excluir domingos en cobro diario</span>
              {cfgExcluirDom !== targetOffice?.excluir_domingos && (
                <span className="text-[11px] text-[#D97706]">
                  Anterior: {targetOffice?.excluir_domingos ? 'Sí' : 'No'} → Nuevo: {cfgExcluirDom ? 'Sí' : 'No'}
                </span>
              )}
            </div>
            <input
              type="checkbox"
              checked={cfgExcluirDom}
              onChange={(e) => setCfgExcluirDom(e.target.checked)}
              className="w-5 h-5 accent-[#15803D]"
            />
          </div>

          <p className="text-[12px] text-[#525252]">
            Nota: Los cambios aplican únicamente a nuevas solicitudes; no alteran retroactivamente préstamos vigentes.
          </p>

          <button
            type="submit"
            disabled={isSavingConfig}
            className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
          >
            {isSavingConfig && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
            <span>Guardar configuración</span>
          </button>
        </form>
      </div>
    );
  }

  // =========================================================================
  // 10. AUDITORÍA
  // =========================================================================
  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-[22px] font-semibold text-black">Auditoría de oficina</h2>
      {auditLogs.length === 0 ? (
        <EmptyState title="No se han registrado eventos de auditoría todavía." />
      ) : (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] divide-y divide-[#E5E7EB]">
          {auditLogs.map((ev) => (
            <div key={ev.id} className="p-3.5 flex items-start justify-between gap-2 text-[13px]">
              <div>
                <p className="font-semibold text-black">{ev.accion}</p>
                <p className="text-[12px] text-[#525252]">{ev.detalle}</p>
                <p className="text-[11px] text-[#8A8A8A]">Por {ev.usuario} ({ev.rol})</p>
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
