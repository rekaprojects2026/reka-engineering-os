import * as React from 'react'
import { cn } from '@/lib/utils/cn'

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      data-slot="skeleton"
      className={cn(
        "animate-pulse rounded-[var(--radius-control)] bg-[var(--color-surface-muted)]",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
