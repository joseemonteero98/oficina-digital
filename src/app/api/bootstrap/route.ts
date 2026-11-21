import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';
import {
  INITIAL_OFICINAS,
  INITIAL_USUARIOS,
  INITIAL_RUTAS,
  INITIAL_CLIENTES,
  INITIAL_PRESTAMOS,
  INITIAL_CIERRE_CAJA,
} from '@/lib/initialData';

export async function GET() {
  if (!isDbConfigured || !sql) {
    return NextResponse.json({
      connected: false,
      oficinas: INITIAL_OFICINAS,
      usuarios: INITIAL_USUARIOS,
      rutas: INITIAL_RUTAS,
      clientes: INITIAL_CLIENTES,
      prestamos: INITIAL_PRESTAMOS,
      cierreCaja: INITIAL_CIERRE_CAJA,
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
      cierresDb,
    ] = await Promise.all([
      sql`SELECT * FROM oficinas ORDER BY created_at ASC`,
      sql`SELECT id, oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo, created_at FROM usuarios ORDER BY nombre_completo ASC`,
      sql`SELECT * FROM rutas ORDER BY created_at ASC`,
      sql`SELECT * FROM clientes ORDER BY orden_ruta ASC, nombre_completo ASC`,
      sql`SELECT * FROM prestamos ORDER BY created_at DESC`,
      sql`SELECT * FROM cuotas ORDER BY numero_cuota ASC`,
      sql`SELECT * FROM cierres_caja ORDER BY fecha DESC LIMIT 1`,
    ]);

    // Asociar cuotas y clientes a los préstamos
    const prestamosConCuotas = prestamosDb.map((p: any) => {
      const cuotas = cuotasDb.filter((c: any) => c.prestamo_id === p.id);
      const cliente = clientesDb.find((cl: any) => cl.id === p.cliente_id);
      const cobrador = usuariosDb.find((u: any) => u.id === p.cobrador_id);
      const supervisor = usuariosDb.find((u: any) => u.id === p.supervisor_id);

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
        cliente,
        cobrador_nombre: cobrador?.nombre_completo,
        supervisor_nombre: supervisor?.nombre_completo,
        cuotas: cuotas.map((c: any) => ({
          ...c,
          numero_cuota: Number(c.numero_cuota),
          monto_capital: Number(c.monto_capital),
          monto_interes: Number(c.monto_interes),
          monto_total: Number(c.monto_total),
          monto_pagado: Number(c.monto_pagado),
        })),
      };
    });

    const cierreActual = cierresDb.length > 0 ? {
      ...cierresDb[0],
      base_inicial: Number(cierresDb[0].base_inicial),
      total_cobrado: Number(cierresDb[0].total_cobrado),
      total_desembolsado: Number(cierresDb[0].total_desembolsado),
      total_gastos: Number(cierresDb[0].total_gastos),
      efectivo_esperado: Number(cierresDb[0].efectivo_esperado),
      efectivo_entregado: Number(cierresDb[0].efectivo_entregado),
      diferencia: Number(cierresDb[0].diferencia),
    } : INITIAL_CIERRE_CAJA;

    return NextResponse.json({
      connected: true,
      oficinas: oficinasDb.length > 0 ? oficinasDb : INITIAL_OFICINAS,
      usuarios: usuariosDb.length > 0 ? usuariosDb : INITIAL_USUARIOS,
      rutas: rutasDb.length > 0 ? rutasDb : INITIAL_RUTAS,
      clientes: clientesDb.length > 0 ? clientesDb : INITIAL_CLIENTES,
      prestamos: prestamosConCuotas.length > 0 ? prestamosConCuotas : INITIAL_PRESTAMOS,
      cierreCaja: cierreActual,
    });
  } catch (error: any) {
    console.error('Error al consultar Neon Postgres:', error);
    // En caso de error de conexión en frío, responder con datos iniciales
    return NextResponse.json({
      connected: false,
      error: error.message,
      oficinas: INITIAL_OFICINAS,
      usuarios: INITIAL_USUARIOS,
      rutas: INITIAL_RUTAS,
      clientes: INITIAL_CLIENTES,
      prestamos: INITIAL_PRESTAMOS,
      cierreCaja: INITIAL_CIERRE_CAJA,
    });
  }
}
