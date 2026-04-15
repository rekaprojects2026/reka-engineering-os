V2 Sprint 08: Google Drive Live Integration

Read first:
- docs/01_V2_MASTER_PRD_FREELANCE_FIRST.md
- docs/02_V2_AI_EXECUTION_PROTOCOL.md
- docs/03_V2_UI_UX_SPEC.md
- docs/04_V2_ACCESS_MATRIX.md
- docs/05_V2_DATA_MODEL_EXTENSIONS.md
- sprints/SPRINT_08_BRIEF_GOOGLE_DRIVE_LIVE_INTEGRATION.md

Also inspect the current codebase before making changes.

Your task:
1. Implement Sprint 08 only: Google Drive live integration.
2. Integrate with the existing Files model and file provider architecture.
3. Do not add unrelated new modules.
4. Keep secrets server-only.
5. Keep the user experience practical.

Sprint 08 requirements:
- real Google Drive OAuth flow
- provider-safe env usage
- optional Google Picker integration if appropriate for the architecture
- ability to attach/select Google Drive files into the app
- store provider metadata safely
- keep manual link/file behavior working alongside Google Drive

Before coding:
1. List the exact files and folders you will create or modify.
2. Define what success looks like for Sprint 08.
3. Identify blockers or missing prerequisites.

Then implement Sprint 08 only.

After implementation, stop and report:
- files created/modified
- schema changes if any
- env vars required
- local test steps
- post-integration QA checklist
