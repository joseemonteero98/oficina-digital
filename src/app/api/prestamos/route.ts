import { NextResponse } from 'next/server';
import { sql, isDbConfigured } from '@/lib/db';
import { simularPrestamo } from '@/lib/calculations';

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

    const calculo = simularPrestamo({
      capital: Number(capital),
      tasa_interes: Number(tasa_interes),
      tipo_interes,
      num_cuotas: Number(num_cuotas),
      frecuencia,
      excluir_domingos,
      fecha_primer_cobro,
    });

    const codigo = `PR-${Math.floor(1000 + Math.random() * 9000)}`;

    if (isDbConfigured && sql) {
      // 1. Insertar préstamo en Neon Postgres
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
          ${capital},
          ${tipo_interes},
          ${tasa_interes},
          ${calculo.total_interes},
          ${calculo.total_a_pagar},
          ${calculo.total_a_pagar},
          0,
          ${frecuencia},
          ${num_cuotas},
          ${calculo.valor_cuota},
          ${excluir_domingos},
          CURRENT_DATE,
          ${fecha_primer_cobro},
          'pendiente',
          ${notas || null}
        )
        RETURNING id
      `;

      const prestamoId = result[0].id;

      // 2. Insertar cuotas generadas
      for (const c of calculo.cuotas_simuladas) {
        await sql`
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
        `;
      }

      return NextResponse.json({
        success: true,
        prestamoId,
        codigo,
        calculo,
      });
    }

    return NextResponse.json({
      success: true,
      codigo,
      calculo,
    });
  } catch (error: any) {
    console.error('Error al crear préstamo en DB:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
