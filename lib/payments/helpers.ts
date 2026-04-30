import { parsePaymentProofLink } from '@/lib/payments/proof-link'

export function moneyInt(n: number): number {
  return Math.round(Number.isFinite(n) ? n : 0)
}

export function derivePaymentStatus(
  total_due: number,
  total_paid: number,
): 'unpaid' | 'partial' | 'paid' {
  const due = moneyInt(total_due)
  const paid = moneyInt(total_paid)
  if (due <= 0) {
    if (paid <= 0) return 'paid'
    return 'partial'
  }
  if (paid >= due) return 'paid'
  if (paid > 0) return 'partial'
  return 'unpaid'
}

export type PaymentPayload = {
  member_id: string
  period_label: string | null
  total_due: number
  total_paid: number
  balance: number
  currency_code: string
  payment_status: 'unpaid' | 'partial' | 'paid'
  payment_date: string | null
  payment_method: string | null
  payment_reference: string | null
  proof_link: string | null
  notes: string | null
}

export function buildPaymentPayload(
  formData: FormData,
): { ok: true; payload: PaymentPayload } | { ok: false; error: string } {
  const total_due = moneyInt(parseFloat(formData.get('total_due') as string) || 0)
  const total_paid = moneyInt(parseFloat(formData.get('total_paid') as string) || 0)
  const balance = moneyInt(total_due - total_paid)
  const payment_status = derivePaymentStatus(total_due, total_paid)

  const proofRaw = (formData.get('proof_link') as string)?.trim() || null
  const proofParsed = parsePaymentProofLink(proofRaw)
  if (!proofParsed.ok) return { ok: false, error: proofParsed.message }

  return {
    ok: true,
    payload: {
      member_id: formData.get('member_id') as string,
      period_label: (formData.get('period_label') as string)?.trim() || null,
      total_due,
      total_paid,
      balance,
      currency_code: (formData.get('currency_code') as string) || 'IDR',
      payment_status,
      payment_date: (formData.get('payment_date') as string) || null,
      payment_method: (formData.get('payment_method') as string)?.trim() || null,
      payment_reference: (formData.get('payment_reference') as string)?.trim() || null,
      proof_link: proofParsed.href,
      notes: (formData.get('notes') as string)?.trim() || null,
    },
  }
}
