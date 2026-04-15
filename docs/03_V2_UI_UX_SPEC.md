# V2 UI/UX Specification — Perfect Pass Target

## 1. Product feel
The app should feel:
- mature
- professional
- calm
- operational
- premium but restrained
- readable for long work sessions

It should not feel:
- playful
- trendy for trend's sake
- over-animated
- marketing-site-like
- visually noisy

## 2. Layout philosophy
### Desktop-first
Primary design target:
- 1440px desktop
- must still feel strong at 1280px
- minimum usable width: 1024px

### Table-first
The main modules should primarily use tables:
- clients
- intakes
- projects
- tasks
- deliverables
- files
- team
- payments

Cards are for:
- KPIs
- compact summaries
- profile headers
- dashboard highlights

## 3. Navigation architecture
### Admin / Owner navigation
- Dashboard
- Clients
- Intakes
- Projects
- Tasks
- Deliverables
- Files
- Team
- Payments
- Settings

### Coordinator navigation
- Dashboard
- Intakes
- Projects
- Tasks
- Deliverables
- Files
- Team Assignment

### Reviewer navigation
- Dashboard
- My Reviews
- Projects
- Tasks
- Deliverables
- Files

### Member / Freelancer navigation
- My Dashboard
- My Projects
- My Tasks
- My Deliverables
- My Files
- My Payments
- My Profile

## 4. Sidebar rules
- width: 256px to 272px
- dark neutral background
- clear active state
- readable labels, not tiny labels
- grouped sections when helpful
- subtle hover state
- no clutter

## 5. Topbar rules
- slim
- global search always visible or easily accessible
- profile menu
- context actions where useful
- no unnecessary visual noise

## 6. Color system
### Backgrounds
- app background: #F7F8FA
- surface: #FFFFFF
- subtle surface alt: #F8FAFC
- sidebar background: #0F172A
- sidebar hover: #1E293B

### Text
- primary text: #0F172A
- secondary text: #475569
- muted text: #64748B
- inverse text: #F8FAFC

### Borders
- primary border: #E2E8F0
- strong border: #CBD5E1

### Brand accents
Primary accent:
- #1D3557

Support accent:
- #457B9D

Optional restrained emphasis accent:
- #8B1E3F

### Semantic colors
Success:
- background: #ECFDF3
- text: #027A48

Warning:
- background: #FFFAEB
- text: #B54708

Danger:
- background: #FEF3F2
- text: #B42318

Info:
- background: #EFF8FF
- text: #175CD3

Neutral:
- background: #F2F4F7
- text: #344054

## 7. Typography
### Primary font
Inter

### Optional utility font
IBM Plex Mono only for:
- IDs
- compact refs
- code-like values

### Type scale
- Page title: 24/32, semibold
- Section title: 18/28, semibold
- Card title: 16/24, medium
- Body: 14/22, regular
- Table cell text: 13–14/20
- Small helper text: 12/18

Rules:
- avoid tiny text
- prioritize readability over ultra-dense layouts
- support long use sessions without fatigue

## 8. Spacing and density
### Radius
- cards: 16px
- inputs: 10px to 12px
- buttons: 10px to 12px
- badges: full pill

### Spacing scale
- 4
- 8
- 12
- 16
- 20
- 24
- 32

### Content rhythm
- section gaps: 24–32px
- card padding: 16–20px
- table cell vertical padding: 12–14px

## 9. Table specification
Tables should:
- have strong headers
- use subtle row hover
- preserve readability
- support search/filter near the table
- keep status, priority, owner/assignee, due date prominent
- use sticky headers if useful
- support empty states

## 10. Form specification
Forms should:
- use labels above fields
- use helper text where useful
- group related fields into sections
- avoid giant undivided single-column walls of fields
- use clear required field indicators
- support concise validation messaging

Recommended section patterns:
- Basic Info
- Work Info
- Payment Info
- Availability
- Notes

## 11. Dashboard rules
Dashboards must vary by role.

### Owner dashboard
Should include:
- active projects
- overdue tasks
- projects waiting on client
- deliverables in revision or review
- upcoming deadlines
- payments due
- recent activity
- workload summary

### Freelancer dashboard
Should include:
- my overdue tasks
- my tasks due this week
- my deliverables
- my active projects
- my payment status
- my recent activity

## 12. Chart rules
Charts are optional and must only be included when useful.

### Allowed chart types
- bar chart
- line chart
- stacked bar

### Preferred use cases
- workload by member
- payments by month
- tasks by status
- deliverables over time

### Avoid
- excessive donuts
- pie chart overload
- decorative charts
- chart clutter

## 13. Component consistency rules
Buttons:
- primary
- secondary
- ghost
- danger

Badges:
- consistent semantic meanings across all modules

Empty states:
- must guide action
- must not be generic "No data" only

Search:
- visible and practical
- accessible with keyboard shortcut if already present

## 14. UI/UX perfect pass goals
The V2 perfect pass should improve:
- hierarchy
- contrast
- spacing
- readability
- forms
- tables
- empty states
- role-based dashboard clarity
- navigation clarity
- visual confidence

It should not:
- redesign the app from scratch
- radically change IA
- add trend-driven visuals
- sacrifice clarity for aesthetic novelty
