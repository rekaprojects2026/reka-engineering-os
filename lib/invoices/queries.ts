import { createServerClient } from '@/lib/supabase/server'
import type { ClientInvoice, InvoiceLineItem, IncomingPayment } from '@/types/database'

export type InvoiceWithRelations = ClientInvoice & {
  projects: { name: string; project_code: string } | null
  clients: { client_name: string; client_code: string } | null
  payment_accounts: { name: string; currency: string } | null
  line_items?: InvoiceLineItem[]
  incoming_payments?: IncomingPayment[]
  total_received?: number
}

interface GetInvoicesOptions {
  search?: string
  status?: string
  project_id?: string
  client_id?: string
}

export async function getInvoices(opts: GetInvoicesOptions = {}): Promise<InvoiceWithRelations[]> {
  const supabase = await createServerClient()
  let query = supabase
    .from('client_invoices')
    .select(`
      *,
      projects(name, project_code),
      clients(client_name, client_code),
      payment_accounts(name, currency)
    `)
    .order('created_at', { ascending: false })

  if (opts.search) {
    query = query.or(`invoice_code.ilike.%${opts.search}%`)
  }
  if (opts.status) query = query.eq('status', opts.status)
  if (opts.project_id) query = query.eq('project_id', opts.project_id)
  if (opts.client_id) query = query.eq('client_id', opts.client_id)

  const { data } = await query
  return (data as InvoiceWithRelations[]) ?? []
}

export async function getInvoiceById(id: string): Promise<InvoiceWithRelations | null> {
  const supabase = await createServerClient()

  const [invoiceRes, lineItemsRes, paymentsRes] = await Promise.all([
    supabase
      .from('client_invoices')
      .select(`
        *,
        projects(name, project_code),
        clients(client_name, client_code),
        payment_accounts(name, currency)
      `)
      .eq('id', id)
      .single(),
    supabase
      .from('invoice_line_items')
      .select('*')
      .eq('invoice_id', id)
      .order('sort_order'),
    supabase
      .from('incoming_payments')
      .select('*')
      .eq('invoice_id', id)
      .order('payment_date', { ascending: false }),
  ])

  if (!invoiceRes.data) return null

  const totalReceived = (paymentsRes.data ?? []).reduce(
    (sum, p) => sum + (p.amount_received ?? 0),
    0
  )

  return {
    ...(invoiceRes.data as InvoiceWithRelations),
    line_items: lineItemsRes.data ?? [],
    incoming_payments: paymentsRes.data ?? [],
    total_received: totalReceived,
  }
}

export async function getInvoiceSummary() {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('client_invoices')
    .select('status, gross_amount, net_amount, currency')

  if (!data) return { totalGross: 0, totalNet: 0, outstanding: 0, paid: 0, byStatus: {} }

  const byStatus: Record<string, number> = {}
  let totalGross = 0
  let totalNet = 0
  let outstanding = 0
  let paid = 0

  for (const inv of data) {
    byStatus[inv.status] = (byStatus[inv.status] ?? 0) + 1
    if (inv.status !== 'void') {
      totalGross += inv.gross_amount ?? 0
      totalNet += inv.net_amount ?? 0
    }
    if (['sent', 'partial', 'overdue'].includes(inv.status)) {
      outstanding += inv.net_amount ?? 0
    }
    if (inv.status === 'paid') {
      paid += inv.net_amount ?? 0
    }
  }

  return { totalGross, totalNet, outstanding, paid, byStatus }
}

/** Next sequential code for the current calendar month: INV-YYYYMM-NNN (3 digits). */
export async function generateNextInvoiceCode(): Promise<string> {
  const supabase = await createServerClient()
  const now = new Date()
  const yyyymm = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`
  const prefix = `INV-${yyyymm}-`

  const { data, error } = await supabase
    .from('client_invoices')
    .select('invoice_code')
    .like('invoice_code', `${prefix}%`)

  if (error) throw new Error(error.message)

  let maxSeq = 0
  for (const row of data ?? []) {
    const code = row.invoice_code as string
    if (!code?.startsWith(prefix)) continue
    const seq = parseInt(code.slice(prefix.length), 10)
    if (!Number.isNaN(seq)) maxSeq = Math.max(maxSeq, seq)
  }

  return `${prefix}${String(maxSeq + 1).padStart(3, '0')}`
}

export async function isInvoiceCodeTaken(code: string): Promise<boolean> {
  const supabase = await createServerClient()
  const { data } = await supabase.from('client_invoices').select('id').eq('invoice_code', code).maybeSingle()
  return !!data
}

/** Revenue per client — sum of net_amount from paid/partial invoices */
export async function getRevenueByClient(): Promise<Record<string, { total_gross: number; total_net: number; currency: string; invoice_count: number }>> {
  const supabase = await createServerClient()
  const { data } = await supabase
    .from('client_invoices')
    .select('client_id, gross_amount, net_amount, currency, status')
    .in('status', ['paid', 'partial'])

  if (!data) return {}

  const result: Record<string, { total_gross: number; total_net: number; currency: string; invoice_count: number }> = {}
  for (const inv of data) {
    if (!inv.client_id) continue
    if (!result[inv.client_id]) {
      result[inv.client_id] = { total_gross: 0, total_net: 0, currency: inv.currency, invoice_count: 0 }
    }
    result[inv.client_id].total_gross += inv.gross_amount ?? 0
    result[inv.client_id].total_net += inv.net_amount ?? 0
    result[inv.client_id].invoice_count++
  }
  return result
}
