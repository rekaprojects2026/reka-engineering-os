import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { canAccessProjectsNewRoute } from '@/lib/auth/permissions'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { IntakeStatusBadge } from '@/components/modules/intakes/IntakeStatusBadge'
import { ProjectStatusBadge } from '@/components/modules/projects/ProjectStatusBadge'
import { getClientById } from '@/lib/clients/queries'
import { getIntakesByClientId } from '@/lib/intakes/queries'
import { getProjectsByClientId } from '@/lib/projects/queries'
import { formatDate } from '@/lib/utils/formatters'
import {
  Mail,
  Phone,
  Building2,
  Pencil,
  FolderKanban,
  ClipboardList,
  Plus,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const client = await getClientById(id)
  return { title: client ? `${client.client_name} — ReKa Engineering OS` : 'Client not found — ReKa Engineering OS' }
}

export default async function ClientDetailPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'finance', 'manajer', 'bd'])

  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

  const [intakes, projects] = await Promise.all([
    getIntakesByClientId(client.id),
    getProjectsByClientId(client.id),
  ])

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={client.client_name}
        subtitle={`${client.client_code} · ${client.client_type.charAt(0).toUpperCase() + client.client_type.slice(1)}`}
        actions={
          <Link
            href={`/clients/${client.id}/edit`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '8px 14px',
              backgroundColor: 'var(--color-surface)',
              border: '1px solid var(--color-border)',
              borderRadius: 'var(--radius-control)',
              fontSize: '0.8125rem',
              fontWeight: 500,
              color: 'var(--color-text-secondary)',
              textDecoration: 'none',
            }}
          >
            <Pencil size={13} aria-hidden="true" />
            Edit Client
          </Link>
        }
      />

      <EntityStatusStrip
        statusBadge={<ClientStatusBadge status={client.status} />}
        extraBadge={
          <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', textTransform: 'capitalize' }}>
            Source: {client.source_default}
          </span>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Overview */}
          <SectionCard title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Source">
                <span style={{ textTransform: 'capitalize' }}>{client.source_default}</span>
              </DetailRow>
              {client.company_name && (
                <DetailRow label="Company Name">{client.company_name}</DetailRow>
              )}
              <DetailRow label="Client Since">{formatDate(client.created_at)}</DetailRow>
              <DetailRow label="Last Updated">{formatDate(client.updated_at)}</DetailRow>
            </div>
          </SectionCard>

          {/* Notes */}
          {client.notes && (
            <SectionCard title="Notes">
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
              }}>
                {client.notes}
              </p>
            </SectionCard>
          )}

          {/* Linked Intakes — real data */}
          <SectionCard
            title="Linked Intakes"
            actions={
              <Link
                href={`/intakes/new`}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '0.75rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  fontWeight: 500,
                }}
              >
                <Plus size={12} aria-hidden="true" />
                New Intake
              </Link>
            }
            noPadding
          >
            {intakes.length === 0 ? (
              <div style={{
                padding: '20px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <ClipboardList size={16} />
                No intakes linked to this client yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Code', 'Title', 'Status', 'Received'].map(h => (
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
                    {intakes.map((intake, idx) => (
                      <tr
                        key={intake.id}
                        style={{
                          borderBottom: idx < intakes.length - 1 ? '1px solid var(--color-border)' : undefined,
                          cursor: 'pointer',
                        }}
                        className="hover:bg-[var(--color-surface-muted)]"
                      >
                        <td style={{ padding: '8px 14px' }}>
                          <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {intake.intake_code}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <Link href={`/intakes/${intake.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                              {intake.title}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <IntakeStatusBadge status={intake.status} />
                        </td>
                        <td style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(intake.received_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>

          {/* Linked Projects — real data */}
          <SectionCard
            title="Projects"
            actions={
              canAccessProjectsNewRoute(_sp.system_role) ? (
                <Link
                  href={`/projects/new`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '4px',
                    fontSize: '0.75rem',
                    color: 'var(--color-primary)',
                    textDecoration: 'none',
                    fontWeight: 500,
                  }}
                >
                  <Plus size={12} aria-hidden="true" />
                  New Project
                </Link>
              ) : undefined
            }
            noPadding
          >
            {projects.length === 0 ? (
              <div style={{
                padding: '20px 16px',
                textAlign: 'center',
                color: 'var(--color-text-muted)',
                fontSize: '0.8125rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}>
                <FolderKanban size={16} />
                No projects linked to this client yet.
              </div>
            ) : (
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                      {['Code', 'Name', 'Status', 'Due Date'].map(h => (
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
                    {projects.map((prj, idx) => (
                      <tr
                        key={prj.id}
                        style={{
                          borderBottom: idx < projects.length - 1 ? '1px solid var(--color-border)' : undefined,
                          cursor: 'pointer',
                        }}
                        className="hover:bg-[var(--color-surface-muted)]"
                      >
                        <td style={{ padding: '8px 14px' }}>
                          <Link href={`/projects/${prj.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                              {prj.project_code}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <Link href={`/projects/${prj.id}`} style={{ textDecoration: 'none' }}>
                            <span style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', fontWeight: 500 }}>
                              {prj.name}
                            </span>
                          </Link>
                        </td>
                        <td style={{ padding: '8px 14px' }}>
                          <ProjectStatusBadge status={prj.status} />
                        </td>
                        <td style={{ padding: '8px 14px', fontSize: '0.75rem', color: 'var(--color-text-muted)', whiteSpace: 'nowrap' }}>
                          {formatDate(prj.target_due_date)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </SectionCard>
        </div>

        {/* Right column — Contact card */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <SectionCard title="Contact Information">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {client.primary_contact_name && (
                <ContactRow icon={<Building2 size={14} />} label="Name">
                  {client.primary_contact_name}
                </ContactRow>
              )}
              {client.primary_contact_email && (
                <ContactRow icon={<Mail size={14} />} label="Email">
                  <a
                    href={`mailto:${client.primary_contact_email}`}
                    style={{ color: 'var(--color-primary)', textDecoration: 'none' }}
                  >
                    {client.primary_contact_email}
                  </a>
                </ContactRow>
              )}
              {client.primary_contact_phone && (
                <ContactRow icon={<Phone size={14} />} label="Phone">
                  {client.primary_contact_phone}
                </ContactRow>
              )}
              {!client.primary_contact_name && !client.primary_contact_email && !client.primary_contact_phone && (
                <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-muted)', textAlign: 'center', padding: '8px 0' }}>
                  No contact info added yet.
                </p>
              )}
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginBottom: '3px', fontWeight: 500 }}>
        {label}
      </p>
      <p style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</p>
    </div>
  )
}

function ContactRow({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
      <span style={{ color: 'var(--color-text-muted)', marginTop: '1px', flexShrink: 0 }}>{icon}</span>
      <div>
        <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
          {label}
        </p>
        <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)', marginTop: '1px' }}>{children}</div>
      </div>
    </div>
  )
}
