# Stage 3 Shared Components Porting Plan (Plan Only)

## Status Context (Implemented vs Recommended)
- Already implemented:
  - Stage 1 global visual token foundation in `app/globals.css`.
  - Stage 2 primitive direction is defined and being handled separately.
- Recommended in this document:
  - Shared component visual porting plan only (no implementation in this step).
  - Maintain logic-correct behavior and existing business semantics.

## Scope
- Target shared components:
  - `components/shared/KpiCard.tsx`
  - `components/shared/SectionCard.tsx`
  - `components/shared/EmptyState.tsx`
  - `components/shared/Pagination.tsx`
  - `components/shared/MoneyInput.tsx`
  - `components/shared/FilterBar.tsx`
- Reference context:
  - `app/globals.css`
  - `docs/handoff/01_GLOBAL_UI_UX_DIRECTION.md`
  - `docs/handoff/02_GLOBAL_COLOR_SYSTEM.md`
  - `docs/handoff/06_TABLE_INPUT_EMPTY_STATE_HANDOFF.md`
  - `docs/handoff/04_DASHBOARD_HANDOFF.md`

## Hard Guardrails
- No behavior or business logic changes.
- No route/auth/permissions/database/server-action/query changes.
- No module/dashboard/layout file edits during Stage 3 execution.
- No `#F4F4F1`.
- Preserve existing component APIs unless using safe additive variant/prop strategy.
- Keep keyboard/focus/disabled states intact.
- Keep no-fake-data policy (especially KPI and empty states).

## Current State by Shared Component

### 1) `KpiCard`
- Current strengths:
  - Supports legacy + v0 naming (`label/title`, `description/subtitle`, `accent/variant`).
  - Compact-ish structure with trend support and optional icon.
  - Keeps reusable `KpiStrip`.
- Current visual gaps vs direction:
  - Icon still rendered in rounded pill/circle-like container (direction says avoid icon circles as primary visual).
  - Uses legacy token family (`--color-*`) for many visual states.
  - KPI density still at risk of becoming too tall/copy-heavy in some use.
- Behavior/API risk:
  - Medium risk if defaults are replaced aggressively (many call-sites rely on current props and fallback aliases).

### 2) `SectionCard`
- Current strengths:
  - Clean API (`title`, `description`, `actions`, `noPadding`).
  - Uses UI card primitives; semantics stable.
- Current visual gaps:
  - Header uses warm-muted legacy surface (`--color-surface-muted`) instead of neutral header shell.
  - Border token still legacy family.
  - Needs stricter edge rhythm alignment for table/card sections.
- Behavior/API risk:
  - Low (mostly class-level shell changes).

### 3) `EmptyState`
- Current strengths:
  - Supports `compact` and `emphasis`.
  - Action slot and icon slot already in place.
- Current visual gaps:
  - Uses legacy surface/border/text tokens, not full neutral empty-state token family.
  - No explicit approved-label guidance enforced at component level.
  - Emphasis style may drift too large for compact dashboard empty blocks.
- Behavior/API risk:
  - Low-medium if defaults are changed; safest path is additive variant/tone strategy.

### 4) `Pagination`
- Current strengths:
  - Logic is simple and stable for page navigation.
  - No business logic side effects.
- Current visual gaps:
  - Footer shell still warm (`--color-surface-subtle`, `--color-border`).
  - Uses fixed `px-4`, not tied to table edge rhythm tokens.
- Behavior/API risk:
  - Low (style-only wrapper and spacing updates).

### 5) `MoneyInput`
- Current strengths:
  - Currency + amount behavior is clear and stable.
  - Conversion hint logic already scoped and guarded.
- Current visual gaps:
  - Inline style objects use legacy token values directly.
  - Focus ring uses old primary token; not aligned to input token system.
  - Select/input shell can be visually misaligned with Stage 2 primitives.
- Behavior/API risk:
  - Medium if refactored to primitives incorrectly; must preserve parsing/state flow exactly.

### 6) `FilterBar`
- Current strengths:
  - Flexible API for server GET and client-side callback mode.
  - Clear composition model via `children`.
- Current visual gaps:
  - Built-in search input still hardcoded to legacy border/surface/focus tokens.
  - Should visually converge with shared Input/Select primitive styling.
- Behavior/API risk:
  - Low-medium if search field behavior is touched; keep `name/defaultValue/onChange` contract exactly.

## Desired Visual Direction (Stage 3 Target)
- KPI cards:
  - Value-forward, compact, short helper copy, no decorative icon circles.
  - Semantic accent support remains.
  - Optional future delta slot only as safe additive prop.
  - Never fabricate values/deltas.
- Section cards:
  - White card surfaces, neutral border, consistent header/content padding.
  - Header/body edge alignment consistent with table/card rhythm.
- Empty states:
  - Neutral compact style first.
  - Approved labels:
    - Data not yet available
    - Target not set
    - Scheduling data required
    - Coming soon
    - All clear
    - No overdue tasks
  - Neutral token set:
    - bg `#F7F7F7` (`--empty-bg`)
    - border `#E2E2E2` (`--empty-border`)
    - text `#5F5F5F` (`--empty-text`)
    - muted `#8A8A8A` (`--empty-muted-text`)
    - icon `#9A9A9A` (`--empty-icon`)
- Pagination:
  - Neutral table footer shell + edge alignment consistency.
- MoneyInput / FilterBar:
  - Visually aligned with Stage 2 input/select primitives.
  - No interaction/logic change.

## Exact Recommended Class/Token Changes (Implementation Later)

### A) `KpiCard` (recommended)
- Base shell:
  - move to neutral card tokens: `--surface-card`, `--border-default`, `--text-primary-neutral`, `--text-muted-neutral`.
  - keep subtle elevation via existing shadow tokens.
- Compactness:
  - enforce compact vertical rhythm (target visual height around dashboard guidance, no verbose helper block).
  - cap helper line length and spacing.
- Icon treatment:
  - de-emphasize icon container or make icon container optional via additive variant.
  - do not use decorative pill/circle as dominant element by default.
- Accent handling:
  - keep semantic accents via existing `variant`/`accent` mapping.
  - map visual accent edges to neutral + semantic text accents only (avoid full saturated fills).
- Optional delta slot:
  - add only as additive prop (e.g. `delta?: ReactNode` or structured object), default off.
  - no computed/fake delta behavior in component.

### B) `SectionCard` (recommended)
- Header shell:
  - replace warm header background with neutral header token family (`--surface-neutral`).
  - border to `--table-border`/`--border-default` equivalent.
- Padding rhythm:
  - standardize header/body horizontal edges to table rhythm tokens where relevant.
- Keep API:
  - no changes to `title/description/actions/noPadding`.

### C) `EmptyState` (recommended)
- Add safe additive tone model (preferred):
  - introduce additive prop, e.g. `tone?: 'default' | 'neutral'` with `'default'` preserving current output.
  - style `neutral` using `--empty-*` token family.
- Compact branch:
  - make compact neutral style default for dashboard/list placeholders where possible.
- Approved labels guidance:
  - document and enforce via usage notes (not hardcoded behavior change).
- Keep behavior:
  - no logic changes for action rendering, icon rendering, or layout branching.

### D) `Pagination` (recommended)
- Footer shell:
  - neutralize to table footer shell tokens (`--surface-neutral`, `--table-border`, `--text-muted-neutral`).
- Edge alignment:
  - replace hardcoded `px-4` with table edge token strategy (`--table-edge-padding-x`) or utility wrapper.
- Keep logic:
  - no changes to URL param behavior or paging calculations.

### E) `MoneyInput` (recommended)
- Styling-only migration:
  - align select/input visuals to Stage 2 input/select token set:
    - `--input-bg`, `--input-bg-focus`, `--input-border`, `--input-focus-border`, `--input-focus-ring`, `--input-placeholder`.
- Implementation strategy:
  - safest first step is preserving current structure and replacing inline style token values only.
  - optional later refactor to shared primitives only if behavior parity is proven.
- Must keep unchanged:
  - currency state handling, conversion logic, amount parsing, default option behavior.

### F) `FilterBar` (recommended)
- Search control styling:
  - map built-in search input to Stage 2 input token styling.
  - icon and clear-link colors to neutral text tokens.
- Keep behavior:
  - preserve `searchName`, `defaultValue`, and `onSearchChange` contract exactly.
  - no form submission/URL logic changes.

## Variant vs Default Replacement Strategy
- Safer recommendation:
  - prefer additive variants where default replacement risks broad visual/behavior regressions.
- Component guidance:
  - `EmptyState`: additive `tone="neutral"` is safer than replacing default.
  - `KpiCard`: additive compact/visual variant safer than forced default change at once.
  - `SectionCard`, `Pagination`, `FilterBar`: mostly safe to update defaults because they are shell-oriented and token-driven.
  - `MoneyInput`: keep structure and behavior; perform class/token migration incrementally.

## API Risk Assessment
- Low risk:
  - `SectionCard`, `Pagination`
- Low-medium risk:
  - `FilterBar`, `EmptyState`
- Medium risk:
  - `KpiCard`, `MoneyInput` (high usage + semantic expectations)

## What Not To Touch During Stage 3 Execution
- Do not touch:
  - routes, auth, permissions, database/schema
  - server actions, lib queries
  - dashboard/layout/module feature files
  - form/business logic or data shaping
- Do not remove backward-compatible aliases in shared props unless all call-sites are migrated first.
- Do not add fake KPI/delta/finance placeholders.

## Acceptance Criteria (Stage 3 Execution)
- Only target shared components (and minimal `app/globals.css` alias bridge if required) are changed.
- Visuals align with neutral design direction for KPI/section/empty/pagination/filter/money input shells.
- Component APIs remain backward compatible; additive props only when necessary.
- No behavior changes in interaction, parsing, navigation, or selection.
- No `#F4F4F1`.
- Build/typecheck pass.

## Build and Typecheck Plan
1. Update shared components incrementally, starting with low-risk shells (`SectionCard`, `Pagination`).
2. Validate after each component cluster:
   - `npm run build`
   - `npx tsc --noEmit`
3. Continue to medium-risk components (`FilterBar`, `EmptyState`), then highest-risk (`KpiCard`, `MoneyInput`).
4. If regressions occur, rollback to previous component chunk and re-apply with additive variant strategy.

## Manual QA Checklist

### KPI Card
- Value dominates visual hierarchy.
- Card remains compact; helper text is secondary and short.
- No icon circle as dominant decorative element.
- Semantic accents render correctly for warning/danger/success/primary.
- No fake delta/value displayed.

### Section Card
- Card surface is neutral white.
- Header strip is neutral, not muddy/warm.
- Header/content padding rhythm is consistent.
- Table and section edges align cleanly.

### Empty State
- Neutral compact style reads clearly.
- Approved label copy patterns used where relevant.
- Neutral token mapping matches:
  - bg `#F7F7F7`
  - border `#E2E2E2`
  - text `#5F5F5F`
  - muted `#8A8A8A`
  - icon `#9A9A9A`
- No fake numeric placeholders.

### Pagination
- Footer shell visually matches neutral table ecosystem.
- First/last edge alignment consistent with table rhythm.
- Prev/Next disabled states unchanged functionally.

### Money Input
- Visual parity with input/select primitives.
- Currency switch and amount edit behavior unchanged.
- Conversion hint logic unchanged and accurate.

### Filter Bar
- Search input visually aligned with primitive input style.
- Clear action styling neutral and readable.
- `searchName/defaultValue/onSearchChange` behavior unchanged.

### Global
- No `#F4F4F1` in touched files.
- Focus visibility and keyboard accessibility preserved.
