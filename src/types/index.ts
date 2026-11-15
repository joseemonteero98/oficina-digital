export type UserRole = 'dueno' | 'admin' | 'supervisor' | 'cobrador';

export type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export type TipoInteres = 'fijo' | 'sobre_saldo';

export type EstadoPrestamo = 
  | 'pendiente'      // Creado por cobrador, esperando autorización del supervisor
  | 'aprobado'       // Autorizado por supervisor, listo para que el cobrador entregue el dinero
  | 'rechazado'      // Rechazado por supervisor
  | 'activo'         // Desembolsado y en cobro
  | 'pagado'         // Cancelado en su totalidad
  | 'mora';          // Con cuotas vencidas no pagadas

export type EstadoCuota = 'pendiente' | 'parcial' | 'pagada' | 'atrasada';

export type TipoPago = 'cuota_completa' | 'abono' | 'no_pago';

export type EstadoCierreCaja = 'abierto' | 'pendiente_revision' | 'aprobado';

export interface Oficina {
  id: string;
  nombre: string;
  ciudad: string;
  telefono: string;
  excluir_domingos: boolean;
  tasa_interes_defecto: number;
  activa: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  oficina_id?: string; // Dueño puede tener null (ve todas)
  supervisor_id?: string; // Para cobradores, quién es su supervisor directo
  nombre_completo: string;
  email: string;
  telefono: string;
  rol: UserRole;
  activo: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Ruta {
  id: string;
  oficina_id: string;
  cobrador_id: string;
  nombre: string;
  zona: string;
  activa: boolean;
}

export interface Cliente {
  id: string;
  oficina_id: string;
  ruta_id: string;
  cobrador_id: string;
  nombre_completo: string;
  documento: string;
  telefono: string;
  direccion: string;
  negocio?: string;
  alias?: string;
  orden_ruta: number; // Para ordenar visitas en la calle
  prestamos_activos_count?: number;
  saldo_total?: number;
  activo?: boolean;
  created_at: string;
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  numero_cuota: number;
  fecha_vencimiento: string; // YYYY-MM-DD
  monto_capital: number;
  monto_interes: number;
  monto_total: number;
  monto_pagado: number;
  estado: EstadoCuota;
  fecha_ultimo_pago?: string;
}

export interface Prestamo {
  id: string;
  codigo: string; // Ej: PR-00102
  oficina_id: string;
  cliente_id: string;
  cliente?: Cliente;
  cobrador_id: string;
  cobrador_nombre?: string;
  supervisor_id?: string;
  supervisor_nombre?: string;
  
  // Financiero
  capital: number;
  tipo_interes: TipoInteres; // 'fijo' o 'sobre_saldo'
  tasa_interes: number; // Porcentaje, ej: 20
  total_interes: number;
  total_a_pagar: number;
  saldo_pendiente: number;
  total_recaudado: number;
  
  // Configuración de cuotas
  frecuencia: FrecuenciaPago;
  num_cuotas: number;
  valor_cuota: number;
  excluir_domingos: boolean;
  
  // Fechas y ciclo de vida
  fecha_solicitud: string;
  fecha_aprobacion?: string;
  fecha_desembolso?: string;
  fecha_primer_cobro: string;
  fecha_vencimiento_final?: string;
  
  estado: EstadoPrestamo;
  motivo_rechazo?: string;
  notas?: string;
  
  cuotas?: Cuota[];
}

export interface RegistroPago {
  id: string;
  prestamo_id: string;
  cuota_id?: string;
  cliente_id: string;
  cobrador_id: string;
  monto: number;
  tipo: TipoPago;
  motivo_no_pago?: string;
  nota?: string;
  fecha_pago: string;
  hora_pago: string;
  saldo_restante_despues: number;
}

export interface CierreCaja {
  id: string;
  oficina_id: string;
  cobrador_id: string;
  cobrador_nombre: string;
  supervisor_id?: string;
  fecha: string; // YYYY-MM-DD
  base_inicial: number;
  total_cobrado: number;
  total_desembolsado: number;
  total_gastos: number;
  gastos_detalle?: { concepto: string; monto: number }[];
  efectivo_esperado: number; // base + cobrado - desembolsado - gastos
  efectivo_entregado: number;
  diferencia: number; // entregado - esperado
  estado: EstadoCierreCaja;
  observaciones?: string;
  created_at: string;
}
