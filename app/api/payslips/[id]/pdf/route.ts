import { renderToBuffer } from '@react-pdf/renderer'
import { NextResponse } from 'next/server'
import { createElement } from 'react'
import { isDirektur, isFinance } from '@/lib/auth/permissions'
import { PayslipPDF } from '@/lib/pdf/payslip-template'
import { getPayslipById } from '@/lib/payslips/queries'
import { createServerClient } from '@/lib/supabase/server'
import type { SystemRole } from '@/types/database'

function slugMember(s: string): string {
  const t = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return t || 'member'
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await context.params
  const payslip = await getPayslipById(id)
  if (!payslip) {
    return NextResponse.json({ error: 'Payslip not found' }, { status: 404 })
  }

  const { data: prof } = await supabase.from('profiles').select('system_role').eq('id', user.id).maybeSingle()
  const role = (prof?.system_role as SystemRole | null) ?? null
  const canFinance = isDirektur(role) || isFinance(role)
  const isOwn = payslip.profile_id === user.id
  if (!canFinance && !isOwn) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const buffer = await renderToBuffer(
    createElement(PayslipPDF, { payslip }) as Parameters<typeof renderToBuffer>[0],
  )
  const ym = `${payslip.period_year}${String(payslip.period_month).padStart(2, '0')}`
  const name = slugMember(payslip.profile?.full_name ?? 'member')
  const filename = `payslip-${ym}-${name}.pdf`

  return new NextResponse(new Uint8Array(buffer), {
    status: 200,
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${filename}"`,
      'Cache-Control': 'private, no-cache',
    },
  })
}
