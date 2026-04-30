'use client'

import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

export function CopyLinkButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(url)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select the input
    }
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <input
        readOnly
        value={url}
        style={{
          flex:            1,
          padding:         '7px 10px',
          border:          '1px solid var(--color-border)',
          borderRadius:    '6px',
          fontSize:        '0.75rem',
          fontFamily:      'monospace',
          color:           'var(--color-text-secondary)',
          backgroundColor: 'var(--color-surface-subtle)',
          outline:         'none',
          minWidth:        0,
        }}
        onFocus={(e) => e.target.select()}
      />
      <button
        type="button"
        onClick={handleCopy}
        title="Copy invite link"
        style={{
          display:         'inline-flex',
          alignItems:      'center',
          gap:             '5px',
          padding:         '7px 12px',
          border:          '1px solid var(--color-border)',
          borderRadius:    '6px',
          fontSize:        '0.75rem',
          fontWeight:      500,
          cursor:          'pointer',
          backgroundColor: copied ? 'var(--color-success-subtle)' : 'var(--color-surface)',
          color:           copied ? 'var(--color-success)' : 'var(--color-text-secondary)',
          whiteSpace:      'nowrap',
          flexShrink:      0,
          transition:      'background-color 0.15s, color 0.15s',
        }}
      >
        {copied ? <Check size={13} /> : <Copy size={13} />}
        {copied ? 'Copied!' : 'Copy'}
      </button>
    </div>
  )
}
