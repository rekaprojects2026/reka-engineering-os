# QA Checklist

## 1) Build / Typecheck
- [ ] Run `npm run build`
- [ ] Run `npx tsc --noEmit`
- [ ] Hex guard (`#F4F4F1`) check:
  - macOS/Linux: `rg "#F4F4F1" .`
  - Windows PowerShell/findstr: `findstr /spin /c:"#F4F4F1" *`
- [ ] NaN/Infinity guard check:
  - macOS/Linux: `rg "NaN|Infinity" components app lib`
  - Windows PowerShell/findstr: `findstr /spin /r /c:"NaN" /c:"Infinity" components\* app\* lib\*`

## 2) Visual QA Pages
- [ ] Dashboard (all tabs)
- [ ] Sidebar expanded and collapsed modes
- [ ] Settings
- [ ] Projects list/detail/form
- [ ] People list/detail
- [ ] Clients list/detail
- [ ] Invoices
- [ ] Compensation/Payroll
- [ ] Tasks
- [ ] Mobile/tablet breakpoints

## 3) Dashboard QA
- [ ] All five tabs render and switch correctly
- [ ] Role behavior matches expected branch outputs
- [ ] Overview layout follows main+rail hierarchy
- [ ] Commercial layout follows KPI + pipeline + rail structure
- [ ] Projects layout follows board/risk/chart grouping
- [ ] Resources layout follows workload + assignment summary
- [ ] Finance layout follows no-fake-data policy
- [ ] No fake metrics
- [ ] No `NaN`/`Infinity`
- [ ] No fake deltas/sparklines
- [ ] No fake GP/cashflow
- [ ] IDR display follows `Rp0` style where applicable
- [ ] No `#F4F4F1` dashboard surfaces
- [ ] KPI cards are not too tall
- [ ] KPI cards fill width cleanly
- [ ] Kanban status colors are semantically consistent
- [ ] Placeholders are clear and non-misleading
- [ ] Desktop avoids unnecessary scroll where possible
- [ ] Screenshot QA includes before/after dashboard tabs after final B2 polish

## 4) Sidebar QA
- [ ] Final IA groups and order are correct
- [ ] `Coming Soon` rows are disabled
- [ ] Finance accordion rows are fully clickable
- [ ] Collapsed logo/expand behavior works on hover and keyboard focus
- [ ] Active state is neutral
- [ ] No route mismatch from sidebar navigation

## 5) Table QA
- [ ] Header background is neutral and consistent
- [ ] Edge alignment is correct for first/last columns
- [ ] Pagination/footer shell matches table style
- [ ] Settings tables follow normalized style
- [ ] Native and shadcn table variants remain consistent

## 6) Input/Form Visual QA
- [ ] Input rest background token is correct
- [ ] Input focus background token is correct
- [ ] Placeholder color token is correct
- [ ] Autofill is visually normalized
- [ ] Labels are above fields
- [ ] Placeholders are not used as labels
- [ ] One-column default is used unless pair grouping is justified

## 7) Empty State QA
- [ ] Neutral empty-state colors are used
- [ ] Spacing is balanced
- [ ] Empty states are compact
- [ ] Empty states are not oversized
- [ ] No fake zeros for unavailable data

## 8) Accessibility QA
- [ ] Keyboard tab navigation works
- [ ] Focus states are visible
- [ ] Buttons are real buttons
- [ ] No nested interactive controls
- [ ] Color contrast remains acceptable

## 9) Data QA
- [ ] Revenue definition is explicit and consistent
- [ ] Receivables definition is explicit and consistent
- [ ] Outstanding talent payment definition is explicit and consistent
- [ ] Pending client review definition is explicit and consistent
- [ ] Project queue/start-date definition is explicit and consistent

## 10) Required Screenshot Handoff List
- [ ] Dashboard tabs before/after final B2 polish:
  - Overview
  - Commercial
  - Projects
  - Resources
  - Finance
- [ ] Sidebar states:
  - Expanded
  - Collapsed (low-noise rail behavior)
  - Mobile drawer
- [ ] Key table pages showing tokenized header/border alignment.
- [ ] Key form pages showing input tokens (rest/focus/placeholder).
- [ ] At least one empty-state heavy view and one finance-sensitive dashboard view.
