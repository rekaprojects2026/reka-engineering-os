# V2 Data Model Extensions

## 1. Philosophy
Keep the existing V1 schema stable.
Add V2 in an additive, migration-based way.

## 2. Profiles expansion or team_members adjunct
Preferred approach:
Extend `profiles` where practical, unless a separate `team_members` table is clearly better for the current codebase.

Required fields:
- system_role
- functional_role
- discipline
- worker_type
- active_status
- availability_status
- expected_rate
- approved_rate
- rate_type
- currency_code
- bank_name
- bank_account_name
- bank_account_number
- ewallet_type
- ewallet_number
- city
- portfolio_link
- notes_internal

## 3. Invite / onboarding support
Potential additions:
- invite_token
- invite_status
- invited_at
- accepted_at
- profile_completed_at

This may be stored in:
- profiles
or
- a dedicated invites table, if cleaner

## 4. Compensation tables
### compensation_records
Suggested fields:
- id
- member_id
- project_id
- task_id (nullable)
- deliverable_id (nullable)
- work_basis
- quantity
- unit_rate
- currency_code
- subtotal_amount
- status
- notes
- created_at

### payment_batches
Suggested fields:
- id
- period_label
- period_start
- period_end
- status
- total_amount
- created_by
- created_at

### payment_items
Suggested fields:
- id
- batch_id
- member_id
- compensation_record_id (nullable)
- amount_due
- amount_paid
- balance_amount
- currency_code
- payment_status
- payment_method
- payment_reference
- proof_link
- paid_at
- notes

## 5. Settings tables
Recommended if replacing hardcoded values:
- setting_groups
- setting_options
or a simpler master-data approach:
- disciplines_master
- functional_roles_master
- worker_types_master
- project_types_master
- task_categories_master
- deliverable_types_master
- rate_types_master
- payment_methods_master

The implementation can choose a pragmatic structure.
Avoid overengineering.

## 6. Files / Google Drive readiness
If not already sufficient, ensure file records support:
- provider
- external_file_id
- external_folder_id (optional)
- manual_link
- file_category
- mime_type
- version_label
- revision_number

## 7. Security / RLS considerations
- service role only on server
- role-sensitive writes must be restricted
- member-level payment visibility must be isolated
- do not rely only on hidden UI
