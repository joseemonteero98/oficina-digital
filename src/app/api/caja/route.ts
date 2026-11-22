import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { accion, oficina_id, cobrador_id } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true, accion });
    }

    // Buscar o crear caja del día
    let existing = await sql`
      SELECT * FROM cierres_caja 
      WHERE cobrador_id = ${cobrador_id} AND fecha = CURRENT_DATE
      LIMIT 1
    `;

    if (existing.length === 0) {
      const created = await sql`
        INSERT INTO cierres_caja (
          oficina_id, cobrador_id, fecha, base_inicial, total_cobrado, total_desembolsado, total_gastos, gastos_detalle, efectivo_esperado, efectivo_entregado, diferencia, estado
        ) VALUES (
          ${oficina_id}, ${cobrador_id}, CURRENT_DATE, 250000, 0, 0, 0, '[]'::jsonb, 250000, 250000, 0, 'abierto'
        )
        RETURNING *
      `;
      existing = created;
    }

    const caja = existing[0];

    if (accion === 'gasto') {
      if (caja.estado === 'pendiente_revision' || caja.estado === 'aprobado') {
        return NextResponse.json(
          { success: false, error: 'La caja del día ya fue cerrada o aprobada.' },
          { status: 400 }
        );
      }

      const { tipo, concepto, monto, soporte_nombre } = body;
      const montoNum = Number(monto);
      if (!concepto || !montoNum || montoNum <= 0) {
        return NextResponse.json(
          { success: false, error: 'Ingresa un concepto y monto válido para el gasto.' },
          { status: 400 }
        );
      }

      const now = new Date();
      const nuevoGasto = {
        id: `gasto-${Date.now()}`,
        tipo: tipo || 'Otros',
        concepto: String(concepto).trim(),
        monto: montoNum,
        fecha: now.toISOString().split('T')[0],
        hora: new Intl.DateTimeFormat('es-CO', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
          timeZone: 'America/Bogota',
        }).format(now),
        soporte_nombre: soporte_nombre || undefined,
      };

      const detalleActual = Array.isArray(caja.gastos_detalle) ? caja.gastos_detalle : [];
      const nuevoDetalle = [...detalleActual, nuevoGasto];
      const nuevoTotalGastos = Number(caja.total_gastos) + montoNum;
      const nuevoEsperado = Number(caja.efectivo_esperado) - montoNum;

      await sql`
        UPDATE cierres_caja
        SET
          total_gastos = ${nuevoTotalGastos},
          gastos_detalle = ${JSON.stringify(nuevoDetalle)}::jsonb,
          efectivo_esperado = ${nuevoEsperado}
        WHERE id = ${caja.id}
      `;

      return NextResponse.json({
        success: true,
        gasto: nuevoGasto,
        total_gastos: nuevoTotalGastos,
        efectivo_esperado: nuevoEsperado,
      });
    }

    if (accion === 'enviar_cierre') {
      const { efectivo_entregado, observaciones } = body;
      const entregadoNum = Number(efectivo_entregado);
      const esperadoNum = Number(caja.efectivo_esperado);
      const diferencia = entregadoNum - esperadoNum;

      if (!observaciones || !String(observaciones).trim()) {
        return NextResponse.json(
          { success: false, error: 'Debes ingresar las observaciones del cierre de jornada.' },
          { status: 400 }
        );
      }

      await sql`
        UPDATE cierres_caja
        SET
          efectivo_entregado = ${entregadoNum},
          diferencia = ${diferencia},
          observaciones = ${String(observaciones).trim()},
          estado = 'pendiente_revision'
        WHERE id = ${caja.id}
      `;

      return NextResponse.json({
        success: true,
        diferencia,
        estado: 'pendiente_revision',
      });
    }

    return NextResponse.json({ success: false, error: 'Acción no válida.' }, { status: 400 });
  } catch (error: unknown) {
    console.error('Error en /api/caja POST:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo procesar la operación de caja.' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { cierre_id, aprobado, supervisor_id, observaciones } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    if (!aprobado && (!observaciones || !String(observaciones).trim())) {
      return NextResponse.json(
        { success: false, error: 'Debes indicar el motivo al rechazar un arqueo de caja.' },
        { status: 400 }
      );
    }

    const nuevoEstado = aprobado ? 'aprobado' : 'rechazado';
    await sql`
      UPDATE cierres_caja
      SET
        estado = ${nuevoEstado},
        supervisor_id = ${supervisor_id || null},
        observaciones = COALESCE(${observaciones ? String(observaciones).trim() : null}, observaciones)
      WHERE id = ${cierre_id}
    `;

    return NextResponse.json({ success: true, estado: nuevoEstado });
  } catch (error: unknown) {
    console.error('Error en /api/caja PATCH:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo actualizar el arqueo de caja.' },
      { status: 500 }
    );
  }
}
