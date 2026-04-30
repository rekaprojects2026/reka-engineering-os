# UI/UX Refinement Overview

## Purpose
- This phase is a UI/UX refinement pass, not a business logic rewrite.
- The objective is to evolve a functional prototype into a cleaner, more premium, more readable, and more scalable internal operating system interface.
- Backend auth, routing, and domain workflows remain intact; visual system consistency and information clarity are the focus.

## Source of Truth Order
- 1) `docs/handoff/02_GLOBAL_COLOR_SYSTEM.md` (colors, card/shadow tokens, hard avoids)
- 2) `docs/handoff/01_GLOBAL_UI_UX_DIRECTION.md` (interaction and visual behavior rules)
- 3) `docs/handoff/08_DATA_AND_METRICS_CONSTRAINTS.md` (metric integrity and finance wording rules)
- 4) `docs/handoff/03_IMPLEMENTED_CHANGELOG_BY_AREA.md` (what is already done vs still pending)
- 5) `docs/handoff/04_DASHBOARD_HANDOFF.md` (dashboard layout/role handoff specifics)
- 6) `docs/handoff/11_AI_IMPLEMENTATION_BRIEF.md` (execution protocol for next implementer)

## Implemented vs Planned Label Standard
- Use only these labels in handoff updates:
  - **Implemented (Repo-Verified)**
  - **Planned**
  - **Needs verification**
- Never merge implemented and planned claims in one bullet.
- If uncertain, default to **Needs verification**.

## Major Changes (High Level)
- Global visual direction and tokenization centered in `app/globals.css`.
- Sidebar IA refinement + collapsible behavior in `components/layout/AppSidebar.tsx` and `components/layout/ProtectedAppShell.tsx`.
- Dashboard evolution from single-flow layouts toward phased Owner/PM command-center tabs (`Overview`, `Commercial`, `Projects`, `Resources`, `Finance`) in `components/modules/dashboard/DashboardOwnerPmTabs.tsx`.
- Table cleanup: header/background/border/alignment normalization via `components/ui/table.tsx` + global `.table-edge-align` rules.
- Input cleanup: shared input tokens (`--input-bg`, `--input-bg-focus`, `--input-placeholder`) wired to input primitives and key forms.
- Empty-state cleanup: compact neutral states with explicit no-fake-data copy in `components/shared/EmptyState.tsx` and dashboard modules.
- Settings table normalization (system/file naming/language/finance sections) in `app/(protected)/settings/page.tsx` and settings module components.
- Logo + sidebar header behavior improvements using `components/layout/RekaLogotype.tsx` and rail hover/focus expand control in `AppSidebar`.
- Dashboard planning docs and staged implementation docs added for B/B2/C direction.
- Future forms/dialog direction documented but not yet system-implemented.

## Implemented (Repo-Verified)
- Tokenized shell, table, dashboard, and input variables exist in `app/globals.css`.
- Sidebar collapse persistence exists (`localStorage` key `reka-sidebar-collapsed`) in `components/layout/ProtectedAppShell.tsx`.
- Sidebar IA with grouped sections and `Soon` disabled items is implemented in `components/layout/AppSidebar.tsx`.
- Dashboard tabs for Owner/PM are implemented (`DashboardOwnerPmTabs.tsx`) and used in `DashboardDirektur.tsx` and `DashboardManajer.tsx`.
- Commercial tab content component exists and is wired (`components/modules/dashboard/DashboardCommercialPanels.tsx`).
- Dashboard placeholders and no-fake-finance copy patterns are implemented across dashboard modules.
- Global table/input primitive styling has been applied in `components/ui/table.tsx`, `components/ui/input.tsx`, `components/ui/textarea.tsx`, and `components/ui/select.tsx`.
- Neutral empty-state tone is implemented and used broadly in dashboard surfaces.

## Planned / Not Fully Implemented Yet
- Dashboard B2 final visual polish is still iterative (see `DASHBOARD_PHASE_B2_VISUAL_LAYOUT_PLAN.md`).
- KPI delta/trend C1 implementation is planned but not fully data-safe for all metrics.
- Reliable finance metrics C2 (especially trend/GP/cashflow readiness) are planned.
- Forms/dialog system standardization is planned; no global reusable dialog-form system yet.
- Settings redesign into a full left-nav + right-detail management experience is planned.
- Project detail in-place editing is planned.
- Project Operating Workspace concept is planned.
- Inline table editing is planned.
- Gantt/timeline capability is planned.
- Public landing page + inquiry-to-lead flow is planned.

## Most Important Warnings
- Do not fake finance data under any dashboard role.
- Do not fake gross profit, cashflow, target percentage, deltas, or sparklines.
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- Do not reintroduce muddy dashboard palettes (especially `#F4F4F1`).
- Do not treat draft compensation as outstanding payable.
- Do not rely on placeholder text as field labels in forms.
- Do not force long complex forms into dialogs.

## Current Dashboard B2 Known Issue
- Current known Dashboard B2 issue: KPI cards became too tall / copy-heavy after the latest pass. Next fix is to reduce KPI height to ~7–7.5rem, make values more dominant, trim helper copy, and ensure four-card KPI rows fill the available horizontal width cleanly.

## Dashboard Scroll Clarification
- Goal is to minimize unnecessary dashboard scroll on desktop.
- Readability and content clarity win over forced no-scroll.
- Do not compress typography or card content so aggressively that scanning quality drops.

## UI Acceptance Criteria (Handoff Baseline)
- No fake metrics/deltas/sparklines in finance-sensitive surfaces.
- `#F4F4F1` is absent from dashboard UI.
- `#ECE8DC` remains legacy-only unless intentionally reintroduced.
- KPI rows maintain readable hierarchy and stable 4-up layout where intended.
- Implemented vs planned labeling is explicit in all handoff updates.

## Developer Next Steps
- Finish dashboard B2 visual/layout polish with compact, value-forward KPI cards.
- Validate role-specific dashboard behavior (Direktur/Manajer/TD/Finance/BD) and branch rendering.
- Confirm finance metric definitions before enabling richer KPI trend visuals.
- Run full visual QA across core modules and breakpoints.
- Prepare and scope a forms/dialog pilot (People module first) without breaking existing page flows.
