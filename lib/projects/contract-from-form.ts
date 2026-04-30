import type { ProjectSourceType } from '@/types/database'

/** Derive billing model from project source (must match Drive hierarchy). */
export function deriveSourceTypeFromSource(source: string): ProjectSourceType {
  const s = source.trim().toLowerCase()
  return s === 'fiverr' || s === 'upwork' ? 'PLATFORM' : 'DOMESTIC'
}

export function parseContractFromForm(formData: FormData): {
  source_type: ProjectSourceType
  contract_value: number | null
  contract_currency: string
  has_retention: boolean
  retention_percentage: number
} {
  const sourceRaw = ((formData.get('source') as string) || 'direct').trim()
  const source_type = deriveSourceTypeFromSource(sourceRaw)
  const rawAmount = (formData.get('contract_value') as string)?.trim()
  const amt = rawAmount ? parseFloat(rawAmount) : NaN
  const contract_currency = (formData.get('contract_currency') as string) || 'IDR'
  const has_retention =
    source_type === 'DOMESTIC' &&
    (formData.get('has_retention') === 'on' || formData.get('has_retention') === 'true')
  const rp = parseFloat((formData.get('retention_percentage') as string) || '5')
  const retention_percentage = has_retention ? Math.min(20, Math.max(5, Number.isFinite(rp) ? rp : 5)) : 5

  const contract_value =
    source_type === 'DOMESTIC' && Number.isFinite(amt) && amt > 0 ? amt : null

  return {
    source_type,
    contract_value: source_type === 'PLATFORM' ? null : contract_value,
    contract_currency: source_type === 'DOMESTIC' ? contract_currency : 'IDR',
    has_retention: source_type === 'DOMESTIC' ? has_retention : false,
    retention_percentage: source_type === 'DOMESTIC' ? retention_percentage : 5,
  }
}
