export const DEFAULT_PAGE_SIZE = 50

export interface PaginationParams {
  /** 1-indexed dari URL (?page=1) */
  page: number
  pageSize: number
}

export interface PaginationResult {
  /** Offset untuk .range(from, to) */
  from: number
  /** Inclusive end index untuk Supabase .range */
  to: number
}

export function parsePagination(searchParams: {
  page?: string
  pageSize?: string
}): PaginationParams {
  const page = Math.max(1, Number(searchParams.page ?? 1) || 1)
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.pageSize ?? DEFAULT_PAGE_SIZE) || DEFAULT_PAGE_SIZE),
  )
  return { page, pageSize }
}

export function getRange({ page, pageSize }: PaginationParams): PaginationResult {
  const from = (page - 1) * pageSize
  const to = from + pageSize - 1
  return { from, to }
}

export function totalPages(count: number, pageSize: number): number {
  return Math.max(1, Math.ceil(count / pageSize))
}
