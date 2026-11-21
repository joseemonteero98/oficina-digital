import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      prestamo_id,
      cuota_id,
      cliente_id,
      cobrador_id,
      oficina_id,
      monto,
      tipo,
      motivo_no_pago,
      nota,
    } = body;

    if (!isDbConfigured || !sql) {
      return NextResponse.json({ success: true, simulated: true });
    }

    // 1. Obtener datos actuales del préstamo
    const prestamoRes = await sql`SELECT * FROM prestamos WHERE id = ${prestamo_id}`;
    if (prestamoRes.length === 0) {
      return NextResponse.json({ success: false, error: 'Préstamo no encontrado' }, { status: 404 });
    }

    const prestamo = prestamoRes[0];
    const montoNum = Number(monto);
    const nuevoTotalRecaudado = Number(prestamo.total_recaudado) + (tipo !== 'no_pago' ? montoNum : 0);
    const nuevoSaldo = Math.max(0, Number(prestamo.total_a_pagar) - nuevoTotalRecaudado);
    const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : prestamo.estado;

    // 2. Insertar registro en tabla pagos
    const pagoRes = await sql`
      INSERT INTO pagos (
        oficina_id,
        prestamo_id,
        cuota_id,
        cliente_id,
        cobrador_id,
        monto,
        tipo,
        motivo_no_pago,
        nota,
        fecha_pago,
        saldo_restante_despues
      ) VALUES (
        ${oficina_id || prestamo.oficina_id},
        ${prestamo_id},
        ${cuota_id || null},
        ${cliente_id},
        ${cobrador_id},
        ${montoNum},
        ${tipo},
        ${motivo_no_pago || null},
        ${nota || null},
        CURRENT_DATE,
        ${nuevoSaldo}
      )
      RETURNING id, fecha_pago, hora_pago
    `;

    // 3. Actualizar préstamo
    await sql`
      UPDATE prestamos
      SET
        total_recaudado = ${nuevoTotalRecaudado},
        saldo_pendiente = ${nuevoSaldo},
        estado = ${nuevoEstado}
      WHERE id = ${prestamo_id}
    `;

    // 4. Actualizar cuota si aplica
    if (tipo !== 'no_pago' && cuota_id) {
      await sql`
        UPDATE cuotas
        SET
          monto_pagado = monto_pagado + ${montoNum},
          estado = CASE WHEN (monto_pagado + ${montoNum}) >= monto_total THEN 'pagada' ELSE 'parcial' END,
          fecha_ultimo_pago = NOW()
        WHERE id = ${cuota_id}
      `;
    }

    return NextResponse.json({
      success: true,
      pagoId: pagoRes[0].id,
      nuevoSaldo,
      nuevoTotalRecaudado,
    });
  } catch (error: any) {
    console.error('Error al registrar pago en DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
