export type UserRole = 'dueno' | 'admin' | 'supervisor' | 'cobrador';

export type FrecuenciaPago = 'diario' | 'semanal' | 'quincenal' | 'mensual';

export type TipoInteres = 'fijo' | 'sobre_saldo';

export type MetodoPago = 'efectivo' | 'transferencia' | 'otro';

export type TipoDocumento = 'CC' | 'CE' | 'NIT' | 'PAS';

export type EstadoPrestamo =
  | 'pendiente'   // Creado por cobrador, esperando autorización del supervisor
  | 'aprobado'    // Autorizado por supervisor, listo para que el cobrador entregue el dinero
  | 'rechazado'   // Rechazado por supervisor
  | 'activo'      // Desembolsado y en cobro
  | 'pagado'      // Cancelado en su totalidad
  | 'mora';       // Con cuotas vencidas no pagadas

export type EstadoCuota = 'pendiente' | 'parcial' | 'pagada' | 'atrasada';

export type TipoPago = 'cuota_completa' | 'abono' | 'no_pago';

export type EstadoCierreCaja = 'abierto' | 'pendiente_revision' | 'aprobado' | 'rechazado';

export type SyncStatus = 'conectado' | 'sin_conexion' | 'sincronizando' | 'error';

export type SeccionCobrador =
  | 'cobros_hoy'
  | 'mis_prestamos'
  | 'nuevo_prestamo'
  | 'mis_clientes'
  | 'gastos_calle'
  | 'arqueo_cierre'
  | 'historial_recaudos';

export type SeccionSupervisor =
  | 'resumen_oficina'
  | 'solicitudes'
  | 'cobradores_calle'
  | 'arqueos_pendientes'
  | 'cartera'
  | 'clientes'
  | 'historial_operaciones';

export type SeccionAdmin =
  | 'resumen'
  | 'oficinas_asignadas'
  | 'equipo'
  | 'supervisores'
  | 'cobradores'
  | 'cartera'
  | 'clientes'
  | 'reportes'
  | 'configuracion'
  | 'auditoria';

export type SeccionDueno =
  | 'resumen_general'
  | 'oficinas'
  | 'administradores'
  | 'personal'
  | 'cartera_consolidada'
  | 'indicadores'
  | 'comparacion_oficinas'
  | 'reportes_generales'
  | 'auditoria_global';

export type AppSection =
  | SeccionCobrador
  | SeccionSupervisor
  | SeccionAdmin
  | SeccionDueno;

export interface Oficina {
  id: string;
  nombre: string;
  ciudad: string;
  direccion?: string;
  telefono: string;
  excluir_domingos: boolean;
  tasa_interes_defecto: number;
  tope_aprobacion_automatica?: number;
  activa: boolean;
  created_at: string;
}

export interface Usuario {
  id: string;
  oficina_id?: string | null; // Dueño puede tener null (ve todas)
  supervisor_id?: string | null; // Para cobradores, quién es su supervisor directo
  nombre_completo: string;
  documento?: string;
  email?: string;
  telefono: string;
  rol: UserRole;
  activo: boolean;
  avatar_url?: string;
  created_at: string;
}

export interface Ruta {
  id: string;
  oficina_id: string;
  cobrador_id: string | null;
  nombre: string;
  zona: string;
  activa: boolean;
}

export interface Cliente {
  id: string;
  oficina_id: string;
  ruta_id?: string | null;
  cobrador_id?: string | null;
  nombre_completo: string;
  tipo_documento?: TipoDocumento;
  documento: string;
  telefono: string;
  direccion: string;
  barrio?: string;
  referencia_ubicacion?: string;
  negocio?: string;
  alias?: string;
  notas?: string;
  orden_ruta: number;
  prestamos_activos_count?: number;
  saldo_total?: number;
  activo?: boolean;
  created_at: string;
}

export interface Cuota {
  id: string;
  prestamo_id: string;
  oficina_id?: string;
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
  codigo: string; // Ej: PR-1001
  oficina_id: string;
  cliente_id: string;
  cliente?: Cliente;
  cobrador_id: string;
  cobrador_nombre?: string;
  supervisor_id?: string | null;
  supervisor_nombre?: string;

  // Financiero
  capital: number;
  tipo_interes: TipoInteres;
  tasa_interes: number;
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
  oficina_id?: string;
  prestamo_id: string;
  cuota_id?: string | null;
  cliente_id: string;
  cobrador_id: string;
  monto: number;
  tipo: TipoPago;
  metodo_pago?: MetodoPago;
  motivo_no_pago?: string;
  nota?: string;
  fecha_pago: string;
  hora_pago: string;
  saldo_restante_despues: number;
  proxima_fecha_pago?: string;
  created_at?: string;
}

export interface GastoCalle {
  id: string;
  tipo: 'Gasolina' | 'Transporte' | 'Alimentación' | 'Otros';
  concepto: string;
  monto: number;
  fecha: string;
  hora: string;
  soporte_nombre?: string;
}

export interface CierreCaja {
  id: string;
  oficina_id: string;
  cobrador_id: string;
  cobrador_nombre: string;
  supervisor_id?: string | null;
  fecha: string; // YYYY-MM-DD
  base_inicial: number;
  total_cobrado: number;
  total_cobrado_efectivo?: number;
  total_cobrado_transferencia?: number;
  total_desembolsado: number;
  total_gastos: number;
  gastos_detalle?: GastoCalle[];
  efectivo_esperado: number; // base + cobrado_efectivo - desembolsado - gastos
  efectivo_entregado: number;
  diferencia: number; // entregado - esperado
  estado: EstadoCierreCaja;
  observaciones?: string;
  created_at: string;
}

export interface SimulacionPrestamo {
  capital: number;
  tipo_interes: TipoInteres;
  tasa_interes: number;
  total_interes: number;
  total_a_pagar: number;
  valor_cuota: number;
  num_cuotas: number;
  frecuencia: FrecuenciaPago;
  fecha_primer_pago: string;
  fecha_ultimo_pago: string;
  diferencia_redondeo: number;
  cuotas_simuladas: {
    numero: number;
    fecha: string;
    monto_capital: number;
    monto_interes: number;
    monto_total: number;
    saldo_restante: number;
  }[];
}

export interface AppNotification {
  id: string;
  titulo: string;
  mensaje: string;
  tipo: 'info' | 'success' | 'warning' | 'error';
  leida: boolean;
  fecha: string;
  targetRole?: UserRole;
  targetSection?: AppSection;
}

export interface AuditEvent {
  id: string;
  fecha: string;
  hora: string;
  usuario: string;
  rol: UserRole;
  oficina_id?: string;
  accion: string;
  detalle: string;
}
