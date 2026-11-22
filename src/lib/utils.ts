import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EstadoPrestamo, EstadoCuota, EstadoCierreCaja, FrecuenciaPago } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Formato monetario colombiano ($ 30.000, $ 450.000, $ 1.000.000) sin mostrar COP
 */
export function formatMoney(amount: number | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '$ 0';
  }
  const abs = Math.abs(Math.round(amount));
  const formatted = new Intl.NumberFormat('es-CO', {
    maximumFractionDigits: 0,
    minimumFractionDigits: 0,
  }).format(abs);

  return amount < 0 ? `-$ ${formatted}` : `$ ${formatted}`;
}

/**
 * Formato de fecha colombiano: 21/11/2026
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  try {
    const clean = dateString.split('T')[0];
    const [year, month, day] = clean.split('-');
    if (!year || !month || !day) return dateString;
    const date = new Date(Number(year), Number(month) - 1, Number(day));
    return new Intl.DateTimeFormat('es-CO', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      timeZone: 'America/Bogota',
    }).format(date);
  } catch {
    return dateString;
  }
}

/**
 * Formato de fecha larga para encabezados: "Sábado, 21 de noviembre"
 */
export function formatLongDate(dateInput?: Date | string): string {
  try {
    const d = dateInput ? new Date(dateInput) : new Date();
    const str = new Intl.DateTimeFormat('es-CO', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      timeZone: 'America/Bogota',
    }).format(d);
    return str.charAt(0).toUpperCase() + str.slice(1);
  } catch {
    return 'Hoy';
  }
}

/**
 * Formato de hora colombiano: 08:30 a. m.
 */
export function formatTime(timeStr?: string): string {
  if (!timeStr) {
    try {
      return new Intl.DateTimeFormat('es-CO', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: true,
        timeZone: 'America/Bogota',
      }).format(new Date());
    } catch {
      return '';
    }
  }
  return timeStr;
}

/**
 * Fecha local de hoy en zona horaria America/Bogota (YYYY-MM-DD)
 */
export function getBogotaToday(): string {
  try {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      timeZone: 'America/Bogota',
    }).formatToParts(new Date());
    const y = parts.find((p) => p.type === 'year')?.value;
    const m = parts.find((p) => p.type === 'month')?.value;
    const d = parts.find((p) => p.type === 'day')?.value;
    if (y && m && d) return `${y}-${m}-${d}`;
  } catch {
    // fallback
  }
  return new Date().toISOString().split('T')[0];
}

/**
 * Oculta parcialmente el número de documento para comprobantes digitales
 */
export function maskDocument(doc?: string): string {
  if (!doc) return '****';
  const clean = doc.trim();
  if (clean.length <= 4) return clean;
  return `***${clean.slice(-4)}`;
}

export function getInitials(name?: string): string {
  if (!name) return 'OD';
  const words = name.trim().split(/\s+/);
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return `${words[0][0]}${words[1][0]}`.toUpperCase();
}

export function getFrecuenciaLabel(frecuencia: FrecuenciaPago): string {
  switch (frecuencia) {
    case 'diario':
      return 'Diaria';
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
        label: 'Pendiente',
        bg: 'bg-[#FFFBEB]',
        text: 'text-[#D97706]',
        border: 'border-[#FCD34D]',
      };
    case 'aprobado':
      return {
        label: 'Aprobado',
        bg: 'bg-[#EFF6FF]',
        text: 'text-[#2563EB]',
        border: 'border-[#93C5FD]',
      };
    case 'activo':
      return {
        label: 'Activo',
        bg: 'bg-[#F0FDF4]',
        text: 'text-[#15803D]',
        border: 'border-[#86EFAC]',
      };
    case 'pagado':
      return {
        label: 'Finalizado',
        bg: 'bg-[#F7F8FA]',
        text: 'text-[#525252]',
        border: 'border-[#D1D5DB]',
      };
    case 'rechazado':
      return {
        label: 'Rechazado',
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FCA5A5]',
      };
    case 'mora':
      return {
        label: 'En mora',
        bg: 'bg-[#FEF2F2]',
        text: 'text-[#DC2626]',
        border: 'border-[#FCA5A5]',
      };
    default:
      return {
        label: estado,
        bg: 'bg-[#F7F8FA]',
        text: 'text-[#000000]',
        border: 'border-[#D1D5DB]',
      };
  }
}

export function getEstadoCuotaBadge(estado: EstadoCuota): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (estado) {
    case 'pendiente':
      return { label: 'Pendiente', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#FCD34D]' };
    case 'parcial':
      return { label: 'Abono', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
    case 'pagada':
      return { label: 'Pagado', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', border: 'border-[#86EFAC]' };
    case 'atrasada':
      return { label: 'Atrasada', bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' };
    default:
      return { label: estado, bg: 'bg-[#F7F8FA]', text: 'text-[#525252]', border: 'border-[#D1D5DB]' };
  }
}

export function getEstadoCierreBadge(estado: EstadoCierreCaja): {
  label: string;
  bg: string;
  text: string;
  border: string;
} {
  switch (estado) {
    case 'abierto':
      return { label: 'En operación', bg: 'bg-[#EFF6FF]', text: 'text-[#2563EB]', border: 'border-[#93C5FD]' };
    case 'pendiente_revision':
      return { label: 'Pendiente de revisión', bg: 'bg-[#FFFBEB]', text: 'text-[#D97706]', border: 'border-[#FCD34D]' };
    case 'aprobado':
      return { label: 'Aprobado', bg: 'bg-[#F0FDF4]', text: 'text-[#15803D]', border: 'border-[#86EFAC]' };
    case 'rechazado':
      return { label: 'Rechazado', bg: 'bg-[#FEF2F2]', text: 'text-[#DC2626]', border: 'border-[#FCA5A5]' };
    default:
      return { label: estado, bg: 'bg-[#F7F8FA]', text: 'text-[#525252]', border: 'border-[#D1D5DB]' };
  }
}

export function exportToCsv(filename: string, headers: string[], rows: (string | number)[][]) {
  const escape = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };
  const csvContent = [
    headers.map(escape).join(','),
    ...rows.map((r) => r.map(escape).join(',')),
  ].join('\n');

  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
