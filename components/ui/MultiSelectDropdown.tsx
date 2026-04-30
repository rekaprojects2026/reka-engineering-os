'use client'

import { ChevronDown, X } from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils/cn'
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

export interface MultiSelectDropdownProps {
  options: { value: string; label: string }[]
  selected: string[]
  onChange: (selected: string[]) => void
  placeholder?: string
  disabled?: boolean
}

export function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder = 'Pilih…',
  disabled,
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false)

  function toggle(value: string, checked: boolean) {
    if (checked) onChange([...selected, value])
    else onChange(selected.filter((v) => v !== value))
  }

  function remove(value: string) {
    onChange(selected.filter((v) => v !== value))
  }

  const labelBy = new Map(options.map((o) => [o.value, o.label]))

  return (
    <div className="space-y-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild disabled={disabled}>
          <button
            type="button"
            disabled={disabled}
            className={cn(
              'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-2 py-1.5 text-left text-[0.875rem] text-[var(--color-text-primary)] outline-none transition-colors',
              'focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]',
              disabled && 'cursor-not-allowed opacity-60',
            )}
          >
            {selected.length === 0 ? (
              <span className="px-1 text-[var(--color-text-muted)]">{placeholder}</span>
            ) : (
              selected.map((v) => (
                <span
                  key={v}
                  className="inline-flex items-center gap-0.5 rounded-md bg-[var(--color-surface-muted)] px-1.5 py-0.5 text-[0.8125rem] font-medium text-[var(--color-text-secondary)]"
                  onClick={(e) => e.stopPropagation()}
                >
                  {labelBy.get(v) ?? v}
                  <span
                    role="button"
                    tabIndex={0}
                    className="rounded p-0.5 hover:bg-[var(--color-border)]"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        remove(v)
                      }
                    }}
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      remove(v)
                    }}
                  >
                    <X size={12} className="opacity-70" aria-hidden />
                  </span>
                </span>
              ))
            )}
            <ChevronDown className="ml-auto h-4 w-4 shrink-0 opacity-50" aria-hidden />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="max-h-64 w-[var(--radix-dropdown-menu-trigger-width)] overflow-y-auto" align="start">
          {options.map((o) => (
            <DropdownMenuCheckboxItem
              key={o.value}
              checked={selected.includes(o.value)}
              onCheckedChange={(c) => toggle(o.value, Boolean(c))}
              onSelect={(e) => e.preventDefault()}
            >
              {o.label}
            </DropdownMenuCheckboxItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
      {selected.map((v) => (
        <input key={v} type="hidden" name="disciplines" value={v} />
      ))}
    </div>
  )
}
