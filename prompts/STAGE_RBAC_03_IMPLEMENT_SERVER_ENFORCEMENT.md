Read these files first:
- docs/ROLE_PERMISSION_HARDENING_BRIEFING.md

We are doing Stage RBAC-03 only: server-side permission enforcement + query scoping hardening.

Important:
- Do not redesign UI
- Do not add features
- Do not expand architecture unnecessarily
- Focus only on server-side authorization and scoped data protection
- Stop after Stage RBAC-03 and provide a completion report

Stage RBAC-03 goals:
1. Ensure unauthorized users cannot perform restricted mutations even if they reach the route or submit the action manually
2. Ensure scoped roles only receive data they are allowed to receive
3. Ensure create/edit/delete/status-change actions enforce the role matrix strictly

This stage must cover:
- create project
- create task
- create deliverable
- edit/update where role restrictions apply
- delete where role restrictions apply
- status changes where role restrictions apply
- payment / compensation access
- settings access
- own-scope vs global-scope checks

Requirements:
- use readable helpers / policy checks where practical
- avoid scattered one-off role booleans
- preserve existing business logic and working flows
- reject unauthorized actions explicitly and safely

Before coding:
1. restate the exact files/folders you will modify in RBAC-03
2. explain how server-side permission checks will be enforced
3. explain how scoped query access will be enforced
4. identify the highest-risk mutation path and how you will secure it

Then implement RBAC-03 only.

After implementation, stop and report:
- files modified
- server-side permission checks added
- scoped query protections added
- unauthorized mutation paths blocked
- remaining permission debt, if any
- local QA checklist by role and by mutation type
