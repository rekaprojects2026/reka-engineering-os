'use client'

import { useTransition, useState } from 'react'
import { removeTeamMember } from '@/lib/projects/team-actions'
import { X } from 'lucide-react'

interface RemoveTeamMemberButtonProps {
  assignmentId: string
  projectId: string
  memberName: string
}

export function RemoveTeamMemberButton({ assignmentId, projectId, memberName }: RemoveTeamMemberButtonProps) {
  const [isPending, startTransition] = useTransition()
  const [confirming, setConfirming] = useState(false)

  function handleRemove() {
    startTransition(async () => {
      const fd = new FormData()
      fd.set('assignment_id', assignmentId)
      fd.set('project_id', projectId)
      await removeTeamMember(fd)
      setConfirming(false)
    })
  }

  if (confirming) {
    return (
      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
        <span style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)' }}>Remove?</span>
        <button
          onClick={handleRemove}
          disabled={isPending}
          style={{
            padding: '2px 8px',
            fontSize: '0.6875rem',
            fontWeight: 500,
            backgroundColor: 'var(--color-danger)',
            color: '#fff',
            border: 'none',
            borderRadius: '4px',
            cursor: isPending ? 'not-allowed' : 'pointer',
          }}
        >
          {isPending ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isPending}
          style={{
            padding: '2px 8px',
            fontSize: '0.6875rem',
            fontWeight: 500,
            backgroundColor: 'var(--color-surface-subtle)',
            color: 'var(--color-text-secondary)',
            border: '1px solid var(--color-border)',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          No
        </button>
      </div>
    )
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      title={`Remove ${memberName}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '22px',
        height: '22px',
        padding: 0,
        backgroundColor: 'transparent',
        border: '1px solid var(--color-border)',
        borderRadius: '4px',
        cursor: 'pointer',
        color: 'var(--color-text-muted)',
      }}
    >
      <X size={12} />
    </button>
  )
}
