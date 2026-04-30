import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { EntityStatusStrip } from '@/components/shared/EntityStatusStrip'
import { IntakeStatusUpdater } from '@/components/modules/intakes/IntakeStatusUpdater'
import { ConvertToProjectButton } from '@/components/modules/intakes/ConvertToProjectButton'
import { getIntakeById } from '@/lib/intakes/queries'
import { getClientsForSelect } from '@/lib/clients/queries'
import { getUsersForSelect } from '@/lib/users/queries'
import { formatDate } from '@/lib/utils/formatters'
import {
  Pencil,
  ExternalLink,
  FolderKanban,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const intake = await getIntakeById(id)
  return { title: intake ? `${intake.title} — ReKa Engineering OS` : 'Intake not found — ReKa Engineering OS' }
}

export default async function IntakeDetailPage({ params }: PageProps) {
  const _sp = await getSessionProfile()
  requireRole(_sp.system_role, ['direktur', 'technical_director', 'manajer', 'bd'])

  const { id } = await params
  const [intake, clients, users] = await Promise.all([
    getIntakeById(id),
    getClientsForSelect(),
    getUsersForSelect(),
  ])
  if (!intake) notFound()

  const clientDisplay = intake.clients
    ? intake.clients.client_name
    : intake.temp_client_name ?? '—'
  const clientIsLinked = !!intake.clients

  const isConverted = intake.status === 'converted'
  // Qualified or closed (not yet converted) — same convert flow as list
  const canConvert = !isConverted && (intake.status === 'qualified' || intake.status === 'closed')

  return (
    <div>
      {/* Header */}
      <PageHeader
        title={intake.title}
        subtitle={`${intake.intake_code} · ${intake.discipline.charAt(0).toUpperCase() + intake.discipline.slice(1)} · ${intake.project_type.charAt(0).toUpperCase() + intake.project_type.slice(1)}`}
        actions={
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {canConvert && (
              <ConvertToProjectButton intakeId={intake.id} />
            )}
            <Link
              href={`/intakes/${intake.id}/edit`}
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
              Edit Intake
            </Link>
          </div>
        }
      />

      <EntityStatusStrip
        statusBadge={
          <IntakeStatusUpdater
            intakeId={intake.id}
            currentStatus={intake.status}
            leadTitle={intake.title}
            clientName={clientDisplay}
            clients={clients}
            users={users}
            linkedClientId={intake.client_id}
            readOnly={isConverted}
          />
        }
        dueDate={intake.proposed_deadline}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Overview */}
          <SectionCard title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Source">
                <span style={{ textTransform: 'capitalize' }}>{intake.source}</span>
              </DetailRow>
              <DetailRow label="Client / Prospect">
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {clientIsLinked ? (
                    <Link
                      href={`/clients/${intake.clients!.id}`}
                      style={{
                        color: 'var(--color-primary)',
                        textDecoration: 'none',
                        fontWeight: 500,
                        fontSize: '0.8125rem',
                      }}
                    >
                      {clientDisplay}
                    </Link>
                  ) : (
                    <span>{clientDisplay}</span>
                  )}
                  {!clientIsLinked && (
                    <span
                      style={{
                        fontSize: '0.6875rem',
                        backgroundColor: 'var(--color-surface-subtle)',
                        color: 'var(--color-text-muted)',
                        padding: '1px 6px',
                        borderRadius: '4px',
                        fontWeight: 500,
                      }}
                    >
                      Prospect
                    </span>
                  )}
                </div>
              </DetailRow>
              <DetailRow label="Discipline">
                <span style={{ textTransform: 'capitalize' }}>{intake.discipline}</span>
              </DetailRow>
              <DetailRow label="Project Type">
                <span style={{ textTransform: 'capitalize' }}>{intake.project_type}</span>
              </DetailRow>
              <DetailRow label="Received Date">
                {formatDate(intake.received_date)}
              </DetailRow>
            </div>
          </SectionCard>

          {/* Brief */}
          {intake.short_brief && (
            <SectionCard title="Brief">
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
              }}>
                {intake.short_brief}
              </p>
            </SectionCard>
          )}

          {/* Qualification Notes */}
          {intake.qualification_notes && (
            <SectionCard title="Qualification Notes">
              <p style={{
                fontSize: '0.8125rem',
                color: 'var(--color-text-secondary)',
                lineHeight: '1.7',
                whiteSpace: 'pre-wrap',
              }}>
                {intake.qualification_notes}
              </p>
            </SectionCard>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Linked Project — shown after conversion */}
          {isConverted && intake.converted_project && (
            <SectionCard title="Linked Project">
              <Link
                href={`/projects/${intake.converted_project.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  textDecoration: 'none',
                  padding: '8px 0',
                }}
              >
                <FolderKanban size={16} style={{ color: 'var(--color-primary)', flexShrink: 0 }} />
                <div>
                  <span style={{
                    fontFamily: 'monospace',
                    fontSize: '0.75rem',
                    color: 'var(--color-text-muted)',
                    display: 'block',
                  }}>
                    {intake.converted_project.project_code}
                  </span>
                  <span style={{
                    fontSize: '0.8125rem',
                    color: 'var(--color-primary)',
                    fontWeight: 500,
                  }}>
                    {intake.converted_project.name}
                  </span>
                </div>
              </Link>
            </SectionCard>
          )}

          {/* Timeline & Budget */}
          <SectionCard title="Timeline & Budget">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              <DetailRow label="Budget Estimate">
                {intake.budget_estimate
                  ? `$${Number(intake.budget_estimate).toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                  : <span style={{ color: 'var(--color-text-muted)' }}>Not specified</span>
                }
              </DetailRow>
              <DetailRow label="Estimated Complexity">
                {intake.estimated_complexity
                  ? <span style={{ textTransform: 'capitalize' }}>{intake.estimated_complexity}</span>
                  : <span style={{ color: 'var(--color-text-muted)' }}>Not assessed</span>
                }
              </DetailRow>
            </div>
          </SectionCard>

          {/* External Link */}
          {intake.external_reference_url && (
            <SectionCard title="External Reference">
              <a
                href={intake.external_reference_url}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontSize: '0.8125rem',
                  color: 'var(--color-primary)',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  wordBreak: 'break-all',
                }}
              >
                <ExternalLink size={13} aria-hidden="true" />
                {intake.external_reference_url.length > 50
                  ? intake.external_reference_url.slice(0, 50) + '…'
                  : intake.external_reference_url
                }
              </a>
            </SectionCard>
          )}

          {/* Metadata */}
          <SectionCard title="Record Info">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <DetailRow label="Created">{formatDate(intake.created_at)}</DetailRow>
              <DetailRow label="Last Updated">{formatDate(intake.updated_at)}</DetailRow>
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
      <div style={{ fontSize: '0.8125rem', color: 'var(--color-text-primary)' }}>{children}</div>
    </div>
  )
}
