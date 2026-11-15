import { FrecuenciaPago, TipoInteres, Cuota } from '@/types';

export interface CalculoPrestamoResult {
  capital: number;
  tipo_interes: TipoInteres;
  tasa_interes: number;
  total_interes: number;
  total_a_pagar: number;
  valor_cuota: number;
  num_cuotas: number;
  cuotas_simuladas: {
    numero: number;
    fecha: string;
    monto_capital: number;
    monto_interes: number;
    monto_total: number;
    saldo_restante: number;
  }[];
}

/**
 * Agrega días hábiles o continuos a una fecha
 */
export function calcularFechasCuotas(
  fechaInicioStr: string,
  numCuotas: number,
  frecuencia: FrecuenciaPago,
  excluirDomingos: boolean
): string[] {
  const fechas: string[] = [];
  const fecha = new Date(fechaInicioStr + 'T12:00:00');

  let cuotasGeneradas = 0;
  while (cuotasGeneradas < numCuotas) {
    if (frecuencia === 'diario') {
      // Si excluye domingos y cae domingo (0), avanzamos al lunes
      if (excluirDomingos && fecha.getDay() === 0) {
        fecha.setDate(fecha.getDate() + 1);
      }
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 1);
      cuotasGeneradas++;
    } else if (frecuencia === 'semanal') {
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 7);
      cuotasGeneradas++;
    } else if (frecuencia === 'quincenal') {
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setDate(fecha.getDate() + 15);
      cuotasGeneradas++;
    } else if (frecuencia === 'mensual') {
      fechas.push(fecha.toISOString().split('T')[0]);
      fecha.setMonth(fecha.getMonth() + 1);
      cuotasGeneradas++;
    }
  }

  return fechas;
}

/**
 * Simula el préstamo según el modo (Fijo Simple vs Sobre Saldo)
 */
export function simularPrestamo(params: {
  capital: number;
  tasa_interes: number; // Porcentaje, ej. 20
  tipo_interes: TipoInteres;
  num_cuotas: number;
  frecuencia: FrecuenciaPago;
  excluir_domingos: boolean;
  fecha_primer_cobro: string;
}): CalculoPrestamoResult {
  const {
    capital,
    tasa_interes,
    tipo_interes,
    num_cuotas,
    frecuencia,
    excluir_domingos,
    fecha_primer_cobro,
  } = params;

  const fechas = calcularFechasCuotas(
    fecha_primer_cobro,
    num_cuotas,
    frecuencia,
    excluir_domingos
  );

  if (tipo_interes === 'fijo') {
    // Interés simple fijo (Paga diario estándar):
    // Interés total = Capital * (Tasa / 100)
    // Se divide en cuotas iguales.
    const total_interes = Math.round(capital * (tasa_interes / 100));
    const total_a_pagar = capital + total_interes;
    const valor_cuota = Math.round(total_a_pagar / num_cuotas);

    const cuota_capital = Math.round(capital / num_cuotas);
    const cuota_interes = valor_cuota - cuota_capital;

    let saldo = total_a_pagar;
    const cuotas_simuladas = fechas.map((fecha, idx) => {
      const numero = idx + 1;
      // Para la última cuota ajustamos centavos si hay desfase
      const monto = numero === num_cuotas ? saldo : valor_cuota;
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
      capital,
      tipo_interes,
      tasa_interes,
      total_interes,
      total_a_pagar,
      valor_cuota,
      num_cuotas,
      cuotas_simuladas,
    };
  } else {
    // Interés sobre saldo (Sistema Francés / Amortizado por período)
    const r = (tasa_interes / 100); // Tasa periódica
    let valor_cuota = 0;
    if (r > 0) {
      valor_cuota = Math.round(
        (capital * r * Math.pow(1 + r, num_cuotas)) /
          (Math.pow(1 + r, num_cuotas) - 1)
      );
    } else {
      valor_cuota = Math.round(capital / num_cuotas);
    }

    let saldoCapital = capital;
    let totalInteresAcumulado = 0;
    const cuotas_simuladas = fechas.map((fecha, idx) => {
      const numero = idx + 1;
      const interesPeriodo = Math.round(saldoCapital * r);
      let amortizacionCapital = valor_cuota - interesPeriodo;

      if (numero === num_cuotas || amortizacionCapital > saldoCapital) {
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

    const total_a_pagar = capital + totalInteresAcumulado;

    return {
      capital,
      tipo_interes,
      tasa_interes,
      total_interes: totalInteresAcumulado,
      total_a_pagar,
      valor_cuota,
      num_cuotas,
      cuotas_simuladas,
    };
  }
}

/**
 * Convierte cuotas simuladas en entidades Cuota reales para la base de datos
 */
export function generarCuotasEntidad(
  prestamoId: string,
  calculo: CalculoPrestamoResult
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
