# Stage 5C - Page-Level Visual Cleanup Breakdown (Execution Plan Only)

## Scope and Intent
- Stage 5C is a **visual-only page shell cleanup** after Stage 5A (form controls) and Stage 5B (table normalization batches).
- This document defines safe implementation batches for page-level consistency work.
- This stage explicitly **does not** redesign dashboard layout architecture.
- This is a planning artifact only; no runtime implementation is included here.

## Source References Used
- `docs/handoff/00_UI_UX_REFINEMENT_OVERVIEW.md`
- `docs/handoff/01_GLOBAL_UI_UX_DIRECTION.md`
- `docs/handoff/02_GLOBAL_COLOR_SYSTEM.md`
- `docs/handoff/03_IMPLEMENTED_CHANGELOG_BY_AREA.md`
- `docs/handoff/06_TABLE_INPUT_EMPTY_STATE_HANDOFF.md`
- `docs/handoff/STAGE_5_PAGE_LEVEL_VISUAL_CLEANUP_PLAN.md`
- `docs/handoff/STAGE_5B_TABLE_STYLE_AUDIT.md`
- `app/globals.css`

## Hard Constraints for All Stage 5C Implementation
- Visual-only changes.
- No route/auth/permission changes.
- No database/schema changes.
- No server action changes.
- No `lib/**/queries.ts` changes.
- No form submission/validation changes.
- No financial calculation changes.
- No task/status mutation behavior changes.
- No dashboard layout redesign.
- No button system changes.
- Keep current **blue button system** as approved default.
- Red only for destructive/danger actions.
- Existing approved sidebar active red accent is allowed.
- Do not introduce `#F4F4F1`.

---

## 1) Current Visual State Summary

### What Has Already Been Normalized
- Global visual tokens and spacing rhythm are in place in `app/globals.css` (tables, inputs, empty states, card shadow/radius system).
- Shared table/input primitives are standardized (`components/ui/table.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, `components/ui/select.tsx`).
- Stage 5B completed table normalization across settings, commercial, operations, people, finance, tasks/work logs, and dashboard table-only consistency.
- Dashboard shared table and empty-state baseline exists (`components/modules/dashboard/dashboard-shared.tsx` + role dashboards), with layout redesign explicitly deferred.
- Empty-state neutral style and compact usage patterns already exist but need page-level consistency pass.

### What Remains Visually Inconsistent
- Page-level shell rhythm still varies by module (header-to-filter spacing, card padding, section vertical cadence).
- Filter bars and page action strips have uneven spacing/density between list pages.
- Empty states are not consistently compact/neutral across all page shells after table/form passes.
- Detail pages (clients/projects/team/finance) still show mixed card shell treatments and section spacing.
- Some legacy inline surface/border utility usage remains at page level despite normalized primitives.

### Pages Likely Needing Page-Level Cleanup (Post 5A/5B)
- Settings/admin surfaces (`settings`, `settings/webhooks`, `settings/api-keys`, `settings/api-docs`).
- Commercial pages (`leads`, `outreach`, `clients`, `clients/[id]` + new/edit forms).
- Operations pages (`projects`, `projects/[id]`, `tasks`, `work-logs`, `deliverables`, `files`).
- People pages (`team`, `team/[id]`, team member forms/invite flows, compensation-linked detail sections).
- Finance shells (`finance/invoices`, `finance/payslips`, `payments`, `my-payments`, `compensation`, `finance/reports`, `finance/fx-rates`, `finance/payment-accounts`).
- Dashboard pages/modules for non-layout polish only.

---

## 2) Proposed Implementation Batches

## 5C-1 - Settings Page Layout Cleanup

### Target Files / Pages
- `app/(protected)/settings/page.tsx`
- `app/(protected)/settings/webhooks/page.tsx`
- `app/(protected)/settings/api-keys/page.tsx`
- `app/(protected)/settings/api-docs/page.tsx`
- `components/modules/settings/SettingsFileNamingClient.tsx`
- `components/modules/settings/WebhooksSettingsClient.tsx`
- `components/modules/settings/ApiKeysSettingsClient.tsx`

### Visual Issues to Fix
- Normalize page heading-to-content spacing and section grouping rhythm.
- Align card shell padding/border/shadow rhythm for settings blocks.
- Standardize filter/control strip spacing near settings tables/cards.
- Normalize empty-state container spacing for settings sections with no data.

### What Not to Touch
- API key/webhook behavior, credential handling, generation/revocation flows.
- Server actions, permission checks, route structure.
- Data contracts and settings mutation logic.

### Behavior Risk Level
- **Low to Medium** (mixed interactive admin actions; visual-only shell updates should remain safe).

### Acceptance Criteria
- Settings sections share consistent page/card spacing cadence.
- No behavior change on webhooks/API key actions.
- Empty/filter/card shells match global neutral patterns.
- Blue button system preserved; red remains destructive-only.

### Manual QA Checklist
- Verify all settings actions still trigger expected dialogs/forms.
- Verify API key and webhook list/action controls unchanged functionally.
- Verify empty sections are compact and visually neutral.
- Verify no `#F4F4F1` introduced.

### Suggested Commit Message
- `style(settings): normalize page shell spacing and card/filter rhythm`

### Split Smaller?
- **Yes, if needed:** split into `settings main + file naming` and `webhooks/api keys/api docs`.

---

## 5C-2 - Commercial Pages Cleanup

### Target Files / Pages
- `app/(protected)/leads/page.tsx`
- `app/(protected)/leads/[id]/page.tsx`
- `app/(protected)/outreach/page.tsx`
- `app/(protected)/clients/page.tsx`
- `app/(protected)/clients/[id]/page.tsx`
- `components/modules/clients/ClientForm.tsx`

### Visual Issues to Fix
- Normalize list-page shell spacing between title, filter bar, table/card containers.
- Align detail-card section spacing in client detail screens.
- Standardize action row spacing and empty-state shell consistency.
- Normalize form/detail card spacing without changing form behavior.

### What Not to Touch
- Lead/outreach/client workflow logic and status transitions.
- Query params, sorting/filter behavior, links, or mutation handlers.
- Form submission contracts and validation.

### Behavior Risk Level
- **Medium** (high navigation and action density, but mostly list/detail shell work).

### Acceptance Criteria
- Commercial pages show consistent page spacing and card shell rhythm.
- Empty states and filter bars look consistent across leads/outreach/clients.
- No behavior regression in list links, filters, and client actions.

### Manual QA Checklist
- Verify lead/outreach/client filters still map to same query behavior.
- Verify all row/detail links navigate exactly as before.
- Verify client form submit/edit flows remain unchanged.
- Verify default button style remains blue.

### Suggested Commit Message
- `style(commercial): align leads outreach clients page shell and empty/filter spacing`

### Split Smaller?
- **Yes (recommended):** split `leads/outreach` and `clients list/detail/forms`.

---

## 5C-3 - Operations / Project Pages Cleanup

### Target Files / Pages
- `app/(protected)/projects/page.tsx`
- `app/(protected)/projects/[id]/page.tsx`
- `app/(protected)/tasks/page.tsx`
- `app/(protected)/work-logs/page.tsx`
- `app/(protected)/deliverables/page.tsx`
- `app/(protected)/files/page.tsx`
- `components/modules/projects/ProjectTasksTable.tsx`
- `components/modules/projects/TerminTable.tsx`
- `components/modules/projects/ProjectsViewToggle.tsx`

### Visual Issues to Fix
- Normalize project list/detail section shell spacing and card rhythm.
- Align task/work-log page shell spacing around filter bars and list containers.
- Harmonize deliverables/files shell spacing to match page-level standard.
- Keep interaction-dense areas visually cleaner without changing structure.

### What Not to Touch
- Task/project/work-log mutation logic and permission rules.
- View mode toggling logic (list/kanban/workspace behavior).
- Inline edit/subform/status update behavior.
- Workspace architecture/redesign.

### Behavior Risk Level
- **High** (interaction-dense modules with many stateful actions).

### Acceptance Criteria
- Project/task/work-log/deliverable/file pages share consistent shell rhythm.
- No change to task/project status/action behavior.
- No workspace redesign or flow change.

### Manual QA Checklist
- Verify list/kanban toggles remain intact.
- Verify task status updates and assignment flows unchanged.
- Verify project detail actions and file/deliverable flows unchanged.
- Verify filter bars preserve existing parameter behavior.

### Suggested Commit Message
- `style(operations): normalize projects tasks worklogs and delivery page shells`

### Split Smaller?
- **Yes (strongly recommended):** split into `projects`, `tasks/work-logs`, and `deliverables/files`.

---

## 5C-4 - People / Team Pages Cleanup

### Target Files / Pages
- `app/(protected)/team/page.tsx`
- `app/(protected)/team/[id]/page.tsx`
- `components/modules/team/TeamMemberForm.tsx`
- `components/modules/team/InviteForm.tsx`
- `components/modules/projects/TeamMemberList.tsx`
- `app/(protected)/compensation/[id]/page.tsx` (visual sections linked to people context)

### Visual Issues to Fix
- Normalize team list/detail shell spacing and section/card cadence.
- Align form card spacing for member create/edit/invite screens.
- Standardize compensation-linked visual blocks in team/person detail contexts.
- Improve consistency of empty states and action strip spacing.

### What Not to Touch
- Team permissions, invite/membership logic, role workflows.
- Compensation/business rules and calculations.
- Any server actions or mutation policy behavior.

### Behavior Risk Level
- **Medium** (mixed list/detail/form views with some action sensitivity).

### Acceptance Criteria
- Team pages and member forms have consistent page/card spacing rhythm.
- Compensation-linked visual blocks are visually aligned without logic changes.
- No regression in invite/edit/team-member actions.

### Manual QA Checklist
- Verify team invite/create/edit/member update flows behave identically.
- Verify team detail linked tables/cards still function.
- Verify compensation-related display actions remain unchanged.
- Verify neutral empty states and blue default actions.

### Suggested Commit Message
- `style(people): align team list detail forms and related card shells`

### Split Smaller?
- **Optional:** split `team list/detail` and `team forms + related sections` if review size grows.

---

## 5C-5 - Finance Page Shell Cleanup

### Target Files / Pages
- `app/(protected)/finance/invoices/page.tsx`
- `app/(protected)/finance/invoices/[id]/page.tsx`
- `app/(protected)/payments/page.tsx`
- `app/(protected)/my-payments/page.tsx`
- `app/(protected)/finance/payslips/page.tsx`
- `app/(protected)/finance/payslips/[id]/page.tsx`
- `app/(protected)/compensation/page.tsx`
- `app/(protected)/finance/reports/page.tsx`
- `app/(protected)/finance/fx-rates/page.tsx`
- `app/(protected)/finance/payment-accounts/page.tsx`
- `components/modules/finance/FxRatesSection.tsx`
- `components/modules/finance/PaymentAccountsSection.tsx`

### Visual Issues to Fix
- Normalize finance page shell spacing around headers, summaries, filters, and list/table containers.
- Standardize card shell border/padding rhythm across finance modules.
- Align empty-state shell spacing where finance data is unavailable.
- Keep visual hierarchy consistent without touching metric semantics.

### What Not to Touch
- Financial formulas, aggregates, report definitions, currency logic.
- Payment/invoice/compensation business actions and workflows.
- Server queries/actions and data integrity logic.

### Behavior Risk Level
- **Medium to High** (finance sensitivity; visual-only must be strict).

### Acceptance Criteria
- Finance pages share consistent shell rhythm and neutral card treatment.
- No changes in values, calculations, or finance behavior.
- Empty/filter/card shells consistent and non-misleading.

### Manual QA Checklist
- Verify all finance actions (record payment, status transitions, etc.) unchanged.
- Verify report and list filters produce same result sets.
- Verify no accidental value/currency formatting logic change.
- Verify blue button defaults retained; red only for destructive actions.

### Suggested Commit Message
- `style(finance): normalize page shell spacing for invoices payments compensation reports`

### Split Smaller?
- **Yes (recommended):** split into `invoices/payments/payslips` and `compensation/reports/fx/payment-accounts`.

---

## 5C-6 - Empty State / Filter Bar / Card Shell Consistency Pass

### Target Files / Pages
- Cross-page final pass on files touched in 5C-1 through 5C-5.
- Shared page-level wrappers and repeated section shells where inconsistent patterns remain.

### Visual Issues to Fix
- Normalize repeated empty-state shell usage (compact + neutral).
- Align filter bar spacing and action strip rhythm across modules.
- Remove residual shell variance (padding/border cadence drift).

### What Not to Touch
- Any feature behavior, query parameters, list sorting/filtering logic.
- Empty-state meaning/copy that changes domain semantics without approval.

### Behavior Risk Level
- **Low to Medium** (broad scope but should be purely visual cleanup).

### Acceptance Criteria
- Repeated empty/filter/card patterns are consistent across major pages.
- No interaction behavior changes.
- No new color/system deviations introduced.

### Manual QA Checklist
- Run a cross-module visual pass on all Stage 5C pages.
- Confirm compact neutral empty-state style consistency.
- Confirm consistent filter/action spacing on desktop and narrow widths.
- Confirm no forbidden color (`#F4F4F1`) appears.

### Suggested Commit Message
- `style(ui): unify empty state filter bar and card shell consistency`

### Split Smaller?
- **No by default**, unless Stage 5C-1..5 already too large; then split by domain cluster.

---

## 5C-7 - Dashboard Non-Layout Polish Only

### Target Files / Pages
- `app/(protected)/dashboard/page.tsx`
- `components/modules/dashboard/dashboard-shared.tsx`
- `components/modules/dashboard/DashboardBD.tsx`
- `components/modules/dashboard/DashboardDirektur.tsx`
- `components/modules/dashboard/DashboardFinance.tsx`
- `components/modules/dashboard/DashboardManajer.tsx`
- `components/modules/dashboard/DashboardTechnicalDirector.tsx`
- `components/modules/dashboard/DashboardOwnerPmTabs.tsx` (only if shell-level spacing class alignment is needed)

### Visual Issues to Fix
- Final table/empty/card shell consistency for dashboard modules.
- Minor spacing/cadence alignment between dashboard section wrappers.
- Keep non-layout visual polish bounded to shell consistency.

### What Not to Touch
- No dashboard redesign.
- No widget movement/repositioning.
- No KPI definition changes.
- No layout architecture change.
- No role branch logic changes.

### Behavior Risk Level
- **Low to Medium** (low if scoped strictly; risk increases if scope drifts into redesign).

### Acceptance Criteria
- Dashboard shell consistency improved without any layout architecture changes.
- No KPI/data semantics changed.
- Existing dashboard navigation/role rendering remains intact.

### Manual QA Checklist
- Verify each role dashboard still renders expected sections.
- Verify no widget moves and no KPI semantic changes.
- Verify table/empty shells align with shared pattern.
- Verify no muddy backgrounds and no button-system drift.

### Suggested Commit Message
- `style(dashboard): apply non-layout shell consistency polish only`

### Split Smaller?
- **No initially**, unless role-specific churn requires separate `owner-pm` and `specialized roles` passes.

---

## 3) Recommended Batch Order
1. **5C-1 Settings**
2. **5C-2 Commercial**
3. **5C-4 People/Team**
4. **5C-3 Operations/Project**
5. **5C-5 Finance**
6. **5C-6 Global empty/filter/card consistency**
7. **5C-7 Dashboard non-layout polish**

Rationale:
- Starts with lower-risk admin shell consistency.
- Moves through medium-risk commercial/people pages before high-interaction operations surfaces.
- Keeps finance and dashboard cleanup after shell standards are stable.
- Ends with global consistency sweep and bounded dashboard polish.

## 4) Recommended First Implementation Batch
- **Start with 5C-1 (Settings page layout cleanup).**

Why this is safest:
- Settings has contained page shells and predictable visual structures.
- Lower chance of impacting core transactional flows compared to operations/finance.
- Produces reusable page-level spacing/card/filter patterns for later batches.
- Provides fast visual baseline validation before entering higher-risk modules.

## 5) Suggested First Implementation Prompt
- "Implement Stage 5C-1 only (settings page layout cleanup) as visual-only changes. Scope to settings pages/modules listed in `docs/handoff/STAGE_5C_PAGE_LEVEL_CLEANUP_BREAKDOWN.md`. Normalize page/card/filter/empty spacing rhythm. Do not touch behavior, server actions, auth/permissions, routes, data logic, button system, or dashboard layout. Keep blue default buttons, red destructive only, and do not introduce `#F4F4F1`. Run `npm run build` after runtime edits."

## Validation Note
- This file is docs-only. Build is not required for this planning update.
- If runtime code is accidentally touched during future implementation, stop and report before continuing.
