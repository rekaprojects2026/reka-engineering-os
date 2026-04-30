import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { createElement } from 'react'
import { canAccessInvoices } from '@/lib/auth/permissions'
import { getInvoiceById } from '@/lib/invoices/queries'
import { InvoicePDF } from '@/lib/pdf/invoice-template'
import { createServerClient } from '@/lib/supabase/server'
import type { SystemRole } from '@/types/database'

function safeFileSegment(s: string): string {
  return s.replace(/[^a-zA-Z0-9-_.]+/g, '_').replace(/_+/g, '_')
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: prof } = await supabase.from('profiles').select('system_role').eq('id', user.id).maybeSingle()
  const role = (prof?.system_role as SystemRole | null) ?? null
  if (!canAccessInvoices(role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const { id } = await context.params
  const invoice = await getInvoiceById(id)
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
  }

  const buffer = await renderToBuffer(
    createElement(InvoicePDF, { invoice }) as Parameters<typeof renderToBuffer>[0],
  )
  const code = safeFileSegment(invoice.invoice_code || id)

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="invoice-${code}.pdf"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
