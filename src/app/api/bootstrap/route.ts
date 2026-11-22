import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';
import {
  INITIAL_OFICINAS,
  INITIAL_USUARIOS,
  INITIAL_RUTAS,
  INITIAL_CLIENTES,
  INITIAL_PRESTAMOS,
  INITIAL_CIERRE_CAJA,
  UUIDS,
} from '@/lib/initialData';

interface DbRow {
  [key: string]: unknown;
}

export async function GET() {
  if (!isDbConfigured || !sql) {
    return NextResponse.json({
      connected: false,
      isEmptyDb: false,
      oficinas: INITIAL_OFICINAS,
      usuarios: INITIAL_USUARIOS,
      rutas: INITIAL_RUTAS,
      clientes: INITIAL_CLIENTES,
      prestamos: INITIAL_PRESTAMOS,
      pagos: [],
      cierreCaja: INITIAL_CIERRE_CAJA,
      cierres: [INITIAL_CIERRE_CAJA],
    });
  }

  try {
    const [
      oficinasDb,
      usuariosDb,
      rutasDb,
      clientesDb,
      prestamosDb,
      cuotasDb,
      pagosDb,
      cierresDb,
    ] = (await Promise.all([
      sql`SELECT * FROM oficinas ORDER BY created_at ASC`,
      sql`SELECT id, oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo, created_at FROM usuarios ORDER BY nombre_completo ASC`,
      sql`SELECT * FROM rutas ORDER BY created_at ASC`,
      sql`SELECT * FROM clientes ORDER BY orden_ruta ASC, nombre_completo ASC`,
      sql`SELECT * FROM prestamos ORDER BY created_at DESC`,
      sql`SELECT * FROM cuotas ORDER BY numero_cuota ASC`,
      sql`SELECT * FROM pagos ORDER BY created_at DESC LIMIT 300`,
      sql`SELECT * FROM cierres_caja ORDER BY fecha DESC, created_at DESC`,
    ])) as [DbRow[], DbRow[], DbRow[], DbRow[], DbRow[], DbRow[], DbRow[], DbRow[]];

    const hasDueno = usuariosDb.some((u) => u.rol === 'dueno');
    const usuariosNormalizados: DbRow[] = hasDueno
      ? usuariosDb
      : [
          {
            id: UUIDS.dueno,
            oficina_id: null,
            nombre_completo: 'Hernando Gómez',
            documento: '1000',
            telefono: '300 111 2233',
            rol: 'dueno',
            activo: true,
            created_at: '2026-01-01',
          },
          ...usuariosDb,
        ];

    const clientesNormalizados: DbRow[] = clientesDb.map((cl) => {
      const dir = String(cl.direccion || '');
      const inferredBarrio = dir.includes(',') ? dir.split(',').pop()?.trim().toUpperCase() : 'VALLEDUPAR';
      return {
        ...cl,
        barrio: String(cl.alias || inferredBarrio || 'VALLEDUPAR'),
      };
    });

    const prestamosConCuotas = prestamosDb.map((p) => {
      const cuotas = cuotasDb.filter((c) => c.prestamo_id === p.id);
      const cliente = clientesNormalizados.find((cl) => cl.id === p.cliente_id);
      const cobrador = usuariosNormalizados.find((u) => u.id === p.cobrador_id);
      const supervisor = usuariosNormalizados.find((u) => u.id === p.supervisor_id);

      return {
        ...p,
        capital: Number(p.capital),
        tasa_interes: Number(p.tasa_interes),
        total_interes: Number(p.total_interes),
        total_a_pagar: Number(p.total_a_pagar),
        saldo_pendiente: Number(p.saldo_pendiente),
        total_recaudado: Number(p.total_recaudado),
        valor_cuota: Number(p.valor_cuota),
        num_cuotas: Number(p.num_cuotas),
        fecha_solicitud: String(p.fecha_solicitud || '').split('T')[0],
        fecha_primer_cobro: String(p.fecha_primer_cobro || '').split('T')[0],
        cliente,
        cobrador_nombre: cobrador ? String(cobrador.nombre_completo) : undefined,
        supervisor_nombre: supervisor ? String(supervisor.nombre_completo) : undefined,
        cuotas: cuotas.map((c) => ({
          ...c,
          numero_cuota: Number(c.numero_cuota),
          fecha_vencimiento: String(c.fecha_vencimiento || '').split('T')[0],
          monto_capital: Number(c.monto_capital),
          monto_interes: Number(c.monto_interes),
          monto_total: Number(c.monto_total),
          monto_pagado: Number(c.monto_pagado),
        })),
      };
    });

    const pagosNormalizados = pagosDb.map((pg) => {
      const notaStr = String(pg.nota || '');
      let metodo_pago = 'efectivo';
      if (notaStr.includes('[METODO:transferencia]')) metodo_pago = 'transferencia';
      else if (notaStr.includes('[METODO:otro]')) metodo_pago = 'otro';

      return {
        ...pg,
        monto: Number(pg.monto),
        saldo_restante_despues: Number(pg.saldo_restante_despues),
        fecha_pago: String(pg.fecha_pago || '').split('T')[0],
        hora_pago: String(pg.hora_pago || '').slice(0, 5),
        metodo_pago,
        nota: notaStr.replace(/\[METODO:(efectivo|transferencia|otro)\]\s*/g, '').trim() || undefined,
      };
    });

    const cierresNormalizados = cierresDb.map((c) => {
      const cobrador = usuariosNormalizados.find((u) => u.id === c.cobrador_id);
      return {
        ...c,
        cobrador_nombre: cobrador ? String(cobrador.nombre_completo) : 'Cobrador',
        fecha: String(c.fecha || '').split('T')[0],
        base_inicial: Number(c.base_inicial),
        total_cobrado: Number(c.total_cobrado),
        total_desembolsado: Number(c.total_desembolsado),
        total_gastos: Number(c.total_gastos),
        efectivo_esperado: Number(c.efectivo_esperado),
        efectivo_entregado: Number(c.efectivo_entregado),
        diferencia: Number(c.diferencia),
        gastos_detalle: Array.isArray(c.gastos_detalle) ? c.gastos_detalle : [],
      };
    });

    const cierreActual =
      cierresNormalizados.length > 0
        ? cierresNormalizados[0]
        : {
            ...INITIAL_CIERRE_CAJA,
            oficina_id: String(oficinasDb[0]?.id || UUIDS.oficina1),
            cobrador_id: String(usuariosNormalizados.find((u) => u.rol === 'cobrador')?.id || UUIDS.cobrador),
          };

    const isEmptyDb = clientesDb.length === 0 && prestamosDb.length === 0;

    return NextResponse.json({
      connected: true,
      isEmptyDb,
      oficinas: oficinasDb.length > 0 ? oficinasDb : INITIAL_OFICINAS,
      usuarios: usuariosNormalizados.length > 0 ? usuariosNormalizados : INITIAL_USUARIOS,
      rutas: rutasDb,
      clientes: clientesNormalizados,
      prestamos: prestamosConCuotas,
      pagos: pagosNormalizados,
      cierreCaja: cierreActual,
      cierres: cierresNormalizados,
    });
  } catch (error: unknown) {
    console.error('Error al consultar Neon Postgres:', error);
    return NextResponse.json({
      connected: false,
      isEmptyDb: false,
      error: 'Error temporal de conexión con base de datos.',
      oficinas: INITIAL_OFICINAS,
      usuarios: INITIAL_USUARIOS,
      rutas: INITIAL_RUTAS,
      clientes: INITIAL_CLIENTES,
      prestamos: INITIAL_PRESTAMOS,
      pagos: [],
      cierreCaja: INITIAL_CIERRE_CAJA,
      cierres: [INITIAL_CIERRE_CAJA],
    });
  }
}
