import { Oficina, Usuario, Cliente, Ruta, Prestamo, CierreCaja } from '@/types';
import { simularPrestamo, generarCuotasEntidad } from './calculations';

export const INITIAL_OFICINAS: Oficina[] = [
  {
    id: 'ofi-1',
    nombre: 'Oficina Central Valledupar',
    ciudad: 'Valledupar, Cesar',
    telefono: '300 456 7890',
    excluir_domingos: true,
    tasa_interes_defecto: 20,
    activa: true,
    created_at: '2026-01-01',
  },
];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: 'usr-dueno',
    nombre_completo: 'Don Hernando Gómez',
    email: 'dueno@oficinadigital.com',
    telefono: '300 111 2233',
    rol: 'dueno',
    activo: true,
    created_at: '2026-01-01',
  },
  {
    id: 'usr-admin',
    oficina_id: 'ofi-1',
    nombre_completo: 'Carlos Mendoza',
    email: 'admin.valledupar@oficinadigital.com',
    telefono: '312 444 5566',
    rol: 'admin',
    activo: true,
    created_at: '2026-01-05',
  },
  {
    id: 'usr-supervisor',
    oficina_id: 'ofi-1',
    nombre_completo: 'Javier Ramírez (Supervisor)',
    email: 'supervisor.valledupar@oficinadigital.com',
    telefono: '315 777 8899',
    rol: 'supervisor',
    activo: true,
    created_at: '2026-01-10',
  },
  {
    id: 'usr-cobrador',
    oficina_id: 'ofi-1',
    supervisor_id: 'usr-supervisor',
    nombre_completo: 'Brayan Martínez (Cobrador)',
    email: 'brayan.cobrador@oficinadigital.com',
    telefono: '320 999 0011',
    rol: 'cobrador',
    activo: true,
    created_at: '2026-01-15',
  },
];

export const INITIAL_RUTAS: Ruta[] = [
  {
    id: 'ruta-1',
    oficina_id: 'ofi-1',
    cobrador_id: 'usr-cobrador',
    nombre: 'Ruta 1 - La Nevada / Divino Niño',
    zona: 'Sector Noroccidental',
    activa: true,
  },
  {
    id: 'ruta-2',
    oficina_id: 'ofi-1',
    cobrador_id: 'usr-cobrador',
    nombre: 'Ruta 2 - Los Fundadores / 12 de Octubre',
    zona: 'Sector Sur',
    activa: true,
  },
  {
    id: 'ruta-3',
    oficina_id: 'ofi-1',
    cobrador_id: 'usr-cobrador',
    nombre: 'Ruta 3 - Centro / Mercado Público',
    zona: 'Sector Comercial',
    activa: true,
  },
];

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: 'cli-1',
    oficina_id: 'ofi-1',
    ruta_id: 'ruta-1',
    cobrador_id: 'usr-cobrador',
    nombre_completo: 'Rosa Elena Pérez',
    documento: '43.567.890',
    telefono: '301 234 5678',
    direccion: 'Calle 6 # 42-15, La Nevada',
    negocio: 'Tienda de Abarrotes Doña Rosa',
    alias: 'Doña Rosa',
    orden_ruta: 1,
    created_at: '2026-01-20',
  },
  {
    id: 'cli-2',
    oficina_id: 'ofi-1',
    ruta_id: 'ruta-2',
    cobrador_id: 'usr-cobrador',
    nombre_completo: 'Juan Camilo Díaz',
    documento: '71.234.901',
    telefono: '314 567 8901',
    direccion: 'Cra 23 # 18-40, Los Fundadores',
    negocio: 'Taller de Motos El Vallenato',
    alias: 'Camilo Motos',
    orden_ruta: 2,
    created_at: '2026-01-22',
  },
  {
    id: 'cli-3',
    oficina_id: 'ofi-1',
    ruta_id: 'ruta-3',
    cobrador_id: 'usr-cobrador',
    nombre_completo: 'Claudia Patricia Restrepo',
    documento: '32.890.123',
    telefono: '318 901 2345',
    direccion: 'Calle 16 # 19-30, Centro',
    negocio: 'Peluquería Glamour Vallenato',
    alias: 'Claudia Peluquería',
    orden_ruta: 3,
    created_at: '2026-02-01',
  },
  {
    id: 'cli-4',
    oficina_id: 'ofi-1',
    ruta_id: 'ruta-2',
    cobrador_id: 'usr-cobrador',
    nombre_completo: 'Andrés Felipe Morales',
    documento: '1.020.345.678',
    telefono: '305 678 1234',
    direccion: 'Cra 4 # 25-10, Doce de Octubre',
    negocio: 'Comidas Rápidas El Cacique',
    alias: 'Pipe Comidas',
    orden_ruta: 4,
    created_at: '2026-02-05',
  },
  {
    id: 'cli-5',
    oficina_id: 'ofi-1',
    ruta_id: 'ruta-3',
    cobrador_id: 'usr-cobrador',
    nombre_completo: 'María Elena Torres',
    documento: '21.456.789',
    telefono: '311 222 3344',
    direccion: 'Mercado Público, Local 45',
    negocio: 'Frutería y Jugos Guatapurí',
    alias: 'Doña Mari',
    orden_ruta: 5,
    created_at: '2026-02-10',
  },
];

export const DEFAULT_TODAY = '2026-02-15';

export function getTodayString(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TODAY;
  }
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch {
    return DEFAULT_TODAY;
  }
}

const today = DEFAULT_TODAY;

// Préstamo 1: Activo en cobro (Doña Rosa, La Nevada)
const calcP1 = simularPrestamo({
  capital: 600000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 24,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: '2026-02-01',
});
const cuotasP1 = generarCuotasEntidad('p-001', calcP1);
for (let i = 0; i < 5; i++) {
  cuotasP1[i].estado = 'pagada';
  cuotasP1[i].monto_pagado = cuotasP1[i].monto_total;
  cuotasP1[i].fecha_ultimo_pago = '2026-02-05';
}
if (cuotasP1[5]) {
  cuotasP1[5].fecha_vencimiento = today;
  cuotasP1[5].estado = 'pendiente';
}

const prestamo1: Prestamo = {
  id: 'p-001',
  codigo: 'PR-1001',
  oficina_id: 'ofi-1',
  cliente_id: 'cli-1',
  cobrador_id: 'usr-cobrador',
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: 'usr-supervisor',
  supervisor_nombre: 'Javier Ramírez',
  capital: 600000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 120000,
  total_a_pagar: 720000,
  saldo_pendiente: 720000 - (5 * 30000),
  total_recaudado: 150000,
  frecuencia: 'diario',
  num_cuotas: 24,
  valor_cuota: 30000,
  excluir_domingos: true,
  fecha_solicitud: '2026-01-28',
  fecha_aprobacion: '2026-01-29',
  fecha_desembolso: '2026-01-30',
  fecha_primer_cobro: '2026-02-01',
  estado: 'activo',
  cuotas: cuotasP1,
};

// Préstamo 2: Pendiente de autorización por el Supervisor (Juan Camilo Díaz, Los Fundadores)
const calcP2 = simularPrestamo({
  capital: 1000000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 30,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: today,
});
const cuotasP2 = generarCuotasEntidad('p-002', calcP2);
const prestamo2: Prestamo = {
  id: 'p-002',
  codigo: 'PR-1002',
  oficina_id: 'ofi-1',
  cliente_id: 'cli-2',
  cobrador_id: 'usr-cobrador',
  cobrador_nombre: 'Brayan Martínez',
  capital: 1000000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 200000,
  total_a_pagar: 1200000,
  saldo_pendiente: 1200000,
  total_recaudado: 0,
  frecuencia: 'diario',
  num_cuotas: 30,
  valor_cuota: 40000,
  excluir_domingos: true,
  fecha_solicitud: today,
  fecha_primer_cobro: today,
  estado: 'pendiente',
  notas: 'Cliente con taller acreditado en Los Fundadores. Compra de repuestos.',
  cuotas: cuotasP2,
};

// Préstamo 3: Aprobado por supervisor, listo para entrega
const calcP3 = simularPrestamo({
  capital: 500000,
  tasa_interes: 15,
  tipo_interes: 'sobre_saldo',
  num_cuotas: 10,
  frecuencia: 'semanal',
  excluir_domingos: true,
  fecha_primer_cobro: today,
});
const cuotasP3 = generarCuotasEntidad('p-003', calcP3);
const prestamo3: Prestamo = {
  id: 'p-003',
  codigo: 'PR-1003',
  oficina_id: 'ofi-1',
  cliente_id: 'cli-3',
  cobrador_id: 'usr-cobrador',
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: 'usr-supervisor',
  supervisor_nombre: 'Javier Ramírez',
  capital: 500000,
  tipo_interes: 'sobre_saldo',
  tasa_interes: 15,
  total_interes: calcP3.total_interes,
  total_a_pagar: calcP3.total_a_pagar,
  saldo_pendiente: calcP3.total_a_pagar,
  total_recaudado: 0,
  frecuencia: 'semanal',
  num_cuotas: 10,
  valor_cuota: calcP3.valor_cuota,
  excluir_domingos: true,
  fecha_solicitud: '2026-02-12',
  fecha_aprobacion: today,
  fecha_primer_cobro: today,
  estado: 'aprobado',
  notas: 'Aprobado para local en el Centro.',
  cuotas: cuotasP3,
};

// Préstamo 4: En mora (Andrés Felipe Morales, 12 de Octubre)
const calcP4 = simularPrestamo({
  capital: 400000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 20,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: '2026-02-01',
});
const cuotasP4 = generarCuotasEntidad('p-004', calcP4);
for (let i = 0; i < 4; i++) {
  cuotasP4[i].estado = 'atrasada';
}
const prestamo4: Prestamo = {
  id: 'p-004',
  codigo: 'PR-1004',
  oficina_id: 'ofi-1',
  cliente_id: 'cli-4',
  cobrador_id: 'usr-cobrador',
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: 'usr-supervisor',
  supervisor_nombre: 'Javier Ramírez',
  capital: 400000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 80000,
  total_a_pagar: 480000,
  saldo_pendiente: 480000,
  total_recaudado: 0,
  frecuencia: 'diario',
  num_cuotas: 20,
  valor_cuota: 24000,
  excluir_domingos: true,
  fecha_solicitud: '2026-01-25',
  fecha_aprobacion: '2026-01-26',
  fecha_desembolso: '2026-01-28',
  fecha_primer_cobro: '2026-02-01',
  estado: 'mora',
  notas: 'Cuotas pendientes en puesto de comidas en 12 de Octubre.',
  cuotas: cuotasP4,
};

export const INITIAL_PRESTAMOS: Prestamo[] = [
  prestamo1,
  prestamo2,
  prestamo3,
  prestamo4,
];

export const INITIAL_CIERRE_CAJA: CierreCaja = {
  id: 'cierre-today',
  oficina_id: 'ofi-1',
  cobrador_id: 'usr-cobrador',
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: 'usr-supervisor',
  fecha: today,
  base_inicial: 250000,
  total_cobrado: 0,
  total_desembolsado: 0,
  total_gastos: 15000,
  gastos_detalle: [
    { concepto: 'Gasolina para moto', monto: 15000 },
  ],
  efectivo_esperado: 235000,
  efectivo_entregado: 235000,
  diferencia: 0,
  estado: 'abierto',
  created_at: today,
};
