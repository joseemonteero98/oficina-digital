'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import {
  Oficina,
  Usuario,
  Cliente,
  Ruta,
  Prestamo,
  RegistroPago,
  CierreCaja,
  UserRole,
  TipoPago,
  MetodoPago,
  SyncStatus,
  AppSection,
  AppNotification,
  AuditEvent,
  SimulacionPrestamo,
  GastoCalle,
  EstadoCuota,
} from '@/types';
import {
  INITIAL_OFICINAS,
  INITIAL_USUARIOS,
  INITIAL_RUTAS,
  INITIAL_CLIENTES,
  INITIAL_PRESTAMOS,
  INITIAL_CIERRE_CAJA,
  getTodayString,
} from './initialData';
import { formatMoney, formatTime } from './utils';

export interface ToastMessage {
  id: string;
  tipo: 'success' | 'error' | 'info';
  mensaje: string;
}

interface AppContextType {
  // Usuario, rol y navegación
  currentUser: Usuario;
  currentRole: UserRole;
  activeSection: AppSection;
  setActiveSection: (section: AppSection) => void;
  switchRole: (role: UserRole) => void;
  selectedOficinaId: string;
  setSelectedOficinaId: (id: string) => void;

  // Estado de conexión y carga
  isDbConnected: boolean;
  isEmptyDb: boolean;
  isLoadingBootstrap: boolean;
  syncStatus: SyncStatus;
  refreshData: () => Promise<void>;
  cargarDatosEjemplo: () => Promise<void>;

  // Colecciones
  oficinas: Oficina[];
  usuarios: Usuario[];
  clientes: Cliente[];
  rutas: Ruta[];
  prestamos: Prestamo[];
  cierreCaja: CierreCaja;
  cierres: CierreCaja[];
  pagos: RegistroPago[];
  auditLogs: AuditEvent[];
  notifications: AppNotification[];
  markAllNotificationsRead: () => void;

  // Toast de retroalimentación
  toast: ToastMessage | null;
  showToast: (tipo: 'success' | 'error' | 'info', mensaje: string) => void;
  clearToast: () => void;

  // Operaciones con confirmación obligatoria del servidor
  simularPrestamoBackend: (params: {
    capital: number;
    tasa_interes: number;
    tipo_interes: 'fijo' | 'sobre_saldo';
    frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual';
    num_cuotas: number;
    excluir_domingos: boolean;
    fecha_primer_cobro: string;
  }) => Promise<SimulacionPrestamo>;

  crearCliente: (cliente: Omit<Cliente, 'id' | 'created_at' | 'orden_ruta'>) => Promise<Cliente>;
  actualizarCliente: (id: string, datos: Partial<Cliente>) => Promise<void>;

  crearSolicitudPrestamo: (datos: {
    cliente_id: string;
    capital: number;
    tasa_interes: number;
    tipo_interes: 'fijo' | 'sobre_saldo';
    frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual';
    num_cuotas: number;
    excluir_domingos: boolean;
    fecha_primer_cobro: string;
    notas?: string;
  }) => Promise<Prestamo>;

  autorizarPrestamo: (
    prestamoId: string,
    accion: 'aprobar' | 'rechazar' | 'solicitar_ajuste',
    motivo?: string
  ) => Promise<void>;

  desembolsarPrestamo: (prestamoId: string, metodoDesembolso?: MetodoPago) => Promise<void>;

  registrarCobro: (params: {
    prestamo_id: string;
    cuota_id?: string;
    monto: number;
    tipo: TipoPago;
    metodo_pago?: MetodoPago;
    motivoNoPago?: string;
    nota?: string;
  }) => Promise<RegistroPago>;

  registrarGastoCaja: (datos: {
    tipo: GastoCalle['tipo'];
    concepto: string;
    monto: number;
    soporte_nombre?: string;
  }) => Promise<void>;

  enviarCierreCaja: (efectivoEntregado: number, observaciones: string) => Promise<void>;
  aprobarCierreCaja: (cierreId: string, aprobado: boolean, observaciones?: string) => Promise<void>;

  // Administración y Dueño
  crearOficina: (datos: Partial<Oficina>) => Promise<void>;
  actualizarOficina: (id: string, datos: Partial<Oficina>) => Promise<void>;
  crearUsuario: (datos: Partial<Usuario>) => Promise<void>;
  actualizarUsuario: (id: string, datos: Partial<Usuario>) => Promise<void>;

  // Modal de Recibo
  activeReceipt: { pago: RegistroPago; prestamo: Prestamo; cliente: Cliente } | null;
  setActiveReceipt: (receipt: { pago: RegistroPago; prestamo: Prestamo; cliente: Cliente } | null) => void;
}

const DEFAULT_SECTION_BY_ROLE: Record<UserRole, AppSection> = {
  cobrador: 'cobros_hoy',
  supervisor: 'resumen_oficina',
  admin: 'resumen',
  dueno: 'resumen_general',
};

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [oficinas, setOficinas] = useState<Oficina[]>(INITIAL_OFICINAS);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);
  const [rutas, setRutas] = useState<Ruta[]>(INITIAL_RUTAS);
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [prestamos, setPrestamos] = useState<Prestamo[]>(INITIAL_PRESTAMOS);
  const [cierreCaja, setCierreCaja] = useState<CierreCaja>(INITIAL_CIERRE_CAJA);
  const [cierres, setCierres] = useState<CierreCaja[]>([INITIAL_CIERRE_CAJA]);
  const [pagos, setPagos] = useState<RegistroPago[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditEvent[]>([]);
  const [readNotifIds, setReadNotifIds] = useState<string[]>([]);

  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [isEmptyDb, setIsEmptyDb] = useState<boolean>(false);
  const [isLoadingBootstrap, setIsLoadingBootstrap] = useState<boolean>(true);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() =>
    typeof navigator !== 'undefined' && !navigator.onLine ? 'sin_conexion' : 'conectado'
  );

  const [currentRole, setCurrentRole] = useState<UserRole>('cobrador');
  const [activeSection, setActiveSection] = useState<AppSection>('cobros_hoy');
  const [selectedOficinaId, setSelectedOficinaId] = useState<string>(INITIAL_OFICINAS[0].id);

  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [activeReceipt, setActiveReceipt] = useState<{
    pago: RegistroPago;
    prestamo: Prestamo;
    cliente: Cliente;
  } | null>(null);

  const showToast = useCallback((tipo: 'success' | 'error' | 'info', mensaje: string) => {
    const id = `toast-${Date.now()}`;
    setToast({ id, tipo, mensaje });
    setTimeout(() => {
      setToast((prev) => (prev?.id === id ? null : prev));
    }, 4500);
  }, []);

  const clearToast = useCallback(() => setToast(null), []);

  const currentUser = useMemo(
    () => usuarios.find((u) => u.rol === currentRole) || usuarios[0],
    [usuarios, currentRole]
  );

  const appendAudit = useCallback(
    (accion: string, detalle: string, oficina_id?: string) => {
      const event: AuditEvent = {
        id: `aud-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        fecha: getTodayString(),
        hora: formatTime(),
        usuario: currentUser?.nombre_completo || 'Sistema',
        rol: currentRole,
        oficina_id: oficina_id || currentUser?.oficina_id || undefined,
        accion,
        detalle,
      };
      setAuditLogs((prev) => [event, ...prev]);
    },
    [currentUser, currentRole]
  );

  // Monitoreo de red del dispositivo
  useEffect(() => {
    const handleOnline = () => setSyncStatus('conectado');
    const handleOffline = () => setSyncStatus('sin_conexion');
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const applyBootstrapPayload = useCallback((data: Record<string, unknown>) => {
    setIsDbConnected(Boolean(data.connected));
    setIsEmptyDb(Boolean(data.isEmptyDb));
    if (Array.isArray(data.oficinas) && data.oficinas.length > 0) {
      const list = data.oficinas as Oficina[];
      setOficinas(list);
      setSelectedOficinaId((prev) =>
        prev === 'todas' || list.some((o) => o.id === prev) ? prev : list[0].id
      );
    }
    if (Array.isArray(data.usuarios) && data.usuarios.length > 0) {
      setUsuarios(data.usuarios as Usuario[]);
    }
    if (Array.isArray(data.rutas)) setRutas(data.rutas as Ruta[]);
    if (Array.isArray(data.clientes)) setClientes(data.clientes as Cliente[]);
    if (Array.isArray(data.prestamos)) setPrestamos(data.prestamos as Prestamo[]);
    if (Array.isArray(data.pagos)) setPagos(data.pagos as RegistroPago[]);
    if (data.cierreCaja) setCierreCaja(data.cierreCaja as CierreCaja);
    if (Array.isArray(data.cierres) && data.cierres.length > 0) {
      setCierres(data.cierres as CierreCaja[]);
    } else if (data.cierreCaja) {
      setCierres([data.cierreCaja as CierreCaja]);
    }
    setSyncStatus(navigator.onLine ? 'conectado' : 'sin_conexion');
  }, []);

  const refreshData = useCallback(async () => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/bootstrap', { cache: 'no-store' });
      const data = await res.json();
      if (data) applyBootstrapPayload(data);
    } catch {
      setSyncStatus(navigator.onLine ? 'error' : 'sin_conexion');
    } finally {
      setIsLoadingBootstrap(false);
    }
  }, [applyBootstrapPayload]);

  useEffect(() => {
    let active = true;
    fetch('/api/bootstrap', { cache: 'no-store' })
      .then((res) => res.json())
      .then((data) => {
        if (active && data) applyBootstrapPayload(data);
      })
      .catch(() => {
        if (active) setSyncStatus(navigator.onLine ? 'error' : 'sin_conexion');
      })
      .finally(() => {
        if (active) setIsLoadingBootstrap(false);
      });
    return () => {
      active = false;
    };
  }, [applyBootstrapPayload]);

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    setActiveSection(DEFAULT_SECTION_BY_ROLE[role]);
    if (role === 'dueno') {
      setSelectedOficinaId('todas');
    } else {
      setSelectedOficinaId(oficinas[0]?.id || INITIAL_OFICINAS[0].id);
    }
  };

  const cargarDatosEjemplo = async () => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'Error cargando datos');
      }
      await refreshData();
      showToast('success', 'Ruta de ejemplo de Valledupar cargada correctamente.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudieron cargar los datos de ejemplo.');
    }
  };

  // Simulación exclusivamente desde backend
  const simularPrestamoBackend = async (params: {
    capital: number;
    tasa_interes: number;
    tipo_interes: 'fijo' | 'sobre_saldo';
    frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual';
    num_cuotas: number;
    excluir_domingos: boolean;
    fecha_primer_cobro: string;
  }): Promise<SimulacionPrestamo> => {
    const res = await fetch('/api/prestamos/simular', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'No se pudo calcular la simulación.');
    }
    return data.simulacion;
  };

  // Crear Cliente con confirmación real del servidor
  const crearCliente = async (
    datos: Omit<Cliente, 'id' | 'created_at' | 'orden_ruta'>
  ): Promise<Cliente> => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.cliente) {
        throw new Error(data.error || 'No se pudo registrar el cliente.');
      }

      const clienteConfirmado: Cliente = {
        ...data.cliente,
        barrio: data.cliente.barrio || datos.barrio || 'VALLEDUPAR',
      };
      setClientes((prev) => [...prev, clienteConfirmado]);
      setSyncStatus('conectado');
      appendAudit('Creación de cliente', `Cliente ${clienteConfirmado.nombre_completo}`, datos.oficina_id);
      showToast('success', `Cliente ${clienteConfirmado.nombre_completo} registrado.`);
      return clienteConfirmado;
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo registrar el cliente.');
      throw err;
    }
  };

  const actualizarCliente = async (id: string, datos: Partial<Cliente>) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch(`/api/clientes/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar el cliente.');
      }
      setClientes((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...datos } : c))
      );
      setSyncStatus('conectado');
      appendAudit('Edición de cliente', `Actualizado cliente ID ${id.slice(0, 8)}`);
      showToast('success', 'Datos del cliente actualizados.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'Error al actualizar el cliente.');
      throw err;
    }
  };

  // Crear Solicitud de Préstamo con confirmación obligatoria del servidor
  const crearSolicitudPrestamo = async (datos: {
    cliente_id: string;
    capital: number;
    tasa_interes: number;
    tipo_interes: 'fijo' | 'sobre_saldo';
    frecuencia: 'diario' | 'semanal' | 'quincenal' | 'mensual';
    num_cuotas: number;
    excluir_domingos: boolean;
    fecha_primer_cobro: string;
    notas?: string;
  }): Promise<Prestamo> => {
    setSyncStatus('sincronizando');
    const cliente = clientes.find((c) => c.id === datos.cliente_id);
    const oficinaId =
      cliente?.oficina_id ||
      (selectedOficinaId === 'todas' ? oficinas[0]?.id : selectedOficinaId);

    try {
      const res = await fetch('/api/prestamos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...datos,
          oficina_id: oficinaId,
          cobrador_id: currentUser.id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo enviar la solicitud de préstamo.');
      }

      const calculo: SimulacionPrestamo = data.calculo;
      const nuevoPrestamo: Prestamo = {
        id: data.prestamoId,
        codigo: data.codigo,
        oficina_id: oficinaId,
        cliente_id: datos.cliente_id,
        cliente,
        cobrador_id: currentUser.id,
        cobrador_nombre: currentUser.nombre_completo,
        capital: calculo.capital,
        tipo_interes: calculo.tipo_interes,
        tasa_interes: calculo.tasa_interes,
        total_interes: calculo.total_interes,
        total_a_pagar: calculo.total_a_pagar,
        saldo_pendiente: calculo.total_a_pagar,
        total_recaudado: 0,
        frecuencia: calculo.frecuencia,
        num_cuotas: calculo.num_cuotas,
        valor_cuota: calculo.valor_cuota,
        excluir_domingos: datos.excluir_domingos,
        fecha_solicitud: getTodayString(),
        fecha_primer_cobro: calculo.fecha_primer_pago,
        fecha_vencimiento_final: calculo.fecha_ultimo_pago,
        estado: 'pendiente',
        notas: datos.notas,
        cuotas: data.cuotas || [],
      };

      setPrestamos((prev) => [nuevoPrestamo, ...prev]);
      setIsEmptyDb(false);
      setSyncStatus('conectado');
      appendAudit(
        'Solicitud de préstamo',
        `${nuevoPrestamo.codigo} por ${formatMoney(nuevoPrestamo.capital)} para ${cliente?.nombre_completo || 'cliente'}`,
        oficinaId
      );
      showToast('success', 'Solicitud enviada al supervisor.');
      return nuevoPrestamo;
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo enviar la solicitud. Verifica tu conexión.');
      throw err;
    }
  };

  // Supervisor: Aprobar / Rechazar / Solicitar ajustes
  const autorizarPrestamo = async (
    prestamoId: string,
    accion: 'aprobar' | 'rechazar' | 'solicitar_ajuste',
    motivo?: string
  ) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch(`/api/prestamos/${prestamoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion,
          supervisor_id: currentUser.id,
          motivo_rechazo: motivo,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo procesar la decisión.');
      }

      setPrestamos((prev) =>
        prev.map((p) => {
          if (p.id !== prestamoId) return p;
          if (accion === 'aprobar') {
            return {
              ...p,
              estado: 'aprobado',
              supervisor_id: currentUser.id,
              supervisor_nombre: currentUser.nombre_completo,
              fecha_aprobacion: getTodayString(),
            };
          }
          if (accion === 'rechazar') {
            return {
              ...p,
              estado: 'rechazado',
              supervisor_id: currentUser.id,
              supervisor_nombre: currentUser.nombre_completo,
              motivo_rechazo: motivo,
            };
          }
          const notaAjuste = `[AJUSTE SOLICITADO POR SUPERVISOR]: ${motivo || 'Revisar condiciones'}`;
          return {
            ...p,
            supervisor_id: currentUser.id,
            supervisor_nombre: currentUser.nombre_completo,
            notas: p.notas ? `${p.notas}\n${notaAjuste}` : notaAjuste,
          };
        })
      );

      setSyncStatus('conectado');
      appendAudit(
        accion === 'aprobar' ? 'Préstamo aprobado' : accion === 'rechazar' ? 'Préstamo rechazado' : 'Ajuste solicitado',
        `Préstamo ${prestamoId.slice(0, 8)} ${motivo ? `— ${motivo}` : ''}`
      );
      showToast(
        'success',
        accion === 'aprobar'
          ? 'Préstamo aprobado y listo para desembolso.'
          : accion === 'rechazar'
          ? 'Solicitud rechazada.'
          : 'Observación de ajuste enviada al cobrador.'
      );
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo actualizar la solicitud.');
      throw err;
    }
  };

  // Cobrador: Desembolsar préstamo aprobado (requiere confirmación del servidor)
  const desembolsarPrestamo = async (prestamoId: string, metodoDesembolso: MetodoPago = 'efectivo') => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch(`/api/prestamos/${prestamoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'desembolsar',
          metodo_desembolso: metodoDesembolso,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo confirmar el desembolso.');
      }

      const prestamoTarget = prestamos.find((item) => item.id === prestamoId);
      setPrestamos((prev) =>
        prev.map((p) =>
          p.id === prestamoId
            ? { ...p, estado: 'activo', fecha_desembolso: getTodayString() }
            : p
        )
      );

      if (prestamoTarget && metodoDesembolso === 'efectivo') {
        setCierreCaja((prev) => {
          const nuevoDesembolso = prev.total_desembolsado + prestamoTarget.capital;
          const nuevoEsperado = prev.efectivo_esperado - prestamoTarget.capital;
          return {
            ...prev,
            total_desembolsado: nuevoDesembolso,
            efectivo_esperado: nuevoEsperado,
          };
        });
      }

      setSyncStatus('conectado');
      appendAudit(
        'Desembolso confirmado',
        `${prestamoTarget?.codigo || prestamoId} entregado (${metodoDesembolso})`
      );
      showToast('success', 'Desembolso confirmado. Cuotas activadas en ruta.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo confirmar el desembolso.');
      throw err;
    }
  };

  // Cobrador: Registrar Cobro (NUNCA marca exitoso sin confirmación real del servidor)
  const registrarCobro = async (params: {
    prestamo_id: string;
    cuota_id?: string;
    monto: number;
    tipo: TipoPago;
    metodo_pago?: MetodoPago;
    motivoNoPago?: string;
    nota?: string;
  }): Promise<RegistroPago> => {
    const prestamo = prestamos.find((p) => p.id === params.prestamo_id);
    if (!prestamo) throw new Error('Préstamo no encontrado.');
    const cliente = clientes.find((c) => c.id === prestamo.cliente_id)!;
    const metodo = params.metodo_pago || 'efectivo';

    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          metodo_pago: metodo,
          cliente_id: prestamo.cliente_id,
          cobrador_id: currentUser.id,
          oficina_id: prestamo.oficina_id,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo registrar el cobro.');
      }

      const saldoRestante =
        data.nuevoSaldo !== undefined
          ? Number(data.nuevoSaldo)
          : params.tipo === 'no_pago'
          ? prestamo.saldo_pendiente
          : Math.max(0, prestamo.saldo_pendiente - params.monto);

      const nuevoTotalRecaudado =
        data.nuevoTotalRecaudado !== undefined
          ? Number(data.nuevoTotalRecaudado)
          : prestamo.total_recaudado + (params.tipo !== 'no_pago' ? params.monto : 0);

      // Aplicar estado confirmado por el servidor
      setPrestamos((prev) =>
        prev.map((p) => {
          if (p.id !== params.prestamo_id) return p;

          if (params.tipo === 'no_pago') {
            return p;
          }

          let montoPorDistribuir = params.monto;
          const cuotasActualizadas = (p.cuotas || []).map((c) => {
            if (montoPorDistribuir <= 0 || c.estado === 'pagada') return c;
            const faltaPagar = c.monto_total - c.monto_pagado;
            if (faltaPagar <= 0) return c;

            const abonoACuota = Math.min(montoPorDistribuir, faltaPagar);
            montoPorDistribuir -= abonoACuota;
            const nuevoPagado = c.monto_pagado + abonoACuota;
            const nuevoEstado = nuevoPagado >= c.monto_total ? 'pagada' : 'parcial';

            return {
              ...c,
              monto_pagado: nuevoPagado,
              estado: nuevoEstado as EstadoCuota,
              fecha_ultimo_pago: data.fecha_pago || getTodayString(),
            };
          });

          return {
            ...p,
            total_recaudado: nuevoTotalRecaudado,
            saldo_pendiente: saldoRestante,
            estado: saldoRestante === 0 ? 'pagado' : p.estado,
            cuotas: cuotasActualizadas,
          };
        })
      );

      if (params.tipo !== 'no_pago') {
        setCierreCaja((prev) => {
          const nuevoCobrado = prev.total_cobrado + params.monto;
          const nuevoEfectivo = (prev.total_cobrado_efectivo || 0) + (metodo === 'efectivo' ? params.monto : 0);
          const nuevaTransf = (prev.total_cobrado_transferencia || 0) + (metodo === 'transferencia' ? params.monto : 0);
          const nuevoEsperado = prev.efectivo_esperado + (metodo === 'efectivo' ? params.monto : 0);
          return {
            ...prev,
            total_cobrado: nuevoCobrado,
            total_cobrado_efectivo: nuevoEfectivo,
            total_cobrado_transferencia: nuevaTransf,
            efectivo_esperado: nuevoEsperado,
          };
        });
      }

      const nuevoPago: RegistroPago = {
        id: data.pagoId || `pago-${Date.now()}`,
        oficina_id: prestamo.oficina_id,
        prestamo_id: params.prestamo_id,
        cuota_id: params.cuota_id,
        cliente_id: prestamo.cliente_id,
        cobrador_id: currentUser.id,
        monto: params.tipo === 'no_pago' ? 0 : params.monto,
        tipo: params.tipo,
        metodo_pago: metodo,
        motivo_no_pago: params.motivoNoPago,
        nota: params.nota,
        fecha_pago: data.fecha_pago || getTodayString(),
        hora_pago: data.hora_pago || formatTime(),
        saldo_restante_despues: saldoRestante,
        proxima_fecha_pago: data.proxima_fecha_pago,
      };

      setPagos((prev) => [nuevoPago, ...prev]);

      if (params.tipo !== 'no_pago') {
        const updatedPrestamo = {
          ...prestamo,
          saldo_pendiente: saldoRestante,
          total_recaudado: nuevoTotalRecaudado,
        };
        setActiveReceipt({ pago: nuevoPago, prestamo: updatedPrestamo, cliente });
      }

      setSyncStatus('conectado');
      appendAudit(
        params.tipo === 'no_pago' ? 'Registro de no pago' : 'Cobro registrado',
        `${cliente.nombre_completo} — ${params.tipo === 'no_pago' ? params.motivoNoPago : `${formatMoney(params.monto)} (${metodo})`}`,
        prestamo.oficina_id
      );
      showToast(
        'success',
        params.tipo === 'no_pago'
          ? 'Motivo de no pago guardado.'
          : 'Pago registrado correctamente.'
      );

      return nuevoPago;
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast(
        'error',
        (err instanceof Error ? err.message : '') || 'No se pudo registrar el cobro. Verifica tu conexión e inténtalo nuevamente.'
      );
      throw err;
    }
  };

  // Gastos de calle (servidor)
  const registrarGastoCaja = async (datos: {
    tipo: GastoCalle['tipo'];
    concepto: string;
    monto: number;
    soporte_nombre?: string;
  }) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'gasto',
          oficina_id: currentUser.oficina_id || oficinas[0]?.id,
          cobrador_id: currentUser.id,
          ...datos,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo registrar el gasto.');
      }

      const gastoConfirmado: GastoCalle = data.gasto || {
        id: `gasto-${Date.now()}`,
        tipo: datos.tipo,
        concepto: datos.concepto,
        monto: datos.monto,
        fecha: getTodayString(),
        hora: formatTime(),
        soporte_nombre: datos.soporte_nombre,
      };

      setCierreCaja((prev) => ({
        ...prev,
        total_gastos: data.total_gastos ?? prev.total_gastos + datos.monto,
        efectivo_esperado: data.efectivo_esperado ?? prev.efectivo_esperado - datos.monto,
        gastos_detalle: [...(prev.gastos_detalle || []), gastoConfirmado],
      }));

      setSyncStatus('conectado');
      appendAudit('Gasto de calle', `${datos.tipo}: ${datos.concepto} (${formatMoney(datos.monto)})`);
      showToast('success', 'Gasto registrado correctamente en caja.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo registrar el gasto.');
      throw err;
    }
  };

  // Enviar cierre de caja al supervisor
  const enviarCierreCaja = async (efectivoEntregado: number, observaciones: string) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/caja', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: 'enviar_cierre',
          oficina_id: currentUser.oficina_id || oficinas[0]?.id,
          cobrador_id: currentUser.id,
          efectivo_entregado: efectivoEntregado,
          observaciones,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo enviar el cierre de caja.');
      }

      const diferencia = efectivoEntregado - cierreCaja.efectivo_esperado;
      const actualizado: CierreCaja = {
        ...cierreCaja,
        efectivo_entregado: efectivoEntregado,
        diferencia,
        observaciones,
        estado: 'pendiente_revision',
      };
      setCierreCaja(actualizado);
      setCierres((prev) => prev.map((c) => (c.id === actualizado.id ? actualizado : c)));

      setSyncStatus('conectado');
      appendAudit('Cierre de jornada enviado', `Declarado ${formatMoney(efectivoEntregado)} (Dif: ${formatMoney(diferencia)})`);
      showToast('success', 'Cierre de caja enviado al supervisor.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo enviar el cierre de caja.');
      throw err;
    }
  };

  // Supervisor aprueba o rechaza cierre
  const aprobarCierreCaja = async (cierreId: string, aprobado: boolean, observaciones?: string) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/caja', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cierre_id: cierreId,
          aprobado,
          supervisor_id: currentUser.id,
          observaciones,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar el arqueo.');
      }

      const nuevoEstado = aprobado ? 'aprobado' : 'rechazado';
      const applyUpdate = (c: CierreCaja): CierreCaja =>
        c.id === cierreId
          ? {
              ...c,
              estado: nuevoEstado,
              supervisor_id: currentUser.id,
              observaciones: observaciones || c.observaciones,
            }
          : c;

      setCierreCaja((prev) => applyUpdate(prev));
      setCierres((prev) => prev.map(applyUpdate));

      setSyncStatus('conectado');
      appendAudit(
        aprobado ? 'Arqueo aprobado' : 'Arqueo rechazado',
        `Cierre ${cierreId.slice(0, 8)} ${observaciones ? `— ${observaciones}` : ''}`
      );
      showToast('success', aprobado ? 'Cierre de caja aprobado.' : 'Cierre devuelto al cobrador.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'No se pudo procesar el arqueo.');
      throw err;
    }
  };

  // Gestión de oficinas
  const crearOficina = async (datos: Partial<Oficina>) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/oficinas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.oficina) {
        throw new Error(data.error || 'No se pudo crear la oficina.');
      }
      setOficinas((prev) => [...prev, data.oficina]);
      setSyncStatus('conectado');
      appendAudit('Nueva oficina', `Oficina creada: ${data.oficina.nombre}`);
      showToast('success', `Oficina "${data.oficina.nombre}" creada.`);
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'Error al crear la oficina.');
      throw err;
    }
  };

  const actualizarOficina = async (id: string, datos: Partial<Oficina>) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/oficinas', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...datos }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo guardar la configuración.');
      }
      setOficinas((prev) => prev.map((o) => (o.id === id ? { ...o, ...datos } : o)));
      setSyncStatus('conectado');
      appendAudit('Configuración de oficina', `Parámetros actualizados en oficina ${id.slice(0, 8)}`);
      showToast('success', 'Configuración de oficina guardada.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'Error al guardar la configuración.');
      throw err;
    }
  };

  // Gestión de usuarios
  const crearUsuario = async (datos: Partial<Usuario>) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/usuarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (!res.ok || !data.success || !data.usuario) {
        throw new Error(data.error || 'No se pudo crear el usuario.');
      }
      setUsuarios((prev) => [...prev, data.usuario]);
      setSyncStatus('conectado');
      appendAudit('Creación de usuario', `${data.usuario.nombre_completo} (${data.usuario.rol})`);
      showToast('success', `Usuario ${data.usuario.nombre_completo} creado.`);
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'Error al crear el usuario.');
      throw err;
    }
  };

  const actualizarUsuario = async (id: string, datos: Partial<Usuario>) => {
    setSyncStatus('sincronizando');
    try {
      const res = await fetch('/api/usuarios', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, ...datos }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || 'No se pudo actualizar el usuario.');
      }
      setUsuarios((prev) => prev.map((u) => (u.id === id ? { ...u, ...datos } : u)));
      setSyncStatus('conectado');
      appendAudit('Actualización de usuario', `Modificado usuario ${id.slice(0, 8)}`);
      showToast('success', 'Usuario actualizado correctamente.');
    } catch (err: unknown) {
      setSyncStatus('error');
      showToast('error', (err instanceof Error ? err.message : '') || 'Error al actualizar el usuario.');
      throw err;
    }
  };

  // Notificaciones derivadas del estado real
  const notifications: AppNotification[] = useMemo(() => {
    const items: AppNotification[] = [];
    const pendientesAprobar = prestamos.filter((p) => p.estado === 'pendiente');
    const aprobadosDesembolso = prestamos.filter((p) => p.estado === 'aprobado');
    const cierresRevision = cierres.filter((c) => c.estado === 'pendiente_revision');
    const prestamosMora = prestamos.filter((p) => p.estado === 'mora');

    if (aprobadosDesembolso.length > 0) {
      items.push({
        id: `notif-aprob-${aprobadosDesembolso.length}`,
        titulo: `${aprobadosDesembolso.length} préstamo(s) aprobado(s)`,
        mensaje: 'Listo para entregar dinero al cliente desde Mis préstamos.',
        tipo: 'info',
        leida: readNotifIds.includes(`notif-aprob-${aprobadosDesembolso.length}`),
        fecha: getTodayString(),
        targetRole: 'cobrador',
        targetSection: 'mis_prestamos',
      });
    }

    if (pendientesAprobar.length > 0) {
      items.push({
        id: `notif-sol-${pendientesAprobar.length}`,
        titulo: `${pendientesAprobar.length} solicitud(es) por aprobar`,
        mensaje: 'Requiere revisión del supervisor en oficina.',
        tipo: 'warning',
        leida: readNotifIds.includes(`notif-sol-${pendientesAprobar.length}`),
        fecha: getTodayString(),
        targetRole: 'supervisor',
        targetSection: 'solicitudes',
      });
    }

    if (cierresRevision.length > 0) {
      items.push({
        id: `notif-cierre-${cierresRevision.length}`,
        titulo: `${cierresRevision.length} arqueo(s) por revisar`,
        mensaje: 'Cierre de jornada enviado por cobrador.',
        tipo: 'warning',
        leida: readNotifIds.includes(`notif-cierre-${cierresRevision.length}`),
        fecha: getTodayString(),
        targetRole: 'supervisor',
        targetSection: 'arqueos_pendientes',
      });
    }

    if (prestamosMora.length > 0) {
      items.push({
        id: `notif-mora-${prestamosMora.length}`,
        titulo: `${prestamosMora.length} crédito(s) en mora`,
        mensaje: 'Clientes con cuotas vencidas pendientes de gestión.',
        tipo: 'error',
        leida: readNotifIds.includes(`notif-mora-${prestamosMora.length}`),
        fecha: getTodayString(),
        targetRole: 'admin',
        targetSection: 'cartera',
      });
    }

    return items;
  }, [prestamos, cierres, readNotifIds]);

  const markAllNotificationsRead = () => {
    setReadNotifIds(notifications.map((n) => n.id));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        activeSection,
        setActiveSection,
        switchRole,
        selectedOficinaId,
        setSelectedOficinaId,
        isDbConnected,
        isEmptyDb,
        isLoadingBootstrap,
        syncStatus,
        refreshData,
        cargarDatosEjemplo,
        oficinas,
        usuarios,
        clientes,
        rutas,
        prestamos,
        cierreCaja,
        cierres,
        pagos,
        auditLogs,
        notifications,
        markAllNotificationsRead,
        toast,
        showToast,
        clearToast,
        simularPrestamoBackend,
        crearCliente,
        actualizarCliente,
        crearSolicitudPrestamo,
        autorizarPrestamo,
        desembolsarPrestamo,
        registrarCobro,
        registrarGastoCaja,
        enviarCierreCaja,
        aprobarCierreCaja,
        crearOficina,
        actualizarOficina,
        crearUsuario,
        actualizarUsuario,
        activeReceipt,
        setActiveReceipt,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp debe ser usado dentro de un AppProvider');
  }
  return context;
}
