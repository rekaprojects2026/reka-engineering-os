# V2 AI Execution Protocol

## 1. General approach
The AI must execute V2 in tightly-scoped sprints.
Do not combine multiple sprints unless explicitly told to do so.

## 2. Mandatory behavior before coding
For every sprint, the AI must:
1. Read the core V2 docs first
2. Inspect the current codebase
3. Summarize the current app status
4. List exact files to create or modify
5. Define success criteria for the sprint
6. Identify blockers or missing prerequisites
7. Wait for approval if required by the prompt

## 3. Mandatory behavior after coding
For every sprint, the AI must stop and report:
- files created/modified
- migration file names
- schema changes
- local test steps
- what remains for the next sprint

## 4. Scope discipline
The AI must not:
- add features outside the sprint
- redesign the whole app without request
- add decorative effects that reduce operational clarity
- create broad refactors that increase risk
- introduce enterprise-level complexity outside the freelance-first plan

## 5. UI/UX discipline
The AI must:
- preserve desktop-first layout
- preserve table-first operational UI
- keep visual styling mature, calm, and professional
- use the V2 UI/UX spec
- avoid gradients, glassmorphism, excessive shadows, and playful visuals

## 6. Data and security discipline
The AI must:
- keep service secrets server-only
- avoid exposing sensitive env values in client code
- prefer migration files over hidden manual schema changes
- keep schema changes explicit and additive where possible
- avoid unsafe role assumptions

## 7. Sprint boundary discipline
### Sprint 01
Team/Freelancer module only

### Sprint 02
Invite-only onboarding only

### Sprint 03
Compensation and payments only

### Sprint 04
Role-based access and views only

### Sprint 05
Settings/Admin master data only

### Sprint 06
UI/UX perfect pass only

### Sprint 07
Infra, migration discipline, QA, production hardening only

### Sprint 08
Google Drive live integration only

## 8. Preferred implementation style
- small, auditable changes
- strong reuse of existing components
- no unnecessary new dependencies
- clean server-side logic
- practical validation and error handling
- lightweight but clear UX states

## 9. Final reminder
This is a freelance-first V2.
Do not turn it into an enterprise ERP.
