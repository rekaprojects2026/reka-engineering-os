# Forms / Dialogs Direction

## 1) Current Status
- Implemented so far is primarily visual input-token cleanup.
- A global reusable dialog/form system is not yet fully implemented.
- Existing forms remain mostly page-based or route-based with incremental visual consistency.
- Implementation status: planning only for dialog system. Do not assume People dialogs or global dialog primitives exist yet.

## 2) Form UX Rules
- One-column default.
- Two-column only for natural paired fields.
- Labels above input fields.
- Placeholder text is example guidance only, never a substitute for labels.
- Keep helper text visible when it reduces mistakes.
- Break long forms into logical sections.
- Use stronger section headings for long multi-step forms.
- Avoid unnecessary dropdown overuse when segmented choice controls are clearer.

## 3) Dialog vs Page Rules

### Dialogs (short CRUD)
- Add/Edit Person
- Invite Person
- Add Task
- Add Deliverable
- Upload/Add Deliverable Version
- Add File/Link File
- Record Payment
- Settings Add/Edit Reference Option (later)

### Full pages (long/critical flows)
- ProjectForm
- Invoice creation
- Payslip/Compensation (for now)
- Finance-sensitive workflows
- Long conditional or line-item-heavy forms

## 4) People Pilot Recommendation
- Start with Add/Edit/Invite dialogs in People & Partners.
- Keep existing route pages as fallback.
- Use centered modal on desktop and responsive full-width behavior on small screens.
- Target modal width around `640px`.
- After save: close dialog and refresh list cleanly.
- Error UX: top-level alert + inline field-level feedback.

## 5) ProjectForm Direction
- Keep page-based form architecture.
- Maintain section navigation for long project setup flows.
- Future evolution: in-place editing on Project Detail cards, with full Edit Project fallback retained.

## 6) Future Reusable Components
- `AppDialogForm`
- `DialogFormHeader`
- `DialogFormFooter`
- `FormSection`
- `FieldGrid`
- `SegmentedChoice`
- `InlineFieldHelp`
- `FormActionBar`
