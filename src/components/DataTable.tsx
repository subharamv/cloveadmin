import React, { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface Column<T> {
  header: string;
  accessor: keyof T | ((item: T) => ReactNode);
  className?: string;
  headerClassName?: string;
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  onRowClick?: (item: T) => void;
  className?: string;
  emptyMessage?: string;
}

export function DataTable<T extends { id: string | number }>({ 
  data, 
  columns, 
  onRowClick,
  className,
  emptyMessage = "No records found."
}: DataTableProps<T>) {
  return (
    <div className={cn("w-full overflow-x-auto custom-scrollbar border-grid bg-transparent rounded-2xl transition-colors duration-300", className)}>
      <table className="w-full text-left border-collapse min-w-[800px]">
        <thead>
          <tr className="bg-[var(--bg-color)]/50 border-b border-[var(--border-color)]">
            {columns.map((column, idx) => (
              <th 
                key={idx}
                className={cn(
                  "p-6 font-display text-[10px] uppercase tracking-[0.3em] font-black text-[var(--text-secondary)] opacity-60",
                  column.headerClassName
                )}
              >
                {column.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[var(--border-color)]">
          {data.length > 0 ? (
            data.map((item) => (
              <tr 
                key={item.id}
                onClick={() => onRowClick?.(item)}
                className={cn(
                  "group transition-all duration-300 hover:bg-blue-500/5 relative",
                  onRowClick && "cursor-pointer"
                )}
              >
                {columns.map((column, colIdx) => (
                  <td 
                    key={colIdx}
                    className={cn(
                      "p-6 font-mono text-sm text-[var(--text-primary)] transition-all duration-300 whitespace-nowrap",
                      colIdx === 0 && "relative border-l-2 border-transparent group-hover:border-blue-500",
                      column.className
                    )}
                  >
                    {typeof column.accessor === 'function' 
                      ? column.accessor(item) 
                      : (item[column.accessor] as ReactNode)}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td 
                colSpan={columns.length} 
                className="p-20 text-center font-mono text-[10px] uppercase tracking-[0.4em] text-[var(--text-secondary)] opacity-30"
              >
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
