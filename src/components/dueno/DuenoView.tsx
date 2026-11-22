'use client';

import React, { useState, useMemo } from 'react';
import { useApp } from '@/lib/store';
import { Oficina, Prestamo, Usuario } from '@/types';
import {
  formatMoney,
  formatDate,
  getEstadoPrestamoBadge,
  exportToCsv,
} from '@/lib/utils';
import { getTodayString } from '@/lib/initialData';
import { DataTable, DataColumn } from '@/components/shared/DataTable';
import { SearchInput } from '@/components/shared/SearchInput';
import { StatusBadge, BadgeVariant } from '@/components/shared/StatusBadge';
import { EmptyState } from '@/components/shared/EmptyState';
import { Plus, Download, Loader2, X, ArrowRight } from 'lucide-react';

export function DuenoView() {
  const {
    activeSection,
    setActiveSection,
    oficinas,
    usuarios,
    prestamos,
    pagos,
    cierreCaja,
    selectedOficinaId,
    setSelectedOficinaId,
    auditLogs,
    crearOficina,
    crearUsuario,
    showToast,
  } = useApp();

  const today = getTodayString();

  // Selector de periodo en Resumen general
  const [periodo, setPeriodo] = useState<'hoy' | '7d' | 'mes' | 'mes_ant' | 'personalizado'>('hoy');
  const [customStart, setCustomStart] = useState(today);
  const [customEnd, setCustomEnd] = useState(today);

  // Modal nueva oficina
  const [showNewOfficeModal, setShowNewOfficeModal] = useState(false);
  const [ofiNombre, setOfiNombre] = useState('');
  const [ofiCiudad, setOfiCiudad] = useState('Valledupar, Cesar');
  const [ofiTel, setOfiTel] = useState('');
  const [ofiTasa, setOfiTasa] = useState('20');
  const [ofiExcluirDom, setOfiExcluirDom] = useState(true);
  const [isCreatingOffice, setIsCreatingOffice] = useState(false);

  // Modal nuevo administrador
  const [showNewAdminModal, setShowNewAdminModal] = useState(false);
  const [admNombre, setAdmNombre] = useState('');
  const [admDoc, setAdmDoc] = useState('');
  const [admTel, setAdmTel] = useState('');
  const [admOfiId, setAdmOfiId] = useState(oficinas[0]?.id || '');
  const [isCreatingAdmin, setIsCreatingAdmin] = useState(false);

  // Búsqueda cartera consolidada
  const [searchMaster, setSearchMaster] = useState('');

  const scopedLoans = useMemo(
    () =>
      prestamos.filter((p) =>
        selectedOficinaId === 'todas' ? true : p.oficina_id === selectedOficinaId
      ),
    [prestamos, selectedOficinaId]
  );

  // Indicadores calculados siguiendo estrictamente reglas contables
  const activeLoans = scopedLoans.filter((p) => p.estado === 'activo' || p.estado === 'mora');
  const capitalColocado = activeLoans.reduce((acc, p) => acc + p.capital, 0);
  const capitalPendiente = activeLoans.reduce((acc, p) => {
    const capitalRatio = p.total_a_pagar > 0 ? p.capital / p.total_a_pagar : 1;
    return acc + Math.round(p.saldo_pendiente * capitalRatio);
  }, 0);

  const recaudoDelDia = useMemo(() => {
    const sum = pagos
      .filter(
        (pg) =>
          pg.fecha_pago === today &&
          pg.tipo !== 'no_pago' &&
          (selectedOficinaId === 'todas' || pg.oficina_id === selectedOficinaId)
      )
      .reduce((acc, pg) => acc + pg.monto, 0);
    return selectedOficinaId === 'todas' || selectedOficinaId === cierreCaja.oficina_id
      ? Math.max(sum, cierreCaja.total_cobrado)
      : sum;
  }, [pagos, today, selectedOficinaId, cierreCaja]);

  const carteraVencida = scopedLoans
    .filter((p) => p.estado === 'mora')
    .reduce((acc, p) => acc + p.saldo_pendiente, 0);

  // Utilidad estimada: proporción de interés devengado/recuperado (no interés pactado bruto sin cobrar)
  const utilidadEstimadaRealizada = scopedLoans.reduce((acc, p) => {
    if (p.total_a_pagar <= 0) return acc;
    const proporcionRecuperada = p.total_recaudado / p.total_a_pagar;
    return acc + Math.round(p.total_interes * proporcionRecuperada);
  }, 0);

  const handleCrearOficina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ofiNombre.trim() || !ofiCiudad.trim()) return;
    setIsCreatingOffice(true);
    try {
      await crearOficina({
        nombre: ofiNombre.trim(),
        ciudad: ofiCiudad.trim(),
        telefono: ofiTel.trim(),
        tasa_interes_defecto: Number(ofiTasa),
        excluir_domingos: ofiExcluirDom,
      });
      setShowNewOfficeModal(false);
      setOfiNombre('');
      setOfiTel('');
    } finally {
      setIsCreatingOffice(false);
    }
  };

  const handleCrearAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!admNombre.trim() || !admDoc.trim()) return;
    setIsCreatingAdmin(true);
    try {
      await crearUsuario({
        nombre_completo: admNombre.trim(),
        documento: admDoc.trim(),
        telefono: admTel.trim(),
        rol: 'admin',
        oficina_id: admOfiId || null,
      });
      setShowNewAdminModal(false);
      setAdmNombre('');
      setAdmDoc('');
      setAdmTel('');
    } finally {
      setIsCreatingAdmin(false);
    }
  };

  const officeComparisonRows = useMemo(() => {
    return oficinas.map((ofi) => {
      const ofiLoans = prestamos.filter((p) => p.oficina_id === ofi.id);
      const enCalle = ofiLoans
        .filter((p) => p.estado === 'activo' || p.estado === 'mora')
        .reduce((a, p) => a + p.saldo_pendiente, 0);
      const mora = ofiLoans
        .filter((p) => p.estado === 'mora')
        .reduce((a, p) => a + p.saldo_pendiente, 0);
      const rec = pagos
        .filter((pg) => pg.oficina_id === ofi.id && pg.fecha_pago === today && pg.tipo !== 'no_pago')
        .reduce((a, b) => a + b.monto, 0);
      const personalActivo = usuarios.filter(
        (u) => u.oficina_id === ofi.id && u.activo
      ).length;

      return {
        oficina: ofi,
        enCalle,
        recaudo: ofi.id === cierreCaja.oficina_id ? Math.max(rec, cierreCaja.total_cobrado) : rec,
        mora,
        personalActivo,
      };
    });
  }, [oficinas, prestamos, pagos, usuarios, today, cierreCaja]);

  // =========================================================================
  // 1. RESUMEN GENERAL
  // =========================================================================
  if (activeSection === 'resumen_general') {
    return (
      <div className="space-y-5 pb-16">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-[22px] font-semibold text-black">Resumen general</h2>
            <p className="text-[13px] text-[#525252]">Consolidado financiero y operativo</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Seleccionar periodo"
              value={periodo}
              onChange={(e) => setPeriodo(e.target.value as 'hoy' | '7d' | 'mes' | 'mes_ant' | 'personalizado')}
              className="h-10 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[13px] font-medium text-black"
            >
              <option value="hoy">Hoy</option>
              <option value="7d">Últimos 7 días</option>
              <option value="mes">Este mes</option>
              <option value="mes_ant">Mes anterior</option>
              <option value="personalizado">Personalizado</option>
            </select>

            <select
              aria-label="Filtrar por oficina"
              value={selectedOficinaId}
              onChange={(e) => setSelectedOficinaId(e.target.value)}
              className="h-10 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[13px] font-medium text-black"
            >
              <option value="todas">Todas las oficinas</option>
              {oficinas.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.nombre}
                </option>
              ))}
            </select>
          </div>
        </div>

        {periodo === 'personalizado' && (
          <div className="flex flex-wrap items-center gap-2 bg-[#F7F8FA] border border-[#E5E7EB] p-3 rounded-[6px]">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="h-10 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[13px] text-black"
            />
            <span className="text-[12px] text-[#525252]">hasta</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="h-10 px-2.5 bg-white border border-[#9CA3AF] rounded-[6px] text-[13px] text-black"
            />
          </div>
        )}

        {/* 6 Indicadores financieros */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Capital colocado</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {formatMoney(capitalColocado)}
            </strong>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Capital pendiente</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {formatMoney(capitalPendiente)}
            </strong>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Recaudo del día</span>
            <strong className="text-[22px] font-bold text-[#15803D] tabular-nums block mt-1">
              {formatMoney(recaudoDelDia)}
            </strong>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Cartera vencida</span>
            <strong className="text-[22px] font-bold text-[#DC2626] tabular-nums block mt-1">
              {formatMoney(carteraVencida)}
            </strong>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Préstamos activos</span>
            <strong className="text-[22px] font-bold text-black tabular-nums block mt-1">
              {activeLoans.length}
            </strong>
          </div>

          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Utilidad estimada realizada</span>
            <strong className="text-[22px] font-bold text-[#2563EB] tabular-nums block mt-1">
              {formatMoney(utilidadEstimadaRealizada)}
            </strong>
            <span className="text-[11px] text-[#525252]">Proporción efectivamente recaudada</span>
          </div>
        </div>

        {/* Tabla rápida de comparación de oficinas */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-[16px] font-semibold text-black">Oficinas</h3>
            <button
              type="button"
              onClick={() => setActiveSection('oficinas')}
              className="text-[13px] font-medium text-[#2563EB] hover:underline"
            >
              Gestionar oficinas
            </button>
          </div>

          <DataTable
            data={officeComparisonRows}
            keyExtractor={(r) => r.oficina.id}
            onRowClick={(r) => {
              setSelectedOficinaId(r.oficina.id);
              showToast('info', `Filtrando vista por ${r.oficina.nombre}`);
            }}
            columns={[
              { key: 'oficina', header: 'Oficina', render: (r) => <strong className="text-black">{r.oficina.nombre}</strong> },
              { key: 'enCalle', header: 'Capital en calle', align: 'right', render: (r) => formatMoney(r.enCalle) },
              { key: 'recaudo', header: 'Recaudo', align: 'right', render: (r) => <span className="text-[#15803D] font-semibold">{formatMoney(r.recaudo)}</span> },
              { key: 'mora', header: 'Mora', align: 'right', render: (r) => <span className="text-[#DC2626] font-semibold">{formatMoney(r.mora)}</span> },
              { key: 'personal', header: 'Personal activo', align: 'right', render: (r) => r.personalActivo },
            ]}
            renderMobileCard={(r) => (
              <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-2">
                <div className="flex justify-between items-center">
                  <strong className="text-[16px] text-black">{r.oficina.nombre}</strong>
                  <span className="text-[12px] text-[#525252]">{r.personalActivo} activos</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-[12px]">
                  <div><span className="text-[#525252] block">En calle</span><strong>{formatMoney(r.enCalle)}</strong></div>
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
  // 2. GESTIÓN DE OFICINAS
  // =========================================================================
  if (activeSection === 'oficinas') {
    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-[22px] font-semibold text-black">Oficinas</h2>
          <button
            type="button"
            onClick={() => setShowNewOfficeModal(true)}
            className="h-11 px-4 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" strokeWidth={2} />
            <span>+ CREAR OFICINA</span>
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {oficinas.map((o: Oficina) => {
            const adm = usuarios.find((u) => u.rol === 'admin' && u.oficina_id === o.id);
            return (
              <div key={o.id} className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-[16px] font-semibold text-black">{o.nombre}</h3>
                    <p className="text-[12px] text-[#525252]">{o.ciudad} · {o.telefono}</p>
                  </div>
                  <StatusBadge label={o.activa ? 'Activa' : 'Inactiva'} variant={o.activa ? 'success' : 'neutral'} />
                </div>
                <div className="text-[13px] text-[#525252] space-y-1">
                  <p>Administrador: <strong className="text-black">{adm?.nombre_completo || 'Sin asignar'}</strong></p>
                  <p>Tasa predeterminada: <strong className="text-black">{o.tasa_interes_defecto}%</strong></p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOficinaId(o.id);
                    setActiveSection('resumen_general');
                  }}
                  className="w-full h-10 rounded-[6px] bg-white border border-[#D1D5DB] text-[#2563EB] text-[13px] font-semibold flex items-center justify-center gap-1.5"
                >
                  <span>Abrir resumen de oficina</span>
                  <ArrowRight className="w-4 h-4" strokeWidth={2} />
                </button>
              </div>
            );
          })}
        </div>

        {showNewOfficeModal && (
          <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={handleCrearOficina}
              className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-md w-full p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
                <h3 className="text-[16px] font-semibold text-black">Crear nueva oficina</h3>
                <button type="button" onClick={() => setShowNewOfficeModal(false)}>
                  <X className="w-5 h-5 text-[#525252]" strokeWidth={2} />
                </button>
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Nombre de oficina *</label>
                <input
                  type="text"
                  value={ofiNombre}
                  onChange={(e) => setOfiNombre(e.target.value)}
                  placeholder="Ej. Oficina Valledupar Norte"
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[#525252] mb-1">Ciudad *</label>
                <input
                  type="text"
                  value={ofiCiudad}
                  onChange={(e) => setOfiCiudad(e.target.value)}
                  className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Teléfono</label>
                  <input
                    type="tel"
                    value={ofiTel}
                    onChange={(e) => setOfiTel(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-medium text-[#525252] mb-1">Tasa defecto (%)</label>
                  <input
                    type="number"
                    value={ofiTasa}
                    onChange={(e) => setOfiTasa(e.target.value)}
                    className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-[13px] text-black">
                <input
                  type="checkbox"
                  checked={ofiExcluirDom}
                  onChange={(e) => setOfiExcluirDom(e.target.checked)}
                  className="w-4 h-4 accent-[#15803D]"
                />
                <span>Excluir domingos por defecto</span>
              </label>

              <button
                type="submit"
                disabled={isCreatingOffice}
                className="w-full h-12 rounded-[6px] bg-[#2563EB] hover:bg-[#1D4ED8] text-white text-[14px] font-semibold flex items-center justify-center gap-2"
              >
                {isCreatingOffice && <Loader2 className="w-4 h-4 animate-spin" strokeWidth={2} />}
                <span>Crear oficina</span>
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 3 y 4. ADMINISTRADORES Y PERSONAL GLOBAL
  // =========================================================================
  if (activeSection === 'administradores' || activeSection === 'personal') {
    const filteredPeople = usuarios.filter((u) =>
      activeSection === 'administradores' ? u.rol === 'admin' : u.rol !== 'dueno'
    );

    const cols: DataColumn<Usuario>[] = [
      { key: 'nombre', header: 'Nombre', render: (u) => <strong className="text-black">{u.nombre_completo}</strong> },
      { key: 'rol', header: 'Rol', render: (u) => <span className="capitalize">{u.rol}</span> },
      {
        key: 'oficina',
        header: 'Oficina',
        render: (u) => oficinas.find((o) => o.id === u.oficina_id)?.nombre || 'Global',
      },
      { key: 'tel', header: 'Teléfono', render: (u) => u.telefono },
      {
        key: 'estado',
        header: 'Estado',
        align: 'center',
        render: (u) => <StatusBadge label={u.activo ? 'Activo' : 'Inactivo'} variant={u.activo ? 'success' : 'neutral'} />,
      },
    ];

    return (
      <div className="space-y-4 pb-16">
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-black">
            {activeSection === 'administradores' ? 'Administradores' : 'Personal global'}
          </h2>
          {activeSection === 'administradores' && (
            <button
              type="button"
              onClick={() => setShowNewAdminModal(true)}
              className="h-10 px-3.5 rounded-[6px] bg-[#2563EB] text-white text-[13px] font-semibold"
            >
              + Nuevo administrador
            </button>
          )}
        </div>

        <DataTable
          data={filteredPeople}
          columns={cols}
          keyExtractor={(u) => u.id}
          emptyTitle="No hay usuarios registrados."
          renderMobileCard={(u) => (
            <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 flex justify-between items-center">
              <div>
                <h4 className="font-semibold text-black">{u.nombre_completo}</h4>
                <p className="text-[12px] text-[#525252] capitalize">
                  {u.rol} · {oficinas.find((o) => o.id === u.oficina_id)?.nombre || 'Global'}
                </p>
              </div>
              <StatusBadge label={u.activo ? 'Activo' : 'Inactivo'} variant={u.activo ? 'success' : 'neutral'} />
            </div>
          )}
        />

        {showNewAdminModal && (
          <div className="fixed inset-0 z-[70] bg-black/40 flex items-center justify-center p-4">
            <form
              onSubmit={handleCrearAdmin}
              className="bg-white border border-[#D1D5DB] rounded-[8px] max-w-sm w-full p-5 space-y-3"
            >
              <div className="flex justify-between items-center border-b border-[#E5E7EB] pb-2">
                <h3 className="text-[16px] font-semibold text-black">Asignar administrador</h3>
                <button type="button" onClick={() => setShowNewAdminModal(false)}>
                  <X className="w-5 h-5 text-[#525252]" strokeWidth={2} />
                </button>
              </div>
              <input
                type="text"
                placeholder="Nombre completo *"
                value={admNombre}
                onChange={(e) => setAdmNombre(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                required
              />
              <input
                type="text"
                placeholder="Cédula *"
                value={admDoc}
                onChange={(e) => setAdmDoc(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
                required
              />
              <input
                type="tel"
                placeholder="Teléfono"
                value={admTel}
                onChange={(e) => setAdmTel(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              />
              <select
                value={admOfiId}
                onChange={(e) => setAdmOfiId(e.target.value)}
                className="w-full h-11 px-3 bg-white border border-[#9CA3AF] rounded-[6px] text-[14px] text-black"
              >
                {oficinas.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.nombre}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                disabled={isCreatingAdmin}
                className="w-full h-12 rounded-[6px] bg-[#2563EB] text-white text-[14px] font-semibold"
              >
                {isCreatingAdmin ? 'Guardando...' : 'Crear administrador'}
              </button>
            </form>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // 5. CARTERA CONSOLIDADA
  // =========================================================================
  if (activeSection === 'cartera_consolidada') {
    const filtered = scopedLoans.filter((p) => {
      if (!searchMaster.trim()) return true;
      const q = searchMaster.toLowerCase();
      return (
        p.codigo.toLowerCase().includes(q) ||
        (p.cliente?.nombre_completo.toLowerCase().includes(q) ?? false)
      );
    });

    const cols: DataColumn<Prestamo>[] = [
      { key: 'codigo', header: 'Código', render: (p) => <strong className="font-mono">{p.codigo}</strong> },
      { key: 'cliente', header: 'Cliente', render: (p) => p.cliente?.nombre_completo || 'Cliente' },
      { key: 'oficina', header: 'Oficina', render: (p) => oficinas.find((o) => o.id === p.oficina_id)?.nombre || '-' },
      { key: 'capital', header: 'Capital', align: 'right', render: (p) => formatMoney(p.capital) },
      { key: 'saldo', header: 'Saldo pendiente', align: 'right', render: (p) => <strong>{formatMoney(p.saldo_pendiente)}</strong> },
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
        <div className="flex items-center justify-between">
          <h2 className="text-[22px] font-semibold text-black">Cartera consolidada</h2>
          <button
            type="button"
            onClick={() =>
              exportToCsv(
                `cartera-consolidada-${today}.csv`,
                ['Código', 'Cliente', 'Capital', 'Saldo', 'Estado'],
                filtered.map((p) => [p.codigo, p.cliente?.nombre_completo || '', p.capital, p.saldo_pendiente, p.estado])
              )
            }
            className="h-10 px-3.5 rounded-[6px] bg-white border border-[#D1D5DB] text-black text-[13px] font-semibold flex items-center gap-1.5"
          >
            <Download className="w-4 h-4" strokeWidth={2} />
            <span>Exportar CSV</span>
          </button>
        </div>

        <SearchInput
          id="dueno-cartera-search"
          value={searchMaster}
          onChange={setSearchMaster}
          placeholder="Buscar por código o cliente..."
        />

        <DataTable
          data={filtered}
          columns={cols}
          keyExtractor={(p) => p.id}
          emptyTitle="No se encontraron créditos."
          renderMobileCard={(p) => (
            <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 flex justify-between items-center">
              <div>
                <span className="text-[12px] text-[#525252]">{p.codigo}</span>
                <p className="font-semibold text-black">{p.cliente?.nombre_completo}</p>
              </div>
              <strong className="text-black tabular-nums">{formatMoney(p.saldo_pendiente)}</strong>
            </div>
          )}
        />
      </div>
    );
  }

  // =========================================================================
  // 6, 7, 8. INDICADORES / COMPARACIÓN / REPORTES GENERALES
  // =========================================================================
  if (
    activeSection === 'indicadores' ||
    activeSection === 'comparacion_oficinas' ||
    activeSection === 'reportes_generales'
  ) {
    const totalPactado = scopedLoans.reduce((a, p) => a + p.total_a_pagar, 0);
    const totalRecaudadoHistorico = scopedLoans.reduce((a, p) => a + p.total_recaudado, 0);
    const tasaRecuperacion = totalPactado > 0 ? Math.round((totalRecaudadoHistorico / totalPactado) * 100) : 0;
    const tasaMora = capitalColocado > 0 ? Math.round((carteraVencida / capitalColocado) * 100) : 0;

    return (
      <div className="space-y-4 pb-16">
        <h2 className="text-[22px] font-semibold text-black">
          {activeSection === 'comparacion_oficinas'
            ? 'Comparación de oficinas'
            : activeSection === 'indicadores'
            ? 'Indicadores financieros'
            : 'Reportes generales'}
        </h2>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Tasa de recuperación</span>
            <strong className="text-[22px] font-bold text-[#15803D]">{tasaRecuperacion}%</strong>
          </div>
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Índice de morosidad</span>
            <strong className="text-[22px] font-bold text-[#DC2626]">{tasaMora}%</strong>
          </div>
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Total recaudado</span>
            <strong className="text-[22px] font-bold text-black tabular-nums">{formatMoney(totalRecaudadoHistorico)}</strong>
          </div>
          <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4">
            <span className="text-[12px] text-[#525252] block">Utilidad realizada</span>
            <strong className="text-[22px] font-bold text-[#2563EB] tabular-nums">{formatMoney(utilidadEstimadaRealizada)}</strong>
          </div>
        </div>

        {/* Gráfico de barras simple y limpio sin efectos decorativos */}
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] p-4 space-y-3">
          <h3 className="text-[15px] font-semibold text-black">Capital en calle por oficina</h3>
          <div className="space-y-2.5">
            {officeComparisonRows.map((r) => {
              const max = Math.max(...officeComparisonRows.map((x) => x.enCalle), 1);
              const pct = Math.round((r.enCalle / max) * 100);
              return (
                <div key={r.oficina.id} className="space-y-1 text-[13px]">
                  <div className="flex justify-between">
                    <span className="font-medium text-black">{r.oficina.nombre}</span>
                    <strong className="tabular-nums text-black">{formatMoney(r.enCalle)}</strong>
                  </div>
                  <div className="h-3 bg-[#E5E7EB] rounded-[4px] overflow-hidden">
                    <div className="h-full bg-[#2563EB]" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // =========================================================================
  // 9. AUDITORÍA GLOBAL
  // =========================================================================
  return (
    <div className="space-y-4 pb-16">
      <h2 className="text-[22px] font-semibold text-black">Auditoría global</h2>
      {auditLogs.length === 0 ? (
        <EmptyState title="No se han registrado movimientos de auditoría todavía." />
      ) : (
        <div className="bg-white border border-[#D1D5DB] rounded-[8px] divide-y divide-[#E5E7EB]">
          {auditLogs.map((ev) => (
            <div key={ev.id} className="p-3.5 flex items-start justify-between gap-2 text-[13px]">
              <div>
                <p className="font-semibold text-black">{ev.accion}</p>
                <p className="text-[12px] text-[#525252]">{ev.detalle}</p>
                <p className="text-[11px] text-[#8A8A8A]">Usuario: {ev.usuario} ({ev.rol})</p>
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
