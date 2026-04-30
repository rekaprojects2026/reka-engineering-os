# Table / Input / Empty-State Handoff

## 1) Tables

### Tokens
- `--table-header-bg`: `#F8F8F8`
- `--table-border`: `#E5E7EB`
- `--table-header-text`: `#4B5563`
- `--table-edge-padding-x`: `1.25rem`
- `--table-cell-padding-x`: `0.75rem`
- `--table-edge-x`: `var(--table-edge-padding-x)`

### Implemented changes
- `components/ui/table.tsx`:
  - Uses tokenized table header/footer/background/border/text classes.
  - Keeps rows border-bottom + neutral hover.
- Global CSS alignment:
  - Shadcn table first/last cell edge alignment rules in `app/globals.css`.
  - Native table utility classes:
    - `.table-edge-align`
    - `.table-edge-align--contained`
- Pagination/footer normalization:
  - `components/shared/Pagination.tsx` now matches neutral table shell.
- Dashboard table strips:
  - Shared `TH_CLASS`/`TD_CLASS` and `table-edge-align` are used across many dashboard sections.
- Settings normalization:
  - `app/(protected)/settings/page.tsx` and `components/modules/settings/SettingsFileNamingClient.tsx` shifted to normalized table/card shell.
- File naming/code map:
  - Uses `Table` primitives for consistent shell and spacing.

### Affected files (representative)
- `components/ui/table.tsx`
- `app/globals.css`
- `components/shared/Pagination.tsx`
- `components/modules/dashboard/dashboard-shared.tsx`
- `components/modules/dashboard/DashboardCommercialPanels.tsx`
- `components/modules/dashboard/DashboardDirektur.tsx`
- `components/modules/dashboard/DashboardManajer.tsx`
- `components/modules/dashboard/DashboardFinance.tsx`
- `app/(protected)/settings/page.tsx`
- `components/modules/settings/SettingsFileNamingClient.tsx`

### Deferred / needs verification
- Some raw table implementations outside shared/table-edge patterns may still need final pass.

## 2) Inputs

### Tokens
- `--input-bg`: `#F8F8F8`
- `--input-bg-focus`: `#FFFFFF`
- `--input-placeholder`: `#C4C4C4`

### Implemented changes
- Global placeholder styling added in `app/globals.css`.
- Autofill override for neutral appearance in `app/globals.css`.
- Shared primitives updated:
  - `components/ui/input.tsx`
  - `components/ui/textarea.tsx`
  - `components/ui/select.tsx` (`SelectTrigger`)
- Applied in shared controls:
  - `components/shared/FilterBar.tsx`
  - `components/layout/TopbarSearch.tsx`
  - `components/shared/MoneyInput.tsx`
- Inline form style pass (visual only, no logic rewrite) in:
  - `InvoiceNewForm.tsx`
  - `RecordPaymentForm.tsx`
  - `FileForm.tsx`
  - `CompensationForm.tsx`
  - `PaymentForm.tsx`
  - `TaskForm.tsx`
  - `ProfileCompletionForm.tsx`
  - `ProjectForm.tsx`
  - `ActivateForm.tsx`

## 3) Empty States

### Implemented
- `EmptyState` supports `tone="neutral"` + compact mode with neutral tokens.
- Dashboard wrappers use compact neutral blocks and balanced spacing from section header divider.
- Common approved copy patterns appear in dashboard placeholders (`Data not yet available`, `Target not set`, `Scheduling data required`, `Coming soon`, etc.).

### Affected dashboard cards/areas
- Problem projects
- Deliverables needing review
- Project status board empties
- Needs attention empty branch
- Finance compact empties
- Manajer assignment empties
- Payment account and settings placeholders
- Recent activity empty branch
- Upcoming deadlines empty branch

## 4) Charts
- Shared chart spacing/footer helper classes are centralized in `components/modules/dashboard/dashboard-shared.tsx`.
- Footer/legend styling is neutralized (no muddy gray strip).
- Chart track/grid/label consistency is token-driven via chart and border variables.
- Affected chart files include:
  - `TaskStatusBarChart.tsx`
  - `DeadlineBucketsChart.tsx`
  - `WorkloadBars.tsx`
  - plus shared chart plumbing in `components/ui/chart.tsx`

## 5) QA Checklist
- Confirm table header bg, border, and first/last column alignment on all major list pages.
- Confirm pagination/footer shell style consistency.
- Confirm input bg/focus/placeholder/autofill behavior in desktop and mobile web.
- Confirm empty-state compact neutral spacing (not oversized) in dashboard sections.
- Confirm chart footers do not look like table strips and remain visually balanced.
