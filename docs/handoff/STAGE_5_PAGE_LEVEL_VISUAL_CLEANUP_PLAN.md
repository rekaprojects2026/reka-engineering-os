# Stage 5 Page-Level Visual Cleanup Plan (Plan Only)

## Scope Context
- Already implemented:
  - Stage 1 global tokens in `app/globals.css`.
- Foundation expected from other stages:
  - Stage 2 primitives (`table`, `input`, `textarea`, `select`).
  - Stage 3 shared components (`SectionCard`, `EmptyState`, `Pagination`, `FilterBar`, `MoneyInput`, etc.).
- Stage 5 objective:
  - Apply visual system on real pages/modules (tables, inputs, empty states, card shells) without changing logic/behavior.

## Hard Rules (Non-Negotiable)
- Do not change:
  - data queries
  - form submission logic
  - validation logic
  - routes
  - auth/permissions
- Preserve:
  - table sorting/filtering/links/actions behavior
  - form field names and submission contracts
- Do not introduce `#F4F4F1`.
- Planning only in this document.

## Design Targets (From Handoff)
- Tables:
  - neutral header/bg/border and edge alignment (`--table-*`, `table-edge-align` rhythm).
- Inputs:
  - neutral input shell and focus system (`--input-*` tokens).
- Empty states:
  - compact neutral treatment with approved copy patterns.
- Card/container shells:
  - white/near-white cards, neutral borders, consistent spacing rhythm.

---

## 1) Pages/Modules with Legacy Raw Tables

### Settings priority
- `app/(protected)/settings/page.tsx`
  - multiple raw `<table>` blocks + local `thClass`/`tdClass` on legacy warm tokens.
- `components/modules/settings/SettingsFileNamingClient.tsx`
  - `CodeMapTable` uses raw table + legacy input/table token mapping.
- `components/modules/settings/WebhooksSettingsClient.tsx`
  - webhook log table and endpoint list shells still partially legacy.

### Projects / Team / Clients priority
- `components/modules/projects/ProjectTasksTable.tsx`
- `components/modules/projects/TerminTable.tsx`
- `components/modules/projects/TeamMemberList.tsx` (heavy inline style table)
- `app/(protected)/team/page.tsx` (DataTable usage with many inline table cell styles around list)
- `app/(protected)/clients/page.tsx` (DataTable-driven list, but legacy inline visual styles for cells and actions)

### Finance / Compensation / Tasks priority
- `app/(protected)/finance/invoices/page.tsx` (list table + summary cards in inline style)
- `app/(protected)/compensation/page.tsx` (DataTable + legacy shell/tab styles)
- `app/(protected)/tasks/page.tsx` (list/kaban wrapper + legacy inline filter controls)

### Dashboard table/empty style only (not layout redesign)
- `components/modules/dashboard/dashboard-shared.tsx`
- `components/modules/dashboard/DashboardBD.tsx`
- `components/modules/dashboard/DashboardDirektur.tsx`
- `components/modules/dashboard/DashboardFinance.tsx`
- `components/modules/dashboard/DashboardManajer.tsx`
- `components/modules/dashboard/DashboardTechnicalDirector.tsx`

---

## 2) Pages/Modules with Legacy Input Styles

### High-impact form modules (inline style / legacy class tokens)
- `components/modules/clients/ClientForm.tsx` (inline style system)
- `components/modules/team/TeamMemberForm.tsx` (inline style system)
- `components/modules/invoices/InvoiceNewForm.tsx` (inline style system)
- `components/modules/invoices/RecordPaymentForm.tsx` (inline style system)
- `components/modules/compensation/CompensationForm.tsx` (inline style system)
- `components/modules/tasks/TaskForm.tsx` (inline style system)

### Page-level filter bars still using inline legacy input/select classes
- `app/(protected)/projects/page.tsx`
- `app/(protected)/clients/page.tsx`
- `app/(protected)/finance/invoices/page.tsx`
- `app/(protected)/tasks/page.tsx`
- `app/(protected)/settings/page.tsx` (various controls)

### Project form area
- `components/modules/projects/ProjectForm.tsx`
  - already structured but still local `controlClass`/`textareaClass` on legacy token family; should converge to Stage 2/3 pattern.

---

## 3) Empty States Requiring Neutral Compact Treatment

### Key target pages
- `app/(protected)/projects/page.tsx`
- `app/(protected)/clients/page.tsx`
- `app/(protected)/finance/invoices/page.tsx`
- `app/(protected)/compensation/page.tsx`
- `app/(protected)/tasks/page.tsx`

### Module targets
- `components/modules/projects/ProjectTasksTable.tsx`
- dashboard table sections in `components/modules/dashboard/dashboard-shared.tsx` and role dashboards.

### Current gap
- Empty states are used widely but tone/compact usage is inconsistent (`emphasis` appears in places where neutral compact is preferred for data grids).
- Approved empty labels need consistent usage policy during migration (copy-level harmonization, no fake data).

---

## 4) Card / Container Shells Requiring Alignment

- `app/(protected)/finance/invoices/page.tsx` summary cards use custom inline shells.
- `app/(protected)/compensation/page.tsx` tab + notice shell blocks are legacy style-heavy.
- `app/(protected)/settings/page.tsx` has mixed shell treatments (tabs, notice banners, table wrappers).
- `components/modules/projects/ProjectTasksTable.tsx` and `TerminTable.tsx` use mixed legacy surface tones.
- `components/modules/projects/TeamMemberList.tsx` currently bypasses shared shell patterns with raw inline table styles.

Goal: standardize on neutral card/table shell rhythm without touching data/render logic.

---

## 5) Exact Files Likely to Change (Implementation Stage)

### Priority 1 — Settings
- `app/(protected)/settings/page.tsx`
- `components/modules/settings/SettingsFileNamingClient.tsx`
- `components/modules/settings/WebhooksSettingsClient.tsx`
- `components/modules/settings/ApiKeysSettingsClient.tsx` (likely shell/input polish)

### Priority 2 — Project/Team/Client list tables
- `app/(protected)/projects/page.tsx`
- `components/modules/projects/ProjectTasksTable.tsx`
- `components/modules/projects/TerminTable.tsx`
- `components/modules/projects/TeamMemberList.tsx`
- `app/(protected)/team/page.tsx`
- `app/(protected)/clients/page.tsx`

### Priority 3 — Invoices/Compensation/Tasks tables
- `app/(protected)/finance/invoices/page.tsx`
- `app/(protected)/compensation/page.tsx`
- `app/(protected)/tasks/page.tsx`

### Priority 4 — Inline legacy forms
- `components/modules/invoices/InvoiceNewForm.tsx`
- `components/modules/invoices/RecordPaymentForm.tsx`
- `components/modules/compensation/CompensationForm.tsx`
- `components/modules/tasks/TaskForm.tsx`
- `components/modules/team/TeamMemberForm.tsx`
- `components/modules/clients/ClientForm.tsx`
- `components/modules/projects/ProjectForm.tsx`

### Priority 5 — Dashboard table/empty style only
- `components/modules/dashboard/dashboard-shared.tsx`
- role dashboard files listed above (table/empty shell touch only)

### Optional token bridge file (only if absolutely needed)
- `app/globals.css` (minimal alias bridge only, no random tokens)

---

## 6) What Must Not Be Touched

- No changes to:
  - `lib/**/queries.ts`
  - `lib/**/actions.ts`
  - route files for behavior-level flow
  - auth/permission guards
  - server mutation policies
- Do not alter:
  - field names in forms
  - hidden inputs
  - pagination/filter query parameter behavior
  - inline action handlers and side effects
- Do not redesign dashboard layout in this stage (table/empty style only for dashboard scope).

---

## 7) Risks Per Module

### Settings
- Risk: mixed server action forms and table actions could regress if structural HTML changed too aggressively.
- Mitigation: class/token swaps only; preserve form/action markup and names.

### Projects
- Risk: nested task tree table and subtask inline form are interaction-dense.
- Mitigation: avoid behavioral refactor; style wrappers/cell classes only.

### Team
- Risk: heavy inline style DataTable renderers may produce inconsistent visual outcome.
- Mitigation: migrate style constants first; do not alter columns/logic shape.

### Clients
- Risk: DataTable cell renderers rely on inline styles and links.
- Mitigation: convert visual styles to tokenized classes while preserving link targets and render order.

### Invoices
- Risk: summary cards + table + filters are mixed and visually inconsistent.
- Mitigation: split into shell pass (cards/table/filter) then form pass.

### Compensation
- Risk: role-based tabs and empty state variants could drift from intended behavior.
- Mitigation: keep tab/query behavior untouched; style-only.

### Tasks
- Risk: multiple edit scopes (`reviewer`, `assignee`, `full`) in form.
- Mitigation: no structural logic changes; only shared input/token styling.

### Dashboard table/empty style
- Risk: accidental layout redesign beyond scope.
- Mitigation: limit to table header/row/empty shell classes and token usage.

---

## 8) Suggested Implementation Order

1. **Settings tables and option lists**  
   Normalize table shells, header/footer rhythm, and input controls in settings pages/modules.

2. **Project/team/client list tables**  
   Replace raw table/input visuals with Stage 2/3 primitives/shared shell patterns.

3. **Invoices/compensation/task tables**  
   Align list shells, filters, and empty states to neutral table/empty token system.

4. **Forms with inline legacy input styles**  
   Migrate form controls (input/select/textarea/button shells) to Stage 2 primitive language.

5. **Empty states and placeholder cards**  
   Final consistency pass for compact neutral treatment and approved copy patterns.

6. **Dashboard table/empty style-only pass**  
   Apply only table/empty shell alignment, no layout architecture changes.

---

## 9) Acceptance Criteria

- Only visual/style-level changes in scoped page/module files.
- Tables:
  - neutral header/border/hover
  - consistent first/last edge alignment
  - behavior intact (sort/filter/link/action)
- Inputs/forms:
  - aligned with Stage 2 input/select/textarea visual tokens
  - no field name/submit/validation behavior changes
- Empty states:
  - compact neutral treatment
  - approved messaging patterns where applicable
  - no fake data placeholders
- Card/container shells:
  - white/neutral card surfaces with consistent border rhythm
- No `#F4F4F1` in touched runtime files.
- `npm run build` and `npx tsc --noEmit` pass after implementation.

---

## 10) Manual QA Checklist

### Cross-page table QA
- Header background and border are neutral on all target list pages.
- First/last column edge alignment matches table rhythm.
- Row hover/readability stays consistent.
- Table links/actions still work exactly as before.

### Filter/input QA
- Search/filter controls visually align with Stage 2 primitives.
- Focus, keyboard navigation, and disabled states are intact.
- Query params are preserved exactly after filtering/reset.

### Form QA
- Create/edit flows in clients/team/tasks/invoices/compensation/projects still submit correctly.
- Hidden fields and required validation still function.
- No regression in scope-based task edit forms.

### Empty state QA
- Compact neutral appearance on list/table empties.
- Copy remains explicit and non-misleading.
- No fake numeric values shown.

### Dashboard-limited QA
- Only table/empty styling changed; dashboard layout composition unchanged.

### Final technical QA
- Run `npm run build`.
- Run `npx tsc --noEmit`.
- Search touched runtime files for `#F4F4F1`.
