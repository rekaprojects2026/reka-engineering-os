'use client'

import { useTransition, useState } from 'react'
import { addTeamMember } from '@/lib/projects/team-actions'
import { TEAM_ROLES } from '@/lib/constants/options'

interface AddTeamMemberFormProps {
  projectId: string
  users: { id: string; full_name: string; email: string; discipline: string | null }[]
  assignedUserIds: string[]
  /** Discipline values on this project (for per-member assignment scope). */
  projectDisciplines: string[]
}

const inputStyle: React.CSSProperties = {
  padding: '7px 11px',
  border: '1px solid var(--input-border)',
  borderRadius: '6px',
  fontSize: '0.8125rem',
  color: 'var(--text-primary-neutral)',
  outline: 'none',
}

function formatDisciplineLabel(d: string): string {
  if (!d) return d
  return d.charAt(0).toUpperCase() + d.slice(1).replace(/_/g, ' ')
}

export function AddTeamMemberForm({ projectId, users, assignedUserIds, projectDisciplines }: AddTeamMemberFormProps) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const availableUsers = users.filter((u) => !assignedUserIds.includes(u.id))

  function handleSubmit(formData: FormData) {
    setError(null)
    setSuccess(false)
    startTransition(async () => {
      const result = await addTeamMember(formData)
      if (result?.error) {
        setError(result.error)
      } else {
        setSuccess(true)
        setTimeout(() => setSuccess(false), 2000)
      }
    })
  }

  if (availableUsers.length === 0) {
    return (
      <p style={{
        fontSize: '0.75rem',
        color: 'var(--text-muted-neutral)',
        padding: '8px 0',
      }}>
        All active users are already assigned to this project.
      </p>
    )
  }

  return (
    <form action={handleSubmit}>
      <input type="hidden" name="project_id" value={projectId} />

      <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 200px', minWidth: '180px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted-neutral)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px',
            }}
          >
            Team Member
          </label>
          <select name="user_id" required style={{ ...inputStyle, width: '100%' }}>
            <option value="">Select a member…</option>
            {availableUsers.map((u) => (
              <option key={u.id} value={u.id}>
                {u.full_name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 0 140px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted-neutral)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px',
            }}
          >
            Role
          </label>
          <select name="team_role" style={{ ...inputStyle, width: '100%' }}>
            {TEAM_ROLES.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ flex: '0 0 160px' }}>
          <label
            style={{
              display: 'block',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--text-muted-neutral)',
              textTransform: 'uppercase',
              letterSpacing: '0.04em',
              marginBottom: '4px',
            }}
          >
            Discipline
          </label>
          <select name="discipline" style={{ ...inputStyle, width: '100%' }}>
            <option value="">Semua disiplin</option>
            {projectDisciplines.map((d) => (
              <option key={d} value={d}>
                {formatDisciplineLabel(d)}
              </option>
            ))}
          </select>
        </div>

        <button
          type="submit"
          disabled={isPending}
          style={{
            padding: '7px 14px',
            backgroundColor: isPending ? 'var(--color-primary-hover)' : 'var(--color-primary)',
            color: 'var(--color-primary-fg)',
            border: 'none',
            borderRadius: '6px',
            fontSize: '0.8125rem',
            fontWeight: 500,
            cursor: isPending ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
          }}
        >
          {isPending ? 'Adding…' : 'Add'}
        </button>
      </div>

      {error && (
        <p
          role="alert"
          style={{
            marginTop: '6px',
            fontSize: '0.75rem',
            color: 'var(--color-danger)',
          }}
        >
          {error}
        </p>
      )}
      {success && (
        <p
          style={{
            marginTop: '6px',
            fontSize: '0.75rem',
            color: 'var(--color-success)',
          }}
        >
          Team member added.
        </p>
      )}
    </form>
  )
}
