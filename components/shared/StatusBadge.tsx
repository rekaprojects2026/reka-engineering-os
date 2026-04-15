import { cn } from '@/lib/utils/cn'
import type { StatusVariant } from '@/lib/constants/statuses'

interface StatusBadgeProps {
  label: string
  variant?: StatusVariant
  className?: string
}

const variantStyles: Record<StatusVariant, string> = {
  neutral: 'bg-[#F1F5F9] text-[#475569]',
  active:  'bg-[#DBEAFE] text-[#1D4ED8]',
  review:  'bg-[#FEF3C7] text-[#D97706]',
  success: 'bg-[#DCFCE7] text-[#16A34A]',
  danger:  'bg-[#FEE2E2] text-[#DC2626]',
}

export function StatusBadge({ label, variant = 'neutral', className }: StatusBadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium whitespace-nowrap',
        variantStyles[variant],
        className
      )}
    >
      {label}
    </span>
  )
}
