'use client'

import { useMemo } from 'react'
import { usePathname, useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'

export interface PaginationProps {
  currentPage: number
  totalPages: number
  pageSize: number
  totalCount: number
}

export function Pagination({ currentPage, totalPages, pageSize, totalCount }: PaginationProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const { fromLabel, toLabel } = useMemo(() => {
    if (totalCount === 0) {
      return { fromLabel: 0, toLabel: 0 }
    }
    const from = (currentPage - 1) * pageSize + 1
    const to = Math.min(currentPage * pageSize, totalCount)
    return { fromLabel: from, toLabel: to }
  }, [currentPage, pageSize, totalCount])

  const pushPage = (nextPage: number) => {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 1) {
      params.delete('page')
    } else {
      params.set('page', String(nextPage))
    }
    const q = params.toString()
    router.push(q ? `${pathname}?${q}` : pathname)
  }

  if (totalCount === 0) {
    return null
  }

  return (
    <div className="flex flex-col gap-[var(--space-section-gap)] border-t border-[var(--table-border)] bg-[var(--surface-neutral)] px-[var(--space-card-padding-x)] py-[var(--space-pagination-y)] sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-[var(--text-muted-neutral)]">
        Menampilkan {fromLabel}–{toLabel} dari {totalCount} data
      </p>
      <div className="flex flex-wrap items-center gap-[var(--space-panel-gap)]">
        <Button type="button" variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => pushPage(currentPage - 1)}>
          ← Prev
        </Button>
        <span className="text-sm tabular-nums text-[var(--text-secondary-neutral)]">
          Halaman {currentPage} / {totalPages}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={currentPage >= totalPages}
          onClick={() => pushPage(currentPage + 1)}
        >
          Next →
        </Button>
      </div>
    </div>
  )
}
