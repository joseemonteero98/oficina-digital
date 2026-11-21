'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  Oficina,
  Usuario,
  Cliente,
  Ruta,
  Prestamo,
  Cuota,
  RegistroPago,
  CierreCaja,
  UserRole,
  TipoPago,
} from '@/types';
import { CalculoPrestamoResult, simularPrestamo, generarCuotasEntidad } from './calculations';
import {
  INITIAL_OFICINAS,
  INITIAL_USUARIOS,
  INITIAL_RUTAS,
  INITIAL_CLIENTES,
  INITIAL_PRESTAMOS,
  INITIAL_CIERRE_CAJA,
  getTodayString,
} from './initialData';

interface AppContextType {
  // Estado de usuario y rol
  currentUser: Usuario;
  currentRole: UserRole;
  switchRole: (role: UserRole) => void;
  selectedOficinaId: string; // 'todas' o un id de oficina
  setSelectedOficinaId: (id: string) => void;
  isDbConnected: boolean;

  // Colecciones
  oficinas: Oficina[];
  usuarios: Usuario[];
  clientes: Cliente[];
  rutas: Ruta[];
  prestamos: Prestamo[];
  cierreCaja: CierreCaja;
  pagos: RegistroPago[];

  // Acciones de Clientes
  crearCliente: (cliente: Omit<Cliente, 'id' | 'created_at' | 'orden_ruta'>) => Promise<Cliente>;

  // Acciones de Préstamos
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

  autorizarPrestamo: (prestamoId: string, aprobado: boolean, motivoRechazo?: string) => Promise<void>;
  desembolsarPrestamo: (prestamoId: string) => Promise<void>;

  // Acciones de Cobro
  registrarCobro: (params: {
    prestamo_id: string;
    cuota_id?: string;
    monto: number;
    tipo: TipoPago;
    motivoNoPago?: string;
    nota?: string;
  }) => Promise<RegistroPago>;

  // Acciones de Caja
  registrarGastoCaja: (concepto: string, monto: number) => void;
  enviarCierreCaja: (efectivoEntregado: number, observaciones?: string) => void;
  aprobarCierreCaja: (aprobado: boolean, observaciones?: string) => void;

  // Modal de Recibo
  activeReceipt: { pago: RegistroPago; prestamo: Prestamo; cliente: Cliente } | null;
  setActiveReceipt: (receipt: { pago: RegistroPago; prestamo: Prestamo; cliente: Cliente } | null) => void;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [oficinas, setOficinas] = useState<Oficina[]>(INITIAL_OFICINAS);
  const [usuarios, setUsuarios] = useState<Usuario[]>(INITIAL_USUARIOS);
  const [rutas, setRutas] = useState<Ruta[]>(INITIAL_RUTAS);
  const [clientes, setClientes] = useState<Cliente[]>(INITIAL_CLIENTES);
  const [prestamos, setPrestamos] = useState<Prestamo[]>(INITIAL_PRESTAMOS);
  const [cierreCaja, setCierreCaja] = useState<CierreCaja>(INITIAL_CIERRE_CAJA);
  const [pagos, setPagos] = useState<RegistroPago[]>([]);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);

  // Rol activo (por defecto cobrador para probar la experiencia smartphone primero)
  const [currentRole, setCurrentRole] = useState<UserRole>('cobrador');
  const [selectedOficinaId, setSelectedOficinaId] = useState<string>('ofi-1');
  const [activeReceipt, setActiveReceipt] = useState<{
    pago: RegistroPago;
    prestamo: Prestamo;
    cliente: Cliente;
  } | null>(null);

  // Cargar datos reales desde Neon Postgres en arranque
  useEffect(() => {
    async function cargarDatosDb() {
      try {
        const res = await fetch('/api/bootstrap');
        const data = await res.json();
        if (data && data.connected) {
          setIsDbConnected(true);
          if (data.oficinas?.length) setOficinas(data.oficinas);
          if (data.usuarios?.length) setUsuarios(data.usuarios);
          if (data.rutas?.length) setRutas(data.rutas);
          if (data.clientes?.length) setClientes(data.clientes);
          if (data.prestamos?.length) setPrestamos(data.prestamos);
          if (data.cierreCaja) setCierreCaja(data.cierreCaja);
        }
      } catch (err) {
        console.warn('Ejecutando con datos locales de contingencia:', err);
      }
    }
    cargarDatosDb();
  }, []);

  // Obtener el usuario según el rol seleccionado
  const currentUser = usuarios.find((u) => u.rol === currentRole) || usuarios[0];

  const switchRole = (role: UserRole) => {
    setCurrentRole(role);
    if (role === 'dueno') {
      setSelectedOficinaId('todas');
    } else {
      setSelectedOficinaId(oficinas[0]?.id || 'ofi-1');
    }
  };

  // Crear Cliente con sincronización a Neon Postgres
  const crearCliente = async (datos: Omit<Cliente, 'id' | 'created_at' | 'orden_ruta'>): Promise<Cliente> => {
    const nuevoLocal: Cliente = {
      ...datos,
      id: `cli-${Date.now()}`,
      orden_ruta: clientes.length + 1,
      created_at: getTodayString(),
    };
    setClientes((prev) => [...prev, nuevoLocal]);

    try {
      const res = await fetch('/api/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(datos),
      });
      const data = await res.json();
      if (data?.cliente?.id) {
        setClientes((prev) =>
          prev.map((c) => (c.id === nuevoLocal.id ? { ...c, id: data.cliente.id } : c))
        );
        return { ...nuevoLocal, id: data.cliente.id };
      }
    } catch (err) {
      console.warn('Guardado localmente:', err);
    }

    return nuevoLocal;
  };

  // Crear Solicitud de Préstamo con persistencia en Neon Postgres
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
    const cliente = clientes.find((c) => c.id === datos.cliente_id);
    const calculo = simularPrestamo({
      capital: datos.capital,
      tasa_interes: datos.tasa_interes,
      tipo_interes: datos.tipo_interes,
      num_cuotas: datos.num_cuotas,
      frecuencia: datos.frecuencia,
      excluir_domingos: datos.excluir_domingos,
      fecha_primer_cobro: datos.fecha_primer_cobro,
    });

    const prestamoId = `p-${Date.now()}`;
    const cuotas = generarCuotasEntidad(prestamoId, calculo);
    const oficinaId = cliente?.oficina_id || selectedOficinaId;

    const nuevoPrestamo: Prestamo = {
      id: prestamoId,
      codigo: `PR-${Math.floor(1000 + Math.random() * 9000)}`,
      oficina_id: oficinaId,
      cliente_id: datos.cliente_id,
      cliente,
      cobrador_id: currentUser.id,
      cobrador_nombre: currentUser.nombre_completo,
      capital: datos.capital,
      tipo_interes: datos.tipo_interes,
      tasa_interes: datos.tasa_interes,
      total_interes: calculo.total_interes,
      total_a_pagar: calculo.total_a_pagar,
      saldo_pendiente: calculo.total_a_pagar,
      total_recaudado: 0,
      frecuencia: datos.frecuencia,
      num_cuotas: datos.num_cuotas,
      valor_cuota: calculo.valor_cuota,
      excluir_domingos: datos.excluir_domingos,
      fecha_solicitud: getTodayString(),
      fecha_primer_cobro: datos.fecha_primer_cobro,
      estado: 'pendiente',
      notas: datos.notas,
      cuotas,
    };

    setPrestamos((prev) => [nuevoPrestamo, ...prev]);

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
      if (data?.prestamoId) {
        setPrestamos((prev) =>
          prev.map((p) =>
            p.id === prestamoId ? { ...p, id: data.prestamoId, codigo: data.codigo } : p
          )
        );
      }
    } catch (err) {
      console.warn('Guardado localmente:', err);
    }

    return nuevoPrestamo;
  };

  // Supervisor: Autorizar o Rechazar Préstamo
  const autorizarPrestamo = async (prestamoId: string, aprobado: boolean, motivoRechazo?: string) => {
    setPrestamos((prev) =>
      prev.map((p) => {
        if (p.id !== prestamoId) return p;
        return {
          ...p,
          estado: aprobado ? 'aprobado' : 'rechazado',
          supervisor_id: currentUser.id,
          supervisor_nombre: currentUser.nombre_completo,
          fecha_aprobacion: getTodayString(),
          motivo_rechazo: aprobado ? undefined : motivoRechazo,
        };
      })
    );

    try {
      await fetch(`/api/prestamos/${prestamoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accion: aprobado ? 'aprobar' : 'rechazar',
          supervisor_id: currentUser.id,
          motivo_rechazo: motivoRechazo,
        }),
      });
    } catch (err) {
      console.warn('Actualizado localmente:', err);
    }
  };

  // Cobrador: Desembolsar (Entrega el dinero en efectivo al cliente)
  const desembolsarPrestamo = async (prestamoId: string) => {
    setPrestamos((prev) =>
      prev.map((p) => {
        if (p.id !== prestamoId) return p;
        return {
          ...p,
          estado: 'activo',
          fecha_desembolso: getTodayString(),
        };
      })
    );

    const p = prestamos.find((item) => item.id === prestamoId);
    if (p) {
      setCierreCaja((prev) => {
        const nuevoDesembolso = prev.total_desembolsado + p.capital;
        const nuevoEsperado = prev.base_inicial + prev.total_cobrado - nuevoDesembolso - prev.total_gastos;
        return {
          ...prev,
          total_desembolsado: nuevoDesembolso,
          efectivo_esperado: nuevoEsperado,
          efectivo_entregado: nuevoEsperado,
        };
      });
    }

    try {
      await fetch(`/api/prestamos/${prestamoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accion: 'desembolsar' }),
      });
    } catch (err) {
      console.warn('Actualizado localmente:', err);
    }
  };

  // Cobrador: Registrar Cobro
  const registrarCobro = async (params: {
    prestamo_id: string;
    cuota_id?: string;
    monto: number;
    tipo: TipoPago;
    motivoNoPago?: string;
    nota?: string;
  }): Promise<RegistroPago> => {
    const prestamo = prestamos.find((p) => p.id === params.prestamo_id);
    if (!prestamo) throw new Error('Préstamo no encontrado');

    const cliente = clientes.find((c) => c.id === prestamo.cliente_id)!;
    let saldoRestante = prestamo.saldo_pendiente;

    if (params.tipo !== 'no_pago') {
      saldoRestante = Math.max(0, prestamo.saldo_pendiente - params.monto);

      setPrestamos((prev) =>
        prev.map((p) => {
          if (p.id !== params.prestamo_id) return p;

          let montoPorDistribuir = params.monto;
          const cuotasActualizadas = (p.cuotas || []).map((c) => {
            if (montoPorDistribuir <= 0) return c;
            const faltaPagar = c.monto_total - c.monto_pagado;
            if (faltaPagar <= 0) return c;

            const abonoACuota = Math.min(montoPorDistribuir, faltaPagar);
            montoPorDistribuir -= abonoACuota;
            const nuevoPagado = c.monto_pagado + abonoACuota;
            const nuevoEstado = nuevoPagado >= c.monto_total ? 'pagada' : 'parcial';

            return {
              ...c,
              monto_pagado: nuevoPagado,
              estado: nuevoEstado as any,
              fecha_ultimo_pago: getTodayString(),
            };
          });

          const nuevoTotalRecaudado = p.total_recaudado + params.monto;
          const nuevoSaldo = Math.max(0, p.total_a_pagar - nuevoTotalRecaudado);
          const estaPagado = nuevoSaldo === 0;

          return {
            ...p,
            total_recaudado: nuevoTotalRecaudado,
            saldo_pendiente: nuevoSaldo,
            estado: estaPagado ? 'pagado' : p.estado,
            cuotas: cuotasActualizadas,
          };
        })
      );

      setCierreCaja((prev) => {
        const nuevoCobrado = prev.total_cobrado + params.monto;
        const nuevoEsperado = prev.base_inicial + nuevoCobrado - prev.total_desembolsado - prev.total_gastos;
        return {
          ...prev,
          total_cobrado: nuevoCobrado,
          efectivo_esperado: nuevoEsperado,
          efectivo_entregado: nuevoEsperado,
        };
      });
    }

    const now = new Date();
    const hora = now.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' });

    const nuevoPago: RegistroPago = {
      id: `pago-${Date.now()}`,
      prestamo_id: params.prestamo_id,
      cuota_id: params.cuota_id,
      cliente_id: prestamo.cliente_id,
      cobrador_id: currentUser.id,
      monto: params.monto,
      tipo: params.tipo,
      motivo_no_pago: params.motivoNoPago,
      nota: params.nota,
      fecha_pago: getTodayString(),
      hora_pago: hora,
      saldo_restante_despues: saldoRestante,
    };

    setPagos((prev) => [nuevoPago, ...prev]);

    const updatedPrestamo = {
      ...prestamo,
      saldo_pendiente: saldoRestante,
      total_recaudado: prestamo.total_recaudado + (params.tipo !== 'no_pago' ? params.monto : 0),
    };
    setActiveReceipt({ pago: nuevoPago, prestamo: updatedPrestamo, cliente });

    try {
      await fetch('/api/pagos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...params,
          cliente_id: prestamo.cliente_id,
          cobrador_id: currentUser.id,
          oficina_id: prestamo.oficina_id,
        }),
      });
    } catch (err) {
      console.warn('Pago registrado localmente:', err);
    }

    return nuevoPago;
  };

  // Registrar Gasto en Caja
  const registrarGastoCaja = (concepto: string, monto: number) => {
    setCierreCaja((prev) => {
      const nuevoGastos = prev.total_gastos + monto;
      const detalle = [...(prev.gastos_detalle || []), { concepto, monto }];
      const nuevoEsperado = prev.base_inicial + prev.total_cobrado - prev.total_desembolsado - nuevoGastos;
      return {
        ...prev,
        total_gastos: nuevoGastos,
        gastos_detalle: detalle,
        efectivo_esperado: nuevoEsperado,
        efectivo_entregado: nuevoEsperado,
      };
    });
  };

  // Cobrador: Enviar Cierre de Caja a Revisión
  const enviarCierreCaja = (efectivoEntregado: number, observaciones?: string) => {
    setCierreCaja((prev) => {
      const diferencia = efectivoEntregado - prev.efectivo_esperado;
      return {
        ...prev,
        efectivo_entregado: efectivoEntregado,
        diferencia,
        estado: 'pendiente_revision',
        observaciones,
      };
    });
  };

  // Supervisor: Aprobar Cuadre de Caja
  const aprobarCierreCaja = (aprobado: boolean, observaciones?: string) => {
    setCierreCaja((prev) => ({
      ...prev,
      estado: aprobado ? 'aprobado' : 'abierto',
      supervisor_id: currentUser.id,
      observaciones: observaciones || prev.observaciones,
    }));
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        currentRole,
        switchRole,
        selectedOficinaId,
        setSelectedOficinaId,
        isDbConnected,
        oficinas,
        usuarios,
        clientes,
        rutas,
        prestamos,
        cierreCaja,
        pagos,
        crearCliente,
        crearSolicitudPrestamo,
        autorizarPrestamo,
        desembolsarPrestamo,
        registrarCobro,
        registrarGastoCaja,
        enviarCierreCaja,
        aprobarCierreCaja,
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
