/**
 * lib/auth/permissions.ts
 * Pure role predicates and nav permissions.
 * Safe to import from BOTH server AND client components.
 * No side effects, no DB calls.
 */

import type { SystemRole } from '@/types/database'

// ── Fallback ─────────────────────────────────────────────────

export function effectiveRole(role: SystemRole | null | undefined): SystemRole {
  return role ?? 'member'
}

// ── Single-role predicates ───────────────────────────────────

export const isDirektur = (r?: SystemRole | null) => effectiveRole(r) === 'direktur'
export const isTD = (r?: SystemRole | null) => effectiveRole(r) === 'technical_director'
export const isFinance = (r?: SystemRole | null) => effectiveRole(r) === 'finance'
export const isManajer = (r?: SystemRole | null) => effectiveRole(r) === 'manajer'
export const isBD = (r?: SystemRole | null) => effectiveRole(r) === 'bd'
export const isSenior = (r?: SystemRole | null) => effectiveRole(r) === 'senior'
export const isMember = (r?: SystemRole | null) => effectiveRole(r) === 'member'
export const isFreelancer = (r?: SystemRole | null) => effectiveRole(r) === 'freelancer'

// ── Composite predicates ─────────────────────────────────────

/** Direktur + TD + Finance */
export const isManagement = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'finance'].includes(effectiveRole(r))

/** TD + Manajer — create & operate projects */
export const isOpsLead = (r?: SystemRole | null) =>
  ['technical_director', 'manajer'].includes(effectiveRole(r))

/** Direktur + TD — BAST / termin verification */
export const isBastSigner = (r?: SystemRole | null) =>
  ['direktur', 'technical_director'].includes(effectiveRole(r))

/** TD + Manajer — propose compensation */
export const canProposeCompensation = (r?: SystemRole | null) =>
  ['technical_director', 'manajer'].includes(effectiveRole(r))

/** Finance — operate finance modules */
export const canOperateFinance = (r?: SystemRole | null) => effectiveRole(r) === 'finance'

/** Direktur + Finance — approve void invoice / final payslip */
export const canApproveFinanceDocs = (r?: SystemRole | null) =>
  ['direktur', 'finance'].includes(effectiveRole(r))

/** Member + Freelancer + Senior */
export const isPersonalOnly = (r?: SystemRole | null) =>
  ['member', 'freelancer', 'senior'].includes(effectiveRole(r))

export const isIsolated = (r?: SystemRole | null) => effectiveRole(r) === 'freelancer'

// ── Module access predicates ─────────────────────────────────

export const canAccessInvoices = (r?: SystemRole | null) => isDirektur(r) || isFinance(r)
export const canAccessPayslips = (r?: SystemRole | null) => isDirektur(r) || isFinance(r)
export const canAccessCompensation = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'finance', 'manajer'].includes(effectiveRole(r))
export const canAccessTeam = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'finance'].includes(effectiveRole(r))

/** Manajer — can see team member availability only (no rates, no banking) */
export const canViewTeamAvailability = (r?: SystemRole | null) =>
  effectiveRole(r) === 'manajer'
export const canAccessSettings = (r?: SystemRole | null) =>
  isTD(r) || isDirektur(r)
export const canAccessClients = (r?: SystemRole | null) =>
  !['senior', 'member', 'freelancer'].includes(effectiveRole(r))
export const canAccessIntakes = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'manajer', 'bd'].includes(effectiveRole(r))
export const canAccessOutreach = (r?: SystemRole | null) => isBD(r)
export const canAccessOutreachReadOnly = (r?: SystemRole | null) =>
  ['direktur', 'technical_director'].includes(effectiveRole(r))
export const canAccessFxRates = (r?: SystemRole | null) => isDirektur(r) || isFinance(r)
export const canAccessPaymentAccounts = (r?: SystemRole | null) => isDirektur(r) || isFinance(r)

/** Member, freelancer, TD, direktur, finance — time logs & utilization visibility. */
export const canAccessWorkLogs = (r?: SystemRole | null) =>
  isMember(r) || isFreelancer(r) || isTD(r) || isDirektur(r) || isFinance(r)

/** Internal roles (exclude isolated freelancer) — project expenses. */
export const canAccessExpenses = (r?: SystemRole | null) => !isFreelancer(r)
export const canAccessLeads = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'manajer', 'bd'].includes(effectiveRole(r))

// ── Project-level permissions ────────────────────────────────

export const canCreateProject = (r?: SystemRole | null) => isOpsLead(r)
export const canApproveProject = (r?: SystemRole | null) => isDirektur(r)
export const canViewAllProjects = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'finance', 'manajer', 'bd'].includes(effectiveRole(r))

// ── Route helpers (used by client + server) ─────────────────

export function canAccessProjectsNewRoute(role: SystemRole | null | undefined): boolean {
  return isOpsLead(role)
}

export function canAccessTasksDeliverablesFilesNewRoute(role: SystemRole | null | undefined): boolean {
  return isManagement(role) || isOpsLead(role)
}

export function canShowFilesAddButton(role: SystemRole | null | undefined): boolean {
  return isManagement(role) || isOpsLead(role)
}

// ── Team visibility ─────────────────────────────────────────

export const canViewTeamRates = (r?: SystemRole | null) =>
  ['direktur', 'technical_director', 'finance'].includes(effectiveRole(r))

export const canInviteTeam = (r?: SystemRole | null) => isTD(r)

// ── Nav permissions ───────────────────────────────────────────

export type NavPermissions = {
  showClients: boolean
  showLeads: boolean
  showOutreach: boolean
  showTeam: boolean
  showCompensation: boolean
  showPayments: boolean
  showSettings: boolean
  showMyPayments: boolean
  showFinance: boolean
  showPaymentAccounts: boolean
  showFxRates: boolean
  showWorkLogs: boolean
  showExpenses: boolean
  showProjectsNav: boolean
  labelProjects: string
  labelTasks: string
  labelDashboard: string
  isPersonalDashboard: boolean
  isIsolatedFreelancer: boolean
}

export function getNavPermissions(role: SystemRole | null | undefined): NavPermissions {
  const r = effectiveRole(role)
  const personal = isPersonalOnly(role)
  const isolated = isIsolated(role)

  return {
    showClients: canAccessClients(role),
    showLeads: canAccessLeads(role),
    showOutreach: isBD(role) || isDirektur(role) || isTD(role),
    showTeam: canAccessTeam(role) || canViewTeamAvailability(role),
    showCompensation: canAccessCompensation(role),
    showPayments: isDirektur(role) || isFinance(role),
    showSettings: canAccessSettings(role),
    showMyPayments: true,
    showFinance: canAccessInvoices(role) || canAccessPayslips(role),
    showPaymentAccounts: canAccessPaymentAccounts(role),
    showFxRates: canAccessFxRates(role),
    showWorkLogs: canAccessWorkLogs(role),
    showExpenses: canAccessExpenses(role),
    showProjectsNav: !(isMember(role) || isFreelancer(role)),

    labelDashboard: personal ? 'My Dashboard' : 'Dashboard',
    labelProjects: isMember(role) ? 'My Projects' : 'Projects',
    labelTasks: isMember(role) || isFreelancer(role) ? 'My Tasks' : 'Tasks',

    isPersonalDashboard: personal,
    isIsolatedFreelancer: isolated,
  }
}

// ── Backward compat aliases ──────────────────────────────────

/** @deprecated Prefer isDirektur() or isManagement() */
export function isAdmin(role: SystemRole | null | undefined): boolean {
  return isManagement(role)
}

/** @deprecated Prefer isManajer(), isBD(), or isOpsLead() */
export function isCoordinator(role: SystemRole | null | undefined): boolean {
  return isManajer(role) || isBD(role)
}

/** @deprecated Prefer isSenior() */
export function isReviewer(role: SystemRole | null | undefined): boolean {
  return isSenior(role)
}

/** @deprecated Prefer isManagement() || isOpsLead() */
export function isAdminOrCoordinator(role: SystemRole | null | undefined): boolean {
  return isManagement(role) || isOpsLead(role)
}
