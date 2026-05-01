# Stage 2 UI Primitives Porting Plan (Plan Only)

## Scope and Constraints
- Goal: port visual styling for shared UI primitives only, preserving behavior and APIs.
- In scope files for implementation phase:
  - `components/ui/table.tsx`
  - `components/ui/input.tsx`
  - `components/ui/textarea.tsx`
  - `components/ui/select.tsx`
  - `app/globals.css` (token/utilities alignment only if needed)
- Out of scope:
  - routes/auth/permissions/database/server actions/lib queries
  - dashboard/sidebar logic
  - form logic/business logic
  - invoice/payment/compensation/project/task logic
- Hard guards:
  - no `#F4F4F1`
  - preserve component APIs and exported symbols
  - no behavior changes (interaction semantics, controlled/uncontrolled flow, Radix wiring)
  - token name guard: before implementation, inspect `app/globals.css` and use exact existing token names; if a planned token is missing, use an existing equivalent or add a minimal bridge alias in `app/globals.css` (no duplicate/random token creation)
  - table edge alignment guard: preserve first/last column outer-edge alignment to `--table-edge-padding-x` while middle cells use `--table-cell-padding-x`; if base padding in `components/ui/table.tsx` changes, ensure existing global `[data-slot="table"]`/`table-edge-align` behavior still controls outer edges correctly
  - Stage 2 execution is blocked until Stage 1 local smoke test passes after `.env.local` is available

## Source References Used
- `docs/handoff/02_GLOBAL_COLOR_SYSTEM.md`
- `docs/handoff/06_TABLE_INPUT_EMPTY_STATE_HANDOFF.md`
- `app/globals.css` (current repo)
- current primitive files listed above

## Current State by Primitive

### 1) `components/ui/table.tsx`
- Already tokenized via `--color-*` variables.
- Uses warm legacy surface tokens in header/footer/hover (`--color-surface-subtle`, `--color-surface-muted`), not Stage 2 neutral table tokens.
- Cell paddings are hardcoded `px-4` instead of table edge/cell token strategy.
- Wrapper has `overflow-auto` but not explicitly tied to neutral scrollbar utility class.

### 2) `components/ui/input.tsx`
- Visual base uses legacy tokens (`--color-surface`, `--color-border`, `--color-primary`).
- Placeholder currently points to `--color-text-muted`, while Stage direction requires `--input-placeholder`.
- Focus ring/color uses legacy primary (indigo), while Stage direction for form controls uses brand red input focus tokens.
- API is stable and minimal (`InputProps` extends native input props).

### 3) `components/ui/textarea.tsx`
- Same visual pattern as `Input`, also on legacy token set.
- Focus and placeholder treatment diverges from handoff input spec.
- API is stable (`TextareaProps` extends native textarea props).

### 4) `components/ui/select.tsx`
- `SelectTrigger` still uses legacy surface/border/focus tokens.
- `SelectContent` and item focus states use warm/legacy neutral surfaces instead of explicit Stage 2 neutral tokens.
- Structure and Radix semantics are correct; risk is mostly visual drift.

### 5) `app/globals.css`
- Stage 1 additive tokens/utilities exist:
  - table/input/empty/chart/scrollbar tokens
  - `.table-edge-align`, `.table-edge-align--contained`, `.scrollbar-neutral`
  - global placeholder + autofill normalization
- This foundation is ready for primitive class migration in Stage 2.

## Desired Direction vs Current Gaps
- Table primitives should use:
  - header bg `--table-header-bg`
  - border `--table-border`
  - header text `--table-header-text`
  - row hover `--table-row-hover`
  - edge alignment via existing table-edge utilities
- Input/textarea/select trigger should use:
  - bg `--input-bg`, focus bg `--input-bg-focus`
  - border `--input-border`
  - placeholder `--input-placeholder`
  - focus border/ring `--input-focus-border` + `--input-focus-ring`
- Select menu/content and option hover/focus should use neutral table/input-family tokens rather than warm legacy surfaces.

## Exact Planned Class/Style Changes (Implementation Later)

### A) `components/ui/table.tsx`
- `Table` wrapper:
  - from: `w-full overflow-auto`
  - to: `w-full overflow-auto scrollbar-neutral`
- `TableHeader`:
  - from: `border-[var(--color-border)] bg-[var(--color-surface-subtle)]`
  - to: `border-[var(--table-border)] bg-[var(--table-header-bg)]`
- `TableBody`:
  - from: `divide-[var(--color-border)]`
  - to: `divide-[var(--table-border)]`
- `TableFooter`:
  - from: `border-[var(--color-border)] bg-[var(--color-surface-muted)]`
  - to: `border-[var(--table-border)] bg-[var(--surface-neutral)]`
- `TableRow` hover:
  - from: `hover:bg-[var(--color-surface-subtle)]`
  - to: `hover:bg-[var(--table-row-hover)]`
- `TableHead` spacing/color:
  - from: `px-4 ... text-[var(--color-text-muted)]`
  - to: `px-[var(--table-cell-padding-x)] ... text-[var(--table-header-text)]`
- `TableCell` spacing:
  - from: `px-4`
  - to: `px-[var(--table-cell-padding-x)]`
- Alignment safety check:
  - verify first/last cell outer padding is still governed by global table edge alignment rules and not accidentally overridden by primitive base classes
- Keep all data attributes and checkbox selectors as-is.

### B) `components/ui/input.tsx`
- Base classes:
  - from: `border-[var(--color-border)] bg-[var(--color-surface)] ... placeholder:text-[var(--color-text-muted)]`
  - to: `border-[var(--input-border)] bg-[var(--input-bg)] ... placeholder:text-[var(--input-placeholder)]`
- Focus classes:
  - from: `focus-visible:ring-[var(--color-primary)] ... border-[var(--color-primary)]`
  - to: `focus-visible:ring-[color:var(--input-focus-ring)] focus-visible:border-[var(--input-focus-border)] focus-visible:bg-[var(--input-bg-focus)]`
- Keep height, radius, file input styling, disabled behavior unchanged.

### C) `components/ui/textarea.tsx`
- Base classes:
  - align to same token mapping as `Input`.
- Focus classes:
  - use `--input-focus-border`, `--input-focus-ring`, and focus bg token.
- Keep `min-h`, `resize-y`, API, and refs unchanged.

### D) `components/ui/select.tsx`
- `SelectTrigger`:
  - align bg/border/placeholder/focus tokens with `Input`.
- `SelectContent`:
  - from legacy `--color-surface`, `--color-border`
  - to neutral tokenized shell (`--surface-card` or `--input-bg-focus` for content, `--table-border` for border).
- `SelectItem` focus state:
  - from `focus:bg-[var(--color-surface-muted)]`
  - to neutral hover/focus tone (`--table-row-hover` or `--surface-neutral`).
- Keep Radix portals, animations, keyboard behavior, and item indicator logic unchanged.

### E) `app/globals.css` (only if needed during Stage 2 implementation)
- No new color invention.
- Only add bridge aliases if a primitive requires a token alias not yet present.
- Do not touch font import stack, Tailwind directives, or base reset behavior.

## Component API Risk Assessment
- `Table`: low risk; no prop/interface changes expected.
- `Input`: low risk; purely class token swap.
- `Textarea`: low risk; purely class token swap.
- `Select`: low-medium risk due to Radix focus/portal layering; ensure only visual class changes.
- Main regression risk:
  - focus-visible accessibility regression if ring classes are changed incorrectly.
  - contrast drift if wrong token used for text on neutral backgrounds.

## What Not To Touch During Stage 2 Implementation
- Do not edit business/domain modules.
- Do not modify feature components except consuming existing primitive output naturally.
- Do not change primitive props, signatures, refs, or exports.
- Do not change data attributes used by tests/selectors.
- Do not alter motion semantics in Radix select open/close transitions.
- Do not add any `#F4F4F1`.

## Acceptance Criteria (Stage 2 Execution)
- Primitive visuals align to handoff neutral system for table/input/textarea/select.
- Existing primitive APIs unchanged (compile-safe, call-site-safe).
- No behavior changes (focus, keyboard, disabled, selection semantics remain intact).
- No component/business logic files touched outside approved primitives + optional `globals.css` token bridge.
- No `#F4F4F1` introduced.
- `npm run build` passes.
- `npx tsc --noEmit` passes.

## Build/Typecheck Plan (When Implementing Stage 2)
1. Apply class-only changes in primitives incrementally.
2. Run `npm run build`.
3. Run `npx tsc --noEmit`.
4. If failures appear, only adjust token/class bindings in scoped primitive files.
5. Re-run both commands until green.

## Manual QA Checklist (After `.env.local` Available)
- Inputs:
  - default/focus/disabled states consistent across forms.
  - placeholder tone is soft neutral (`--input-placeholder`), not body text color.
  - browser autofill stays neutral (no yellow wash).
- Textarea:
  - focus ring/border behavior matches input.
  - resize behavior unchanged.
- Select:
  - trigger default/focus/disabled visual parity with input.
  - menu surface/border/item focus states neutral and readable.
  - keyboard nav and selection unchanged.
- Tables:
  - header bg/border/text follow table tokens.
  - row hover neutral.
  - first/last column edge alignment consistent where `table-edge-align` is used.
  - horizontal scroll uses neutral scrollbar utility where table overflows.
- Global guardrails:
  - no `#F4F4F1` in touched files.
  - no visual regression in dashboard cards caused by primitive changes.
