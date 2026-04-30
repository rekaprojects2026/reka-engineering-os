# Reka Engineering OS — Product Spec v2
_Tanggal: 2026-04-21 | Stack: Next.js 14 (App Router), Supabase, TypeScript, Tailwind, Recharts_

---

## 1. Current State (Baseline)

### App Routes (existing)
| Route | Status | Notes |
|---|---|---|
| `/dashboard` | Live | KPI cards, open tasks, charts (Recharts) |
| `/intakes` | Live | Intake/inquiry management |
| `/intakes/[id]/convert` | Live | Convert intake → project |
| `/projects` | Live | Project list + detail |
| `/tasks` | Live | Task list by project |
| `/deliverables` | Live | Deliverable tracking |
| `/files` | Live | Project file metadata |
| `/clients` | Live | Client list + detail |
| `/compensation` | Live | Compensation records (outgoing only) |
| `/payments` | Live | Team payment summaries |
| `/my-payments` | Live | Member's own payments |
| `/team` | Live | People management |
| `/settings` | Live | Admin config, dropdown values |
| `/search` | Live | Global search |

### Database Tables (existing)
| Table | Key Columns |
|---|---|
| `profiles` | id, full_name, email, system_role, functional_role, worker_type, expected_rate, approved_rate, rate_type, currency_code, bank_name, bank_account_number, ewallet_*, photo_url (missing) |
| `clients` | id, client_code, client_name, client_type, source_default, status, contact fields |
| `intakes` | id, intake_code, client_id, title, discipline, project_type, budget_estimate, status, converted_project_id |
| `projects` | id, project_code, client_id, intake_id, name, discipline, project_type, start_date, target_due_date, project_lead_user_id, status, progress_percent, google_drive_folder_id |
| `project_team_assignments` | id, project_id, user_id, team_role |
| `tasks` | id, project_id, parent_task_id, title, assigned_to_user_id, due_date, estimated_hours, actual_hours, priority, status, progress_percent |
| `deliverables` | id, project_id, linked_task_id, name, type, revision_number, status, submitted_to_client_date, approved_date |
| `project_files` | id, project_id, task_id, deliverable_id, file_name, file_category, provider, manual_link, google_drive_folder_id |
| `compensation_records` | id, member_id, project_id, task_id, rate_type, qty, rate_amount, subtotal_amount, currency_code, status |
| `payment_records` | id, member_id, period_label, total_due, total_paid, balance, currency_code, payment_status |
| `setting_options` | id, domain, value, label, sort_order, is_active |
| `invites` | id, email, token, system_role, expires_at |

### Key Gaps in Current State
- Currency: `currency_code` field exists on some tables but hardcoded to `'IDR'`. No FX rate table. No USD support.
- Finance is outgoing-only: no client invoice, no incoming payment, no payment channels/accounts.
- Deliverables and Files are separate UI tabs with no unified view.
- Kanban: zero infrastructure (all list views only).
- People module: no photo upload, no performance metrics dashboard.
- Intake tab named "Intakes", placed below Clients in nav.
- Dropdowns: migration from hardcoded `lib/constants/options.ts` → `setting_options` table is 50% done.
- Filters: wired to `searchParams` but some may be broken — needs per-page audit.
- Google Drive: `google_drive_folder_id` field exists, actual API integration not live.

---

## 2. Requested Changes — Full Specification

---

### 2.1 Currency System (USD/IDR)

**Requirement**: All money inputs accept USD or IDR. All money displays show both values (e.g., "USD 1,000 (~Rp 16.500.000)").

**Schema changes:**
```sql
-- New table
CREATE TABLE fx_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  from_currency text NOT NULL,  -- 'USD'
  to_currency text NOT NULL,    -- 'IDR'
  rate numeric(20, 6) NOT NULL,
  effective_date date NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Add snapshot rate to all money transaction tables
ALTER TABLE compensation_records ADD COLUMN fx_rate_snapshot numeric(20,6);
ALTER TABLE payment_records ADD COLUMN fx_rate_snapshot numeric(20,6);
-- (same for new invoice/payment tables below)
```

**Storage model**: Always store `amount_original` + `currency_original` + `fx_rate_snapshot` (rate at time of transaction). Never convert and store only IDR — keeps historical accuracy when rate changes.

**FX rate source**: Manual admin entry in Settings page (admin sets USD→IDR rate periodically). Auto-fetch from API (e.g., `api.exchangerate.host`) is optional future enhancement.

**UI component**: `<MoneyDisplay amount currency showConversion />` — renders primary currency + conversion in muted text. Used everywhere an amount is displayed.

**Input component**: `<MoneyInput />` — select USD/IDR + numeric input. If USD selected, show live rough IDR equivalent below the field (uses latest fx_rate from DB).

---

### 2.2 Payment Accounts / Channels

**Requirement**: Minimum 3 accounts: Wise, PayPal, "Rekening Haris" (BCA/etc). Per-project visibility of which account income lands in. Balance per account.

**Schema:**
```sql
CREATE TABLE payment_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,           -- e.g., "Wise USD", "PayPal", "BCA Haris"
  type text NOT NULL,           -- 'wise' | 'paypal' | 'bank' | 'ewallet' | 'other'
  currency text NOT NULL,       -- 'USD' | 'IDR' | 'EUR'
  account_identifier text,      -- email, account number, etc.
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
```

**Balance calculation**: Derived query — `SUM(incoming_payments.net_received WHERE account_id = X) - SUM(outgoing transfers)`. No separate ledger table needed initially.

**Settings page**: CRUD for payment_accounts (admin only).

**Per-project**: `client_invoices.destination_account_id` links each invoice to an account (see §2.3).

---

### 2.3 Invoice & Incoming Payment Tracking

**Requirement**: Track payment from clients (including platform + gateway fees). Auto-generate PDF invoice.

**Schema:**
```sql
CREATE TABLE client_invoices (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_code text UNIQUE NOT NULL,      -- e.g., "INV-2026-001"
  project_id uuid REFERENCES projects(id),
  client_id uuid REFERENCES clients(id),
  issue_date date NOT NULL,
  due_date date,
  currency text NOT NULL,                  -- 'USD' | 'IDR'
  gross_amount numeric(15,2) NOT NULL,
  platform_type text,                      -- 'fiverr' | 'upwork' | 'direct' | other
  platform_fee_pct numeric(5,2) DEFAULT 0, -- e.g., 20.00 for Fiverr
  platform_fee_amount numeric(15,2) GENERATED ALWAYS AS (gross_amount * platform_fee_pct / 100) STORED,
  gateway_fee_pct numeric(5,2) DEFAULT 0,
  gateway_fee_amount numeric(15,2) GENERATED ALWAYS AS ((gross_amount - platform_fee_amount) * gateway_fee_pct / 100) STORED,
  net_amount numeric(15,2) GENERATED ALWAYS AS (gross_amount - platform_fee_amount - gateway_fee_amount) STORED,
  fx_rate_snapshot numeric(20,6),
  destination_account_id uuid REFERENCES payment_accounts(id),
  status text DEFAULT 'draft',             -- 'draft' | 'sent' | 'partial' | 'paid' | 'overdue' | 'void'
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE invoice_line_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES client_invoices(id) ON DELETE CASCADE,
  description text NOT NULL,
  task_id uuid REFERENCES tasks(id),
  deliverable_id uuid REFERENCES deliverables(id),
  qty numeric(10,2) DEFAULT 1,
  unit_price numeric(15,2) NOT NULL,
  subtotal numeric(15,2) GENERATED ALWAYS AS (qty * unit_price) STORED
);

CREATE TABLE incoming_payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  invoice_id uuid REFERENCES client_invoices(id),
  payment_date date NOT NULL,
  amount_received numeric(15,2) NOT NULL,
  currency text NOT NULL,
  fx_rate_snapshot numeric(20,6),
  account_id uuid REFERENCES payment_accounts(id),
  payment_reference text,
  proof_link text,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Platform fee logic**: Fee is **per-invoice** (not per-project), because Upwork uses tiered fees per milestone.

**PDF invoice auto-generate**: Using `@react-pdf/renderer`. Template includes: Reka branding, client details, line items table, total breakdown (gross → platform fee → gateway fee → net), payment instructions per account, due date.

---

### 2.4 Payslip Auto-Generate

**Requirement**: PDF payslip for team members, based on compensation_records.

**Trigger**: From `payment_records` detail page — "Generate Payslip" button.

**Content**: Member info, period, list of compensation line items (project, task, rate_type, qty, rate, subtotal), total due, total paid, balance.

**Implementation**: Same `@react-pdf/renderer` approach as invoices.

---

### 2.5 Fiverr / Upwork Project Source

**Requirement**: Projects from Fiverr or Upwork need to capture platform-specific data.

**Schema**: Add to `intakes` and `projects`:
```sql
ALTER TABLE intakes ADD COLUMN source_platform text; -- 'fiverr' | 'upwork' | 'direct' | 'referral' | other
ALTER TABLE projects ADD COLUMN source_platform text;
```

Platform fee and gateway fee are captured at **invoice level** (§2.3), not project level — this is architecturally correct because a project may have multiple invoices with varying fee structures.

---

### 2.6 Settings — All Dropdowns Editable

**Requirement**: Every dropdown in the app should be managed from the Settings page.

**Current state**: `setting_options` table exists with domain-based entries. Some dropdowns still hardcoded in `lib/constants/options.ts`.

**Action**: 
1. Complete migration — add missing domains to `setting_options`: `lead_status`, `project_status`, `task_status`, `deliverable_status`, `client_type`, `source_platform`, `payment_account_type`, `complexity_level`, `contact_channel`.
2. Settings page: full CRUD per domain, with drag-to-reorder, toggle active/inactive.
3. Retire `lib/constants/options.ts` — replace all static imports with DB queries (with cache).

---

### 2.7 Leads (formerly Intakes)

**Requirement**: Rename "Intakes" → "Leads". Move tab above Clients in nav. Add contact info fields. Add USD/IDR budget. Add quantitative complexity indicator.

**Schema changes to `intakes`:**
```sql
ALTER TABLE intakes RENAME TO leads;  -- or add alias view

-- New fields
ALTER TABLE intakes ADD COLUMN contact_channel text;     -- 'whatsapp' | 'email' | 'instagram' | 'linkedin' | 'other'
ALTER TABLE intakes ADD COLUMN contact_value text;       -- phone number, email address, etc.
ALTER TABLE intakes ADD COLUMN budget_currency text DEFAULT 'IDR';
ALTER TABLE intakes ADD COLUMN complexity_score integer CHECK (complexity_score BETWEEN 1 AND 10);
ALTER TABLE intakes ADD COLUMN complexity_label text GENERATED ALWAYS AS (
  CASE 
    WHEN complexity_score <= 3 THEN 'Low'
    WHEN complexity_score <= 6 THEN 'Medium'
    WHEN complexity_score <= 8 THEN 'High'
    ELSE 'Very High'
  END
) STORED;
```

**Complexity indicator UI**: 1–10 slider or segmented selector. Display as color-coded badge (green/yellow/orange/red) + numeric score.

**Budget field**: `<MoneyInput />` component (§2.1) — select USD/IDR, show IDR equivalent if USD.

**Nav order**: Leads → Clients → Projects → Tasks → Files → People → Finance.

---

### 2.8 Operations Flow (Leads → Projects → Tasks → Files)

**Requirement**: One linear pipeline. No "linked intake" framing in UI. Direct conversion between stages.

**Current flow (schema)**: Already correct — `intakes.converted_project_id` + `projects.intake_id`. No schema change needed.

**UI changes**:
- On Leads list: when status = "Closed/Won", show "Create Project →" action button inline. Clicking opens a modal (not a separate page) pre-filled from lead data. Confirm → project created, lead status updated.
- If project already exists externally (no lead origin): direct "New Project" form on Projects page (status quo).
- On Projects: progress auto-calculated from tasks (see §2.12).
- Pipeline breadcrumb visible on Project detail page: `Lead #XXX → Project #YYY → N Tasks → M Files`.

**Void/Problem flag**:
```sql
ALTER TABLE projects ADD COLUMN is_problematic boolean DEFAULT false;
ALTER TABLE projects ADD COLUMN problem_note text;
ALTER TABLE tasks ADD COLUMN is_problematic boolean DEFAULT false;
ALTER TABLE tasks ADD COLUMN problem_note text;
```
Displayed as a red warning badge. Separate from status so "in_progress + problematic" is valid.

**Deadline pushback (with audit trail)**:
```sql
CREATE TABLE deadline_changes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,   -- 'project' | 'task'
  entity_id uuid NOT NULL,
  old_due_date date,
  new_due_date date NOT NULL,
  reason text,
  changed_by uuid REFERENCES profiles(id),
  changed_at timestamptz DEFAULT now()
);
```
On project/task: "Extend Deadline" button opens modal with new date + reason. History visible in detail panel.

---

### 2.9 Outreach Tab (New)

**Requirement**: Track companies to reach out to for proposals (Upwork, direct, etc.).

**Schema (new table):**
```sql
CREATE TABLE outreach_companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_person text,
  contact_channel text,        -- 'upwork' | 'linkedin' | 'email' | 'direct' | 'other'
  contact_value text,          -- URL, email, username
  status text DEFAULT 'to_contact',  -- 'to_contact' | 'contacted' | 'replied' | 'declined' | 'converted'
  converted_intake_id uuid REFERENCES intakes(id),
  last_contact_date date,
  notes text,
  created_at timestamptz DEFAULT now()
);
```

**Route**: `/outreach` — new tab in nav under Operations section.

**Conversion**: "Convert to Lead →" action button on outreach record. Opens lead creation modal pre-filled, links `converted_intake_id` back.

---

### 2.10 Clients — Revenue Generated

**Requirement**: Show revenue generated per client.

**Implementation**: Computed from `client_invoices` where `status IN ('partial', 'paid')`. Display on Clients list as column, and on Client detail as summary card.

```sql
-- View or computed field
SELECT client_id, 
  SUM(gross_amount) AS total_gross,
  SUM(net_amount) AS total_net,
  currency
FROM client_invoices
WHERE status IN ('partial', 'paid')
GROUP BY client_id, currency;
```

Display both USD and IDR converted totals using latest FX rate.

---

### 2.11 Unified Files / Deliverables / Tasks View in Projects

**Requirement**: Merge tasks + deliverables + files into one view per project. Add "approved" file variant. Keep deliverables as a logical concept but don't surface as a separate tab.

**Recommended approach**: Keep `deliverables` entity as metadata anchor (it holds approval status, revision tracking, client feedback). Merge UI into one "Work" tab on project detail with three sub-views toggled by type:

```
[Project Detail]
  Tabs: Overview | Work | Team | Files | Finance | Activity
  
  "Work" tab contains:
    - Tasks (with subtask indentation, inline status edit)
    - Each task expandable → shows linked deliverables + files
    - Files without task: shown in a "Miscellaneous" group
    - "Approved/Final" files: badged with green "Approved" tag
```

**Approved file flag:**
```sql
ALTER TABLE project_files ADD COLUMN is_approved_version boolean DEFAULT false;
ALTER TABLE project_files ADD COLUMN approved_at timestamptz;
ALTER TABLE project_files ADD COLUMN approved_by uuid REFERENCES profiles(id);
```

**Deliverables tab**: Remove from top nav (keep data, just merge UI into project Work tab).

---

### 2.12 Project Progress — Auto-calculate from Tasks

**Formula**: `progress_percent = COUNT(tasks WHERE status = 'done') / COUNT(all tasks) * 100`

- Excludes cancelled tasks from both numerator and denominator.
- Updates via database trigger on `tasks.status` change.
- Subtasks count independently (not grouped by parent).
- Manual override still allowed (admin can set `progress_percent` directly if needed).

```sql
CREATE OR REPLACE FUNCTION update_project_progress()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE projects SET progress_percent = (
    SELECT ROUND(
      COUNT(*) FILTER (WHERE status = 'done')::numeric / 
      NULLIF(COUNT(*) FILTER (WHERE status != 'cancelled'), 0) * 100
    )
    FROM tasks WHERE project_id = NEW.project_id
  )
  WHERE id = NEW.project_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER task_progress_trigger
AFTER INSERT OR UPDATE OF status ON tasks
FOR EACH ROW EXECUTE FUNCTION update_project_progress();
```

---

### 2.13 Task Subtask Indentation

**Current state**: `parent_task_id` column already exists on `tasks` table.

**UI change**: Tasks rendered as nested tree (2 levels: task → subtask). Subtasks indented with vertical connector line. Add/remove subtask inline from task row.

---

### 2.14 Inline Status Editing in Tables

**Requirement**: Status badges clickable/editable from table view (no navigate-to-detail required).

**Implementation**: Status cell renders as a `<Select>` dropdown on click. On change, fires server action update. Toast confirmation. Works for: project status, task status, lead status.

---

### 2.15 Kanban View

**Requirement**: Kanban view for Projects and Tasks. Columns = statuses.

**Library**: `@dnd-kit/core` + `@dnd-kit/sortable` (most maintained, Next.js compatible).

**Where**:
1. `/projects` — toggle between List and Kanban. Columns: New | In Progress | Review | On Hold | Completed | Cancelled.
2. `/tasks` — toggle between List and Kanban. Same column toggle. Filterable by project and by assigned person.

**Card contents**:
- Project card: name, client, lead, due date, progress bar, priority badge.
- Task card: title, project name, assignee avatar, due date, priority badge.

**Drag behavior**: Dragging card between columns updates status via server action. No cross-entity dragging.

---

### 2.16 Google Drive Auto-Folder

**Requirement**: When a project is created, auto-generate a Google Drive folder with a standardized name.

**Naming convention**: `[YYYY]-[CLIENT_CODE]-[PROJECT_CODE] [Project Name]`  
Example: `2026-RK001-PRJ042 Structural Design Warehouse`

**Implementation**: 
- Google Drive API via service account (no user OAuth required — company-owned service account).
- Triggered in `createProject` server action after project row inserted.
- Folder created in a configured parent folder (set in Settings: "Google Drive Root Folder ID").
- `projects.google_drive_folder_id` updated with created folder ID.
- On failure: project still created, folder generation logged as warning, admin notified.

**Settings page**: Add field "Google Drive Root Folder ID" for admin to configure.

---

### 2.17 Tasks — Filter by Person & Project

**Current state**: Task list filtered by `?project_id=` and `?status=` via searchParams.

**Add**: `?assigned_to=` filter. UI: dropdown showing all team members with tasks.

On `/tasks`, add filter row option: "All People | [Person Name] ▼".

---

### 2.18 People — Talent Asset Dashboard

**Requirement**: Per-person metrics: projects count, on-time %, total paid, pending payment.

**Schema addition:**
```sql
ALTER TABLE profiles ADD COLUMN photo_url text; -- Supabase Storage URL
```

**Metrics (computed, not stored):**
```sql
-- Per member view
SELECT 
  p.id,
  COUNT(DISTINCT c.project_id) AS projects_count,
  ROUND(
    COUNT(*) FILTER (
      WHERE t.status = 'done' 
      AND t.updated_at <= t.due_date
    )::numeric / NULLIF(COUNT(*) FILTER (WHERE t.status = 'done'), 0) * 100
  ) AS on_time_pct,
  SUM(pr.total_paid) AS total_paid,
  SUM(c.subtotal_amount) FILTER (WHERE c.status = 'confirmed') 
    - SUM(pr.total_paid) AS pending_amount
FROM profiles p
LEFT JOIN compensation_records c ON c.member_id = p.id
LEFT JOIN tasks t ON t.assigned_to_user_id = p.id
LEFT JOIN payment_records pr ON pr.member_id = p.id
GROUP BY p.id;
```

**Photo upload**: Supabase Storage bucket `profile-photos`. Upload on `/my-profile` and on team member edit (admin).

**People page layout**: Cards view (not just table) with photo, name, role, metrics summary. List/card toggle.

---

### 2.19 Dashboard — Finance KPIs

**Requirement**: Add to dashboard: incoming payments from clients, outgoing to subcon/team, P&L summary. All figures in USD + IDR.

**New dashboard widgets**:
| Widget | Data source |
|---|---|
| Total Revenue (Month/YTD) | `client_invoices.gross_amount` grouped by period |
| Platform Fees (Month/YTD) | `client_invoices.platform_fee_amount` |
| Net Revenue | `client_invoices.net_amount` |
| Team Costs | `compensation_records.subtotal_amount` WHERE status=paid |
| P&L (Net Revenue − Team Costs) | Computed |
| Outstanding Invoices | `client_invoices` WHERE status IN ('sent','partial','overdue') |
| Pending Team Payments | `compensation_records` WHERE status=confirmed AND unpaid |
| Balance per Account | `payment_accounts` with aggregated balance |

All widgets: display in selected currency + conversion. Filterable by date range.

---

### 2.20 Search Consolidation

**Requirement**: Keep one search tab, remove duplicate.

**Action**: Keep per-page filter rows (they're contextual and useful). Remove global `/search` route from nav. Keep it as keyboard shortcut accessible if already implemented.

---

## 3. Implementation Phases

### Phase 1 — Foundation (must ship first, unblocks everything)
- [ ] FX rates table + admin entry UI in Settings
- [ ] `<MoneyInput />` and `<MoneyDisplay />` components
- [ ] `payment_accounts` table + Settings CRUD
- [ ] Complete `setting_options` migration (all domains)
- [ ] Fix any broken per-page filters

### Phase 2 — Finance Inbound
- [ ] `client_invoices` + `invoice_line_items` + `incoming_payments` schema
- [ ] Invoice creation UI (from project detail)
- [ ] Platform/gateway fee fields per invoice
- [ ] Incoming payment recording
- [ ] Revenue per client on Clients page

### Phase 3 — PDF Generation
- [ ] Install `@react-pdf/renderer`
- [ ] Invoice PDF template
- [ ] Payslip PDF template
- [ ] Download buttons on invoice/payslip detail pages

### Phase 4 — Operations UX
- [ ] Rename Intakes → Leads, reorder nav
- [ ] Add contact channel/value fields to leads
- [ ] Add complexity score field + UI component
- [ ] Inline lead-to-project conversion (modal, not redirect)
- [ ] Outreach tab + schema
- [ ] Void/problem flag on projects + tasks
- [ ] Deadline pushback with history
- [ ] Unified Work tab in project (tasks + deliverables + files merged)
- [ ] `is_approved_version` flag on files
- [ ] Inline status editing in tables
- [ ] Source platform field on intakes/projects

### Phase 5 — Views & Kanban
- [ ] Install `@dnd-kit/core` + `@dnd-kit/sortable`
- [ ] Kanban view on Projects page
- [ ] Kanban view on Tasks page
- [ ] Task subtask indentation in table/kanban
- [ ] Auto-progress on tasks trigger

### Phase 6 — People Module
- [ ] `photo_url` field + Supabase Storage bucket
- [ ] Photo upload on profile + team edit
- [ ] Talent metrics view/query
- [ ] People card layout with metrics

### Phase 7 — Dashboard Finance
- [ ] P&L widget
- [ ] Revenue/cost/balance widgets
- [ ] All existing widgets converted to dual-currency display

### Phase 8 — Integration (if credentials available)
- [ ] Google Drive service account setup
- [ ] Auto-create folder on project creation
- [ ] Settings: Drive root folder ID config

---

## 4. Open Design Decisions (needs owner decision before implementing)

| # | Question | Options | Default assumption |
|---|---|---|---|
| 1 | FX rate source | Manual admin entry vs. auto-fetch API | Manual for now |
| 2 | Platform fee scope | Per-invoice (recommended) vs. per-project | Per-invoice |
| 3 | "Jangan pake linked intake" | Modal inline conversion vs. auto-convert | Modal inline |
| 4 | Deliverable entity | Keep as grouping (merge UI only) vs. drop completely | Keep, merge UI |
| 5 | Progress calc | Count-based vs. weighted by estimated_hours | Count-based |
| 6 | Void/Problem | Separate flag (recommended) vs. status value | Separate flag |
| 7 | Deadline pushback | Full audit trail vs. simple field update | Full audit trail |
| 8 | Which filter is broken? | Need specific example | TBD |
| 9 | Photo storage | Supabase Storage | Supabase Storage |
| 10 | Google Drive auth | Service account vs. user OAuth | Service account |
| 11 | Search nav | Remove global `/search` route | Remove from nav |
| 12 | Wise multi-currency | One account per currency ("Wise USD", "Wise IDR") vs. single Wise account | Per currency |
| 13 | Revenue displayed | Gross or net per client | Both shown |

---

## 5. Tech Stack Additions Required

| Package | Purpose |
|---|---|
| `@react-pdf/renderer` | Invoice + payslip PDF generation |
| `@dnd-kit/core` + `@dnd-kit/sortable` | Kanban drag and drop |
| `googleapis` | Google Drive API (Phase 8) |
| `exchangerate-api` or similar | FX rate auto-fetch (optional, Phase 1 alt) |

---

## 6. Notes for AI Implementer

- This is a **Next.js 14 App Router** project with **Server Actions** for mutations. All data fetching is via server components or server actions — no REST API layer.
- Database is **Supabase** (PostgreSQL) with **Row Level Security (RLS)**. Every new table needs RLS policies.
- Auth: Supabase Auth. `system_role` on `profiles` table controls access: `admin` > `coordinator` > `reviewer` > `member`.
- All server actions live in `app/(protected)/[module]/actions.ts` (or `lib/actions/`).
- UI components: Tailwind + shadcn/ui. Check `components/ui/` for existing primitives before creating new ones.
- DataTable component: `components/shared/DataTable.tsx`. Accepts column config with `render` functions. Extend this, don't create a second table system.
- FilterBar component: `components/shared/FilterBar.tsx`. Extend for new filter fields.
- Existing status badges: `components/shared/ProjectStatusBadge.tsx`, `TaskStatusBadge.tsx`. Add new domains following same pattern.
- `setting_options` table: `domain` column groups dropdown options. Always fetch from DB with `unstable_cache` or React cache.
- All monetary amounts: `numeric(15,2)` in DB. Display using `formatIDR()` in `lib/utils/formatters.ts` — extend this with `formatMoney(amount, currency)` multi-currency formatter.
- RLS pattern: authenticated users read their own data; admins/coordinators read all; only admins write settings/dropdowns.
