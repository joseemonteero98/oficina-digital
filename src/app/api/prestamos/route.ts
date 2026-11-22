import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';
import { simularPrestamo, generarCuotasEntidad } from '@/lib/calculations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      cliente_id,
      oficina_id,
      cobrador_id,
      capital,
      tasa_interes,
      tipo_interes,
      frecuencia,
      num_cuotas,
      excluir_domingos,
      fecha_primer_cobro,
      notas,
    } = body;

    if (!cliente_id || Number(capital) <= 0 || Number(num_cuotas) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Datos incompletos o inválidos para crear la solicitud.' },
        { status: 400 }
      );
    }

    const calculo = simularPrestamo({
      capital: Number(capital),
      tasa_interes: Number(tasa_interes),
      tipo_interes,
      num_cuotas: Number(num_cuotas),
      frecuencia,
      excluir_domingos: Boolean(excluir_domingos),
      fecha_primer_cobro,
    });

    const codigo = `PR-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isDbConfigured && sql) {
      const result = await sql`
        INSERT INTO prestamos (
          codigo,
          oficina_id,
          cliente_id,
          cobrador_id,
          capital,
          tipo_interes,
          tasa_interes,
          total_interes,
          total_a_pagar,
          saldo_pendiente,
          total_recaudado,
          frecuencia,
          num_cuotas,
          valor_cuota,
          excluir_domingos,
          fecha_solicitud,
          fecha_primer_cobro,
          estado,
          notas
        ) VALUES (
          ${codigo},
          ${oficina_id},
          ${cliente_id},
          ${cobrador_id},
          ${calculo.capital},
          ${calculo.tipo_interes},
          ${calculo.tasa_interes},
          ${calculo.total_interes},
          ${calculo.total_a_pagar},
          ${calculo.total_a_pagar},
          0,
          ${calculo.frecuencia},
          ${calculo.num_cuotas},
          ${calculo.valor_cuota},
          ${Boolean(excluir_domingos)},
          CURRENT_DATE,
          ${calculo.fecha_primer_pago},
          'pendiente',
          ${notas || null}
        )
        RETURNING *
      `;

      const prestamoDb = result[0];
      const prestamoId = prestamoDb.id;
      const cuotasInsertadas = [];

      for (const c of calculo.cuotas_simuladas) {
        const cRes = await sql`
          INSERT INTO cuotas (
            prestamo_id,
            oficina_id,
            numero_cuota,
            fecha_vencimiento,
            monto_capital,
            monto_interes,
            monto_total,
            monto_pagado,
            estado
          ) VALUES (
            ${prestamoId},
            ${oficina_id},
            ${c.numero},
            ${c.fecha},
            ${c.monto_capital},
            ${c.monto_interes},
            ${c.monto_total},
            0,
            'pendiente'
          )
          RETURNING *
        `;
        cuotasInsertadas.push({
          ...cRes[0],
          numero_cuota: Number(cRes[0].numero_cuota),
          fecha_vencimiento: String(cRes[0].fecha_vencimiento).split('T')[0],
          monto_capital: Number(cRes[0].monto_capital),
          monto_interes: Number(cRes[0].monto_interes),
          monto_total: Number(cRes[0].monto_total),
          monto_pagado: Number(cRes[0].monto_pagado),
        });
      }

      return NextResponse.json({
        success: true,
        prestamoId,
        codigo,
        calculo,
        cuotas: cuotasInsertadas,
      });
    }

    const demoId = `p-${Date.now()}`;
    return NextResponse.json({
      success: true,
      prestamoId: demoId,
      codigo,
      calculo,
      cuotas: generarCuotasEntidad(demoId, calculo),
    });
  } catch (error: unknown) {
    console.error('Error al crear préstamo en DB:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo registrar la solicitud de préstamo.' },
      { status: 500 }
    );
  }
}
