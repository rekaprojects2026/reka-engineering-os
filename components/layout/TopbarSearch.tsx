'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * TopbarSearch — global search control (Stage 2 input tokens).
 * Width is stable (no expand-on-focus) to avoid visual jitter.
 */
export function TopbarSearch() {
  const [value,   setValue]   = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  const handleGlobalKeydown = useCallback((e: KeyboardEvent) => {
    const tag = (e.target as HTMLElement).tagName
    if (e.key === '/' && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
      e.preventDefault()
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleGlobalKeydown)
    return () => document.removeEventListener('keydown', handleGlobalKeydown)
  }, [handleGlobalKeydown])

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()
    const q = value.trim()
    if (q.length >= 2) {
      router.push(`/search?q=${encodeURIComponent(q)}`)
    }
  }

  const handleInputKeydown = (e: ReactKeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setValue('')
      inputRef.current?.blur()
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      aria-label="Global search"
      className="flex items-center"
    >
      <div className="relative flex items-center">
        <Search
          size={15}
          aria-hidden="true"
          className={cn(
            'pointer-events-none absolute left-3 transition-colors duration-100',
            focused ? 'text-[var(--brand-accent)]' : 'text-[var(--icon-empty-neutral)]'
          )}
        />
        <input
          ref={inputRef}
          type="search"
          name="q"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleInputKeydown}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder="Search projects, tasks, files…"
          aria-label="Search across all records"
          autoComplete="off"
          spellCheck={false}
          className={cn(
            'h-9 min-w-[200px] max-w-[min(100vw-8rem,320px)] w-[min(100%,260px)] rounded-[var(--radius-control)] border border-[var(--input-border)] bg-[var(--input-bg)] py-2 pl-9 pr-[2.25rem] text-[0.8125rem] leading-snug text-[var(--text-primary-neutral)] outline-none transition-[color,background-color,border-color,box-shadow] duration-150 placeholder:text-[var(--input-placeholder)] md:w-[min(100%,280px)] lg:max-w-[320px]',
            focused && 'border-[var(--input-focus-border)] bg-[var(--input-bg-focus)] ring-[3px] ring-[color:var(--input-focus-ring)]'
          )}
        />
        {!focused && !value && (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-2.5 top-1/2 inline-flex h-5 min-w-[1.25rem] -translate-y-1/2 items-center justify-center rounded border border-[var(--input-border)] bg-[var(--surface-neutral)] px-1 text-[0.625rem] font-medium tabular-nums text-[var(--text-muted-neutral)]"
          >
            /
          </kbd>
        )}
      </div>
    </form>
  )
}
