# V2 Access Matrix

## 1. Roles
### Admin
Full access to all current and V2 modules.

### Coordinator
Access limited to assigned / relevant work scope.

### Reviewer
Access limited to review work and necessary project context.

### Member
Access limited to own work, own payments, own profile.

## 2. Module-level access

| Module | Admin | Coordinator | Reviewer | Member |
|---|---|---|---|---|
| Dashboard | Full | Assigned scope | Review scope | Personal scope |
| Clients | Full | Read only where relevant | No | No |
| Intakes | Full | Assigned scope | No | No |
| Projects | Full | Assigned scope | Relevant projects only | Assigned projects only |
| Tasks | Full | Assigned scope | Review tasks only | Assigned tasks only |
| Deliverables | Full | Assigned scope | Review deliverables only | Assigned deliverables only |
| Files | Full | Assigned scope | Relevant files only | Assigned/relevant files only |
| Team | Full | Limited read if helpful | No | No |
| Payments | Full | Limited or none | No | Own only |
| Settings | Full | No | No | No |
| My Profile | Yes | Yes | Yes | Yes |

## 3. Action-level intent
### Admin
- create/edit/delete all modules where business-safe
- assign roles
- approve rates
- track payments
- edit settings

### Coordinator
- manage assigned projects
- create/edit tasks and deliverables in assigned scope
- assign team within allowed scope
- no global settings access
- no full payment visibility

### Reviewer
- update review outcomes
- mark review/revision states
- add notes
- no admin-style operational control

### Member
- update their task progress
- upload or link their deliverable work where allowed
- view their payments
- edit their own profile fields only

## 4. Required implementation behavior
Role-based UX is not only navigation hiding.

It must include:
- route protection
- server-side query filtering
- action permission enforcement
- view-level data restrictions
