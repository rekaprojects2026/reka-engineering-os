# Global UI/UX Direction

## Design Goal
- Move REKA OS from a raw functional admin prototype into a cleaner, premium internal operating system.
- Primary product use cases:
  - Project tracking
  - Commercial pipeline
  - Client management
  - People/talent management
  - Finance visibility
  - Internal operations
- Prioritize scan speed, hierarchy, compact clarity, accurate state communication, and role-aware readability.

## Visual Personality
### Preferred
- Clean
- Structured
- Warm-neutral
- Engineering studio
- Premium but practical
- Minimal, not empty
- Data-first

### Avoid
- Generic admin template look
- Cold blue SaaS look
- Muddy beige dashboard surfaces
- Overly red interface
- Gray-on-gray visual soup
- Decorative clutter
- Fake analytics optics

## Global Color Direction
- Brand accent is REKA red `#A12228`; it is not a full-UI fill color.
- Keep cards/surfaces white or near-white with neutral gray border rhythm.
- Use semantic accent colors as scan cues, not decorative large fills.
- Dashboard must avoid `#F4F4F1` (hard avoid).
- `#ECE8DC` verification result:
  - **Current repo check:** `#ECE8DC` is not found in `app/globals.css`, `app/layout.tsx`, or protected layout files.
  - `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.

## Typography Direction
- Use clean sans-serif UI baseline (currently Manrope in `app/globals.css`).
- No display serif for core dashboard/admin body UI.
- Greeting title should be visually prominent and immediate.
- KPI values should dominate card hierarchy.
- Helper text should stay short and actionable.
- Avoid tiny labels and long paragraph KPI explanations.

## Spacing and Density
- Compact but not cramped.
- Avoid oversized dead zones.
- Keep consistent spacing between card headers, section dividers, and body blocks.
- Optimize desktop dashboard for minimal scroll where possible.
- Use main + right-rail layouts for high-priority executive scanning.

## Card System
- White/near-white cards.
- Neutral soft borders.
- Subtle radius and restrained shadow.
- KPI cards should be value-forward, concise, and avoid decorative icon circles.

## Card & Shadow System

### Base Card Rules
- Default app card uses white surface, neutral border, and calm elevation.
- Keep card radius consistent with existing tokenized control/card radii.
- Use border-first styling; shadow supports depth, not structure.

### Elevated Card Rules
- Use elevated cards only for high-priority summary blocks (dashboard sections, attention panels, key summaries).
- Elevated cards should still keep white/near-white surfaces and subtle border.
- Avoid stacking multiple strong shadows in nested card structures.

### KPI Card Rules
- KPI cards are value-dominant and compact.
- Keep helper copy short and secondary.
- Avoid icon circles or decorative hero graphics that reduce scan speed.
- **Current known issue to fix:** KPI cards became too tall/copy-heavy in latest B2 pass; reduce to ~7-7.5rem and restore 4-up row fit.

### Table Card Rules
- Table containers should align with section edge gutters and tokenized borders.
- Header zones remain neutral and should not use warm/muddy fills.
- Prefer one table shell style per section (avoid mixed nested table chrome).

### Empty State Card Rules
- Empty states should be compact, neutral, and explicit.
- No fake numeric placeholders in empty states.
- Keep empty cards visually balanced between section divider and card bottom spacing.

### Shadow Usage Rules
- **Implemented tokens (from `app/globals.css`):**
  - `--shadow-card`
  - `--shadow-card-hover`
  - `--shadow-sm`
  - `--shadow-md`
- Use `--shadow-card` as primary surface elevation baseline where card lift is needed.
- Use hover shadow sparingly (`--shadow-card-hover`) on interactive cards only.
- Keep shadows subtle and consistent across modules.

### Suggested Shadow Token Usage (Recommended)
- Base cards: `--shadow-card` or no shadow (if border-only section is preferred).
- Interactive hover cards: `--shadow-card` -> `--shadow-card-hover`.
- Utility small elements/chips: `--shadow-sm` (limited use).
- Menus/popovers/modals: `--shadow-md` where applicable.

### Anti-Patterns
- Deep, dark, or long blur shadows that overpower content.
- Multiple layered shadows across nested cards.
- Inconsistent per-page custom shadows when shared tokens already exist.
- Saturated colored card backgrounds combined with heavy shadows.
- Reintroducing muddy dashboard surfaces (`#F4F4F1` hard avoid).
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.

## Buttons and Actions
- Primary action: REKA red.
- Secondary action: neutral surface/border style.
- Destructive style only for truly destructive actions.
- Avoid overusing red as action color on non-primary controls.

## Sidebar Direction
- IA groups:
  - HOME
  - MY WORKSPACE
  - COMMERCIAL
  - OPERATIONS
  - PEOPLE
  - FINANCE
  - ADMIN
- Section labels should stay calm and muted.
- `Coming Soon` items should be visible but disabled and clearly non-clickable.
- Active state should be neutral, not loud red.
- Collapsed rail should avoid icon noise; mark/logo behavior should remain clear.

## Dashboard Tabs
- Use neutral segmented tab styling.
- Increase click target size and label readability.
- Active tab should use white/off-white + subtle border/shadow, not muddy red/pink fills.

## Tables
- Align title/header/body/footer edges consistently.
- Align first/last columns with section/card gutters.
- Header surface should stay neutral (`#F8F8F8`).
- Use neutral borders and scrollbar styling.
- Avoid warm/muddy table shells.

## Empty States
- Compact, neutral, and explicit.
- Approved style copy patterns:
  - Data not yet available
  - Target not set
  - Scheduling data required
  - Coming soon
  - All clear
  - No overdue tasks
- Never show fake zero values when data is unavailable.

## UI Copy Rules
- Keep copy short, operational, and state-accurate.
- Prefer explicit status language over marketing language.
- Never present unavailable data as numeric zero unless zero is truly measured.
- Use approved placeholder terms consistently:
  - Data not yet available
  - Target not set
  - Scheduling data required
  - Coming soon
  - All clear
  - No overdue tasks
- Avoid ambiguous finance wording in KPI/helper text; follow `08_DATA_AND_METRICS_CONSTRAINTS.md`.

## Forms
- One-column by default.
- Two-column only for natural field pairs.
- Labels above inputs.
- Placeholders are examples, not labels.
- Show helper text where it reduces user error.
- Keep dialogs for short CRUD only.
- Keep long/complex forms on full pages.
- `ProjectForm` remains page-based with section navigation.

## Responsiveness and Accessibility
- Desktop: main + rail where appropriate.
- Mobile: stack and preserve reading order.
- Tabs should wrap/scroll without truncating meaning.
- Keyboard access and visible focus states must remain intact.
- Use semantic controls (real buttons/links), not clickable `div` patterns.
