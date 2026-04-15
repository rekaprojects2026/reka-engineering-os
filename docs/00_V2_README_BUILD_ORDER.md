# Reka Engineering OS V2 — Freelance-First Build Pack

This pack is designed so an AI coding assistant can continue the existing V1 app into a V2 that is still freelance-first, not enterprise-first.

## Current Baseline Assumption
The existing app already includes:
- auth and protected layout
- clients
- intakes
- projects
- project team assignment and intake conversion
- tasks
- deliverables
- files metadata/manual links
- dashboard
- activity
- search

This V2 pack starts **after** that baseline.

## What V2 is for
V2 should turn the app from a project-ops core into a freelance-first agency operating system.

### Primary V2 priorities
1. Team/Freelancer management
2. Invite-only onboarding
3. Compensation and payment tracking in IDR
4. Role-based access and role-based views
5. Settings/Admin master data
6. UI/UX polish that makes the app feel mature and usable every day
7. Migration / production hardening
8. Google Drive live integration only after the above is stable

## What V2 is NOT
Do not turn this into a giant enterprise ERP.
Do not add procurement, payroll enterprise complexity, public signup, heavy analytics, client portal, or mobile-native work in this phase.

## Recommended execution order
1. Read all V2 docs first
2. Execute Sprint 01
3. Stop and report
4. Human reviews output
5. Run migrations and QA
6. Commit checkpoint
7. Move to next sprint

## Documents in this pack
### Core docs
- `docs/00_V2_README_BUILD_ORDER.md`
- `docs/01_V2_MASTER_PRD_FREELANCE_FIRST.md`
- `docs/02_V2_AI_EXECUTION_PROTOCOL.md`
- `docs/03_V2_UI_UX_SPEC.md`
- `docs/04_V2_ACCESS_MATRIX.md`
- `docs/05_V2_DATA_MODEL_EXTENSIONS.md`

### Sprint docs
- `sprints/SPRINT_01_BRIEF_TEAM_FREELANCER.md`
- `sprints/SPRINT_01_PROMPT_TEAM_FREELANCER.md`
- `sprints/SPRINT_02_BRIEF_INVITE_ONBOARDING.md`
- `sprints/SPRINT_02_PROMPT_INVITE_ONBOARDING.md`
- `sprints/SPRINT_03_BRIEF_COMPENSATION_PAYMENTS_IDR.md`
- `sprints/SPRINT_03_PROMPT_COMPENSATION_PAYMENTS_IDR.md`
- `sprints/SPRINT_04_BRIEF_ROLE_BASED_ACCESS_AND_VIEWS.md`
- `sprints/SPRINT_04_PROMPT_ROLE_BASED_ACCESS_AND_VIEWS.md`
- `sprints/SPRINT_05_BRIEF_SETTINGS_ADMIN.md`
- `sprints/SPRINT_05_PROMPT_SETTINGS_ADMIN.md`
- `sprints/SPRINT_06_BRIEF_UI_UX_PERFECT_PASS.md`
- `sprints/SPRINT_06_PROMPT_UI_UX_PERFECT_PASS.md`
- `sprints/SPRINT_07_BRIEF_INFRA_MIGRATION_PROD_HARDENING.md`
- `sprints/SPRINT_07_PROMPT_INFRA_MIGRATION_PROD_HARDENING.md`
- `sprints/SPRINT_08_BRIEF_GOOGLE_DRIVE_LIVE_INTEGRATION.md`
- `sprints/SPRINT_08_PROMPT_GOOGLE_DRIVE_LIVE_INTEGRATION.md`

## Human workflow recommendation
For every sprint:
1. Open a new session in the AI tool
2. Paste the sprint prompt exactly
3. Let the AI inspect first
4. Review planned files before coding
5. Let it implement only that sprint
6. Run migration(s)
7. Test manually
8. Commit
9. Move on

## General safety rules
- No sprint should add unrelated features
- No sprint should redesign the architecture unless explicitly requested
- Keep scope tight
- Prefer practical operational UX over visual gimmicks
