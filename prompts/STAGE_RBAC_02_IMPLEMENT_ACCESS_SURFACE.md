Read these files first:
- docs/ROLE_PERMISSION_HARDENING_BRIEFING.md

We are doing Stage RBAC-02 only: permission surface hardening.

Important:
- Do not jump ahead to server-side mutation enforcement yet unless a tiny shared helper is needed
- Focus first on the access surface
- Do not redesign UI
- Do not add features
- Preserve existing working flows
- Stop after Stage RBAC-02 and provide a completion report

Stage RBAC-02 goals:
1. Clarify and centralize the role matrix in code
2. Fix navigation visibility by role
3. Fix page / route access by role
4. Fix action / button visibility by role
5. Block unauthorized access to obvious create/edit/admin pages

The main problems to solve here:
- members/freelancers should not see or access New Project / New Task / similar create flows
- reviewers should not see or access admin/global creation flows
- coordinators should only get the intended scoped operational access
- settings must be admin-only

Before coding:
1. restate the exact files/folders you will modify in RBAC-02
2. restate what will be enforced at:
   - navigation level
   - route/page level
   - button/action level
3. identify the highest regression risk
4. explain how the role matrix will be centralized or made clearer

Then implement RBAC-02 only.

After implementation, stop and report:
- files modified
- navigation changes by role
- page/route protection changes
- action/button visibility changes
- what still remains for server-side enforcement
- local QA checklist by role
