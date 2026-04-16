# Agency OS — Role System Clarification + Permission Hardening Briefing

## 1. Objective
Agency OS currently has a role/permission problem.
The visual product may be improving, but the **authorization model is not strict enough**.

The immediate goal is to make roles **real**, not cosmetic.

This means:
- different roles must **not only see different UI**
- they must also have different **page access**, **action access**, **server-side permission checks**, and **data scope**

## 2. What is wrong right now
Known issues include:
- members / freelancers can still access create flows such as **New Project** and **New Task**
- role-based navigation may be partially present, but **action-level enforcement is incomplete**
- route protection is likely too shallow
- server actions may allow operations without checking roles strictly
- scoped roles may still see or manipulate data they should not control

## 3. This task is NOT about
Do **not** do any of the following in this workstream:
- do not redesign the UI
- do not add new product features
- do not redesign the dashboard
- do not change product architecture unnecessarily
- do not rewrite backend logic unrelated to permissions
- do not add new business modules
- do not touch billing / deployment / infra unless absolutely required by permission enforcement

## 4. Role model to enforce
There are four system roles to support:

### 4.1 Admin / Owner
This is the highest access role.

Admin can:
- view all modules
- create / edit / delete clients
- create / edit / delete intakes
- create / edit / delete projects
- create / edit / delete tasks
- create / edit / delete deliverables
- manage files
- manage team / freelancer records
- manage compensation and payments
- manage settings / master data
- assign people to projects and tasks
- change statuses globally

### 4.2 Coordinator
This is a scoped operations role.

Coordinator can:
- view projects in their operational scope
- view related clients / intakes when relevant to their scope
- create and manage tasks within allowed project scope
- create and manage deliverables within allowed project scope
- update statuses within allowed scope
- assign work within allowed scope if the product already supports this operationally

Coordinator cannot:
- manage settings / master data
- manage global team administration
- manage compensation / global payments unless explicitly intended later
- have unrestricted global project creation unless the product owner explicitly wants that

**Default recommendation:** coordinator should **not** be able to create global new projects unless explicitly approved.

### 4.3 Reviewer
This is a review-focused role.

Reviewer can:
- view tasks / deliverables assigned for review
- update review state / revision outcomes
- add review notes and comments
- view related project context needed for review

Reviewer cannot:
- create projects
- create global tasks
- create global deliverables
- manage settings
- manage team administration
- manage payments / compensation

### 4.4 Member / Freelancer
This is a personal-scope role.

Member can:
- view **my projects**
- view **my tasks**
- view **my deliverables**
- view **my files** where already scoped to them
- view **my payments** only
- update own task status
- submit / update own deliverables where appropriate
- edit own profile where already supported

Member cannot:
- create projects
- create global tasks
- create global deliverables
- access team administration
- access settings
- access client / intake management globally
- access payment / compensation data for other people

## 5. Permission philosophy
Permissions must be enforced at **four layers**:

### Layer A — Navigation visibility
Hide menu items that are irrelevant or unauthorized.

### Layer B — Page / route access
If a user manually goes to a route like:
- `/projects/new`
- `/tasks/new`
- `/deliverables/new`
- `/payments/new`
- `/settings`

...they must still be blocked if unauthorized.

### Layer C — Action/button visibility
Even on allowed pages, unauthorized users must not see action buttons like:
- New Project
- New Task
- Edit
- Delete
- Add Payment
- Assign Team

### Layer D — Server-side enforcement
This is the most important layer.
Even if a route or button leaks, server-side actions must reject unauthorized users.

No create/edit/delete/status-change action should rely only on UI hiding.

## 6. Required deliverables
The work must produce:

### 6.1 Permission audit
A clear diagnosis of why unauthorized roles still access create flows.

### 6.2 Permission matrix
A strict matrix by role and by module, covering at minimum:
- view list
- view detail
- create
- edit
- delete
- change status
- assign others
- manage payments
- manage settings

### 6.3 Access enforcement plan
A file-by-file implementation plan covering:
- navigation visibility
- route/page guards
- action visibility
- server actions
- data query scoping

### 6.4 Implementation
The actual permission hardening, done in safe stages.

### 6.5 QA checklist
A realistic test matrix by role.

## 7. Scope by module
The following modules must be reviewed:
- dashboard
- clients
- intakes
- projects
- tasks
- deliverables
- files
- team
- compensation
- payments
- settings

## 8. Expected technical targets
The work should likely touch some combination of:
- role helpers / permission helpers
- shared auth or permission utilities
- route-level guards
- page-level role checks
- action/button visibility conditions
- server actions for create/edit/delete/status changes
- scoped queries

Do not assume navigation hiding is sufficient.

## 9. Preferred implementation shape
### 9.1 Single source of truth
Prefer a centralized permission model instead of scattered one-off booleans.

### 9.2 Readable helpers
Prefer helper functions such as:
- canCreateProject(role)
- canCreateTask(role, context)
- canManagePayments(role)
- canAccessSettings(role)
- canEditOwnTask(role, userId, taskAssigneeId)

or a clean permission map / policy layer.

### 9.3 Safe scoped checks
Where scope matters (coordinator, reviewer, member), use explicit ownership / assignment / project scope checks.

## 10. Hard rules for Cursor
- do not add new product features
- do not redesign UI while doing this
- do not change architecture unless necessary for permission safety
- do not skip server-side checks
- do not leave permission enforcement only in the UI
- stop after each stage and provide a completion report

## 11. Success criteria
The work is successful when all of the following are true:
- members/freelancers cannot access project/task create flows
- unauthorized users cannot access restricted routes via direct URL
- unauthorized server-side mutations are rejected
- each role has a clear and documented permission model
- navigation, page access, action visibility, and server-side enforcement all agree
- role behavior is understandable and consistent across the app
