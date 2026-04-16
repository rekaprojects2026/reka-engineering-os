Read these files first:
- docs/ROLE_PERMISSION_HARDENING_BRIEFING.md

We are doing Stage RBAC-01 only: permission audit + hardening plan.

Important:
- Do not write code yet
- Do not edit files yet
- Do not implement anything yet
- Do not redesign UI
- Do not add features
- Focus only on role clarification, permission audit, and the implementation plan

Current known problem:
Members / freelancers can still access actions like creating new projects and new tasks.
This means the current role system is not enforced properly.

Your task:
1. Inspect the current codebase and identify how roles are currently implemented.
2. Identify why unauthorized roles can still access create flows or restricted pages.
3. Produce a strict permission matrix by role and by module.
4. Separate the access model into:
   - navigation visibility
   - page / route access
   - action/button visibility
   - server-side action enforcement
   - data query scoping
5. List the exact files and folders likely to change.
6. Propose the safest staged implementation plan.

You must cover these roles:
- admin / owner
- coordinator
- reviewer
- member / freelancer

You must cover these modules:
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

Output requirements:
- brutally honest but structured
- exact permission matrix
- exact files/folders likely to change
- staged implementation plan
- regression risks
- success criteria

Do not code.
Do not implement.
Stop after the audit and plan.
