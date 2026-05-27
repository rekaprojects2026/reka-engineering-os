# Stage 5B-1 - Table Style Audit (No Implementation)

## 1) Summary

- Total table/table-like areas found in scope: **34**
- Already aligned or near-aligned to global table system: **8**
- Need cleanup (full or partial): **26**
- Biggest recurring issues:
  - Raw `<table>` with heavy inline styles on `table/thead/tr/th/td`.
  - Legacy token usage in table shells (`--color-surface*`, `--color-border`) instead of `--table-*` and neutral aliases.
  - Missing `.table-edge-align` (first/last column edge rhythm inconsistent).
  - Inconsistent row hover behavior (`hover:bg-[var(--color-surface-muted)]`, no hover, or custom inline).
  - Mixed table header background and typography (custom `thClass`, inline header styles, sticky headers with legacy tones).
  - DataTable consumers rely on dense inline cell render styling, creating inconsistent table visuals across pages.

Button policy note:
- Existing blue button system is kept as-is in this audit scope recommendation.
- Red remains destructive-only.

---

## 2) Table Inventory

### Legend
- Table type: `primitive table` | `raw table` | `custom table` | `DataTable-like` | `table-like list/card panel`
- Behavior risk:
  - `low`: mostly wrapper/classes/token swap
  - `medium`: custom cell renderers, links, actions
  - `high`: nested row interactions/forms/heavy custom state

| File | Component/Page | Type | Current Visual Issue | Legacy tokens/classes found | Behavior risk | Recommended fix | Recommended batch |
|---|---|---|---|---|---|---|---|
| `components/ui/table.tsx` | Table primitives | primitive table | Baseline mostly good, but table footer uses `--surface-neutral` and caption uses `--color-text-muted` alias family | mixed `--table-*` + `--surface-neutral` + `--color-text-muted` | low | Keep as canonical base; minor token consistency pass only if needed | 5B-2 |
| `components/shared/DataTable.tsx` | Shared DataTable shell | DataTable-like | Header row overrides primitive styles with custom bg/text classes; uses `tbl-row`; shell uses legacy `--color-surface`/`--color-border`; style prop heavy | `--color-surface`, `--color-border`, `--color-surface-subtle`, `--color-surface-muted`, `tbl-row` | medium | Normalize DataTable shell/header/row to pure table primitives + `--table-*`; reduce inline style dependence | 5B-2 |
| `app/(protected)/settings/page.tsx` | Settings option lists table | raw table | Raw table with custom `thClass/tdClass`; no `table-edge-align`; legacy border/text token usage | `--color-border`, `--color-text-*` | low | Migrate to `Table` primitives + `table-edge-align`, unify header/cell rhythm | 5B-3 |
| `components/modules/settings/SettingsFileNamingClient.tsx` | `CodeMapTable` | custom table | Custom table shell, legacy bg token in header row, no primitive usage | `bg-[var(--color-surface-subtle)]`, `--color-border` | low | Move to `Table` primitives and `--table-*` tokens, keep behavior intact | 5B-3 |
| `components/modules/settings/WebhooksSettingsClient.tsx` | Webhook logs table | custom table | Sticky header and compact rows use legacy token family; not aligned to shared table shell | `bg-[var(--color-surface-muted)]`, `--color-border`, `--color-text-muted` | medium | Keep sticky behavior; normalize header/cell tokens and edge spacing | 5B-3 |
| `components/modules/finance/PaymentAccountsSection.tsx` | Payment accounts table | custom table | Already close to standard (`table-edge-align`, table tokens), minor consistency only | mostly `--table-*`, neutral aliases | low | Keep mostly as reference; only minimal polish if needed | 5B-2 |
| `components/modules/finance/FxRatesSection.tsx` | FX rates table | custom table | Uses custom `thClass/tdClass` and `hover:bg-[var(--color-surface-muted)]`; missing full table token consistency | `--color-border`, `--color-text-*`, `--color-surface-muted` | low | Align to same pattern as PaymentAccountsSection | 5B-3 |
| `app/(protected)/expenses/page.tsx` | Expenses list table | raw table | Full inline table/th/td/tr styles; no table primitives; no edge-align utility | inline styles + `--color-border` | low | Convert to primitives + utility classes; preserve row actions/links | 5B-2 |
| `app/(protected)/work-logs/page.tsx` | Work logs detail table | raw table | Inline style heavy table; custom summary row style; inconsistent row spacing | inline styles + `--color-border` | medium | Migrate visual shell to primitives while preserving calculations and totals row | 5B-6 |
| `app/(protected)/work-logs/page.tsx` | Work logs member summary table | raw table | Same as above, independent table block with inline styles | inline styles + `--color-border` | medium | Same pass as detail table for consistency | 5B-6 |
| `app/(protected)/finance/reports/page.tsx` | Finance report table | raw table | Large raw table with inline cell styles; inconsistent table shell and hover | inline styles + `--color-border` | medium | Primitive table migration with tokenized cell classes | 5B-5 |
| `app/(protected)/finance/invoices/[id]/page.tsx` | Invoice detail line items table | raw table | Inline style table with custom header text/cell spacing, non-shared shell | inline styles + `--color-border` | medium | Move to table primitives; keep monetary formatting/link behavior | 5B-5 |
| `app/(protected)/finance/invoices/[id]/page.tsx` | Invoice incoming payments table | raw table | Same pattern as line items, inconsistent with global table shell | inline styles + `--color-border` | medium | Normalize in same batch | 5B-5 |
| `app/(protected)/finance/payslips/[id]/page.tsx` | Payslip breakdown table | raw table | Inline styles, custom emphasis row, no shared shell | inline styles + `--color-border` | low | Primitive table conversion while preserving net total emphasis | 5B-5 |
| `app/(protected)/clients/[id]/page.tsx` | Client detail - recent projects table | raw table | Inline table styles, custom paddings, no edge-align | inline styles + `--color-border` | medium | Standardize with table primitives; keep links and status badges | 5B-4 |
| `app/(protected)/clients/[id]/page.tsx` | Client detail - recent invoices table | raw table | Same as above | inline styles + `--color-border` | medium | Same batch as recent projects table | 5B-4 |
| `app/(protected)/team/[id]/page.tsx` | Team detail - compensation history table | raw table | Inline styles + custom small typography constants; no primitives | inline styles + `--color-border` | medium | Keep behavior and badges; normalize table shell and cell rhythm | 5B-4 |
| `app/(protected)/team/[id]/page.tsx` | Team detail - payment history table | raw table | Same as above | inline styles + `--color-border` | medium | Same batch | 5B-4 |
| `app/(protected)/projects/[id]/page.tsx` | Project detail - deliverables table | custom table | Custom `thClass/tdClass`, legacy border token, no edge-align | `--color-border`, local classes | medium | Move to shared table class system; preserve link/actions | 5B-4 |
| `app/(protected)/projects/[id]/page.tsx` | Project detail - files table | custom table | Same class pattern as deliverables table | `--color-border`, local classes | medium | Same batch | 5B-4 |
| `components/modules/projects/ProjectTasksTable.tsx` | Project tasks hierarchical table | custom table | Nested rows, inline indent styles, inline subform row bg, custom classes | `--color-border`, `--color-surface-subtle` | high | Visual-only refactor of table shell/classes only; avoid changing tree/subform behavior | 5B-6 |
| `components/modules/projects/TerminTable.tsx` | Termin table | custom table | Legacy header bg token and border token; custom shell | `bg-[var(--color-surface-muted)]`, `--color-border` | medium | Align to table primitives/tokens, keep permission-driven actions | 5B-4 |
| `components/modules/projects/TeamMemberList.tsx` | Team member list table | raw table | Very inline-style heavy, custom chips and text sizing | inline styles + `--color-border` | medium | Convert to shared table shell and utility classes only | 5B-4 |
| `components/modules/portal/ClientPortalView.tsx` | Client portal tasks table | custom table | Legacy surface/border tokens and custom header bg | `--color-surface`, `--color-surface-muted`, `--color-border` | medium | Token alignment to global table system while preserving portal behavior | 5B-3 |
| `components/modules/portal/ClientPortalView.tsx` | Client portal deliverables table | custom table | Same as portal tasks table | `--color-surface`, `--color-surface-muted`, `--color-border` | medium | Same batch | 5B-3 |
| `components/modules/dashboard/dashboard-shared.tsx` | Shared dashboard table strips (tasks/deliverables/payments) | custom table | Largely aligned (`table-edge-align`, TH/TD constants), but mixed usage across dashboard pages | mostly `--table-*` + some local class mix | low | Use as reference baseline, only minor consistency pass | 5B-7 |
| `components/modules/dashboard/DashboardBD.tsx` | BD dashboard tables (2 blocks) | custom table | Uses shared TH/TD but still raw `<table>` wrappers without `table-edge-align` in places, `--color-border` rows | `--color-border` row classes | low | Ensure wrappers/row borders align with dashboard-shared standard | 5B-7 |
| `components/modules/dashboard/DashboardDirektur.tsx` | Direktur dashboard projects table | custom table | Similar to BD: shared constants but wrapper/border token inconsistency | `--color-border` row classes | low | Minor class alignment to dashboard-shared standard | 5B-7 |
| `components/modules/dashboard/DashboardFinance.tsx` | Finance dashboard tables (3 blocks) | custom table | Mostly aligned and already using `table-edge-align`; small consistency gaps only | mostly `--table-*` | low | Minimal cleanup only | 5B-7 |
| `components/modules/dashboard/DashboardManajer.tsx` | Manajer dashboard table | custom table | Shared TH/TD but old row border token class usage | `--color-border` row class | low | Minor token/class alignment | 5B-7 |
| `components/modules/dashboard/DashboardTechnicalDirector.tsx` | Technical Director dashboard tables (2 blocks) | custom table | Similar mixed wrapper pattern and old border token classes | `--color-border` row classes | low | Minor token/class alignment | 5B-7 |
| `app/(protected)/clients/page.tsx` | Clients list (`DataTable`) | DataTable-like | Heavy custom cell render inline styles across columns | many inline styles + `--color-text-*` | medium | After DataTable shell cleanup, normalize cell render typography/layout classes | 5B-4 |
| `app/(protected)/team/page.tsx` | Team list + invites (`DataTable`) | DataTable-like | DataTable columns likely carry mixed inline styling conventions | DataTable-based + custom renderers | medium | Consumer-level class normalization post DataTable base pass | 5B-4 |
| `app/(protected)/finance/invoices/page.tsx` | Invoices list (`DataTable`) | DataTable-like | Inline cell render style and list shell inconsistency | DataTable-based + inline renderer styles | medium | Normalize column render styles and table shell in finance batch | 5B-5 |
| `app/(protected)/compensation/page.tsx` | Compensation list (`DataTable`) | DataTable-like | Inline render styles, mixed shell/filter wrappers | DataTable-based + inline styles + `--color-surface-subtle` wrappers | medium | Token/class cleanup only, preserve tab/query/action behavior | 5B-5 |
| `app/(protected)/tasks/page.tsx` + `components/modules/tasks/TasksViewWrapper.tsx` | Tasks list (`DataTable`) + list/kanban wrapper | table-like list/card panel | View toggle and list wrapper use inline shell styles; DataTable cell renderers inline-heavy; row accent logic present | inline styles + DataTable custom row style | high | Keep status update behavior; visual shell/class cleanup only | 5B-6 |
| `app/(protected)/leads/page.tsx` | Leads list (`DataTable`) | DataTable-like | Extensive inline cell styles and custom link typography in columns | DataTable render inline styles | medium | Normalize render class usage after DataTable base pass | 5B-4 |
| `app/(protected)/outreach/page.tsx` | Outreach list (`DataTable`) | DataTable-like | Similar inline-heavy column rendering | DataTable render inline styles | medium | Same as leads | 5B-4 |
| `app/(protected)/payments/page.tsx` | Payments list (`DataTable`) | DataTable-like | Inline cell styles (monospace, links, status formatting) | DataTable render inline styles | medium | Finance list styling harmonization | 5B-5 |
| `app/(protected)/my-payments/page.tsx` | My Payments list (`DataTable`) | DataTable-like | Inline-render visual variance and KPI/list shell mismatch | inline styles + `--color-surface` wrapper | medium | Normalize table/list visual shell with finance pages | 5B-5 |
| `app/(protected)/finance/payslips/page.tsx` | Payslips list (`DataTable`) | DataTable-like | Inline-heavy cell renderers and mixed token family | DataTable render inline styles + `--color-surface-muted` | medium | Finance batch styling normalization | 5B-5 |
| `app/(protected)/files/page.tsx` | Files list (`DataTable`) | DataTable-like | Many inline styles for chips/links/meta in cells | DataTable render inline styles + legacy tokens | medium | Normalize render classes and table shell consistency | 5B-4 |
| `app/(protected)/deliverables/page.tsx` | Deliverables list (`DataTable`) | DataTable-like | Inline style-heavy columns and legacy subtle bg chips | DataTable render inline styles + `--color-surface-subtle` | medium | Normalize visual rendering classes only | 5B-4 |
| `components/modules/projects/ProjectsViewToggle.tsx` | Projects list/kanban toggle | table-like list/card panel | Toggle shell inline styles and DataTable column render inline styles | inline styles + DataTable | high | Preserve view/state logic; visual shell standardization only | 5B-6 |

---

## 3) Recommended Batches

### 5B-2 - Low-risk raw/simple tables + base primitive alignment
- `components/ui/table.tsx` (minor consistency only)
- `components/shared/DataTable.tsx` (shared base normalization, no behavior change)
- `app/(protected)/expenses/page.tsx`
- `components/modules/finance/PaymentAccountsSection.tsx` (reference-level adjustments only)

Reason:
- Highest leverage with relatively low interaction risk.
- Stabilizes shared visual contract before module/page-level pass.

### 5B-3 - Settings/reference/portal tables
- `app/(protected)/settings/page.tsx`
- `components/modules/settings/SettingsFileNamingClient.tsx`
- `components/modules/settings/WebhooksSettingsClient.tsx`
- `components/modules/finance/FxRatesSection.tsx`
- `components/modules/portal/ClientPortalView.tsx` (both table blocks)

Reason:
- Mostly contained table blocks with manageable behavior risk.

### 5B-4 - Projects/team/clients/document lists
- `app/(protected)/clients/page.tsx`
- `app/(protected)/team/page.tsx`
- `app/(protected)/clients/[id]/page.tsx` (2 tables)
- `app/(protected)/team/[id]/page.tsx` (2 tables)
- `app/(protected)/projects/[id]/page.tsx` (deliverables + files tables)
- `components/modules/projects/TeamMemberList.tsx`
- `components/modules/projects/TerminTable.tsx`
- `app/(protected)/leads/page.tsx`
- `app/(protected)/outreach/page.tsx`
- `app/(protected)/files/page.tsx`
- `app/(protected)/deliverables/page.tsx`

Reason:
- Medium-risk due to links/actions/custom cells, but mostly table/list shell rendering.

### 5B-5 - Finance/invoices/compensation/payments tables
- `app/(protected)/finance/invoices/page.tsx`
- `app/(protected)/finance/invoices/[id]/page.tsx` (2 tables)
- `app/(protected)/finance/payslips/page.tsx`
- `app/(protected)/finance/payslips/[id]/page.tsx`
- `app/(protected)/payments/page.tsx`
- `app/(protected)/my-payments/page.tsx`
- `app/(protected)/finance/reports/page.tsx`
- `app/(protected)/compensation/page.tsx`

Reason:
- Finance pages have dense table + monetary formatting + actions, need careful visual-only pass.

### 5B-6 - Tasks/work logs + high-interaction table-like panels
- `app/(protected)/work-logs/page.tsx` (2 tables)
- `app/(protected)/tasks/page.tsx` + `components/modules/tasks/TasksViewWrapper.tsx`
- `components/modules/projects/ProjectTasksTable.tsx`
- `components/modules/projects/ProjectsViewToggle.tsx`

Reason:
- High interaction complexity (row accents, inline forms, status mutation, list/kanban switching).

### 5B-7 - Dashboard table-only cleanup
- `components/modules/dashboard/dashboard-shared.tsx`
- `components/modules/dashboard/DashboardBD.tsx`
- `components/modules/dashboard/DashboardDirektur.tsx`
- `components/modules/dashboard/DashboardFinance.tsx`
- `components/modules/dashboard/DashboardManajer.tsx`
- `components/modules/dashboard/DashboardTechnicalDirector.tsx`

Reason:
- Mostly aligned already; final consistency pass only for wrappers/border tokens/edge rhythm.

---

## 4) Hard Constraints for Future Implementation

- Visual-only changes.
- No route/auth/permission/business logic changes.
- No data query changes.
- No row action behavior changes.
- No button system changes (blue button system stays).
- Red remains destructive-only.
- Do not introduce `#F4F4F1`.
- Preserve all existing sorting/filtering/links/actions/form row behavior.

---

## Notes from Audit Execution

- Audit performed as read-only scan across:
  - `app/(protected)/**`
  - `components/modules/**`
  - `components/shared/**`
  - `components/ui/**`
- No runtime code edited during this stage.
