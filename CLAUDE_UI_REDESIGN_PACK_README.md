# CLAUDE_UI_REDESIGN_PACK_README.md

## What This Pack Is
This pack contains strict markdown briefings and copy-paste prompts for a staged UI/UX redesign of Agency OS.

The pack is designed so Claude can read the markdown files directly from your project folder and work in controlled stages.

---

## File Structure

### `/docs`
- `GLOBAL_UI_REDESIGN_RULES.md`
- `STAGE_01_BRIEFING_AUDIT_MASTER_PLAN.md`
- `STAGE_02_BRIEFING_GLOBAL_SHELL_SHARED_SYSTEM.md`
- `STAGE_03_BRIEFING_DASHBOARD_REDESIGN.md`
- `STAGE_04_BRIEFING_PRODUCT_SWEEP.md`

### `/prompts`
- `STAGE_01_PROMPT_AUDIT_MASTER_PLAN.md`
- `STAGE_02_PROMPT_GLOBAL_SHELL_SHARED_SYSTEM.md`
- `STAGE_03_PROMPT_DASHBOARD_REDESIGN.md`
- `STAGE_04_PROMPT_PRODUCT_SWEEP.md`

---

## How To Use
1. Copy the whole pack into your project root.
2. Make sure the markdown files stay in:
   - `docs/...`
   - `prompts/...`
3. Start with Stage 01 only.
4. Do **not** let Claude skip stages.
5. Approve each stage before moving forward.
6. Require a completion report after every stage.

---

## Recommended Workflow
### Stage 01
Use:
- `docs/GLOBAL_UI_REDESIGN_RULES.md`
- `docs/STAGE_01_BRIEFING_AUDIT_MASTER_PLAN.md`
- `prompts/STAGE_01_PROMPT_AUDIT_MASTER_PLAN.md`

### Stage 02
Use only after Stage 01 is approved:
- `docs/GLOBAL_UI_REDESIGN_RULES.md`
- `docs/STAGE_02_BRIEFING_GLOBAL_SHELL_SHARED_SYSTEM.md`
- `prompts/STAGE_02_PROMPT_GLOBAL_SHELL_SHARED_SYSTEM.md`

### Stage 03
Use only after Stage 02 is approved:
- `docs/GLOBAL_UI_REDESIGN_RULES.md`
- `docs/STAGE_03_BRIEFING_DASHBOARD_REDESIGN.md`
- `prompts/STAGE_03_PROMPT_DASHBOARD_REDESIGN.md`

### Stage 04
Use only after Stage 03 is approved:
- `docs/GLOBAL_UI_REDESIGN_RULES.md`
- `docs/STAGE_04_BRIEFING_PRODUCT_SWEEP.md`
- `prompts/STAGE_04_PROMPT_PRODUCT_SWEEP.md`

---

## Guardrail Reminder
If Claude starts going out of scope, use this:

> Stop.  
> Do not add new features.  
> Do not redesign architecture unnecessarily.  
> Do not redesign product logic.  
> Only follow the currently approved stage.  
> Preserve all working flows.  
> Keep this premium, operational, restrained, and highly usable.

---

## Reference Websites Included
This pack explicitly references:
- Phoenix Project Management Dashboard  
  https://prium.github.io/phoenix-tailwind/v1.1.0/dashboard/project-management.html

- Dash UI Admin Dashboard  
  https://dash-ui-admin-template.vercel.app/

These references are intended for:
- structural inspiration
- hierarchy
- dashboard composition
- project-management/admin-product quality

They are **not** to be cloned literally.
