# Implemented Changelog by Area

This changelog separates verified implementation from planning.  
Legend: **Implemented**, **Planned**, **Needs verification**.

## 1) Global Styling / Tokens
- **What changed (Implemented):**
  - Core shell/table/input/dashboard tokens consolidated in `app/globals.css`.
  - Added table tokens (`--table-header-bg`, `--table-border`, `--table-header-text`, edge paddings).
  - Added input tokens (`--input-bg`, `--input-bg-focus`, `--input-placeholder`).
  - Added dashboard spacing/neutral/placeholder tokens (`--dash-*` family).
  - Added `table-scroll-area` scrollbar styling and native table alignment helpers.
  - Explicit anti-muddy note in CSS comments regarding `#F4F4F1` family.
- **Why:** enforce cross-page consistency without rewriting domain logic.
- **Affected files:** `app/globals.css`.
- **Risk/follow-up:** Some legacy colors still exist outside dashboard/shared primitives; audit page-local hardcoded colors later.

## 2) Sidebar / Topbar / App Shell
- **What changed (Implemented):**
  - `ProtectedAppShell` controls `--sidebar-width` and persists collapse (`reka-sidebar-collapsed`) in localStorage.
  - Desktop expanded/collapsed widths use CSS vars (`--sidebar-expanded-width`, `--sidebar-collapsed-width`).
  - Mobile drawer keeps full label IA via `MobileSidebar` + `SidebarContent`.
  - Sidebar IA grouped into Home/My Workspace/Commercial/Operations/People/Finance/Admin.
  - Finance accordion rows are full-row clickable (`button` + full trigger class).
  - `Coming Soon` rows are disabled/muted and non-routing.
  - Topbar shell is neutral with border + tokenized background.
  - Topbar search uses neutral input styling and fixed width behavior.
  - Notification button normalized to 40x40 control.
  - Breadcrumb labels include Finance > Revenue > Invoices and Finance > Expenses > Payroll > Compensation/Payslips paths.
- **Why:** improve information architecture, scannability, and shell cohesion.
- **Affected files:** `components/layout/ProtectedAppShell.tsx`, `AppSidebar.tsx`, `MobileSidebar.tsx`, `AppTopbar.tsx`, `TopbarSearch.tsx`, `BreadcrumbNav.tsx`, `NotificationsBell.tsx`.
- **Risk/follow-up:** Confirm edge-role behavior for dashboard labels and isolated freelancer flow after further IA changes.

## 3) Logo
- **What changed (Implemented):**
  - Sidebar uses mark variant and shared mark height constant for consistency.
  - Collapsed rail shows mark; hover/focus swaps visual affordance to expand icon.
  - Logo asset mapping centralized in `RekaLogotype.tsx`.
- **Why:** prevent expanded/collapsed logo drift and avoid re-drawn text logos.
- **Affected files:** `components/layout/RekaLogotype.tsx`, `components/layout/AppSidebar.tsx`.
- **Risk/follow-up:** Verify final exported brand assets remain unchanged in `public/brand/*`.

## 4) Tables
- **What changed (Implemented):**
  - `components/ui/table.tsx` now uses tokenized header/background/border/text.
  - Global shadcn table edge padding alignment applied in CSS.
  - Native table utility classes `table-edge-align` and `table-edge-align--contained` added and used widely.
  - Pagination/footer neutralization in `components/shared/Pagination.tsx`.
  - `Showing X-Y of Z` area now aligns with table header neutral shell.
  - Settings tables normalized toward shared table shell.
  - Dashboard tables and strips aligned with shared TH/TD classes + edge alignment.
- **Why:** eliminate per-page spacing drift and align card/table title edges.
- **Affected files (representative):**
  - `components/ui/table.tsx`
  - `app/globals.css`
  - `components/shared/Pagination.tsx`
  - `components/modules/settings/SettingsFileNamingClient.tsx`
  - `app/(protected)/settings/page.tsx`
  - Multiple dashboard/finance/project/client/team detail tables using `table-edge-align`
- **Risk/follow-up:** Some raw/non-shadcn tables may still need final alignment pass (**Needs verification**).

## 5) Inputs / Form Visual Tokens
- **What changed (Implemented):**
  - Global input tokens and placeholder styling in `app/globals.css`.
  - Autofill override to avoid browser default yellow/blue fill.
  - `Input`, `Textarea`, `SelectTrigger` use tokenized bg/focus/placeholder.
  - `FilterBar`, `TopbarSearch`, and `MoneyInput` migrated to the same token language.
  - Inline-form style pass appears in:
    - `components/modules/invoices/InvoiceNewForm.tsx`
    - `components/modules/invoices/RecordPaymentForm.tsx`
    - `components/modules/files/FileForm.tsx`
    - `components/modules/compensation/CompensationForm.tsx`
    - `components/modules/payments/PaymentForm.tsx`
    - `components/modules/tasks/TaskForm.tsx`
    - `components/modules/onboarding/ProfileCompletionForm.tsx`
    - `components/modules/projects/ProjectForm.tsx`
    - `components/modules/onboarding/ActivateForm.tsx`
- **Why:** unify control readability and focus behavior across modules.
- **Logic impact:** none intended; visual/token-only.
- **Risk/follow-up:** verify remaining domain forms not listed above.

## 6) Cards / Layout
- **What changed (Implemented):**
  - `SectionCard` header/content padding aligned to table edge token rhythm.
  - `DashboardSection` uses consistent header/body spacing + border/shadow structure.
  - Empty-state wrappers in dashboard sections now balanced around divider/body spacing.
- **Why:** align card rhythm and reduce uneven visual density.
- **Affected files:** `components/shared/SectionCard.tsx`, `components/modules/dashboard/dashboard-shared.tsx`, `components/shared/EmptyState.tsx`.
- **Risk/follow-up:** Some role dashboards still mix `Card` and `DashboardSection` patterns.

## 6A) Card & Shadow System

### Implemented (Repo-Verified)
- Shadow tokens exist in `app/globals.css`:
  - `--shadow-card`
  - `--shadow-card-hover`
  - `--shadow-sm`
  - `--shadow-md`
- `SectionCard` and dashboard section surfaces use tokenized border/radius/shadow direction.
- KPI cards use restrained elevation and hover-lift pattern through shared `KpiCard`/global classes.
- Table containers in key modules are normalized to card-like neutral shells.
- Empty states are presented in neutral compact card blocks in dashboard contexts.

### Recommended / Planned (Not fully implemented yet)
- Standardize one clear card-elevation hierarchy across all modules (base/elevated/KPI/table/empty).
- Remove remaining per-page shadow drift where mixed section systems still coexist.
- Complete dashboard B2 KPI card compactness correction:
  - reduce height to ~7-7.5rem
  - emphasize value
  - trim helper copy
  - ensure 4-card rows fill width cleanly.

### Anti-patterns to avoid
- Heavy/deep shadows that dominate content.
- Layered nested shadows in card-inside-card layouts.
- Mixed ad hoc shadow styles where shared tokens already exist.
- Muddy dashboard surfaces (`#F4F4F1` hard avoid).
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.

## 7) Dashboard Phase A
- **What changed (Implemented, mostly):**
  - Dashboard spacing tokens and section/card gap rules.
  - Greeting pattern `Hello, <FirstName>!`.
  - KPI band and shared `KpiCard` value-first style.
  - Chart footer neutralization and compact chart spacing helpers.
  - Compact neutral empty states for queues/feeds/cards.
  - Recent activity/upcoming deadline wrappers normalized.
- **Affected files:** `components/modules/dashboard/dashboard-shared.tsx`, `components/shared/KpiCard.tsx`, role dashboard components, chart modules.
- **Risk/follow-up:** role-specific visual parity still needs QA.

## 8) Dashboard Phase B / B2
- **What changed (Implemented):**
  - Owner/PM tab shell exists with five tabs.
  - Commercial tab and shared commercial panel component implemented.
  - Overview/Projects/Resources/Finance tab content structures implemented for Direktur/Manajer.
  - Placeholders enforce no fake GP/cashflow/target in many sections.
  - `getBDDashboardData` wired into Direktur and Manajer dashboard payloads.
- **What is still pending (Planned / Needs verification):**
  - Final B2 compactness polish and KPI card final heights/copy density.
  - Full role-parity visual treatment, especially TD vs Owner/PM shell consistency.
  - Final “desktop minimal scroll” goal across all tab combinations.
- **Affected files:** `DashboardOwnerPmTabs.tsx`, `DashboardCommercialPanels.tsx`, `DashboardDirektur.tsx`, `DashboardManajer.tsx`, `lib/dashboard/direktur-queries.ts`, `lib/dashboard/manajer-queries.ts`.

## 9) Settings
- **What changed (Implemented):**
  - System options and file naming tables moved toward normalized table/card shell.
  - `SettingsFileNamingClient` uses table/card visual consistency.
  - `SettingsLanguagePlaceholder` neutralized shell.
  - Finance tools section and Drive root panel use neutral card wrappers.
  - Sidebar includes Admin > User Access as `Soon`.
- **What remains planned:**
  - Full settings redesign IA (left category list + right detail pane) is not fully implemented.
- **Affected files:** `app/(protected)/settings/page.tsx`, `components/modules/settings/SettingsFileNamingClient.tsx`, `SettingsLanguagePlaceholder.tsx`.

## 10) Finance / Dashboard Data
- **What changed (Implemented):**
  - `getBDDashboardData` is included in Direktur and Manajer dashboard payloads.
  - Finance placeholders explicitly prevent fake GP/cashflow displays.
  - Sidebar marks Payslips as `Soon`.
- **Why:** broaden dashboard context without inventing unreliable finance metrics.
- **Affected files:** `lib/dashboard/direktur-queries.ts`, `lib/dashboard/manajer-queries.ts`, dashboard modules, `AppSidebar.tsx`.
- **Risk/follow-up:** finance definitions still require formal sign-off (revenue basis, receivables basis, outstanding talent payments).

## 11) Forms / Dialogs
- **Implemented:**
  - Visual form/input token alignment in shared and module-level forms.
- **Planned / not yet implemented:**
  - Reusable global dialog-form system.
  - People pilot dialog workflows.
  - Project detail in-place field editing framework.
- **Risk/follow-up:** keep current page-based fallbacks while introducing future dialog pilot.

## 12) Known Unresolved Issues
- Dashboard B2 still under ongoing visual refinement.
- KPI sizing/copy width and no-scroll targets need final QA confirmation.
- Role-branch visual consistency still uneven in some dashboard modules.
- Data definition contracts (finance + some project metrics) pending.
- Forms/dialog global system not yet implemented.
- Settings redesign not yet implemented.

## 13) Do Not Touch Without Approval
- Auth/permission/routing policy files (including role gates and mutation authorization helpers).
- Server query/action contracts and finance calculation definitions.
- Database schema assumptions for finance/project metrics without explicit sign-off.
- Deprecated/backward-compat permission aliases unless all call-sites are migrated and approved.
