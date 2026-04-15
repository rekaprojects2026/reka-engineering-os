# V2 Master PRD — Reka Engineering OS (Freelance-First)

## 1. Product framing
This product is an internal operating system for a freelance-first engineering agency.

It is not trying to become Oracle or a giant ERP in this phase.
The priority is to help the owner run engineering work with freelancers and a small team.

## 2. V2 objective
Turn the current V1 project operations core into a more complete freelance-first agency OS.

### V2 must make the following easy:
- managing freelancers and internal team members
- inviting people into the system
- assigning people to projects and tasks clearly
- tracking their work and review responsibilities
- setting and tracking payments in IDR
- showing different views to owner, coordinator, reviewer, and freelancer
- managing master data without hardcoding everything
- making the app much more mature in UX/UI

## 3. Existing baseline assumed
The following modules already exist from V1:
- auth
- clients
- intakes
- projects
- tasks
- deliverables
- files metadata/manual links
- dashboard
- activity
- search

## 4. V2 priorities
### Priority 1 — Team / Freelancer management
Create a real People module with the right data model and pages.

### Priority 2 — Invite-only onboarding
Allow admin to invite members and let them complete their own profile.

### Priority 3 — Compensation / payment tracking in IDR
Allow the business to define approved rates and track what is owed and what is paid.

### Priority 4 — Role-based access and views
Owner/admin, coordinator/PM, reviewer/checker, and freelancer/member must not see the same experience.

### Priority 5 — Settings / Admin master data
Move key dropdown/master data into configurable system-managed records.

### Priority 6 — UI/UX polish
Upgrade the app from plain MVP to mature internal product.

### Priority 7 — Infra / production hardening
Migration discipline, env cleanliness, documentation, QA, and production-readiness improvements.

### Priority 8 — Google Drive live integration
Optional at the end of V2 or after V2, not at the beginning.

## 5. Core user modes in V2
### Admin / Owner
Sees full business operations and can manage all modules.

### Coordinator / PM
Sees and manages assigned project operations without full business-wide visibility.

### Reviewer / Checker
Sees only review-related work and relevant project data.

### Freelancer / Member
Sees only their own work, own files, own payments, and own profile.

## 6. High-level module additions in V2
### 6.1 Team / Freelancer module
Purpose:
- maintain the people directory
- store business-relevant work and payment data
- support assignment and filtering

Required fields:
- full_name
- email
- phone
- profile_photo_url (optional)
- system_role
- functional_role
- discipline
- worker_type
- active_status
- availability_status
- joined_date
- expected_rate (optional)
- approved_rate
- rate_type
- currency_code (default IDR)
- bank_name (optional)
- bank_account_name (optional)
- bank_account_number (optional)
- ewallet_type (optional)
- ewallet_number (optional)
- tax_id_or_identifier (optional)
- city (optional)
- portfolio_link (optional)
- notes_internal

Required pages:
- team list
- team detail
- add member
- edit member
- my profile
- optional invite member page

### 6.2 Invite / onboarding module
Purpose:
- keep admin control over who enters the system
- reduce manual data entry burden
- let users complete their own profile

Flow:
1. admin creates invited member record
2. admin sends invite
3. invited user activates account
4. invited user completes profile
5. admin reviews final details if needed

### 6.3 Compensation / payment module
Purpose:
- define rates
- calculate work-based compensation
- track payment status in IDR

Required concepts:
- default approved rate
- rate type
- compensation records
- payment batches
- payment items
- unpaid / partial / paid status

### 6.4 Role-based access and role-based views
Purpose:
- give the right people the right visibility
- reduce noise
- prevent data leakage

This includes:
- role-based navigation
- role-based queries
- role-based dashboard content
- role-based page access
- role-based action permissions

### 6.5 Settings / Admin master data
Purpose:
- reduce hardcoded values
- allow business configuration

Required areas:
- system roles
- functional roles
- worker types
- disciplines
- task categories
- deliverable types
- project types
- file categories
- payment methods
- rate types
- status labels where appropriate

### 6.6 UI/UX perfect pass
Purpose:
- significantly improve maturity, readability, visual hierarchy, and confidence
- keep the product operational, not decorative

### 6.7 Infra / production hardening
Purpose:
- make the app safer to continue and deploy
- standardize migration workflow
- clean up env handling
- improve documentation and QA discipline

### 6.8 Google Drive live integration
Purpose:
- attach files from Google Drive using real OAuth and Picker
- store file metadata and links safely
- optionally map project folders later

## 7. Detailed role model
### 7.1 System roles
- admin
- coordinator
- reviewer
- member

### 7.2 Functional roles
Examples:
- civil engineer
- mechanical engineer
- drafter
- checker
- estimator
- admin ops
- BIM modeler
- CAD freelancer

### 7.3 Project assignment roles
Examples:
- lead
- reviewer
- executor
- support

Important:
- system role is global app access role
- functional role describes what the person does
- assignment role is their role within a specific project

## 8. Detailed V2 UX requirements by user type
### 8.1 Admin / Owner
Must see:
- global dashboard
- all clients, intakes, projects, tasks, deliverables
- all members
- all payments
- settings

### 8.2 Coordinator / PM
Must see:
- assigned dashboard
- assigned projects
- related tasks
- related deliverables
- assigned intakes
- project team assignments

### 8.3 Reviewer / Checker
Must see:
- review queue
- review-relevant projects
- review tasks
- review deliverables
- relevant files

### 8.4 Freelancer / Member
Must see:
- my dashboard
- my projects
- my tasks
- my deliverables
- my files
- my payments
- my profile

## 9. Payment and compensation model
### 9.1 Rate types
- hourly
- daily
- per_task
- per_deliverable
- per_project
- monthly_fixed (optional for internal team)

### 9.2 Currency
Default and primary currency:
- IDR

Multi-currency is out of scope for this phase.

### 9.3 Payment statuses
- unpaid
- partial
- paid
- cancelled (optional only if useful)

## 10. V2 out of scope
The following must not be included unless explicitly requested later:
- public self-registration
- enterprise payroll complexity
- procurement
- deep financial accounting / general ledger
- client portal
- notifications and automations
- mobile-native app
- BI / heavy analytics
- fancy charts without operational value
- total architecture rewrite

## 11. Definition of V2 success
V2 succeeds if:
- the owner can add and manage freelancers cleanly
- invited users can complete their own profile
- system role and project role are handled correctly
- the owner can assign work and track who is doing what
- the owner can track payment obligations in IDR
- each user sees the right subset of the product
- the app feels much more mature and usable than V1
- settings/master data are not mostly hardcoded
