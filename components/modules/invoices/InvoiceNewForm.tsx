'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { Plus, Trash2, Loader2 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { PaymentAccount } from '@/types/database'

interface Client { id: string; client_name: string; client_code: string }
interface Project { id: string; name: string; project_code: string; client_id: string | null }

interface LineItem {
  description: string
  qty: number
  unit_price: number
}

interface InvoiceNewFormProps {
  clients: Client[]
  projects: Project[]
  accounts: PaymentAccount[]
  fxRate: number
  createInvoice: (formData: FormData) => Promise<{ id: string } | null>
}

export function InvoiceNewForm({ clients, projects, accounts, fxRate, createInvoice }: InvoiceNewFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [currency, setCurrency] = useState('USD')
  const [gross, setGross] = useState('')
  const [platformPct, setPlatformPct] = useState('')
  const [gatewayPct, setGatewayPct] = useState('')
  const [lineItems, setLineItems] = useState<LineItem[]>([{ description: '', qty: 1, unit_price: 0 }])
  const [selectedClientId, setSelectedClientId] = useState('')

  const yyyymm = `${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}`
  const invoiceCodePlaceholder = `Kosongkan untuk auto-generate (INV-${yyyymm}-001)`

  // Fee calculations
  const grossNum = parseFloat(gross) || 0
  const platformFee = grossNum * (parseFloat(platformPct) || 0) / 100
  const gatewayFee = (grossNum - platformFee) * (parseFloat(gatewayPct) || 0) / 100
  const netAmount = grossNum - platformFee - gatewayFee

  // Filter projects by client
  const filteredProjects = selectedClientId
    ? projects.filter(p => p.client_id === selectedClientId)
    : projects

  function addLineItem() {
    setLineItems(prev => [...prev, { description: '', qty: 1, unit_price: 0 }])
  }

  function removeLineItem(i: number) {
    setLineItems(prev => prev.filter((_, idx) => idx !== i))
  }

  function updateLineItem(i: number, field: keyof LineItem, value: string | number) {
    setLineItems(prev => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const form = e.currentTarget
    const formData = new FormData(form)

    // Inject line items as JSON
    const validItems = lineItems.filter(li => li.description.trim())
    formData.set('line_items', JSON.stringify(validItems))

    setError(null)
    startTransition(async () => {
      try {
        const result = await createInvoice(formData)
        if (result) {
          router.push(`/finance/invoices/${result.id}`)
        } else {
          router.push('/finance/invoices')
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      }
    })
  }

  const fieldStyle = {
    width: '100%',
    padding: '8px 12px',
    border: '1px solid var(--input-border)',
    borderRadius: 'var(--radius-control)',
    fontSize: '0.875rem',
    color: 'var(--text-primary-neutral)',
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  const optionalFieldStyle = {
    ...fieldStyle,
    backgroundColor: 'var(--surface-neutral)',
  }

  const labelStyle = {
    display: 'block',
    fontSize: '0.8125rem',
    fontWeight: 600,
    color: 'var(--text-primary-neutral)',
    marginBottom: '6px',
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div style={{ padding: '10px 14px', backgroundColor: 'var(--color-danger-subtle)', border: '1px solid var(--color-danger)', borderRadius: 'var(--radius-control)', color: 'var(--color-danger)', fontSize: '0.8125rem', marginBottom: '16px' }}>
          {error}
        </div>
      )}

      <div style={{ display: 'grid', gap: '20px', maxWidth: '700px' }}>

        {/* Client & Project */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Client <span style={{ color: 'var(--color-danger)' }}>*</span></label>
            <select name="client_id" required value={selectedClientId} onChange={e => { setSelectedClientId(e.target.value) }} style={fieldStyle}>
              <option value="">— Select client —</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.client_name} ({c.client_code})</option>)}
            </select>
          </div>
          <div>
            <label style={labelStyle}>Project (optional)</label>
            <select name="project_id" style={fieldStyle}>
              <option value="">— No project —</option>
              {filteredProjects.map(p => <option key={p.id} value={p.id}>{p.project_code} — {p.name}</option>)}
            </select>
          </div>
        </div>

        {/* Invoice code (optional — server generates INV-YYYYMM-NNN when blank) */}
        <div>
          <label style={labelStyle}>Invoice code</label>
          <input
            name="invoice_code"
            type="text"
            placeholder={invoiceCodePlaceholder}
            autoComplete="off"
            style={optionalFieldStyle}
          />
          <p style={{ fontSize: '0.6875rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
            Biarkan kosong agar kode dibuat otomatis
          </p>
        </div>

        {/* Dates */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={labelStyle}>Issue Date <span style={{ color: 'var(--brand-accent)' }}>*</span></label>
            <input name="issue_date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} style={fieldStyle} />
          </div>
          <div>
            <label style={labelStyle}>Due Date</label>
            <input name="due_date" type="date" style={fieldStyle} />
          </div>
        </div>

        {/* Amount section */}
        <div style={{ padding: '16px', backgroundColor: 'var(--surface-neutral)', borderRadius: 'var(--radius-card)', border: '1px solid var(--border-default)' }}>
          <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary-neutral)', marginBottom: '14px' }}>Amount & Fees</p>

          <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Currency</label>
              <select name="currency" value={currency} onChange={e => setCurrency(e.target.value)} style={fieldStyle}>
                <option value="USD">USD</option>
                <option value="IDR">IDR</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Gross Amount <span style={{ color: 'var(--brand-accent)' }}>*</span></label>
              <input
                name="gross_amount"
                type="number"
                min="0"
                step="0.01"
                required
                value={gross}
                onChange={e => setGross(e.target.value)}
                placeholder="0.00"
                style={fieldStyle}
              />
              {currency === 'USD' && grossNum > 0 && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted-neutral)', marginTop: '3px' }}>
                  ≈ {(grossNum * fxRate).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                </p>
              )}
            </div>
          </div>

          {/* Platform fee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
            <div>
              <label style={labelStyle}>Platform (Upwork/Fiverr)</label>
              <select name="platform_type" style={fieldStyle}>
                <option value="">None</option>
                <option value="upwork">Upwork</option>
                <option value="fiverr">Fiverr</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label style={labelStyle}>Platform Fee %</label>
              <input
                name="platform_fee_pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={platformPct}
                onChange={e => setPlatformPct(e.target.value)}
                placeholder="0"
                style={fieldStyle}
              />
              {platformFee > 0 && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: '3px' }}>
                  -{currency} {platformFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Gateway fee */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Gateway (PayPal/Wise)</label>
              <input
                name="gateway_type"
                placeholder="e.g. PayPal"
                style={fieldStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Gateway Fee %</label>
              <input
                name="gateway_fee_pct"
                type="number"
                min="0"
                max="100"
                step="0.01"
                value={gatewayPct}
                onChange={e => setGatewayPct(e.target.value)}
                placeholder="0"
                style={fieldStyle}
              />
              {gatewayFee > 0 && (
                <p style={{ fontSize: '0.6875rem', color: 'var(--color-danger)', marginTop: '3px' }}>
                  -{currency} {gatewayFee.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </p>
              )}
            </div>
          </div>

          {/* Net amount summary */}
          {grossNum > 0 && (
            <div style={{ padding: '10px 12px', backgroundColor: 'var(--surface-card)', borderRadius: 'var(--radius-control)', border: '1px solid var(--border-default)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--text-primary-neutral)' }}>Net Received</span>
                <div style={{ textAlign: 'right' }}>
                  <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-primary-neutral)' }}>
                    {currency} {netAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                  {currency === 'USD' && (
                    <p style={{ fontSize: '0.6875rem', color: 'var(--text-muted-neutral)', marginTop: '1px' }}>
                      ≈ {(netAmount * fxRate).toLocaleString('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 })}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Destination Account */}
        <div>
          <label style={labelStyle}>Payment Account</label>
          <select name="destination_account_id" style={fieldStyle}>
            <option value="">— Select account —</option>
            {accounts.map(a => (
              <option key={a.id} value={a.id}>{a.name} ({a.currency})</option>
            ))}
          </select>
        </div>

        {/* Status */}
        <div>
          <label style={labelStyle}>Status</label>
          <select name="status" defaultValue="draft" style={fieldStyle}>
            <option value="draft">Draft</option>
            <option value="sent">Sent</option>
          </select>
        </div>

        {/* Line Items */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '10px' }}>
            <label style={{ ...labelStyle, marginBottom: 0 }}>Line Items (optional)</label>
            <button
              type="button"
              onClick={addLineItem}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '0.8125rem', color: 'var(--color-primary)', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 500 }}
            >
              <Plus size={13} /> Add Item
            </button>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {lineItems.map((item, i) => (
              <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 72px 100px 28px', gap: '8px', alignItems: 'center' }}>
                <input
                  type="text"
                  placeholder="Description"
                  value={item.description}
                  onChange={e => updateLineItem(i, 'description', e.target.value)}
                  style={fieldStyle}
                />
                <input
                  type="number"
                  min="1"
                  step="1"
                  placeholder="Qty"
                  value={item.qty}
                  onChange={e => updateLineItem(i, 'qty', parseInt(e.target.value) || 1)}
                  style={fieldStyle}
                />
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Price"
                  value={item.unit_price || ''}
                  onChange={e => updateLineItem(i, 'unit_price', parseFloat(e.target.value) || 0)}
                  style={fieldStyle}
                />
                <button
                  type="button"
                  onClick={() => removeLineItem(i)}
                  style={{ width: 28, height: 36, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', border: 'none', background: 'none', cursor: 'pointer', color: 'var(--text-muted-neutral)' }}
                >
                  <Trash2 size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Notes */}
        <div>
          <label style={labelStyle}>Notes</label>
          <textarea
            name="notes"
            rows={2}
            placeholder="Internal notes about this invoice…"
            style={{ ...fieldStyle, resize: 'vertical' }}
          />
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: '10px', paddingTop: '4px' }}>
          <button
            type="submit"
            disabled={isPending}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '9px 20px', backgroundColor: 'var(--color-primary)', color: 'var(--color-primary-fg)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 600, border: 'none', cursor: isPending ? 'not-allowed' : 'pointer', opacity: isPending ? 0.7 : 1 }}
          >
            {isPending ? (
              <>
                <Loader2 size={14} className="animate-spin" aria-hidden />
                Creating…
              </>
            ) : (
              'Create Invoice'
            )}
          </button>
          <Link
            href="/finance/invoices"
            style={{ padding: '9px 16px', border: '1px solid var(--input-border)', borderRadius: 'var(--radius-control)', fontSize: '0.8125rem', fontWeight: 500, color: 'var(--text-secondary-neutral)', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', backgroundColor: 'var(--surface-card)' }}
          >
            Cancel
          </Link>
        </div>
      </div>
    </form>
  )
}
