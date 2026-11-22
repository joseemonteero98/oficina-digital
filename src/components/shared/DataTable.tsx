'use client';

import React from 'react';
import { EmptyState } from './EmptyState';

export interface DataColumn<T> {
  key: string;
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  data: T[];
  columns: DataColumn<T>[];
  keyExtractor: (row: T) => string;
  renderMobileCard: (row: T) => React.ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
}

export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  renderMobileCard,
  emptyTitle = 'No se encontraron registros.',
  emptyDescription,
  onRowClick,
}: DataTableProps<T>) {
  if (data.length === 0) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div>
      {/* Vista móvil en tarjetas */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <div key={keyExtractor(row)}>{renderMobileCard(row)}</div>
        ))}
      </div>

      {/* Vista escritorio en tabla limpia */}
      <div className="hidden md:block bg-white border border-[#D1D5DB] rounded-[8px] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F7F8FA] border-b border-[#E5E7EB]">
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className={`px-4 py-3 text-[12px] font-semibold text-[#525252] uppercase tracking-wider ${
                      col.align === 'right'
                        ? 'text-right'
                        : col.align === 'center'
                        ? 'text-center'
                        : 'text-left'
                    }`}
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E5E7EB] text-[14px] text-black">
              {data.map((row) => (
                <tr
                  key={keyExtractor(row)}
                  onClick={onRowClick ? () => onRowClick(row) : undefined}
                  className={onRowClick ? 'hover:bg-[#F7F8FA] cursor-pointer' : 'hover:bg-[#F7F8FA]'}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className={`px-4 py-3 ${
                        col.align === 'right'
                          ? 'text-right tabular-nums'
                          : col.align === 'center'
                          ? 'text-center'
                          : 'text-left'
                      }`}
                    >
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
