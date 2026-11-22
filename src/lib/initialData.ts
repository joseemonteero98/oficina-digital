import { Oficina, Usuario, Cliente, Ruta, Prestamo, CierreCaja } from '@/types';
import { simularPrestamo, generarCuotasEntidad } from './calculations';

// UUIDs determinísticos compatibles con PostgreSQL y con el SQL inicial
export const UUIDS = {
  oficina1: '11111111-1111-1111-1111-111111111111',
  oficina2: '22222222-2222-2222-2222-222222222222',
  dueno: 'dddddddd-dddd-dddd-dddd-dddddddddddd',
  admin: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
  supervisor: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
  cobrador: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
  ruta1: '33333333-3333-3333-3333-333333333301',
  ruta2: '33333333-3333-3333-3333-333333333302',
  ruta3: '33333333-3333-3333-3333-333333333303',
  ruta4: '33333333-3333-3333-3333-333333333304',
  ruta5: '33333333-3333-3333-3333-333333333305',
  ruta6: '33333333-3333-3333-3333-333333333306',
  cli1: '44444444-4444-4444-4444-444444444401',
  cli2: '44444444-4444-4444-4444-444444444402',
  cli3: '44444444-4444-4444-4444-444444444403',
  cli4: '44444444-4444-4444-4444-444444444404',
  cli5: '44444444-4444-4444-4444-444444444405',
  cli6: '44444444-4444-4444-4444-444444444406',
  p1: '55555555-5555-5555-5555-555555555501',
  p2: '55555555-5555-5555-5555-555555555502',
  p3: '55555555-5555-5555-5555-555555555503',
  p4: '55555555-5555-5555-5555-555555555504',
  p5: '55555555-5555-5555-5555-555555555505',
  p6: '55555555-5555-5555-5555-555555555506',
};

export const INITIAL_OFICINAS: Oficina[] = [
  {
    id: UUIDS.oficina1,
    nombre: 'Oficina Central Valledupar',
    ciudad: 'Valledupar, Cesar',
    direccion: 'Cra 9 # 16-24, Centro',
    telefono: '300 456 7890',
    excluir_domingos: true,
    tasa_interes_defecto: 20,
    tope_aprobacion_automatica: 2000000,
    activa: true,
    created_at: '2026-01-01',
  },
];

export const INITIAL_USUARIOS: Usuario[] = [
  {
    id: UUIDS.dueno,
    oficina_id: null,
    nombre_completo: 'Hernando Gómez',
    documento: '1000',
    email: 'dueno@oficinadigital.co',
    telefono: '300 111 2233',
    rol: 'dueno',
    activo: true,
    created_at: '2026-01-01',
  },
  {
    id: UUIDS.admin,
    oficina_id: UUIDS.oficina1,
    nombre_completo: 'Carlos Mendoza',
    documento: '1001',
    email: 'admin.valledupar@oficinadigital.co',
    telefono: '312 444 5566',
    rol: 'admin',
    activo: true,
    created_at: '2026-01-05',
  },
  {
    id: UUIDS.supervisor,
    oficina_id: UUIDS.oficina1,
    nombre_completo: 'Javier Ramírez',
    documento: '1002',
    email: 'supervisor.valledupar@oficinadigital.co',
    telefono: '315 777 8899',
    rol: 'supervisor',
    activo: true,
    created_at: '2026-01-10',
  },
  {
    id: UUIDS.cobrador,
    oficina_id: UUIDS.oficina1,
    supervisor_id: UUIDS.supervisor,
    nombre_completo: 'Brayan Martínez',
    documento: '1003',
    email: 'brayan.cobrador@oficinadigital.co',
    telefono: '320 999 0011',
    rol: 'cobrador',
    activo: true,
    created_at: '2026-01-15',
  },
];

export const INITIAL_RUTAS: Ruta[] = [
  {
    id: UUIDS.ruta1,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: 'LA NEVADA',
    zona: 'Sector Noroccidental',
    activa: true,
  },
  {
    id: UUIDS.ruta2,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: 'DIVINO NIÑO',
    zona: 'Sector Noroccidental',
    activa: true,
  },
  {
    id: UUIDS.ruta3,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: 'LOS FUNDADORES',
    zona: 'Sector Sur',
    activa: true,
  },
  {
    id: UUIDS.ruta4,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: '12 DE OCTUBRE',
    zona: 'Sector Sur',
    activa: true,
  },
  {
    id: UUIDS.ruta5,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: 'CENTRO',
    zona: 'Sector Comercial',
    activa: true,
  },
  {
    id: UUIDS.ruta6,
    oficina_id: UUIDS.oficina1,
    cobrador_id: UUIDS.cobrador,
    nombre: 'MERCADO PÚBLICO',
    zona: 'Sector Comercial',
    activa: true,
  },
];

export const INITIAL_CLIENTES: Cliente[] = [
  {
    id: UUIDS.cli1,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta1,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'Rosa Elena Pérez',
    tipo_documento: 'CC',
    documento: '43567890',
    telefono: '301 234 5678',
    direccion: 'Calle 6 # 42-15, La Nevada',
    barrio: 'LA NEVADA',
    referencia_ubicacion: 'Frente a la cancha sintética',
    negocio: 'Tienda Doña Rosa',
    alias: 'LA NEVADA',
    orden_ruta: 1,
    activo: true,
    created_at: '2026-01-20',
  },
  {
    id: UUIDS.cli2,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta3,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'Juan Camilo Díaz',
    tipo_documento: 'CC',
    documento: '71234901',
    telefono: '314 567 8901',
    direccion: 'Cra 23 # 18-40, Los Fundadores',
    barrio: 'LOS FUNDADORES',
    referencia_ubicacion: 'Esquina del semáforo',
    negocio: 'Taller de Motos El Vallenato',
    alias: 'LOS FUNDADORES',
    orden_ruta: 2,
    activo: true,
    created_at: '2026-01-22',
  },
  {
    id: UUIDS.cli3,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta5,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'Claudia Patricia Restrepo',
    tipo_documento: 'CC',
    documento: '32890123',
    telefono: '318 901 2345',
    direccion: 'Calle 16 # 19-30, Centro',
    barrio: 'CENTRO',
    referencia_ubicacion: 'A dos cuadras de la Plaza Alfonso López',
    negocio: 'Peluquería Glamour Vallenato',
    alias: 'CENTRO',
    orden_ruta: 3,
    activo: true,
    created_at: '2026-02-01',
  },
  {
    id: UUIDS.cli4,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta4,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'Andrés Felipe Morales',
    tipo_documento: 'CC',
    documento: '1020345678',
    telefono: '305 678 1234',
    direccion: 'Cra 4 # 25-10, 12 de Octubre',
    barrio: '12 DE OCTUBRE',
    referencia_ubicacion: 'Junto al parque',
    negocio: 'Comidas Rápidas El Cacique',
    alias: '12 DE OCTUBRE',
    orden_ruta: 4,
    activo: true,
    created_at: '2026-02-05',
  },
  {
    id: UUIDS.cli5,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta6,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'María Elena Torres',
    tipo_documento: 'CC',
    documento: '21456789',
    telefono: '311 222 3344',
    direccion: 'Mercado Público, Local 45',
    barrio: 'MERCADO PÚBLICO',
    referencia_ubicacion: 'Pabellón de frutas',
    negocio: 'Frutería Guatapurí',
    alias: 'MERCADO PÚBLICO',
    orden_ruta: 5,
    activo: true,
    created_at: '2026-02-10',
  },
  {
    id: UUIDS.cli6,
    oficina_id: UUIDS.oficina1,
    ruta_id: UUIDS.ruta2,
    cobrador_id: UUIDS.cobrador,
    nombre_completo: 'Luis Eduardo Quintero',
    tipo_documento: 'CC',
    documento: '77190234',
    telefono: '316 445 8822',
    direccion: 'Mz 12 Casa 4, Divino Niño',
    barrio: 'DIVINO NIÑO',
    referencia_ubicacion: 'Diagonal a la panadería',
    negocio: 'Ferretería El Maestro',
    alias: 'DIVINO NIÑO',
    orden_ruta: 6,
    activo: true,
    created_at: '2026-02-11',
  },
];

export const DEFAULT_TODAY = '2026-11-21';

export function getTodayString(): string {
  if (typeof window === 'undefined') {
    return DEFAULT_TODAY;
  }
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fallback
  }
  return DEFAULT_TODAY;
}

const today = DEFAULT_TODAY;

// P1: Activo en cobro hoy - Doña Rosa (La Nevada)
const calcP1 = simularPrestamo({
  capital: 600000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 24,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: '2026-11-01',
});
const cuotasP1 = generarCuotasEntidad(UUIDS.p1, calcP1);
for (let i = 0; i < 9; i++) {
  cuotasP1[i].estado = 'pagada';
  cuotasP1[i].monto_pagado = cuotasP1[i].monto_total;
  cuotasP1[i].fecha_ultimo_pago = '2026-11-20';
}
if (cuotasP1[9]) {
  cuotasP1[9].fecha_vencimiento = today;
  cuotasP1[9].estado = 'pendiente';
}

const prestamo1: Prestamo = {
  id: UUIDS.p1,
  codigo: 'PR-1001',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli1,
  cliente: INITIAL_CLIENTES[0],
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
  supervisor_nombre: 'Javier Ramírez',
  capital: 600000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 120000,
  total_a_pagar: 720000,
  saldo_pendiente: 450000,
  total_recaudado: 270000,
  frecuencia: 'diario',
  num_cuotas: 24,
  valor_cuota: 30000,
  excluir_domingos: true,
  fecha_solicitud: '2026-10-30',
  fecha_aprobacion: '2026-10-31',
  fecha_desembolso: '2026-10-31',
  fecha_primer_cobro: '2026-11-01',
  fecha_vencimiento_final: calcP1.fecha_ultimo_pago,
  estado: 'activo',
  cuotas: cuotasP1,
};

// P2: Pendiente de autorización por el Supervisor - Juan Camilo Díaz (Los Fundadores)
const calcP2 = simularPrestamo({
  capital: 1000000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 30,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: today,
});
const cuotasP2 = generarCuotasEntidad(UUIDS.p2, calcP2);
const prestamo2: Prestamo = {
  id: UUIDS.p2,
  codigo: 'PR-1002',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli2,
  cliente: INITIAL_CLIENTES[1],
  cobrador_id: UUIDS.cobrador,
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
  fecha_vencimiento_final: calcP2.fecha_ultimo_pago,
  estado: 'pendiente',
  notas: 'Cliente con taller acreditado en Los Fundadores. Solicita para compra de repuestos.',
  cuotas: cuotasP2,
};

// P3: Aprobado por supervisor, listo para entrega - Claudia Patricia Restrepo (Centro)
const calcP3 = simularPrestamo({
  capital: 500000,
  tasa_interes: 15,
  tipo_interes: 'sobre_saldo',
  num_cuotas: 10,
  frecuencia: 'semanal',
  excluir_domingos: true,
  fecha_primer_cobro: today,
});
const cuotasP3 = generarCuotasEntidad(UUIDS.p3, calcP3);
const prestamo3: Prestamo = {
  id: UUIDS.p3,
  codigo: 'PR-1003',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli3,
  cliente: INITIAL_CLIENTES[2],
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
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
  fecha_solicitud: '2026-11-19',
  fecha_aprobacion: today,
  fecha_primer_cobro: today,
  fecha_vencimiento_final: calcP3.fecha_ultimo_pago,
  estado: 'aprobado',
  notas: 'Aprobado para peluquería en el Centro.',
  cuotas: cuotasP3,
};

// P4: En mora - Andrés Felipe Morales (12 de Octubre)
const calcP4 = simularPrestamo({
  capital: 400000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 20,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: '2026-11-05',
});
const cuotasP4 = generarCuotasEntidad(UUIDS.p4, calcP4);
for (let i = 0; i < 3; i++) {
  cuotasP4[i].estado = 'atrasada';
}
if (cuotasP4[3]) {
  cuotasP4[3].fecha_vencimiento = today;
  cuotasP4[3].estado = 'atrasada';
}
const prestamo4: Prestamo = {
  id: UUIDS.p4,
  codigo: 'PR-1004',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli4,
  cliente: INITIAL_CLIENTES[3],
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
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
  fecha_solicitud: '2026-11-03',
  fecha_aprobacion: '2026-11-04',
  fecha_desembolso: '2026-11-04',
  fecha_primer_cobro: '2026-11-05',
  fecha_vencimiento_final: calcP4.fecha_ultimo_pago,
  estado: 'mora',
  notas: 'Tiene cuotas atrasadas en puesto de comidas en 12 de Octubre.',
  cuotas: cuotasP4,
};

// P5: Activo con abono parcial - Luis Eduardo Quintero (Divino Niño)
const calcP5 = simularPrestamo({
  capital: 500000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 20,
  frecuencia: 'diario',
  excluir_domingos: true,
  fecha_primer_cobro: '2026-11-10',
});
const cuotasP5 = generarCuotasEntidad(UUIDS.p5, calcP5);
cuotasP5[0].estado = 'pagada';
cuotasP5[0].monto_pagado = cuotasP5[0].monto_total;
cuotasP5[1].estado = 'parcial';
cuotasP5[1].monto_pagado = 10000;
cuotasP5[1].fecha_vencimiento = today;

const prestamo5: Prestamo = {
  id: UUIDS.p5,
  codigo: 'PR-1005',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli6,
  cliente: INITIAL_CLIENTES[5],
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
  supervisor_nombre: 'Javier Ramírez',
  capital: 500000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 100000,
  total_a_pagar: 600000,
  saldo_pendiente: 560000,
  total_recaudado: 40000,
  frecuencia: 'diario',
  num_cuotas: 20,
  valor_cuota: 30000,
  excluir_domingos: true,
  fecha_solicitud: '2026-11-09',
  fecha_aprobacion: '2026-11-09',
  fecha_desembolso: '2026-11-09',
  fecha_primer_cobro: '2026-11-10',
  fecha_vencimiento_final: calcP5.fecha_ultimo_pago,
  estado: 'activo',
  cuotas: cuotasP5,
};

// P6: Activo en Mercado Público - María Elena Torres
const calcP6 = simularPrestamo({
  capital: 300000,
  tasa_interes: 20,
  tipo_interes: 'fijo',
  num_cuotas: 24,
  frecuencia: 'diario',
  excluir_domingos: false,
  fecha_primer_cobro: '2026-11-15',
});
const cuotasP6 = generarCuotasEntidad(UUIDS.p6, calcP6);
cuotasP6[0].fecha_vencimiento = today;
cuotasP6[0].estado = 'pendiente';

const prestamo6: Prestamo = {
  id: UUIDS.p6,
  codigo: 'PR-1006',
  oficina_id: UUIDS.oficina1,
  cliente_id: UUIDS.cli5,
  cliente: INITIAL_CLIENTES[4],
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
  supervisor_nombre: 'Javier Ramírez',
  capital: 300000,
  tipo_interes: 'fijo',
  tasa_interes: 20,
  total_interes: 60000,
  total_a_pagar: 360000,
  saldo_pendiente: 360000,
  total_recaudado: 0,
  frecuencia: 'diario',
  num_cuotas: 24,
  valor_cuota: 15000,
  excluir_domingos: false,
  fecha_solicitud: '2026-11-14',
  fecha_aprobacion: '2026-11-14',
  fecha_desembolso: '2026-11-14',
  fecha_primer_cobro: '2026-11-15',
  fecha_vencimiento_final: calcP6.fecha_ultimo_pago,
  estado: 'activo',
  cuotas: cuotasP6,
};

export const INITIAL_PRESTAMOS: Prestamo[] = [
  prestamo1,
  prestamo2,
  prestamo3,
  prestamo4,
  prestamo5,
  prestamo6,
];

export const INITIAL_CIERRE_CAJA: CierreCaja = {
  id: '66666666-6666-6666-6666-666666666601',
  oficina_id: UUIDS.oficina1,
  cobrador_id: UUIDS.cobrador,
  cobrador_nombre: 'Brayan Martínez',
  supervisor_id: UUIDS.supervisor,
  fecha: today,
  base_inicial: 250000,
  total_cobrado: 0,
  total_cobrado_efectivo: 0,
  total_cobrado_transferencia: 0,
  total_desembolsado: 0,
  total_gastos: 15000,
  gastos_detalle: [
    {
      id: 'gasto-1',
      tipo: 'Gasolina',
      concepto: 'Gasolina para moto ruta La Nevada',
      monto: 15000,
      fecha: today,
      hora: '07:45 a. m.',
    },
  ],
  efectivo_esperado: 235000,
  efectivo_entregado: 235000,
  diferencia: 0,
  estado: 'abierto',
  created_at: today,
};
