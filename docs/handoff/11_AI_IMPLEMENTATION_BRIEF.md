# AI Implementation Brief

## 1) Context
- REKA OS UI/UX refinement is ongoing from an initial functional prototype baseline.
- Global direction is clean, structured, warm-neutral, compact, data-first.
- Current top implementation priority is dashboard B2 visual polish.

## 2) Absolute Rules
- No fake finance metrics.
- No fake deltas or fake sparklines.
- No fake gross profit/cashflow/target percentages.
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- No `#F4F4F1` in dashboard surfaces.
- Preserve auth/permissions/routes behavior.
- Use existing data only unless explicitly requested to add model/query support.
- Clearly separate implemented facts from planned ideas in all outputs.

## 3) Current Top Priority
- Finish dashboard B2 visual polish:
  - KPI cards compact and value-forward
  - Overview layout refinement
  - Commercial layout refinement
  - Projects/Resources/Finance layout refinement
  - Screenshot-based QA pass
- Current known Dashboard B2 issue: KPI cards became too tall / copy-heavy after the latest pass. Next fix is to reduce KPI height to ~7–7.5rem, make values more dominant, trim helper copy, and ensure four-card KPI rows fill the available horizontal width cleanly.

## 4) Next Priorities
- Forms/dialog system planning and pilot (People module first).
- Settings redesign IA and UX shell.
- C1/C2 metric reliability work after B2 visual stabilization.

## 5) Required Style Inputs
- Follow `docs/handoff/02_GLOBAL_COLOR_SYSTEM.md`.
- Follow `docs/handoff/01_GLOBAL_UI_UX_DIRECTION.md`.
- Keep dashboard compact, scannable, and semantically consistent.
- Ask before adding any new KPI or metric not already defined.

## 6) Expected Output Format (for future AI work)
- Files changed
- What changed
- What did not change
- Build/typecheck result
- Known issues / follow-up
- Screenshots to inspect (list of page states/tabs captured)

## 7) Core UI Component Ownership Map
- **Global shell:** `components/layout/*` (`ProtectedAppShell`, `AppSidebar`, `AppTopbar`, `BreadcrumbNav`, `TopbarSearch`)
- **Global primitives:** `components/ui/*` (`table`, `input`, `textarea`, `select`, `tabs`, `card`, `button`)
- **Shared patterns:** `components/shared/*` (`SectionCard`, `KpiCard`, `EmptyState`, `Pagination`, `FilterBar`)
- **Dashboard system:** `components/modules/dashboard/*`
- **Settings system surfaces:** `app/(protected)/settings/page.tsx` + `components/modules/settings/*`

## 8) Do Not Touch Without Approval
- Auth/permissions/mutation policy behavior.
- Role routing logic and access gates.
- Finance metric definitions and query contracts.
- Schema-level assumptions for KPI calculations.

## 9) AI Implementation Protocol
- Step 1: Confirm source-of-truth order from `00_UI_UX_REFINEMENT_OVERVIEW.md`.
- Step 2: Declare each change as **Implemented (Repo-Verified)**, **Planned**, or **Needs verification**.
- Step 3: Do UI-only scope unless explicitly asked for data/query/auth changes.
- Step 4: Apply finance wording rules from `08_DATA_AND_METRICS_CONSTRAINTS.md`.
- Step 5: Run build/typecheck and required QA checks before final report.
- Step 6: Provide required screenshot handoff list from `10_QA_CHECKLIST.md`.
