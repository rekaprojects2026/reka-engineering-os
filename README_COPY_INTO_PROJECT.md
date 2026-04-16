# Agency OS — Role & Permission Hardening Pack for Cursor

## Purpose
This pack is for fixing **role confusion and permission leaks** in Agency OS.

Current known problem examples:
- members / freelancers can still access create actions like **New Project** and **New Task**
- role behavior is inconsistent between navigation, page access, action visibility, and server-side enforcement
- role definitions are not yet clear enough across admin / coordinator / reviewer / member

This pack is **not** for UI polish.
This pack is **not** for new features.
This pack is only for:
- role clarification
- permission matrix definition
- route protection
- action visibility
- server-side permission enforcement
- scoped query protection

## Copy into project
Copy these folders into your project root:
- `docs/`
- `prompts/`
- `.cursor/rules/`

## Recommended workflow in Cursor
### Session 1 — Audit only
Use:
- `docs/ROLE_PERMISSION_HARDENING_BRIEFING.md`
- `prompts/STAGE_RBAC_01_AUDIT_PLAN.md`

### Session 2 — Implement role matrix + UI/route guards
Use:
- `docs/ROLE_PERMISSION_HARDENING_BRIEFING.md`
- `prompts/STAGE_RBAC_02_IMPLEMENT_ACCESS_SURFACE.md`

### Session 3 — Implement server-side permission enforcement + scoped query checks
Use:
- `docs/ROLE_PERMISSION_HARDENING_BRIEFING.md`
- `prompts/STAGE_RBAC_03_IMPLEMENT_SERVER_ENFORCEMENT.md`

### Session 4 — QA / cleanup / consistency sweep
Use:
- `docs/ROLE_PERMISSION_HARDENING_BRIEFING.md`
- `prompts/STAGE_RBAC_04_QA_SWEEP.md`

## Important
- Work in a **new Cursor chat/session for each stage**
- Review the "Before coding" response before allowing implementation
- Commit and push after each stage
- Do not let Cursor jump ahead to later stages
