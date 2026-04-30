import { describe, expect, it } from 'vitest'
import type { SessionProfile } from '@/lib/auth/session'
import { buildCompensationPayload, calcMoneyPercent, calcMoneyProduct } from './helpers'

const fakeProfile = {
  id: 'u1',
  full_name: 'Tester',
  email: 't@test.com',
  system_role: 'manajer',
  profile_completed_at: null,
  photo_url: null,
} satisfies SessionProfile

describe('calcMoneyProduct', () => {
  it('handles integer qty × rate', () => {
    expect(calcMoneyProduct(2, 500_000)).toBe(1_000_000)
  })

  it('handles decimal qty without floating-point error', () => {
    expect(calcMoneyProduct(0.3, 333_333)).toBe(100_000)
    expect(calcMoneyProduct(0.1, 10)).toBe(1)
    expect(calcMoneyProduct('0.1', '0.2')).toBe(0)
  })

  it('rounds half-up at 0.5', () => {
    expect(calcMoneyProduct(1, 100.5)).toBe(101)
    expect(calcMoneyProduct(1, 100.49)).toBe(100)
  })
})

describe('calcMoneyPercent', () => {
  it('10% of 1000', () => {
    expect(calcMoneyPercent(1000, 10)).toBe(100)
  })

  it('11% PPN', () => {
    expect(calcMoneyPercent(123_456, 11)).toBe(13_580)
  })
})

describe('buildCompensationPayload', () => {
  it('returns error when member_id missing', () => {
    const fd = new FormData()
    fd.set('project_id', 'p1')
    fd.set('qty', '1')
    fd.set('rate_amount', '100')
    fd.set('rate_type', 'hourly')
    const r = buildCompensationPayload(fd, fakeProfile)
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toMatch(/anggota/i)
  })

  it('returns error when project_id missing', () => {
    const fd = new FormData()
    fd.set('member_id', 'm1')
    fd.set('qty', '1')
    fd.set('rate_amount', '100')
    fd.set('rate_type', 'hourly')
    const r = buildCompensationPayload(fd, fakeProfile)
    expect(r.ok).toBe(false)
  })

  it('returns error when qty <= 0', () => {
    const fd = new FormData()
    fd.set('member_id', 'm1')
    fd.set('project_id', 'p1')
    fd.set('qty', '0')
    fd.set('rate_amount', '100')
    fd.set('rate_type', 'hourly')
    const r = buildCompensationPayload(fd, fakeProfile)
    expect(r.ok).toBe(false)
  })

  it('calculates subtotal with decimal qty correctly', () => {
    const fd = new FormData()
    fd.set('member_id', 'm1')
    fd.set('project_id', 'p1')
    fd.set('qty', '0.3')
    fd.set('rate_amount', '333333')
    fd.set('rate_type', 'hourly')
    const r = buildCompensationPayload(fd, fakeProfile)
    expect(r.ok).toBe(true)
    if (r.ok) expect(r.payload.subtotal_amount).toBe(100_000)
  })
})
