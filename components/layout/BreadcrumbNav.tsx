'use client'

import { usePathname } from 'next/navigation'

// ── Module labels (first path segment) ──────────────────────────────────────

const MODULE_LABELS: Record<string, string> = {
  dashboard:       'Dashboard',
  clients:         'Clients',
  intakes:         'Intakes',
  projects:        'Projects',
  tasks:           'Tasks',
  deliverables:    'Deliverables',
  files:           'Files',
  team:            'Team',
  compensation:    'Compensation',
  payments:        'Payments',
  'my-payments':   'My Payments',
  settings:        'Settings',
  search:          'Search',
  'my-profile':    'My Profile',
  onboarding:      'Onboarding',
  'access-denied': 'Access Denied',
}

// ── Sub-segment labels (second or third path segment) ───────────────────────

const SUB_LABELS: Record<string, string> = {
  new:      'New',
  edit:     'Edit',
  complete: 'Complete',
}

// ── Breadcrumb parser ────────────────────────────────────────────────────────

interface Breadcrumb {
  module: string
  sub?:   string
}

function parseBreadcrumb(pathname: string): Breadcrumb {
  const segments = pathname.split('/').filter(Boolean)
  const module   = MODULE_LABELS[segments[0] ?? ''] ?? ''

  if (!module || segments.length < 2) return { module }

  const seg2 = segments[1]  // 'new' | UUID | known sub
  const seg3 = segments[2]  // 'edit' | undefined

  // Segment 3 wins — /[module]/[id]/edit → "Edit"
  if (seg3 && SUB_LABELS[seg3]) return { module, sub: SUB_LABELS[seg3] }

  // Segment 2 is a known keyword — /[module]/new, /[module]/complete
  if (SUB_LABELS[seg2]) return { module, sub: SUB_LABELS[seg2] }

  // Segment 2 is anything else (UUID / ID) — treat as detail page
  return { module, sub: 'Detail' }
}

// ── Component ────────────────────────────────────────────────────────────────

export function BreadcrumbNav() {
  const pathname        = usePathname()
  const { module, sub } = parseBreadcrumb(pathname)

  if (!module) return null

  return (
    <nav aria-label="Current section" className="flex min-h-[1.375rem] items-center gap-2.5 sm:gap-3">
      {sub ? (
        <span className="max-w-[min(100%,240px)] truncate text-[0.9375rem] font-medium leading-snug text-[var(--text-muted-neutral)] sm:max-w-[280px]">
          {module}
        </span>
      ) : (
        <span className="max-w-[min(100%,280px)] truncate text-[0.9375rem] font-semibold leading-snug text-[var(--text-primary-neutral)] sm:max-w-[320px]">
          {module}
        </span>
      )}

      {sub && (
        <>
          <span
            aria-hidden="true"
            className="select-none px-0.5 text-[0.8125rem] font-normal leading-none text-[var(--text-soft-muted)]"
          >
            /
          </span>
          <span className="max-w-[min(100%,240px)] truncate text-[0.9375rem] font-semibold leading-snug text-[var(--text-primary-neutral)] sm:max-w-[280px]">
            {sub}
          </span>
        </>
      )}
    </nav>
  )
}
