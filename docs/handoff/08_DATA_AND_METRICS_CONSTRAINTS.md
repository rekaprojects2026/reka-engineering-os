# Data and Metrics Constraints

## 1) Finance Safety
- No fake revenue.
- No fake target.
- No fake gross profit.
- No fake cashflow.
- No fake sparkline.
- No fake delta.
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- Keep `#F4F4F1` as a hard avoid in dashboard UI.

## Dashboard Role Behavior Decision Table

| Role | Current dashboard | Desired final behavior | Decision status |
|------|-------------------|------------------------|-----------------|
| Direktur | Tabbed Owner/PM | Keep | Final |
| Manajer | Tabbed Owner/PM | Keep scoped where needed | Verify |
| Technical Director | Separate dashboard | TBD: separate or tabbed project/resource-focused | Pending |
| Finance | Separate role dashboard | TBD | Pending |
| BD | Separate role dashboard | TBD | Pending |
| Personal/Freelancer | Existing role dashboard | Keep unless product changes | Verify |

## 2) Revenue MTD
- Must follow one explicit definition:
  - paid invoice basis, or
  - received payment basis.
- Do not silently mix both in one KPI.
- For roles where reliability is not guaranteed, show placeholder copy instead of fabricated value.

## 3) Active Receivables
- Defined as unpaid + partial client invoice balances.
- Must align with Finance-page summary logic.

## 4) Overdue Client Invoices
- Defined as unpaid/partial invoices with `due_date` before current date.
- Must explicitly decide whether headline shows amount, count, or both.

## 5) Outstanding Talent Payments
- Include confirmed owed unpaid amounts only.
- Exclude draft compensation from payable headline.
- Pending compensation remains attention workflow signal, not payable total.

## 6) Target Progress
- Monthly target should come from a proper Finance settings source.
- Until target exists, show `Target not set`.
- Never render fake percentages.

## 7) Gross Profit / Cashflow
- Placeholder-only until reliable data model is validated.
- Gross profit requires trusted COGS/direct project cost modeling.
- Cashflow requires ledger/bank cash movement events.

## 8) Commercial Metrics
- Reuse existing lead/outreach/client data pipelines.
- Contracts remain placeholder until domain model is implemented.
- Do not fake contract value totals.

## 9) Project Metrics
- Pending client review requires one canonical mapping.
- Queue/start-next-week requires clear `start_date` and queue semantics.
- Projects done this month requires trustworthy completion-date/status-history logic.

## 10) KPI Delta / Trend
- C1 future scope.
- Sentiment must be metric-specific; avoid naive `up = green`.
- Never output `NaN`/`Infinity`.
- Never fake `+0%` when history is missing.

## 11) Data Gap List
- Monthly target storage
- Revenue recognition definition
- Receivables balance canonical query
- Overdue invoice canonical query
- Outstanding talent payment canonical query
- Project `completed_at` or audited status transition data
- Project `start_date` semantics
- Capacity model
- Talent availability model
- COGS/direct cost model
- Ledger/cashflow events
- Contracts model
- User Access admin UI completion

## 12) Finance Wording Rules (Mandatory)
- **Outstanding Talent Payments**
  - Use only for confirmed owed unpaid talent amounts.
  - Must not include draft/pending compensation values by default.
- **Pending Compensation**
  - Use for workflow state requiring review/approval/confirmation.
  - Treat as attention item, not payable headline amount.
- **Overdue Client Invoices**
  - Use only for unpaid/partial client invoices past due date.
  - Keep wording client-invoice specific (not general receivables).
- **Active Receivables**
  - Use for total unpaid + partial client invoice balances currently open.
  - Do not use as synonym for overdue invoices; overdue is a subset.
