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
      metodo_pago = 'efectivo',
      motivo_no_pago,
      nota,
    } = body;

    if (!prestamo_id || !cliente_id || !cobrador_id) {
      return NextResponse.json(
        { success: false, error: 'Faltan datos requeridos para registrar la operación.' },
        { status: 400 }
      );
    }

    const montoNum = tipo === 'no_pago' ? 0 : Number(monto);
    if (tipo !== 'no_pago' && (!montoNum || montoNum <= 0)) {
      return NextResponse.json(
        { success: false, error: 'El monto recibido debe ser mayor a cero.' },
        { status: 400 }
      );
    }

    if (!isDbConfigured || !sql) {
      const now = new Date();
      const hora = new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota',
      }).format(now);
      return NextResponse.json({
        success: true,
        simulated: true,
        pagoId: `pago-${Date.now()}`,
        fecha_pago: now.toISOString().split('T')[0],
        hora_pago: hora,
      });
    }

    // 1. Validar préstamo en servidor
    const prestamoRes = await sql`SELECT * FROM prestamos WHERE id = ${prestamo_id}`;
    if (prestamoRes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Préstamo no encontrado.' },
        { status: 404 }
      );
    }

    const prestamo = prestamoRes[0];
    if (prestamo.estado !== 'activo' && prestamo.estado !== 'mora') {
      return NextResponse.json(
        { success: false, error: 'Solo se pueden registrar cobros en préstamos activos o en mora.' },
        { status: 400 }
      );
    }

    const saldoActual = Number(prestamo.saldo_pendiente);
    if (tipo !== 'no_pago' && montoNum > saldoActual) {
      return NextResponse.json(
        { success: false, error: 'El monto ingresado supera el saldo pendiente del préstamo.' },
        { status: 400 }
      );
    }

    // Validar que no se duplique pago completo sobre cuota ya pagada
    if (tipo !== 'no_pago' && cuota_id) {
      const cuotaCheck = await sql`SELECT * FROM cuotas WHERE id = ${cuota_id}`;
      if (cuotaCheck.length > 0 && cuotaCheck[0].estado === 'pagada') {
        return NextResponse.json(
          { success: false, error: 'Esta cuota ya fue marcada como pagada anteriormente.' },
          { status: 409 }
        );
      }
    }

    const nuevoTotalRecaudado =
      Number(prestamo.total_recaudado) + (tipo !== 'no_pago' ? montoNum : 0);
    const nuevoSaldo = Math.max(0, Number(prestamo.total_a_pagar) - nuevoTotalRecaudado);
    const nuevoEstado = nuevoSaldo === 0 ? 'pagado' : prestamo.estado;

    const notaConMetodo =
      tipo === 'no_pago'
        ? nota || null
        : `[METODO:${metodo_pago}]${nota ? ` ${nota}` : ''}`;

    // 2. Insertar pago confirmado
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
        ${tipo === 'no_pago' ? motivo_no_pago || 'No especificado' : null},
        ${notaConMetodo},
        CURRENT_DATE,
        ${nuevoSaldo}
      )
      RETURNING id, fecha_pago, hora_pago
    `;

    // 3. Actualizar préstamo y distribuir en cuotas en servidor
    if (tipo !== 'no_pago') {
      await sql`
        UPDATE prestamos
        SET
          total_recaudado = ${nuevoTotalRecaudado},
          saldo_pendiente = ${nuevoSaldo},
          estado = ${nuevoEstado}
        WHERE id = ${prestamo_id}
      `;

      const cuotasPendientes = await sql`
        SELECT * FROM cuotas 
        WHERE prestamo_id = ${prestamo_id} AND estado != 'pagada'
        ORDER BY numero_cuota ASC
      `;

      let restantePorAplicar = montoNum;
      for (const c of cuotasPendientes) {
        if (restantePorAplicar <= 0) break;
        const faltaCuota = Number(c.monto_total) - Number(c.monto_pagado);
        if (faltaCuota <= 0) continue;

        const abono = Math.min(restantePorAplicar, faltaCuota);
        restantePorAplicar -= abono;
        const nuevoPagado = Number(c.monto_pagado) + abono;
        const estadoCuota = nuevoPagado >= Number(c.monto_total) ? 'pagada' : 'parcial';

        await sql`
          UPDATE cuotas
          SET
            monto_pagado = ${nuevoPagado},
            estado = ${estadoCuota},
            fecha_ultimo_pago = NOW()
          WHERE id = ${c.id}
        `;
      }

      // 4. Actualizar caja del día (solo sumar a efectivo esperado si fue efectivo)
      const existingCierre = await sql`
        SELECT * FROM cierres_caja 
        WHERE cobrador_id = ${cobrador_id} AND fecha = CURRENT_DATE
        LIMIT 1
      `;
      const sumarEfectivo = metodo_pago === 'efectivo' ? montoNum : 0;

      if (existingCierre.length > 0) {
        const c = existingCierre[0];
        const nuevoTotalCobrado = Number(c.total_cobrado) + montoNum;
        const nuevoEsperado = Number(c.efectivo_esperado) + sumarEfectivo;
        await sql`
          UPDATE cierres_caja
          SET 
            total_cobrado = ${nuevoTotalCobrado},
            efectivo_esperado = ${nuevoEsperado}
          WHERE id = ${c.id}
        `;
      } else {
        await sql`
          INSERT INTO cierres_caja (
            oficina_id, cobrador_id, fecha, base_inicial, total_cobrado, total_desembolsado, total_gastos, efectivo_esperado, efectivo_entregado, diferencia, estado
          ) VALUES (
            ${oficina_id || prestamo.oficina_id}, ${cobrador_id}, CURRENT_DATE, 250000, ${montoNum}, 0, 0, ${250000 + sumarEfectivo}, ${250000 + sumarEfectivo}, 0, 'abierto'
          )
        `;
      }
    }

    // Consultar próxima cuota pendiente para el comprobante
    const nextCuotaRes = await sql`
      SELECT fecha_vencimiento FROM cuotas 
      WHERE prestamo_id = ${prestamo_id} AND estado != 'pagada'
      ORDER BY numero_cuota ASC
      LIMIT 1
    `;
    const proximaFecha = nextCuotaRes.length > 0
      ? String(nextCuotaRes[0].fecha_vencimiento).split('T')[0]
      : undefined;

    return NextResponse.json({
      success: true,
      pagoId: pagoRes[0].id,
      fecha_pago: String(pagoRes[0].fecha_pago).split('T')[0],
      hora_pago: String(pagoRes[0].hora_pago).slice(0, 5),
      nuevoSaldo,
      nuevoTotalRecaudado,
      proxima_fecha_pago: proximaFecha,
    });
  } catch (error: unknown) {
    console.error('Error al registrar pago en DB:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo registrar el cobro. Verifica tu conexión e inténtalo nuevamente.' },
      { status: 500 }
    );
  }
}
