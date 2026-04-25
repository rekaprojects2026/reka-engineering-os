import { describe, expect, it } from 'vitest'
import {
  canAccessCompensation,
  canAccessExpenses,
  canAccessWorkLogs,
  canProposeCompensation,
  canAccessTeam,
  canViewTeamAvailability,
  effectiveRole,
  getNavPermissions,
  isBD,
  isFinance,
  isFreelancer,
  isManagement,
  isManajer,
  isMember,
  isOpsLead,
  isPersonalOnly,
  isSenior,
  isTD,
} from './permissions'

describe('permissions predicates', () => {
  it('isManagement', () => {
    expect(isManagement('direktur')).toBe(true)
    expect(isManagement('technical_director')).toBe(true)
    expect(isManagement('finance')).toBe(true)
    expect(isManagement('manajer')).toBe(false)
  })

  it('isManajer', () => {
    expect(isManajer('manajer')).toBe(true)
    expect(isManajer('technical_director')).toBe(false)
  })

  it('isFreelancer', () => {
    expect(isFreelancer('freelancer')).toBe(true)
    expect(isFreelancer('member')).toBe(false)
  })

  it('effectiveRole falls back to member', () => {
    expect(effectiveRole(null)).toBe('member')
    expect(effectiveRole(undefined)).toBe('member')
  })

  it('isTD and isFinance', () => {
    expect(isTD('technical_director')).toBe(true)
    expect(isTD('manajer')).toBe(false)
    expect(isFinance('finance')).toBe(true)
    expect(isFinance('direktur')).toBe(false)
  })

  it('isOpsLead and canProposeCompensation', () => {
    expect(isOpsLead('technical_director')).toBe(true)
    expect(isOpsLead('manajer')).toBe(true)
    expect(isOpsLead('finance')).toBe(false)
    expect(canProposeCompensation('manajer')).toBe(true)
    expect(canProposeCompensation('direktur')).toBe(false)
  })

  it('isPersonalOnly and role singles', () => {
    expect(isPersonalOnly('member')).toBe(true)
    expect(isPersonalOnly('freelancer')).toBe(true)
    expect(isPersonalOnly('senior')).toBe(true)
    expect(isPersonalOnly('manajer')).toBe(false)
    expect(isMember('member')).toBe(true)
    expect(isSenior('senior')).toBe(true)
    expect(isBD('bd')).toBe(true)
  })

  it('canAccessCompensation', () => {
    expect(canAccessCompensation('finance')).toBe(true)
    expect(canAccessCompensation('member')).toBe(false)
  })

  it('canAccessTeam and canViewTeamAvailability', () => {
    expect(canAccessTeam('technical_director')).toBe(true)
    expect(canAccessTeam('manajer')).toBe(false)
    expect(canViewTeamAvailability('manajer')).toBe(true)
    expect(canViewTeamAvailability('technical_director')).toBe(false)
  })

  it('getNavPermissions showTeam for manajer', () => {
    expect(getNavPermissions('manajer').showTeam).toBe(true)
    expect(getNavPermissions('bd').showTeam).toBe(false)
  })

  it('canAccessWorkLogs and showWorkLogs', () => {
    expect(canAccessWorkLogs('member')).toBe(true)
    expect(canAccessWorkLogs('freelancer')).toBe(true)
    expect(canAccessWorkLogs('technical_director')).toBe(true)
    expect(canAccessWorkLogs('finance')).toBe(true)
    expect(canAccessWorkLogs('manajer')).toBe(false)
    expect(getNavPermissions('member').showWorkLogs).toBe(true)
    expect(getNavPermissions('manajer').showWorkLogs).toBe(false)
  })

  it('canAccessExpenses excludes freelancer only', () => {
    expect(canAccessExpenses('freelancer')).toBe(false)
    expect(canAccessExpenses('member')).toBe(true)
    expect(canAccessExpenses('manajer')).toBe(true)
    expect(getNavPermissions('freelancer').showExpenses).toBe(false)
    expect(getNavPermissions('member').showExpenses).toBe(true)
  })
})
