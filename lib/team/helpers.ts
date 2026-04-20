export function buildProfilePayload(formData: FormData) {
  const rawRate = (v: string) => {
    const n = parseFloat(v)
    return isNaN(n) || v.trim() === '' ? null : n
  }

  return {
    full_name:           (formData.get('full_name') as string).trim(),
    phone:               (formData.get('phone') as string)?.trim()            || null,
    system_role:         (formData.get('system_role') as string)              || null,
    functional_role:     (formData.get('functional_role') as string)?.trim()  || null,
    discipline:          (formData.get('discipline') as string)               || null,
    worker_type:         (formData.get('worker_type') as string)              || null,
    active_status:       (formData.get('active_status') as string)            || 'active',
    availability_status: (formData.get('availability_status') as string)      || 'available',
    joined_date:         (formData.get('joined_date') as string)              || null,
    expected_rate:       rawRate(formData.get('expected_rate') as string),
    approved_rate:       rawRate(formData.get('approved_rate') as string),
    rate_type:           (formData.get('rate_type') as string)                || null,
    currency_code:       (formData.get('currency_code') as string)            || 'IDR',
    city:                (formData.get('city') as string)?.trim()             || null,
    portfolio_link:      (formData.get('portfolio_link') as string)?.trim()   || null,
    notes_internal:      (formData.get('notes_internal') as string)?.trim()   || null,
  }
}
