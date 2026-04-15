import type { ReactNode } from 'react'

interface AppTopbarProps {
  right?: ReactNode
}

export function AppTopbar({ right }: AppTopbarProps) {
  return (
    <header
      style={{
        height: 'var(--topbar-height)',
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '0 24px',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        zIndex: 10,
      }}
    >
      {right && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {right}
        </div>
      )}
    </header>
  )
}
