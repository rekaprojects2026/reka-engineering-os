'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { cn } from '@/lib/utils/cn'

/**
 * TopbarSearch — global search control.
 *
 * Quiet surface (surface-muted background, no visible border) at rest;
 * resolves to the brand primary focus ring. Width is stable (no expand-on-focus
 * animation) which reads more premium and avoids visual jitter.
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
            focused ? 'text-[var(--color-primary)]' : 'text-[var(--color-text-muted)]'
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
            'h-9 w-[300px] rounded-md border border-transparent bg-[var(--color-surface-muted)] py-2 pl-9 pr-8 text-[0.875rem] text-[var(--color-text-primary)] outline-none transition-colors duration-150 placeholder:text-[var(--color-text-muted)]',
            focused && 'border-[var(--color-primary)] bg-[var(--color-surface)] ring-[3px] ring-[var(--color-primary)]/10'
          )}
        />
        {!focused && !value && (
          <kbd
            aria-hidden="true"
            className="pointer-events-none absolute right-3 inline-flex h-5 min-w-[20px] items-center justify-center rounded border border-[var(--color-border)] bg-[var(--color-surface)] px-1.5 text-[0.6875rem] font-semibold text-[var(--color-text-muted)]"
          >
            /
          </kbd>
        )}
      </div>
    </form>
  )
}
