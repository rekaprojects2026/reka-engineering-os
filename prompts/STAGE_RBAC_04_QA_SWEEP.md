Read these files first:
- docs/ROLE_PERMISSION_HARDENING_BRIEFING.md

We are doing Stage RBAC-04 only: QA sweep + consistency cleanup.

Important:
- Do not add features
- Do not redesign UI
- Do not expand architecture unnecessarily
- Focus only on permission consistency, role sanity checks, and cleanup
- Stop after Stage RBAC-04 and provide a completion report

Stage RBAC-04 goals:
1. Verify that navigation, route access, button visibility, server actions, and query scope all agree
2. Remove leftover permission inconsistencies
3. Verify each role experience is coherent and safe
4. Finalize the documented permission matrix if needed in code/comments/docs

You must verify at minimum:
- admin / owner
- coordinator
- reviewer
- member / freelancer

You must verify at minimum these flows:
- project create
- task create
- deliverable create
- restricted edit/delete
- status changes
- settings access
- payment / compensation access
- my-payments only visibility for members
- direct URL access to restricted pages

Before coding:
1. list the exact files/folders you will modify in RBAC-04
2. explain what inconsistencies you will verify
3. explain the final success criteria for closing the role hardening workstream

Then implement RBAC-04 only.

After implementation, stop and report:
- files modified
- permission consistency fixes made
- final QA checklist by role
- final permission matrix summary
- whether the role system is now fully clarified and hardened
