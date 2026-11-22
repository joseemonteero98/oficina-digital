import { NextResponse } from 'next/server';
import { simularPrestamo } from '@/lib/calculations';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      capital,
      tasa_interes,
      tipo_interes,
      frecuencia,
      num_cuotas,
      excluir_domingos,
      fecha_primer_cobro,
    } = body;

    if (!capital || Number(capital) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El monto solicitado debe ser mayor a cero.' },
        { status: 400 }
      );
    }

    if (!num_cuotas || Number(num_cuotas) <= 0) {
      return NextResponse.json(
        { success: false, error: 'El número de cuotas debe ser mayor a cero.' },
        { status: 400 }
      );
    }

    const simulacion = simularPrestamo({
      capital: Number(capital),
      tasa_interes: Number(tasa_interes ?? 20),
      tipo_interes: tipo_interes === 'sobre_saldo' ? 'sobre_saldo' : 'fijo',
      num_cuotas: Number(num_cuotas),
      frecuencia: frecuencia || 'diario',
      excluir_domingos: Boolean(excluir_domingos),
      fecha_primer_cobro: fecha_primer_cobro || new Date().toISOString().split('T')[0],
    });

    return NextResponse.json({
      success: true,
      simulacion,
    });
  } catch (error: unknown) {
    console.error('Error al simular préstamo:', error);
    return NextResponse.json(
      { success: false, error: 'No se pudo calcular la simulación del préstamo.' },
      { status: 500 }
    );
  }
}
