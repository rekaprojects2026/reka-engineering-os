# Next Implementation Backlog

## P0 — Stabilize Current UI Polish

### 1) Finish dashboard B2 visual/layout polish
- **Purpose:** complete command-center quality target.
- **Dependency:** existing B1/B2 tab shell and dashboard sections.
- **First step:** finalize one reference tab (Overview) then apply consistent spacing/KPI patterns to other tabs.
- **Risk:** visual regressions across role-specific dashboards.
- Current known Dashboard B2 issue: KPI cards became too tall / copy-heavy after the latest pass. Next fix is to reduce KPI height to ~7–7.5rem, make values more dominant, trim helper copy, and ensure four-card KPI rows fill the available horizontal width cleanly.

### 2) Remove/avoid `#F4F4F1` usage
- **Purpose:** enforce neutral-clean dashboard surfaces.
- **Dependency:** token compliance pass.
- **First step:** run token/hex audit in dashboard components and CSS.
- **Risk:** accidental style drift if replacing colors ad hoc.

### 3) Final KPI card sizing/copy/width
- **Purpose:** improve scan speed and reduce vertical bloat.
- **Dependency:** agreed KPI text hierarchy.
- **First step:** define 1 KPI card spec and update role dashboards consistently.
- **Risk:** overflow/truncation on smaller desktop widths.

### 4) Screenshot QA
- **Purpose:** visual baseline before next feature phases.
- **Dependency:** stable B2 layout.
- **First step:** capture all dashboard tabs per key role.
- **Risk:** missed breakpoints if screenshot matrix is incomplete.

### 5) Build/typecheck
- **Purpose:** ensure handoff branch is technically clean.
- **Dependency:** no pending syntax/type issues.
- **First step:** run `npm run build` and `npx tsc --noEmit`.
- **Risk:** hidden TS regressions in less-used role branches.

### 6) Raw/non-shadcn table audit (P0/P1)
- **Purpose:** remove remaining visual drift in table shells.
- **Dependency:** baseline table token system already in place.
- **First step:** audit remaining raw/non-shadcn tables for table-edge alignment and tokenized header/body styling.
- **Risk:** inconsistency persists across detail/settings pages if this is deferred.

## P1 — Dashboard C1/C2

### 6) C1 KPI delta/trend support (safe metrics first)
- **Purpose:** add trustworthy trend context.
- **Dependency:** reliable prior-period comparisons.
- **First step:** implement metric-specific sentiment map + helper with non-finance-safe KPIs.
- **Risk:** misleading sentiment if generic up/down logic is used.

### 7) C2 reliable finance metrics
- **Purpose:** unlock finance KPIs beyond placeholders safely.
- **Dependency:** data contracts for revenue/receivables/targets.
- **First step:** lock one finance metric definition doc + query source of truth.
- **Risk:** stakeholder trust damage if numbers conflict with Finance pages.

### 8) Maintain no-fake GP/cashflow/target
- **Purpose:** preserve data integrity.
- **Dependency:** explicit product sign-off before enabling any numeric rendering.
- **First step:** enforce placeholder gating conditions in finance dashboard components.
- **Risk:** accidental “temporary demo numbers” entering production UI.

## P1 — Forms / Dialog System

### 9) People & Partners pilot
- **Purpose:** validate short CRUD dialog UX pattern.
- **Dependency:** stable modal form primitives.
- **First step:** implement Add/Edit/Invite Person dialogs with fallback routes.
- **Risk:** accessibility and state-sync bugs (close/save/refresh).

### 10) Reusable dialog/form primitives
- **Purpose:** avoid per-module form style drift.
- **Dependency:** agreed component API.
- **First step:** ship `AppDialogForm` + header/footer/section primitives.
- **Risk:** over-abstraction too early.

### 11) Keep long forms page-based
- **Purpose:** prevent modal overload for complex workflows.
- **Dependency:** product agreement on dialog/page split.
- **First step:** document explicit “dialog vs page” matrix in code comments/docs.
- **Risk:** inconsistent UX if teams choose ad hoc pattern per feature.

## P1 — Settings Redesign

### 12) New settings IA (General/File Naming/Finance/Reference Data)
- **Purpose:** improve discoverability and admin workflow clarity.
- **Dependency:** role-based permissions and existing settings actions.
- **First step:** build left category nav + right content panel shell only.
- **Risk:** permissions edge cases causing inaccessible panels.

### 13) Add option dialog pattern
- **Purpose:** modernize option CRUD UX.
- **Dependency:** reusable dialog form primitives.
- **First step:** migrate one low-risk domain option flow first.
- **Risk:** form validation regression if parity checks are skipped.

## P1 — Project Detail In-Place Editing

### 14) Card/field group inline edit
- **Purpose:** reduce navigation friction.
- **Dependency:** robust field-level authorization and save handling.
- **First step:** pilot on one non-sensitive project detail section.
- **Risk:** accidental destructive edit behavior without clear confirm/cancel UX.

### 15) Keep full Edit Project fallback
- **Purpose:** preserve safe path for full complex edits.
- **Dependency:** existing edit route.
- **First step:** add “Open full edit” affordance from inline panels.
- **Risk:** split logic divergence between inline and full form.

## P2 — Project Operating Workspace

### 16) Workspace modules (brief/scope/requirements/deliverables/tasks)
- **Purpose:** centralize operational execution.
- **Dependency:** schema and module architecture decisions.
- **First step:** define MVP read-only workspace shell from existing data.
- **Risk:** feature sprawl without phased boundaries.

### 17) Deliverable versioning + task linkage
- **Purpose:** traceability from work item to deliverable output.
- **Dependency:** deliverable model extensions.
- **First step:** create version list model and relationship contracts.
- **Risk:** complexity in migration and permission handling.

### 18) Phases/subtasks + project/person kanban
- **Purpose:** finer operational control.
- **Dependency:** workflow state model.
- **First step:** define canonical status model before UI build.
- **Risk:** inconsistent status taxonomy across modules.

## P2 — Inline Table Editing

### 19) Safe inline editing
- **Purpose:** speed data maintenance for suitable fields.
- **Dependency:** field-level validation + optimistic/error UX.
- **First step:** enable inline editing on one simple, low-risk table column.
- **Risk:** accidental edits and unclear save state.

### 20) Remove redundant Edit action where safe
- **Purpose:** declutter table actions.
- **Dependency:** proven inline edit reliability.
- **First step:** usage audit to identify replaceable edit buttons.
- **Risk:** loss of discoverability if inline affordance is weak.

## P2 — Gantt

### 21) Timeline and dependencies
- **Purpose:** schedule visibility and sequencing control.
- **Dependency:** DB support for dependency/date semantics.
- **First step:** define minimal timeline schema and read model.
- **Risk:** heavy complexity and performance overhead.

## P2 — Commercial Acquisition

### 22) Landing page + inquiry form
- **Purpose:** feed qualified leads into intake pipeline.
- **Dependency:** lead creation endpoint and anti-spam policy.
- **First step:** define inquiry payload mapping to leads/intakes.
- **Risk:** low-quality lead spam without validation controls.

## P2 — Data Entry / Sync

### 23) Bulk input and possible Google Sheets sync
- **Purpose:** reduce manual repetitive data entry.
- **Dependency:** import schema validation and conflict handling.
- **First step:** CSV import MVP with dry-run validation output.
- **Risk:** data quality issues and duplicate records.
