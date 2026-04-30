import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSessionProfile, requireRole } from '@/lib/auth/session'
import { PageHeader } from '@/components/layout/PageHeader'
import { SectionCard } from '@/components/shared/SectionCard'
import { createOutreachCompany } from '@/lib/outreach/actions'

export const metadata = { title: 'Add Outreach Company — ReKa Engineering OS' }

export default async function NewOutreachPage() {
  const sp = await getSessionProfile()
  requireRole(sp.system_role, ['bd'])

  async function handleCreate(formData: FormData) {
    'use server'
    await createOutreachCompany(formData)
    redirect('/outreach')
  }

  return (
    <div>
      <PageHeader
        title="Add Outreach Company"
        subtitle="Track a new company you want to contact for business."
      />
      <SectionCard>
        <form action={handleCreate}>
          <div style={{ display: 'grid', gap: '20px', maxWidth: '560px' }}>

            {/* Company Name */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Company Name <span style={{ color: 'var(--color-danger)' }}>*</span>
              </label>
              <input
                name="company_name"
                required
                placeholder="e.g. Acme Corp"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Contact Person */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Contact Person
              </label>
              <input
                name="contact_person"
                placeholder="e.g. John Smith"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }}
              />
            </div>

            {/* Contact Channel & Value */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Contact Channel
                </label>
                <select
                  name="contact_channel"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
                >
                  <option value="">— Select —</option>
                  <option value="upwork">Upwork</option>
                  <option value="linkedin">LinkedIn</option>
                  <option value="email">Email</option>
                  <option value="instagram">Instagram</option>
                  <option value="direct">Direct</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Contact Value
                </label>
                <input
                  name="contact_value"
                  placeholder="URL, email, handle…"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Status */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Status
              </label>
              <select
                name="status"
                defaultValue="to_contact"
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', cursor: 'pointer', boxSizing: 'border-box' }}
              >
                <option value="to_contact">To Contact</option>
                <option value="contacted">Contacted</option>
                <option value="replied">Replied</option>
                <option value="in_discussion">In Discussion</option>
                <option value="declined">Declined</option>
              </select>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Last Contact Date
                </label>
                <input
                  name="last_contact_date"
                  type="date"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                  Next Follow-Up Date
                </label>
                <input
                  name="next_followup_date"
                  type="date"
                  style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            {/* Notes */}
            <div>
              <label style={{ display: 'block', fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '6px' }}>
                Notes
              </label>
              <textarea
                name="notes"
                rows={3}
                placeholder="Any relevant context, intro message draft, etc."
                style={{ width: '100%', padding: '8px 12px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.875rem', backgroundColor: 'var(--color-surface)', color: 'var(--color-text-primary)', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
              />
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
              <button
                type="submit"
                style={{ padding: '9px 20px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: 'pointer' }}
              >
                Add Company
              </button>
              <Link
                href="/outreach"
                style={{ padding: '9px 16px', border: '1px solid var(--color-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--color-text-secondary)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center' }}
              >
                Cancel
              </Link>
            </div>
          </div>
        </form>
      </SectionCard>
    </div>
  )
}
