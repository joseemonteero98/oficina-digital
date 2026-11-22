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

export async function POST() {
  if (!isDbConfigured || !sql) {
    return NextResponse.json({ success: true, simulated: true });
  }

  try {
    // 1. Oficina
    for (const o of INITIAL_OFICINAS) {
      await sql`
        INSERT INTO oficinas (id, nombre, ciudad, telefono, excluir_domingos, tasa_interes_defecto, activa)
        VALUES (${o.id}, ${o.nombre}, ${o.ciudad}, ${o.telefono}, ${o.excluir_domingos}, ${o.tasa_interes_defecto}, ${o.activa})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 2. Usuarios
    for (const u of INITIAL_USUARIOS) {
      await sql`
        INSERT INTO usuarios (id, oficina_id, supervisor_id, nombre_completo, documento, telefono, rol, activo)
        VALUES (${u.id}, ${u.oficina_id || null}, ${u.supervisor_id || null}, ${u.nombre_completo}, ${u.documento || u.id}, ${u.telefono}, ${u.rol}, ${u.activo})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 3. Rutas
    for (const r of INITIAL_RUTAS) {
      await sql`
        INSERT INTO rutas (id, oficina_id, cobrador_id, nombre, zona, activa)
        VALUES (${r.id}, ${r.oficina_id}, ${r.cobrador_id}, ${r.nombre}, ${r.zona}, ${r.activa})
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 4. Clientes
    for (const c of INITIAL_CLIENTES) {
      await sql`
        INSERT INTO clientes (id, oficina_id, ruta_id, cobrador_id, nombre_completo, documento, telefono, direccion, negocio, alias, orden_ruta, activo)
        VALUES (${c.id}, ${c.oficina_id}, ${c.ruta_id || null}, ${c.cobrador_id || null}, ${c.nombre_completo}, ${c.documento}, ${c.telefono}, ${c.direccion}, ${c.negocio || null}, ${c.barrio || c.alias || null}, ${c.orden_ruta}, true)
        ON CONFLICT (id) DO NOTHING
      `;
    }

    // 5. Préstamos y cuotas
    for (const p of INITIAL_PRESTAMOS) {
      await sql`
        INSERT INTO prestamos (
          id, codigo, oficina_id, cliente_id, cobrador_id, supervisor_id,
          capital, tipo_interes, tasa_interes, total_interes, total_a_pagar, saldo_pendiente, total_recaudado,
          frecuencia, num_cuotas, valor_cuota, excluir_domingos,
          fecha_solicitud, fecha_primer_cobro, estado, notas
        ) VALUES (
          ${p.id}, ${p.codigo}, ${p.oficina_id}, ${p.cliente_id}, ${p.cobrador_id}, ${p.supervisor_id || null},
          ${p.capital}, ${p.tipo_interes}, ${p.tasa_interes}, ${p.total_interes}, ${p.total_a_pagar}, ${p.saldo_pendiente}, ${p.total_recaudado},
          ${p.frecuencia}, ${p.num_cuotas}, ${p.valor_cuota}, ${p.excluir_domingos},
          ${p.fecha_solicitud}, ${p.fecha_primer_cobro}, ${p.estado}, ${p.notas || null}
        )
        ON CONFLICT (id) DO NOTHING
      `;

      for (const q of p.cuotas || []) {
        await sql`
          INSERT INTO cuotas (
            prestamo_id, oficina_id, numero_cuota, fecha_vencimiento,
            monto_capital, monto_interes, monto_total, monto_pagado, estado
          ) VALUES (
            ${p.id}, ${p.oficina_id}, ${q.numero_cuota}, ${q.fecha_vencimiento},
            ${q.monto_capital}, ${q.monto_interes}, ${q.monto_total}, ${q.monto_pagado}, ${q.estado}
          )
          ON CONFLICT DO NOTHING
        `;
      }
    }

    // 6. Cierre inicial de caja
    await sql`
      INSERT INTO cierres_caja (
        id, oficina_id, cobrador_id, supervisor_id, fecha, base_inicial,
        total_cobrado, total_desembolsado, total_gastos, gastos_detalle,
        efectivo_esperado, efectivo_entregado, diferencia, estado
      ) VALUES (
        ${INITIAL_CIERRE_CAJA.id}, ${INITIAL_CIERRE_CAJA.oficina_id}, ${INITIAL_CIERRE_CAJA.cobrador_id}, ${INITIAL_CIERRE_CAJA.supervisor_id || null},
        CURRENT_DATE, ${INITIAL_CIERRE_CAJA.base_inicial}, 0, 0, ${INITIAL_CIERRE_CAJA.total_gastos},
        ${JSON.stringify(INITIAL_CIERRE_CAJA.gastos_detalle || [])}::jsonb,
        ${INITIAL_CIERRE_CAJA.efectivo_esperado}, ${INITIAL_CIERRE_CAJA.efectivo_entregado}, 0, 'abierto'
      )
      ON CONFLICT (id) DO NOTHING
    `;

    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    console.error('Error al cargar datos de ejemplo en Postgres:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudieron cargar los datos de ejemplo en Postgres.' },
      { status: 500 }
    );
  }
}
