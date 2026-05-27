# Global Color System

This file is the canonical color reference for UI continuation. Do not invent additional colors without explicit approval.

## 1) Brand Core
- REKA Red / Primary: `#A12228`
- Primary Hover: `#8F1E24`
- Primary Soft Tint: `#F6EAEA`
- Primary Border Soft: `#E7C7CA`

## 2) Base Surfaces
- Existing App Canvas / Shell BG: **Not active in current CSS** (`#ECE8DC` not found in `app/globals.css`)
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- Surface / Card: `#FFFFFF`
- Surface Neutral: `#F8F8F8`
- Surface Neutral 2 / Empty BG: `#F7F7F7`
- Neutral Chip BG: `#F0F0F0`
- Placeholder Track / Chart Track: `#ECECEC`
- Hard avoid in dashboard: `#F4F4F1`

## 3) Borders
- Default Border: `#E5E7EB`
- Strong Border: `#D1D5DB`
- Empty Border: `#E2E2E2`
- Very Soft Divider: `#F0F0F0`
- Chart Footer / Neutral Divider: `#E2E2E2`

## 4) Text
- Text Primary: `#1F2937`
- Text Secondary: `#4B5563`
- Text Muted: `#6B7280`
- Text Soft Muted: `#8A8A8A`
- Text Disabled: `#9A9A9A`
- Placeholder Text: `#C4C4C4`
- Empty Text: `#5F5F5F`
- Empty Icon: `#9A9A9A`

## 5) Inputs
- Input BG: `#F8F8F8`
- Input Focus BG: `#FFFFFF`
- Input Border: `#E5E7EB`
- Input Placeholder: `#C4C4C4`
- Focus Border: `#A12228`
- Focus Ring: `rgba(161, 34, 40, 0.12)`

## 6) Tables
- Table Header BG: `#F8F8F8`
- Table Border: `#E5E7EB`
- Table Header Text: `#4B5563`
- Table Row Hover: `#F3F4F6`
- Table Scroll Track: `#F3F4F6`
- Table Scroll Thumb: `#D1D5DB`
- Table Scroll Hover: `#9CA3AF`

## 7) Empty States
- Empty BG: `#F7F7F7`
- Empty Border: `#E2E2E2`
- Empty Text: `#5F5F5F`
- Empty Muted Text: `#8A8A8A`
- Empty Icon: `#9A9A9A`
- Neutral Chip BG: `#F0F0F0`
- Neutral Chip Text: `#8A8A8A`
- Neutral Chip Border: `#E2E2E2`
- Placeholder Track: `#ECECEC`
- Chart Neutral Line: `#ECECEC`

## 8) Dashboard Category Accents
- Overview / Brand Accent: `#A12228`
- Overview Soft Tint: `#F6EAEA`
- Commercial Accent: `#B45309`
- Commercial Soft Tint: `#FFF3E3`
- Projects Accent: `#9C3D32`
- Projects Soft Tint: `#F8EDEA`
- Resources Accent: `#4A5D44`
- Resources Soft Tint: `#EEF4EC`
- Finance Accent: `#5C3D5C`
- Finance Soft Tint: `#F3ECF3`
- Commercial Strong: `#92400E`
- Projects Strong: `#7F2F28`
- Resources Strong: `#354832`
- Finance Strong: `#4A314A`

## 9) Status / Workflow Colors
### Project/Kanban
- New: accent `#9A9A9A`, bg `#F7F7F7`, text `#5F5F5F`
- Ready to Start: accent `#D97706`, bg `#FFF7E6`, text `#92400E`
- In Progress: accent `#EA580C`, bg `#FFF1E8`, text `#9A3412`
- Internal Review: accent `#2563EB`, bg `#EFF6FF`, text `#1D4ED8`
- Client Review / Waiting Client: accent `#7C3AED`, bg `#F3EFFF`, text `#6D28D9`
- Revision: accent `#C2410C`, bg `#FFF0E8`, text `#9A3412`
- On Hold / Blocked: accent `#B91C1C`, bg `#FEF2F2`, text `#991B1B`
- Done / Completed: accent `#15803D`, bg `#ECFDF3`, text `#166534`
- Cancelled / Archived: accent `#6B7280`, bg `#F3F4F6`, text `#4B5563`

### Task
- To Do: accent `#9A9A9A`, bg `#F7F7F7`, text `#5F5F5F`
- In Progress: accent `#EA580C`, bg `#FFF1E8`, text `#9A3412`
- Waiting / Blocked: accent `#B91C1C`, bg `#FEF2F2`, text `#991B1B`
- Review: accent `#2563EB`, bg `#EFF6FF`, text `#1D4ED8`
- Done: accent `#15803D`, bg `#ECFDF3`, text `#166534`

### Commercial
- New Lead: accent `#B45309`, bg `#FFF3E3`, text `#92400E`
- Contacted: accent `#2563EB`, bg `#EFF6FF`, text `#1D4ED8`
- Follow-up Due: accent `#D97706`, bg `#FFF7E6`, text `#92400E`
- Proposal Sent: accent `#7C3AED`, bg `#F3EFFF`, text `#6D28D9`
- Negotiation: accent `#C2410C`, bg `#FFF0E8`, text `#9A3412`
- Won / Converted: accent `#15803D`, bg `#ECFDF3`, text `#166534`
- Lost / Inactive: accent `#6B7280`, bg `#F3F4F6`, text `#4B5563`

### Finance
- Paid: accent `#15803D`, bg `#ECFDF3`, text `#166534`
- Partially Paid: accent `#D97706`, bg `#FFF7E6`, text `#92400E`
- Unpaid: accent `#6B7280`, bg `#F3F4F6`, text `#4B5563`
- Overdue: accent `#B91C1C`, bg `#FEF2F2`, text `#991B1B`
- Draft: accent `#9A9A9A`, bg `#F7F7F7`, text `#5F5F5F`
- Pending Approval: accent `#7C3AED`, bg `#F3EFFF`, text `#6D28D9`
- Outstanding Talent Payment: accent `#B45309`, bg `#FFF3E3`, text `#92400E`

## 10) Delta / Trend Colors
- Positive: accent `#15803D`, bg `#ECFDF3`
- Negative: accent `#B91C1C`, bg `#FEF2F2`
- Caution: accent `#D97706`, bg `#FFF7E6`
- Neutral: accent `#6B7280`, bg `#F3F4F6`

## 11) Sidebar Colors
- Sidebar BG: `#FFFFFF`
- Sidebar Border: `#E5E7EB`
- Sidebar Hover: `#F8F8F8`
- Sidebar Active BG: `#F8F8F8`
- Sidebar Active Text: `#1F2937`
- Sidebar Section Label: `#8A8A8A`
- Sidebar Disabled Text: `#9A9A9A`
- Sidebar Soon Badge BG: `#F0F0F0`
- Sidebar Soon Badge Text: `#9A9A9A`

## 12) Dashboard Tabs Colors
- Tabs Container BG: `#F8F8F8` (or transparent page bg)
- Tabs Border: `#E5E7EB`
- Tab Inactive Text: `#6B7280`
- Tab Hover BG: `#FFFFFF`
- Tab Active BG: `#FFFFFF`
- Tab Active Text: `#1F2937`
- Tab Active Border: `#D1D5DB`
- Active Accent: `#A12228` (small underline/dot only when needed)

## 13) KPI Card Colors
- KPI Card BG: `#FFFFFF`
- KPI Border: `#E5E7EB`
- KPI Label: `#6B7280`
- KPI Value: `#1F2937`
- KPI Helper: `#8A8A8A`

KPI-specific accents:
- Revenue MTD: `#A12228` or `#5C3D5C`
- Active Receivables: `#D97706`
- Active Projects: `#9C3D32`
- Commercial Pipeline: `#B45309`
- Active Leads: `#B45309`
- Outreach Due: `#D97706`
- New Clients: `#15803D`
- Open Tasks: `#9C3D32`
- Overdue Tasks: `#B91C1C` if >0, `#15803D` if 0
- Pending Client Review: `#7C3AED`
- Active People: `#4A5D44`
- Capacity: `#6B7280`
- Overdue Client Invoices: `#B91C1C`
- Outstanding Talent Payments: `#D97706`

## 14) Chart Colors
- Chart Primary / Brand: `#A12228`
- Chart Commercial: `#B45309`
- Chart Projects: `#9C3D32`
- Chart Resources: `#4A5D44`
- Chart Finance: `#5C3D5C`
- Chart Positive: `#15803D`
- Chart Warning: `#D97706`
- Chart Critical: `#B91C1C`
- Chart Neutral Track: `#ECECEC`
- Chart Grid Line: `#ECECEC`
- Chart Label: `#6B7280`

## 15) Usage Rules
- Use white cards as default dashboard surfaces.
- Use accent borders/tints sparingly and consistently.
- Keep neutral grays literal and clean (avoid muddy/warm dashboard fills).
- Never use `#F4F4F1` in dashboard UI.
- Avoid saturated full-card backgrounds.
- Never fake chart/delta/progress color semantics without validated data.

## 16) Card & Shadow Tokens

### Implemented in current CSS (`app/globals.css`)
- `--shadow-card`: `0 10px 25px rgba(15, 23, 42, 0.06)`
- `--shadow-card-hover`: `0 14px 30px rgba(15, 23, 42, 0.08)`
- `--shadow-sm`:
  - `0 1px 2px rgba(15, 23, 42, 0.04)`
  - `0 1px 1px rgba(15, 23, 42, 0.02)`
- `--shadow-md`:
  - `0 10px 28px rgba(15, 23, 42, 0.07)`
  - `0 1px 2px rgba(15, 23, 42, 0.04)`

### Recommended Usage Mapping (Not new implementation)
- Base card elevation: `--shadow-card`.
- Hover/elevated interactive card state: `--shadow-card-hover`.
- Small utility surfaces (limited): `--shadow-sm`.
- Overlays/popovers/menus/dialog surfaces: `--shadow-md`.

### Guardrails
- Do not invent additional shadow tokens unless explicitly approved.
- Keep white/neutral card surfaces with subtle shadow only.
- `#ECE8DC` is not an active recommended token in current CSS. Treat as legacy only unless intentionally reintroduced.
- Keep `#F4F4F1` as hard avoid in dashboard UI.
