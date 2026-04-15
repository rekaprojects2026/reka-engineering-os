'use client'

import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

interface SearchInputProps {
  placeholder?: string
  value: string
  onChange: (value: string) => void
  className?: string
  id?: string
}

export function SearchInput({
  placeholder = 'Search…',
  value,
  onChange,
  className,
  id,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Search
        size={14}
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
        style={{ color: 'var(--color-text-muted)' }}
        aria-hidden="true"
      />
      <input
        id={id}
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border py-2 pl-8 pr-3 text-sm outline-none transition-colors"
        style={{
          borderColor: 'var(--color-border)',
          backgroundColor: 'var(--color-surface)',
          color: 'var(--color-text-primary)',
          fontSize: '0.8125rem',
        }}
      />
    </div>
  )
}
