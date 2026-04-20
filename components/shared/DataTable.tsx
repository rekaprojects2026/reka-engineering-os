import { cn } from '@/lib/utils/cn'
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from '@/components/ui/table'
import { EmptyState } from '@/components/shared/EmptyState'
import type { CSSProperties, ReactNode } from 'react'

export interface Column<T> {
  key:     string
  header:  string
  width?:  string
  align?:  'left' | 'center' | 'right'
  /** Primary cell renderer (existing callers). */
  render:  (row: T) => ReactNode
  /** v0-ui alias for `render` — when set, takes precedence. */
  cell?:   (row: T) => ReactNode
}

interface DataTableProps<T> {
  columns:           Column<T>[]
  data:              T[]
  emptyState?:       ReactNode
  className?:        string
  /** Subtle row hover when rows contain in-cell links (default true). */
  interactiveRows?: boolean
  /** Per-row layout accents (e.g. overdue / blocked inset border). */
  getRowStyle?:      (row: T, index: number) => CSSProperties | undefined
  sortable?:         boolean
  sortKey?:          string | null
  sortDirection?:    'asc' | 'desc'
  onSort?:           (columnKey: string) => void
}

function cellContent<T>(col: Column<T>, row: T) {
  return (col.cell ?? col.render)(row)
}

/**
 * DataTable — shared list table shell (server-compatible).
 * Define columns in the parent page; keep business-specific rendering there.
 */
export function DataTable<T extends { id: string }>({
  columns,
  data,
  emptyState,
  className,
  interactiveRows = true,
  getRowStyle,
  sortable,
  sortKey,
  sortDirection,
  onSort,
}: DataTableProps<T>) {
  if (data.length === 0) {
    const body = emptyState ?? (
      <EmptyState title="No data" description="Nothing to show yet." />
    )
    return (
      <div
        className={cn(
          'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden',
          className
        )}
      >
        {body}
      </div>
    )
  }

  return (
    <div
      className={cn(
        'rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] overflow-hidden',
        className
      )}
    >
      <Table>
        <TableHeader>
          <TableRow className="hover:bg-transparent">
            {columns.map((col) => {
              const active = sortKey === col.key
              const sortControl = sortable && onSort

              return (
                <TableHead
                  key={col.key}
                  className={cn(
                    'h-10 whitespace-nowrap bg-[var(--color-surface-muted)]/50 text-xs font-medium uppercase tracking-wider text-[var(--color-text-muted)]',
                    sortControl && 'cursor-pointer select-none hover:text-[var(--color-text-secondary)]'
                  )}
                  style={{
                    width:     col.width,
                    textAlign: col.align ?? 'left',
                  }}
                  onClick={sortControl ? () => onSort(col.key) : undefined}
                  onKeyDown={
                    sortControl
                      ? (e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault()
                            onSort(col.key)
                          }
                        }
                      : undefined
                  }
                  role={sortControl ? 'button' : undefined}
                  tabIndex={sortControl ? 0 : undefined}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {sortControl && active && (
                      <span className="text-[0.625rem] font-semibold normal-case tracking-normal text-[var(--color-text-muted)]">
                        {sortDirection === 'desc' ? '↓' : '↑'}
                      </span>
                    )}
                  </span>
                </TableHead>
              )
            })}
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((row, idx) => (
            <TableRow
              key={row.id}
              className={cn(
                'tbl-row',
                !interactiveRows && 'hover:bg-transparent'
              )}
              style={getRowStyle?.(row, idx)}
            >
              {columns.map((col) => (
                <TableCell
                  key={col.key}
                  className="text-[var(--color-text-secondary)]"
                  style={{ textAlign: col.align ?? 'left' }}
                >
                  {cellContent(col, row)}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
