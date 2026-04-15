'use client'

import { useState, useRef, useEffect, useCallback, type FormEvent, type KeyboardEvent as ReactKeyboardEvent } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'

export function TopbarSearch() {
  const [value,   setValue]   = useState('')
  const [focused, setFocused] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const router   = useRouter()

  // Press '/' anywhere outside a text field → focus the search input
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
      style={{ display: 'flex', alignItems: 'center' }}
    >
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        {/* Search icon */}
        <Search
          size={14}
          aria-hidden="true"
          style={{
            position:      'absolute',
            left:          '9px',
            color:         focused ? 'var(--color-primary)' : 'var(--color-text-muted)',
            pointerEvents: 'none',
            transition:    'color 0.1s',
          }}
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
          placeholder="Search…  /"
          aria-label="Search across all records"
          autoComplete="off"
          spellCheck={false}
          style={{
            paddingLeft:     '30px',
            paddingRight:    '10px',
            paddingTop:      '6px',
            paddingBottom:   '6px',
            border:          focused
              ? '1px solid var(--color-primary)'
              : '1px solid var(--color-border)',
            borderRadius:    '6px',
            fontSize:        '0.8125rem',
            width:           focused ? '260px' : '220px',
            backgroundColor: 'var(--color-surface)',
            color:           'var(--color-text-primary)',
            outline:         'none',
            transition:      'border-color 0.15s, width 0.15s',
          }}
        />
      </div>
    </form>
  )
}
