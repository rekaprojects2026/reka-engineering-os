# Stage 4 Layout Shell / Sidebar / Topbar / Logo Porting Plan (Plan Only)

## Status Context
- Implemented already:
  - Stage 1 global token foundation (`app/globals.css`).
- In progress separately:
  - Stage 2 UI primitives.
  - Stage 3 shared components.
- This document is planning-only for Stage 4 shell/navigation/logo visual and IA porting.

## Scope and Guardrails
- Scope:
  - App shell layout composition
  - Sidebar IA + styling + collapsed/mobile behavior
  - Topbar/breadcrumb/search/notification shell styling
  - Logo/brand asset usage consistency
- Hard rules:
  - preserve routes and auth/permission behavior
  - do not remove existing valid links
  - Coming Soon rows visible but disabled (not clickable)
  - no nested interactive controls
  - no `#F4F4F1`
  - planning only (no implementation in this stage)

## File Discovery Notes (Current Repo Reality)
- Requested but not present:
  - `components/layout/ProtectedAppShell.tsx` (not found)
  - `components/layout/RekaLogotype.tsx` (not found)
  - `public/brand/*` directory (not found)
- Equivalent current shell composition is in:
  - `app/(protected)/layout.tsx`
- Existing layout files inspected:
  - `components/layout/AppSidebar.tsx`
  - `components/layout/MobileSidebar.tsx`
  - `components/layout/AppTopbar.tsx`
  - `components/layout/BreadcrumbNav.tsx`
  - `components/layout/TopbarSearch.tsx`
  - `components/layout/NotificationsBell.tsx`

## 1) Current App Shell / Sidebar / Topbar / Logo State

### App Shell
- `app/(protected)/layout.tsx` composes:
  - desktop sidebar (`AppSidebar`)
  - mobile sidebar trigger/drawer (`MobileSidebar`)
  - topbar (`AppTopbar`) with breadcrumb + search + notifications
  - profile-incomplete banner
  - main content container with max width and spacing
- Sidebar offset uses `md:pl-[var(--sidebar-width)]`, so width token is structurally important.

### Sidebar (`AppSidebar.tsx`)
- Navigation built dynamically from `getNavPermissions(systemRole)`.
- Current group structure:
  - main/dashboard
  - operations
  - finance
  - people
  - admin
- Current item visibility is permission-driven and route-aware.
- Current style is dark sidebar token family (`--sidebar-bg`, etc.) and neutralized active bg.
- No explicit "Coming Soon" disabled rows yet in IA structure.
- No accordion finance parent rows yet (currently flat links).
- Logo in header currently text-based mark (`R`, `ReKa`) rendered inline, not asset-driven component.

### Mobile Sidebar (`MobileSidebar.tsx`)
- Uses `Sheet` + `SidebarContent`, preserving full labels.
- Navigation close-on-click via `onNavigate`.

### Topbar (`AppTopbar.tsx`)
- Sticky header with neutral border/background.
- Search shortcut link is styled as pill link to `/search`; can coexist with `TopbarSearch`.
- Notification bell integrated as action slot.

### Breadcrumb (`BreadcrumbNav.tsx`)
- Segment parsing by label maps; handles `new`, `edit`, and default `Detail`.
- No finance-specific hierarchy depth mapping beyond generic parser.

### Topbar Search (`TopbarSearch.tsx`)
- Functional keyboard shortcut (`/`) and submit behavior.
- Visual style currently uses legacy `--color-*` tokens; not fully aligned to Stage 1/2 neutral input tokens.

### Notifications (`NotificationsBell.tsx`)
- Functional dropdown + unread badge + mark-all-read.
- Visual style partly legacy token-based; shell is close but not fully normalized to neutral topbar language.

### Logo / Brand Assets
- No `RekaLogotype` component exists yet.
- No `public/brand` assets folder exists in this repo currently.
- Current sidebar "logo" is rendered text/initials inside `AppSidebar`.

## 2) Desired Final IA and Visual Behavior

### Final Sidebar IA Target
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

### Visual/Behavior Target
- Sidebar active state neutral (not heavy red).
- Coming Soon visible, muted, non-interactive.
- Finance parents are full-row clickable accordion controls.
- Collapsed sidebar low-noise:
  - default mark-only rail
  - no icon soup unless intentionally re-enabled
  - clear hover/focus affordance to expand/open
- Mobile drawer keeps full readable labels.
- Topbar:
  - neutral border/background shell
  - search aligned with input token system
  - clean breadcrumb labels
  - normalized notification button/dropdown shell
- Logo:
  - asset-based usage, no recreated text wordmark
  - consistent expanded/collapsed presentation

## 3) Existing Routes and Permissions to Preserve
- Permission source must stay unchanged:
  - `lib/auth/permissions.ts` (`getNavPermissions` and role predicates)
- Existing navigable routes currently used in sidebar must remain valid:
  - `/dashboard`
  - `/leads`, `/outreach`, `/clients`
  - `/projects`, `/tasks`, `/work-logs`, `/expenses`
  - `/finance/invoices`, `/compensation`, `/finance/payslips`, `/payments`, `/my-payments`
  - `/finance/fx-rates`, `/finance/payment-accounts`
  - `/team`, `/settings`, `/my-profile`
- Isolated freelancer behavior from `getNavPermissions` must remain intact.
- No changes to auth/session flow in `app/(protected)/layout.tsx` and logout flow in sidebar profile menu.

## 4) Exact Files Likely to Change (Implementation Stage)
- Primary expected edits:
  - `components/layout/AppSidebar.tsx`
  - `components/layout/MobileSidebar.tsx`
  - `components/layout/AppTopbar.tsx`
  - `components/layout/BreadcrumbNav.tsx`
  - `components/layout/TopbarSearch.tsx`
  - `components/layout/NotificationsBell.tsx`
  - `app/(protected)/layout.tsx` (only if shell extraction/composition cleanup needed)
  - `app/globals.css` (minimal token bridge aliases only if missing)
- Potential new files (if needed):
  - `components/layout/ProtectedAppShell.tsx` (optional extraction target)
  - `components/layout/RekaLogotype.tsx` (asset wrapper component)
- Brand assets:
  - `public/brand/*` only if real approved assets are provided/required.

## 5) Component/API Risks
- `AppSidebar` (high risk):
  - IA restructure can accidentally break route visibility or permission gates.
  - Accordion introduction can create nested interactive antipatterns if done incorrectly.
- `MobileSidebar` (medium risk):
  - Must keep drawer close behavior and full-label readability.
- `BreadcrumbNav` (medium risk):
  - Label map changes can cause incorrect/ambiguous breadcrumb output.
- `TopbarSearch` (low-medium risk):
  - Visual updates must not break shortcut, submit, and escape behavior.
- `NotificationsBell` (low-medium risk):
  - Visual refactor must not affect unread badge logic/realtime behavior.
- Logo component introduction (medium risk):
  - Missing assets can block implementation; need fallback-safe strategy.

## 6) What Must Not Be Overwritten
- Do not modify:
  - `lib/auth/permissions.ts` logic
  - existing route URLs
  - logout/session/profile fetch behavior
  - notification realtime hook behavior
- Do not turn Coming Soon items into clickable links.
- Do not remove existing valid links while introducing IA groups.
- Do not recreate brand wordmark text as fake logo if asset exists/is expected.
- Do not introduce `#F4F4F1`.

## 7) Acceptance Criteria (Stage 4 Execution)
- Sidebar IA matches target grouping and hierarchy while preserving existing valid routes.
- Role/permission-based visibility remains correct and unchanged logically.
- Coming Soon rows:
  - visible
  - disabled
  - non-clickable
- Finance section uses full-row clickable accordion parent controls without nested interactive violations.
- Collapsed desktop sidebar is low-noise with clear expand affordance and visible REKA mark.
- Mobile drawer shows full labels and remains navigable.
- Topbar/search/breadcrumb/notifications visually align to neutral token system.
- Logo rendering is asset-consistent in expanded and collapsed states.
- No auth/permission/route/business logic change.
- No `#F4F4F1`.

## 8) Build / Typecheck Plan
1. Implement Stage 4 in small batches:
   - shell composition
   - sidebar IA + disabled soon rows
   - topbar/search/breadcrumb/notification styling
   - logo integration
2. After each batch run:
   - `npm run build`
   - `npx tsc --noEmit`
3. Before finalizing:
   - search touched runtime files for `#F4F4F1`
   - verify no unauthorized files changed.

## 9) Manual QA Checklist

### Sidebar IA and Permissions
- For each role (direktur, technical_director, finance, manajer, bd, senior/member/freelancer):
  - visible sections and links match permission intent
  - no forbidden links appear
  - existing allowed links still work
- Coming Soon rows are visible and non-clickable.
- Active state is neutral and clearly visible.

### Finance Accordion
- Parent rows (`Revenue`, `Expenses`, `Payroll`) are full-row clickable controls.
- Child route links work where routes exist.
- No nested button-in-link or link-in-button patterns.

### Collapsed / Expanded / Mobile
- Expanded desktop: full labels and group structure readable.
- Collapsed desktop: low-noise mark + expand affordance; no icon soup overload.
- Keyboard focus for collapse/expand and nav rows is visible and logical.
- Mobile drawer keeps full labels and closes correctly after navigate.

### Topbar / Breadcrumb / Notifications
- Topbar shell is neutral (border/bg) and visually stable.
- Search input aligns with input tokens and keeps keyboard behavior (`/`, escape, submit).
- Breadcrumb labels are accurate across key routes (including finance deep routes).
- Notification button/dropdown shells are normalized and still functional.

### Logo
- Expanded/collapsed logo treatment is consistent.
- Uses actual brand assets if available; no fake text wordmark recreation.

