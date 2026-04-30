import Link from 'next/link'
import { redirect } from 'next/navigation'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { getSessionProfile } from '@/lib/auth/session'
import { isDirektur } from '@/lib/auth/permissions'
import { API_KEY_SCOPES, API_KEY_SCOPE_LABELS } from '@/lib/api/scopes'
import { WEBHOOK_EVENTS } from '@/lib/webhooks/events'

export const metadata = { title: 'API documentation — Settings' }

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'
const API_BASE = `${APP_URL.replace(/\/$/, '')}/api/v1`

export default async function ApiDocsPage() {
  const sp = await getSessionProfile()
  if (!isDirektur(sp.system_role)) redirect('/access-denied')

  return (
    <div>
      <PageHeader
        title="API documentation"
        subtitle="Public REST API and webhooks (direktur reference)."
        breadcrumb={{ label: 'Settings', href: '/settings?tab=system' }}
      />

      <SectionCard title="Base URL" className="mb-4">
        <p className="text-[0.8125rem] text-[var(--color-text-secondary)]">
          All v1 endpoints are under:
        </p>
        <code className="mt-2 block rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem]">
          {API_BASE}
        </code>
      </SectionCard>

      <SectionCard title="Authentication" className="mb-4">
        <p className="text-[0.8125rem] text-[var(--color-text-secondary)]">
          Send a valid API key in the Authorization header:
        </p>
        <pre className="mt-2 overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem]">
          Authorization: Bearer rek_…
        </pre>
        <p className="mt-3 text-[0.8125rem] text-[var(--color-text-muted)]">
          Create keys under{' '}
          <Link href="/settings/api-keys" className="text-[var(--color-primary)]">
            Settings → API keys
          </Link>
          . Each key has scopes; a request without the required scope returns 403.
        </p>
      </SectionCard>

      <SectionCard title="Success and error shape" className="mb-4">
        <p className="mb-2 text-[0.8125rem] text-[var(--color-text-secondary)]">Success:</p>
        <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem]">
          {`{ "data": [...], "meta": { "total": 0, "page": 1, "limit": 20 } }`}
        </pre>
        <p className="mb-2 mt-3 text-[0.8125rem] text-[var(--color-text-secondary)]">Error:</p>
        <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem]">
          {`{ "error": "message", "code": "ERROR_CODE" }`}
        </pre>
      </SectionCard>

      <SectionCard title="Scopes" className="mb-4">
        <ul className="list-inside list-disc text-[0.8125rem] text-[var(--color-text-secondary)]">
          {API_KEY_SCOPES.map((s) => (
            <li key={s}>
              <code className="font-mono text-[0.75rem]">{s}</code> — {API_KEY_SCOPE_LABELS[s]}
            </li>
          ))}
        </ul>
      </SectionCard>

      <SectionCard title="Endpoints (GET)" className="mb-4">
        <ul className="space-y-3 text-[0.8125rem] text-[var(--color-text-secondary)]">
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/projects</code> — scope{' '}
            <code className="font-mono">projects:read</code>. Query: <code className="font-mono">page</code>,{' '}
            <code className="font-mono">limit</code>, optional <code className="font-mono">status</code>.
          </li>
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/projects/&#123;id&#125;</code> — scope{' '}
            <code className="font-mono">projects:read</code>.
          </li>
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/tasks</code> — scope{' '}
            <code className="font-mono">tasks:read</code>. Required query:{' '}
            <code className="font-mono">project_id</code>. Optional: <code className="font-mono">page</code>,{' '}
            <code className="font-mono">limit</code>.
          </li>
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/invoices</code> — scope{' '}
            <code className="font-mono">invoices:read</code>. Optional: <code className="font-mono">page</code>,{' '}
            <code className="font-mono">limit</code>, <code className="font-mono">status</code>,{' '}
            <code className="font-mono">project_id</code>.
          </li>
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/invoices/&#123;id&#125;</code> — scope{' '}
            <code className="font-mono">invoices:read</code>.
          </li>
          <li>
            <code className="font-mono text-[0.75rem]">GET /api/v1/clients</code> — scope{' '}
            <code className="font-mono">clients:read</code>. Optional: <code className="font-mono">page</code>,{' '}
            <code className="font-mono">limit</code>.
          </li>
        </ul>
      </SectionCard>

      <SectionCard title="Webhooks" className="mb-4">
        <p className="mb-2 text-[0.8125rem] text-[var(--color-text-secondary)]">
          Configure endpoints under{' '}
          <Link href="/settings/webhooks" className="text-[var(--color-primary)]">
            Settings → Webhooks
          </Link>
          . Each delivery is a JSON POST:
        </p>
        <pre className="overflow-x-auto rounded-md border border-[var(--color-border)] bg-[var(--color-surface-subtle)] p-3 font-mono text-[0.75rem]">
          {`{
  "event": "invoice.created",
  "timestamp": "2026-01-01T00:00:00.000Z",
  "data": { ... }
}`}
        </pre>
        <p className="mt-3 text-[0.8125rem] text-[var(--color-text-secondary)]">
          Headers: <code className="font-mono">Content-Type: application/json</code>,{' '}
          <code className="font-mono">X-Reka-Event</code>,{' '}
          <code className="font-mono">X-Reka-Signature: sha256=&lt;hmac&gt;</code> (HMAC-SHA256 of the raw body with
          your endpoint secret).
        </p>
        <p className="mt-3 text-[0.75rem] font-semibold text-[var(--color-text-primary)]">Event types</p>
        <ul className="mt-1 list-inside list-disc text-[0.8125rem] text-[var(--color-text-secondary)]">
          {(Object.keys(WEBHOOK_EVENTS) as (keyof typeof WEBHOOK_EVENTS)[]).map((k) => (
            <li key={k}>
              <code className="font-mono text-[0.75rem]">{k}</code> — {WEBHOOK_EVENTS[k]}
            </li>
          ))}
        </ul>
        <p className="mt-3 text-[0.8125rem] text-[var(--color-text-muted)]">
          Payload fields vary by event (e.g. <code className="font-mono">invoice.created</code> includes{' '}
          <code className="font-mono">invoice_id</code>, <code className="font-mono">project_id</code>, amounts,
          etc.).
        </p>
      </SectionCard>
    </div>
  )
}
