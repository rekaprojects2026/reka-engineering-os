import { cn } from '@/lib/utils/cn'
import type { ChangeEventHandler } from 'react'

interface FilterSelectOption {
  value: string
  label: string
}

interface FilterSelectProps {
  name:           string
  defaultValue?:  string
  options:        FilterSelectOption[]
  placeholder?:   string
  className?:     string
  onChange?:      ChangeEventHandler<HTMLSelectElement>
  'aria-label'?:  string
}

/**
 * FilterSelect — a standardised native <select> for FilterBar rows.
 * Stays as native select for server-form GET compatibility — NOT Radix.
 * Consistent sizing, border, and focus treatment across all list pages.
 */
export function FilterSelect({
  name,
  defaultValue = '',
  options,
  placeholder,
  className,
  onChange,
  'aria-label': ariaLabel,
}: FilterSelectProps) {
  return (
    <select
      name={name}
      defaultValue={defaultValue}
      onChange={onChange}
      aria-label={ariaLabel}
      className={cn(
        'h-8 min-w-[140px] cursor-pointer rounded-[var(--radius-control)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 text-[0.8125rem] text-[var(--color-text-primary)] outline-none transition-colors',
        'focus:border-[var(--color-primary)] focus:ring-[3px] focus:ring-[var(--color-primary)]/10',
        className
      )}
    >
      {placeholder && <option value="">{placeholder}</option>}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  )
}
