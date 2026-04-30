import * as React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils/cn'

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-0.5 text-[0.6875rem] font-medium leading-none whitespace-nowrap select-none border border-transparent",
  {
    variants: {
      variant: {
        neutral:
          "bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]",
        active:
          "bg-[var(--badge-active-bg)] text-[var(--badge-active-text)]",
        review:
          "bg-[var(--badge-review-bg)] text-[var(--badge-review-text)]",
        success:
          "bg-[var(--badge-success-bg)] text-[var(--badge-success-text)]",
        danger:
          "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]",
        // shadcn-compat extras
        default:
          "bg-[var(--badge-neutral-bg)] text-[var(--badge-neutral-text)]",
        secondary:
          "bg-[var(--color-surface-muted)] text-[var(--color-text-secondary)]",
        destructive:
          "bg-[var(--badge-danger-bg)] text-[var(--badge-danger-text)]",
        outline:
          "border-[var(--color-border)] bg-transparent text-[var(--color-text-muted)]",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  )
}

export { Badge, badgeVariants }
