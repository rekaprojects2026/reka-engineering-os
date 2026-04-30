# Dashboard Handoff

## 1) Old Dashboard Problems
- Cluttered composition with weak priority hierarchy.
- Too many widgets competing visually as equal priority.
- Inconsistent spacing and card rhythm across role dashboards.
- Finance visibility risked misleading interpretation if metrics were displayed without strict definitions.

## 2) Phase A (Implemented)
- Shared spacing rhythm via dashboard tokens and section wrappers.
- KPI-band pattern established (`KpiStrip` + shared `KpiCard` behavior).
- Greeting headline standardized (`Hello, <Name>!`).
- Chart footer treatment neutralized and tightened.
- Empty states converted to neutral compact style in many dashboard sections.
- Placeholder semantics introduced to avoid fake values.

## 3) Phase B (Implemented + Partial)
- Tabs implemented for Owner/PM shell:
  - Overview
  - Commercial
  - Projects
  - Resources
  - Finance
- Commercial tab content component implemented (`DashboardCommercialPanels.tsx`).
- Direktur and Manajer dashboards now render tabbed shell.
- TD currently remains a separate dashboard structure (not full Owner/PM tab shell) — deliberate role branch, final parity still under review.

## 4) Phase B2 Visual Direction
- Compact command-center layout.
- Larger neutral segmented tabs.
- Value-forward KPI cards (minimal decorative noise).
- Semantic accent usage (not full-card saturation).
- Main + right-rail desktop composition.
- Minimize unnecessary desktop scroll.
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- Hard avoid muddy dashboard surface (`#F4F4F1`).

### Current status
- **Implemented:** core tab shell, many section structures, placeholders, token base.
- **Still under revision:** final KPI density/height/copy tuning, full layout polish consistency across all tabs/roles.
- Current known Dashboard B2 issue: KPI cards became too tall / copy-heavy after the latest pass. Next fix is to reduce KPI height to ~7–7.5rem, make values more dominant, trim helper copy, and ensure four-card KPI rows fill the available horizontal width cleanly.

## Role Behavior Decision Table

| Role | Current dashboard | Desired final behavior | Decision status |
|------|-------------------|------------------------|-----------------|
| Direktur | Tabbed Owner/PM | Keep | Final |
| Manajer | Tabbed Owner/PM | Keep scoped where needed | Verify |
| Technical Director | Separate dashboard | TBD: separate or tabbed project/resource-focused | Pending |
| Finance | Separate role dashboard | TBD | Pending |
| BD | Separate role dashboard | TBD | Pending |
| Personal/Freelancer | Existing role dashboard | Keep unless product changes | Verify |

## 5) Final Target Layout Per Tab

### Overview
- Main left:
  - Revenue MTD
  - Active Receivables
  - Active Projects
  - Commercial Pipeline
- Right rail:
  - Needs Attention
- Below main:
  - Active Projects Kanban Preview
- Right rail lower:
  - Project Queue / Starting Next Week
  - Recent Activity

### Commercial
- Main:
  - KPI cards
  - Lead Pipeline
- Right rail:
  - Outreach Follow-up Queue
  - Contracts
  - Recent Client Activity

### Projects
- KPI:
  - Active Projects
  - Open Tasks
  - Overdue Tasks
  - Pending Client Review
- Below:
  - Active Projects Board
  - Problem Projects
  - Deadline Pressure
  - Task Status
  - Deliverables Needing Review

### Resources
- KPI:
  - Active People
  - Assigned Tasks
  - Overdue Assignments
  - Capacity
- Below:
  - Team Workload
  - Assigned Tasks by Person
  - Overdue Tasks by Person
  - Talent Availability

### Finance
- KPI:
  - Revenue MTD
  - Active Receivables
  - Overdue Client Invoices
  - Outstanding Talent Payments
- Right rail:
  - Finance Needs Attention
- Below:
  - Revenue Trend / Target Progress Detail
  - Receivables Summary
  - Invoice Summary
  - Talent Payment / Compensation Summary
  - Gross Profit placeholder
  - Cashflow placeholder

## 6) Finance Corrections (Must Keep)
- Target Hit must not be treated as separate KPI in final Finance layout.
- Target progress belongs inside Revenue MTD card.
- Outstanding Talent Payments means confirmed owed unpaid only.
- Draft/pending compensation is an attention signal, not automatically payable headline amount.
- No fake GP/cashflow/target/revenue trends.

## 7) KPI Card Target
- Keep cards compact, not tall.
- Fill horizontal width cleanly.
- Make value visually dominant.
- Keep supporting copy short.
- No icon circles as primary visual.
- Use subtle semantic accents.
- Reserve optional future delta slot.
- Never show fake deltas.

## 8) Kanban Target
- Horizontal scroll allowed where needed.
- Column coverage through Done if mapped from real statuses.
- Use approved semantic status color logic.
- Do not invent statuses.

## 9) C1/C2 Reminders
- C1: KPI delta/trend support for safe metrics first.
- C2: reliable finance metrics only.
- Keep no-fake-finance policy strict.

## 10) Current Dashboard QA Checklist
- Verify all five tabs render and switch cleanly.
- Verify role-branch rendering (Direktur, Manajer, TD, Finance, BD, personal roles).
- Confirm no fake metrics, fake sparklines, or fake deltas.
- Confirm no `NaN`/`Infinity` appears in KPI or chart helpers.
- Validate compactness/readability balance on desktop and stacked behavior on mobile.
- Minimize unnecessary scroll on desktop, but readability wins over forced no-scroll.
