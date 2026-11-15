import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { EstadoPrestamo, EstadoCuota, EstadoCierreCaja, FrecuenciaPago } from "@/types";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formato de moneda en pesos (sin sufijo de código de moneda, estilo $ 100.000)
 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(amount);
  
  return `$ ${formatted}`;
}

export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const [year, month, day] = dateString.split('T')[0].split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('es-CO', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }).format(date);
  } catch {
    return dateString;
  }
}

export function formatTime(timeStr?: string): string {
  if (!timeStr) return '';
  return timeStr;
}

export function getFrecuenciaLabel(frecuencia: FrecuenciaPago): string {
  switch (frecuencia) {
    case 'diario':
      return 'Diario';
    case 'semanal':
      return 'Semanal';
    case 'quincenal':
      return 'Quincenal';
    case 'mensual':
      return 'Mensual';
    default:
      return frecuencia;
  }
}

export function getEstadoPrestamoBadge(estado: EstadoPrestamo): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (estado) {
    case 'pendiente':
      return {
        label: 'Por Autorizar',
        bg: 'bg-amber-500/10 dark:bg-amber-500/20',
        text: 'text-amber-700 dark:text-amber-400',
        border: 'border-amber-300 dark:border-amber-700',
      };
    case 'aprobado':
      return {
        label: 'Aprobado (Listo p/ entregar)',
        bg: 'bg-blue-500/10 dark:bg-blue-500/20',
        text: 'text-blue-700 dark:text-blue-400',
        border: 'border-blue-300 dark:border-blue-700',
      };
    case 'activo':
      return {
        label: 'En Cobro Activo',
        bg: 'bg-emerald-500/10 dark:bg-emerald-500/20',
        text: 'text-emerald-700 dark:text-emerald-400',
        border: 'border-emerald-300 dark:border-emerald-700',
      };
    case 'pagado':
      return {
        label: 'Cancelado / Pagado',
        bg: 'bg-slate-500/10 dark:bg-slate-500/20',
        text: 'text-slate-700 dark:text-slate-300',
        border: 'border-slate-300 dark:border-slate-700',
      };
    case 'rechazado':
      return {
        label: 'Rechazado',
        bg: 'bg-rose-500/10 dark:bg-rose-500/20',
        text: 'text-rose-700 dark:text-rose-400',
        border: 'border-rose-300 dark:border-rose-700',
      };
    case 'mora':
      return {
        label: 'En Mora',
        bg: 'bg-red-500/10 dark:bg-red-500/20',
        text: 'text-red-700 dark:text-red-400',
        border: 'border-red-300 dark:border-red-700',
      };
    default:
      return {
        label: estado,
        bg: 'bg-gray-100',
        text: 'text-gray-800',
        border: 'border-gray-200',
      };
  }
}

export function getEstadoCuotaBadge(estado: EstadoCuota): {
  label: string;
  bg: string;
  text: string;
} {
  switch (estado) {
    case 'pendiente':
      return { label: 'Pendiente', bg: 'bg-amber-100 text-amber-800', text: 'text-amber-800' };
    case 'parcial':
      return { label: 'Abonado', bg: 'bg-blue-100 text-blue-800', text: 'text-blue-800' };
    case 'pagada':
      return { label: 'Al Día', bg: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800' };
    case 'atrasada':
      return { label: 'Atrasada', bg: 'bg-rose-100 text-rose-800', text: 'text-rose-800' };
    default:
      return { label: estado, bg: 'bg-slate-100 text-slate-800', text: 'text-slate-800' };
  }
}

export function getEstadoCierreBadge(estado: EstadoCierreCaja): {
  label: string;
  bg: string;
  text: string;
} {
  switch (estado) {
    case 'abierto':
      return { label: 'Caja Abierta (Operando)', bg: 'bg-blue-100 text-blue-800', text: 'text-blue-800' };
    case 'pendiente_revision':
      return { label: 'Esperando Aprobación de Supervisor', bg: 'bg-amber-100 text-amber-800', text: 'text-amber-800' };
    case 'aprobado':
      return { label: 'Cuadre Aprobado', bg: 'bg-emerald-100 text-emerald-800', text: 'text-emerald-800' };
    default:
      return { label: estado, bg: 'bg-gray-100 text-gray-800', text: 'text-gray-800' };
  }
}
