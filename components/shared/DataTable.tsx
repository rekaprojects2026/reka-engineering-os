import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

export interface Column<T> {
  key: string
  header: string
  width?: string
  render: (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns: Column<T>[]
  data: T[]
  onRowClick?: (row: T) => void
  emptyState?: ReactNode
  className?: string
}

export function DataTable<T extends { id: string }>({
  columns,
  data,
  onRowClick,
  emptyState,
  className,
}: DataTableProps<T>) {
  if (data.length === 0 && emptyState) {
    return <div>{emptyState}</div>
  }

  return (
    <div
      className={cn('w-full overflow-x-auto', className)}
      style={{ border: '1px solid var(--color-border)', borderRadius: '8px' }}
    >
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {columns.map((col) => (
              <th
                key={col.key}
                style={{
                  width: col.width,
                  padding: '10px 14px',
                  textAlign: 'left',
                  fontSize: '0.75rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              style={{
                borderBottom:
                  idx < data.length - 1 ? '1px solid var(--color-border)' : undefined,
                cursor: onRowClick ? 'pointer' : undefined,
                backgroundColor: 'var(--color-surface)',
                transition: 'background-color 0.1s',
              }}
              className={onRowClick ? 'hover:bg-[#F8FAFC]' : ''}
            >
              {columns.map((col) => (
                <td
                  key={col.key}
                  style={{
                    padding: '10px 14px',
                    color: 'var(--color-text-primary)',
                    fontSize: '0.8125rem',
                    verticalAlign: 'middle',
                  }}
                >
                  {col.render(row)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
