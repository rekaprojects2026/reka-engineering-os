import { cn } from '@/lib/utils/cn'
import type { ReactNode } from 'react'

interface FilterBarProps {
  children: ReactNode
  className?: string
}

export function FilterBar({ children, className }: FilterBarProps) {
  return (
    <div
      className={cn('flex flex-wrap items-center gap-2', className)}
      role="group"
      aria-label="Filters"
    >
      {children}
    </div>
  )
}
