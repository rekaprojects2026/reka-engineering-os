# Sprint 01 Brief — Team / Freelancer Module

## Goal
Create a real Team / Freelancer module so the app can support freelance-first operations.

## Why this sprint exists
The current app is strong on project operations but weak on people operations.
The Team page is not yet a true management module.

## Required outcomes
- real Team list page
- real Team detail page
- add/edit member flows
- freelancer/team fields added to data model
- system role and functional role represented clearly
- worker type, availability, active status, and payment base fields represented
- My Profile page for member-side usage if appropriate

## Must support
- internal team members
- freelancers
- subcontractor-style members if needed
- role-based filtering later
- payment setup later

## Required fields
- full_name
- email
- phone
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
- bank and/or ewallet fields
- city (optional)
- portfolio_link (optional)
- notes_internal

## Required pages
- /team
- /team/new
- /team/[id]
- /team/[id]/edit
- /my-profile (or equivalent member profile page if already aligned with app architecture)

## UX requirements
- table-first team list
- useful filters
- clean profile sections
- no overdesigned visuals
- reuse current design system
