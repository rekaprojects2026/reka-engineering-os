# Sidebar / Topbar / Logo Handoff

## 1) Sidebar Final IA

HOME
- Dashboard

MY WORKSPACE
- Assigned Tasks [Soon]
- Earnings

COMMERCIAL
- Leads
- Outreach
- Clients
- Contracts [Soon]

OPERATIONS
- Projects
- Tasks

PEOPLE
- People & Partners
- Talent Pool [Soon]

FINANCE
- Revenue
  - Invoices
  - Receivables [Soon]
- Expenses
  - Operating Expenses [Soon]
  - Payroll
    - Compensation
    - Payslips [Soon]

ADMIN
- Settings
- User Access [Soon]

## 2) Sidebar Behavior
- **Implemented:**
  - Expanded desktop by default.
  - Collapsible desktop sidebar.
  - Collapse state persisted in localStorage (`reka-sidebar-collapsed`).
  - CSS var-based width switching (`--sidebar-width`).
  - Mobile drawer preserves full labels and grouped IA.
  - Collapsed rail shows REKA mark and expand affordance on hover/focus.
- **Planned / needs verification:**
  - Additional collapsed anti-noise refinements beyond current mark+toggle behavior.
- Collapsed sidebar should not render the full nav icon rail unless intentionally re-enabled. Current desired direction is low-noise: REKA mark + open-sidebar affordance.

## 3) Coming Soon
- Implemented as disabled, muted, visible rows.
- Present in expanded + mobile drawer contexts.
- Not active and not navigable.

## 4) Finance Accordion
- Revenue/Expenses/Payroll are full-row clickable accordion triggers.
- Parent groups are controls, not routes.
- Child links remain standard links where routes exist.
- No nested anchor-in-anchor interaction pattern used.

## 5) Active State
- Active state is neutralized (`sidebar-active-bg` neutral) rather than heavy red.
- Ancestor groups use open-state/expanded behavior with neutral styling.

## 6) Logo Behavior
- Asset path mapping centralized in `components/layout/RekaLogotype.tsx`.
- Sidebar currently uses mark variant for expanded and collapsed header usage.
- Shared height constant used for consistency.
- No text recreation in component; renders brand assets directly.
- Collapsed mode hover/focus exposes expand control while keeping mark default.

## 7) Topbar Changes
- Sticky topbar with neutral border and shell background.
- Breadcrumb routing labels include Finance hierarchy details (Revenue/Payroll/Compensation/Payslips).
- Desktop search uses tokenized neutral input and stable width.
- Notification control uses normalized tokenized icon button shell.
- Mobile uses menu trigger + sheet-based sidebar pattern.

## 8) Known Issues / QA
- Confirm breadcrumb fallback coverage on less-common routes.
- Verify role-specific nav visibility for isolated and restricted roles after future IA updates.
- Re-test collapsed rail behavior for keyboard-only users on all major browsers.
- Validate icon/text truncation for long labels at narrow desktop widths.
