import { RemoveTeamMemberButton } from './RemoveTeamMemberButton'
import { formatDate } from '@/lib/utils/formatters'
import type { TeamMemberWithProfile } from '@/lib/projects/team-queries'
import { Users } from 'lucide-react'

interface TeamMemberListProps {
  members: TeamMemberWithProfile[]
  projectId: string
  /** When false, hide remove actions (read-only roster). Default true. */
  allowRemove?: boolean
}

const roleLabels: Record<string, string> = {
  lead: 'Lead',
  engineer: 'Engineer',
  drafter: 'Drafter',
  checker: 'Checker',
  support: 'Support',
}

export function TeamMemberList({ members, projectId, allowRemove = true }: TeamMemberListProps) {
  if (members.length === 0) {
    return (
      <div
        style={{
          padding: '24px 16px',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
          fontSize: '0.8125rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
        }}
      >
        <Users size={16} />
        No team members assigned yet.
      </div>
    )
  }

  const headers = allowRemove
    ? ['Name', 'Role', 'Discipline', 'Assigned', '']
    : ['Name', 'Role', 'Discipline', 'Assigned']

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
            {headers.map((h) => (
              <th
                key={h}
                style={{
                  padding: '8px 14px',
                  textAlign: 'left',
                  fontSize: '0.6875rem',
                  fontWeight: 600,
                  color: 'var(--color-text-muted)',
                  backgroundColor: 'var(--color-surface-subtle)',
                  letterSpacing: '0.02em',
                  textTransform: 'uppercase',
                  whiteSpace: 'nowrap',
                }}
              >
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {members.map((member, idx) => (
            <tr
              key={member.id}
              style={{
                borderBottom: idx < members.length - 1 ? '1px solid var(--color-border)' : undefined,
              }}
            >
              {/* Name */}
              <td style={{ padding: '8px 14px' }}>
                <div>
                  <p
                    style={{
                      fontWeight: 500,
                      color: 'var(--color-text-primary)',
                      fontSize: '0.8125rem',
                    }}
                  >
                    {member.profiles.full_name}
                  </p>
                  <p
                    style={{
                      fontSize: '0.6875rem',
                      color: 'var(--color-text-muted)',
                      marginTop: '1px',
                    }}
                  >
                    {member.profiles.email}
                  </p>
                </div>
              </td>
              {/* Role */}
              <td style={{ padding: '8px 14px' }}>
                <span
                  style={{
                    fontSize: '0.75rem',
                    fontWeight: 500,
                    color: member.team_role === 'lead' ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    backgroundColor: member.team_role === 'lead' ? 'var(--color-primary-subtle)' : 'var(--color-surface-subtle)',
                    padding: '2px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {roleLabels[member.team_role] ?? member.team_role}
                </span>
              </td>
              {/* Discipline */}
              <td
                style={{
                  padding: '8px 14px',
                  fontSize: '0.8125rem',
                  color: 'var(--color-text-secondary)',
                  textTransform: 'capitalize',
                }}
              >
                {member.profiles.discipline ?? '—'}
              </td>
              {/* Assigned */}
              <td
                style={{
                  padding: '8px 14px',
                  fontSize: '0.75rem',
                  color: 'var(--color-text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {formatDate(member.assigned_at)}
              </td>
              {allowRemove && (
                <td style={{ padding: '8px 14px', textAlign: 'right' }}>
                  <RemoveTeamMemberButton
                    assignmentId={member.id}
                    projectId={projectId}
                    memberName={member.profiles.full_name}
                  />
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
