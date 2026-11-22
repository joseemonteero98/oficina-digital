import { FrecuenciaPago, TipoInteres, Cuota, SimulacionPrestamo } from '@/types';

export type CalculoPrestamoResult = SimulacionPrestamo;

/**
 * Agrega días hábiles o continuos a una fecha respetando exclusión de domingos
 */
export function calcularFechasCuotas(
  fechaInicioStr: string,
  numCuotas: number,
  frecuencia: FrecuenciaPago,
  excluirDomingos: boolean
): string[] {
  const fechas: string[] = [];
  const baseDate = fechaInicioStr && fechaInicioStr.includes('-')
    ? fechaInicioStr.split('T')[0]
    : new Date().toISOString().split('T')[0];
  const fecha = new Date(baseDate + 'T12:00:00');

  let cuotasGeneradas = 0;
  while (cuotasGeneradas < numCuotas) {
    if (frecuencia === 'diario') {
      if (excluirDomingos && fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 1);
      cuotasGeneradas++;
    } else if (frecuencia === 'semanal') {
      if (excluirDomingos && fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 7);
      cuotasGeneradas++;
    } else if (frecuencia === 'quincenal') {
      if (excluirDomingos && fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 15);
      cuotasGeneradas++;
    } else if (frecuencia === 'mensual') {
      if (excluirDomingos && fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setMonth(fecha.getMonth() + 1);
      cuotasGeneradas++;
    }
  }

  return fechas;
}

/**
 * Motor financiero oficial (ejecutado en el servidor como única fuente de verdad)
 */
export function simularPrestamo(params: {
  capital: number;
  tasa_interes: number;
  tipo_interes: TipoInteres;
  num_cuotas: number;
  frecuencia: FrecuenciaPago;
  excluir_domingos: boolean;
  fecha_primer_cobro: string;
}): SimulacionPrestamo {
  const {
    capital,
    tasa_interes,
    tipo_interes,
    num_cuotas,
    frecuencia,
    excluir_domingos,
    fecha_primer_cobro,
  } = params;

  const safeCapital = Math.max(0, Number(capital) || 0);
  const safeCuotas = Math.max(1, Math.floor(Number(num_cuotas) || 1));
  const safeTasa = Math.max(0, Number(tasa_interes) || 0);

  const fechas = calcularFechasCuotas(
    fecha_primer_cobro,
    safeCuotas,
    frecuencia,
    excluir_domingos
  );

  if (tipo_interes === 'fijo') {
    const total_interes = Math.round(safeCapital * (safeTasa / 100));
    const total_a_pagar = safeCapital + total_interes;
    const valor_cuota = Math.round(total_a_pagar / safeCuotas);
    const diferencia_redondeo = total_a_pagar - valor_cuota * safeCuotas;

    const cuota_capital = Math.round(safeCapital / safeCuotas);
    const cuota_interes = valor_cuota - cuota_capital;

    let saldo = total_a_pagar;
    const cuotas_simuladas = fechas.map((fecha, idx) => {
      const numero = idx + 1;
      const monto = numero === safeCuotas ? Math.max(0, saldo) : valor_cuota;
      saldo -= monto;
      return {
        numero,
        fecha,
        monto_capital: cuota_capital,
        monto_interes: cuota_interes,
        monto_total: monto,
        saldo_restante: Math.max(0, saldo),
      };
    });

    return {
      capital: safeCapital,
      tipo_interes,
      tasa_interes: safeTasa,
      total_interes,
      total_a_pagar,
      valor_cuota,
      num_cuotas: safeCuotas,
      frecuencia,
      fecha_primer_pago: fechas[0] || fecha_primer_cobro,
      fecha_ultimo_pago: fechas[fechas.length - 1] || fecha_primer_cobro,
      diferencia_redondeo,
      cuotas_simuladas,
    };
  } else {
    const r = safeTasa / 100;
    let valor_cuota = 0;
    if (r > 0) {
      valor_cuota = Math.round(
        (safeCapital * r * Math.pow(1 + r, safeCuotas)) /
          (Math.pow(1 + r, safeCuotas) - 1)
      );
    } else {
      valor_cuota = Math.round(safeCapital / safeCuotas);
    }

    let saldoCapital = safeCapital;
    let totalInteresAcumulado = 0;
    const cuotas_simuladas = fechas.map((fecha, idx) => {
      const numero = idx + 1;
      const interesPeriodo = Math.round(saldoCapital * r);
      let amortizacionCapital = valor_cuota - interesPeriodo;

      if (numero === safeCuotas || amortizacionCapital > saldoCapital) {
        amortizacionCapital = saldoCapital;
      }

      const totalCuota = amortizacionCapital + interesPeriodo;
      saldoCapital -= amortizacionCapital;
      totalInteresAcumulado += interesPeriodo;

      return {
        numero,
        fecha,
        monto_capital: amortizacionCapital,
        monto_interes: interesPeriodo,
        monto_total: totalCuota,
        saldo_restante: Math.max(0, saldoCapital),
      };
    });

    const total_a_pagar = safeCapital + totalInteresAcumulado;
    const diferencia_redondeo = total_a_pagar - valor_cuota * safeCuotas;

    return {
      capital: safeCapital,
      tipo_interes,
      tasa_interes: safeTasa,
      total_interes: totalInteresAcumulado,
      total_a_pagar,
      valor_cuota,
      num_cuotas: safeCuotas,
      frecuencia,
      fecha_primer_pago: fechas[0] || fecha_primer_cobro,
      fecha_ultimo_pago: fechas[fechas.length - 1] || fecha_primer_cobro,
      diferencia_redondeo,
      cuotas_simuladas,
    };
  }
}

/**
 * Convierte cuotas simuladas en entidades Cuota reales
 */
export function generarCuotasEntidad(
  prestamoId: string,
  calculo: SimulacionPrestamo
): Cuota[] {
  return calculo.cuotas_simuladas.map((c) => ({
    id: `cuota-${prestamoId}-${c.numero}`,
    prestamo_id: prestamoId,
    numero_cuota: c.numero,
    fecha_vencimiento: c.fecha,
    monto_capital: c.monto_capital,
    monto_interes: c.monto_interes,
    monto_total: c.monto_total,
    monto_pagado: 0,
    estado: 'pendiente',
  }));
}
