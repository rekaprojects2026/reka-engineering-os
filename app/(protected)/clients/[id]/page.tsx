import { notFound } from 'next/navigation'
import Link from 'next/link'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { ClientStatusBadge } from '@/components/modules/clients/ClientStatusBadge'
import { getClientById } from '@/lib/clients/queries'
import { formatDate } from '@/lib/utils/formatters'
import {
  Mail,
  Phone,
  Building2,
  Globe,
  Pencil,
  FolderKanban,
  ClipboardList,
} from 'lucide-react'

interface PageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: PageProps) {
  const { id } = await params
  const client = await getClientById(id)
  return { title: client ? `${client.client_name} — Engineering Agency OS` : 'Client Not Found' }
}

export default async function ClientDetailPage({ params }: PageProps) {
  const { id } = await params
  const client = await getClientById(id)
  if (!client) notFound()

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
              borderRadius: '6px',
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

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '20px', alignItems: 'start' }}>

        {/* Left column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Overview */}
          <SectionCard title="Overview">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <DetailRow label="Status">
                <ClientStatusBadge status={client.status} />
              </DetailRow>
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

          {/* Linked Intakes placeholder */}
          <SectionCard
            title="Linked Intakes"
            actions={
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Available in Stage 02B
              </span>
            }
          >
            <div style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <ClipboardList size={16} />
              Intakes linked to this client will appear here.
            </div>
          </SectionCard>

          {/* Linked Projects placeholder */}
          <SectionCard
            title="Projects"
            actions={
              <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                Available in Stage 03
              </span>
            }
          >
            <div style={{
              padding: '20px 0',
              textAlign: 'center',
              color: 'var(--color-text-muted)',
              fontSize: '0.8125rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
            }}>
              <FolderKanban size={16} />
              Projects for this client will appear here.
            </div>
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
