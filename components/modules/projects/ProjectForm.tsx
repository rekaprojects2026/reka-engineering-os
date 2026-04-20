'use client'

import { useTransition, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { createProject, updateProject } from '@/lib/projects/actions'
import { cn } from '@/lib/utils/cn'
import {
  SOURCE_PLATFORMS,
  DISCIPLINES,
  PROJECT_TYPES,
  PROJECT_STATUS_OPTIONS,
  WAITING_ON_OPTIONS,
  PRIORITY_OPTIONS,
} from '@/lib/constants/options'
import type { Project } from '@/types/database'

type OptionPair = { value: string; label: string }

interface ProjectFormProps {
  mode: 'create' | 'edit'
  project?: Project
  clients: { id: string; client_name: string; client_code: string }[]
  users: { id: string; full_name: string; email: string; discipline: string | null }[]
  disciplineOptions?: OptionPair[]
  projectTypeOptions?: OptionPair[]
}

const controlClass =
  'h-10 w-full rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-[0.875rem] text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

const textareaClass =
  'min-h-[5rem] w-full resize-y rounded-md border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-[0.875rem] leading-normal text-[var(--color-text-primary)] outline-none transition-colors focus:border-[var(--color-primary)] focus:ring-2 focus:ring-[var(--color-primary-subtle)]'

function ProjectFormSection({
  title,
  description,
  children,
  first,
}: {
  title: string
  description: string
  children: ReactNode
  first?: boolean
}) {
  return (
    <section className={cn(!first && 'mt-10')}>
      <div className="mb-6 border-b border-[var(--color-border)] pb-4">
        <h2 className="text-base font-semibold text-[var(--color-text-primary)]">{title}</h2>
        <p className="mt-0.5 text-[0.8125rem] text-[var(--color-text-muted)]">{description}</p>
      </div>
      {children}
    </section>
  )
}

function Field({ label, required, children }: { label: string; required?: boolean; children: ReactNode }) {
  return (
    <div>
      <label className="mb-1.5 block text-[0.8125rem] font-medium text-[var(--color-text-secondary)]">
        {label}{' '}
        {required && (
          <span className="text-[var(--color-danger)]" aria-hidden>
            *
          </span>
        )}
      </label>
      {children}
    </div>
  )
}

export function ProjectForm({
  mode,
  project,
  clients,
  users,
  disciplineOptions,
  projectTypeOptions,
}: ProjectFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const todayString = new Date().toISOString().split('T')[0]

  function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result =
        mode === 'create' ? await createProject(formData) : await updateProject(project!.id, formData)

      if (result?.error) setError(result.error)
    })
  }

  return (
    <form action={handleSubmit} className="flex flex-col">
      <div className="flex flex-1 flex-col pb-4">
        <ProjectFormSection
          first
          title="Project information"
          description="Basic identifying information and scope for this project."
        >
          <div className="space-y-5">
            <Field label="Project Name" required>
              <input
                name="name"
                type="text"
                required
                defaultValue={project?.name ?? ''}
                placeholder="e.g. Steel Frame Design — Warehouse Phase 2"
                className={controlClass}
              />
            </Field>
            <Field label="Scope Summary">
              <textarea
                name="scope_summary"
                rows={3}
                defaultValue={project?.scope_summary ?? ''}
                placeholder="High-level scope description for this project…"
                className={textareaClass}
              />
            </Field>
          </div>
        </ProjectFormSection>

        <ProjectFormSection
          title="Client & intake"
          description="Link this project to a client and optionally to an intake record."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Client" required>
                <select name="client_id" defaultValue={project?.client_id ?? ''} className={controlClass} required>
                  <option value="">Select a client…</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.client_name} ({c.client_code})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Linked Intake (optional)">
                <input
                  name="intake_id"
                  type="text"
                  defaultValue={project?.intake_id ?? ''}
                  placeholder="Intake ID (if converted from intake)"
                  className={controlClass}
                />
              </Field>
            </div>
          </div>
        </ProjectFormSection>

        <ProjectFormSection
          title="Source & classification"
          description="Where the work came from and how it is categorized."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Source" required>
                <select name="source" defaultValue={project?.source ?? 'direct'} className={controlClass} required>
                  {SOURCE_PLATFORMS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="External Reference URL">
                <input
                  name="external_reference_url"
                  type="url"
                  defaultValue={project?.external_reference_url ?? ''}
                  placeholder="https://www.upwork.com/jobs/…"
                  className={controlClass}
                />
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Discipline" required>
                <select
                  name="discipline"
                  defaultValue={project?.discipline ?? 'mechanical'}
                  className={controlClass}
                  required
                >
                  {(disciplineOptions ?? DISCIPLINES).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Project Type" required>
                <select
                  name="project_type"
                  defaultValue={project?.project_type ?? 'design'}
                  className={controlClass}
                  required
                >
                  {(projectTypeOptions ?? PROJECT_TYPES).map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </ProjectFormSection>

        <ProjectFormSection title="Timeline" description="Planned dates and optional actual completion.">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Start Date" required>
                <input
                  name="start_date"
                  type="date"
                  required
                  defaultValue={project?.start_date ?? todayString}
                  className={controlClass}
                />
              </Field>
              <Field label="Target Due Date" required>
                <input
                  name="target_due_date"
                  type="date"
                  required
                  defaultValue={project?.target_due_date ?? ''}
                  className={controlClass}
                />
              </Field>
            </div>
            {mode === 'edit' && (
              <div className="max-w-full sm:max-w-md">
                <Field label="Actual Completion Date">
                  <input
                    name="actual_completion_date"
                    type="date"
                    defaultValue={project?.actual_completion_date ?? ''}
                    className={controlClass}
                  />
                </Field>
              </div>
            )}
          </div>
        </ProjectFormSection>

        <ProjectFormSection title="Assignment" description="Assign a project lead and optional reviewer.">
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Project Lead" required>
                <select
                  name="project_lead_user_id"
                  defaultValue={project?.project_lead_user_id ?? ''}
                  className={controlClass}
                  required
                >
                  <option value="">Select lead…</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Reviewer (optional)">
                <select name="reviewer_user_id" defaultValue={project?.reviewer_user_id ?? ''} className={controlClass}>
                  <option value="">No reviewer</option>
                  {users.map((u) => (
                    <option key={u.id} value={u.id}>
                      {u.full_name} ({u.email})
                    </option>
                  ))}
                </select>
              </Field>
            </div>
          </div>
        </ProjectFormSection>

        <ProjectFormSection
          title="Status & priority"
          description="Track status, priority, waiting state, and progress."
        >
          <div className="space-y-5">
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Status" required>
                <select name="status" defaultValue={project?.status ?? 'new'} className={controlClass} required>
                  {PROJECT_STATUS_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Priority" required>
                <select name="priority" defaultValue={project?.priority ?? 'medium'} className={controlClass} required>
                  {PRIORITY_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <Field label="Waiting On">
                <select name="waiting_on" defaultValue={project?.waiting_on ?? 'none'} className={controlClass}>
                  {WAITING_ON_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Progress (%)">
                <input
                  name="progress_percent"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={project?.progress_percent ?? 0}
                  className={controlClass}
                />
              </Field>
            </div>
          </div>
        </ProjectFormSection>

        <ProjectFormSection title="Links & notes" description="Drive folder and internal-only context.">
          <div className="space-y-5">
            <Field label="Google Drive Folder Link">
              <input
                name="google_drive_folder_link"
                type="url"
                defaultValue={project?.google_drive_folder_link ?? ''}
                placeholder="https://drive.google.com/drive/folders/…"
                className={controlClass}
              />
            </Field>
            <Field label="Internal Notes">
              <textarea
                name="notes_internal"
                rows={3}
                defaultValue={project?.notes_internal ?? ''}
                placeholder="Internal-only notes, context, risks…"
                className={textareaClass}
              />
            </Field>
          </div>
        </ProjectFormSection>

        {error && (
          <div
            role="alert"
            className="mt-8 rounded-lg border border-[var(--color-border-strong)] bg-[var(--color-danger-subtle)] px-4 py-3 text-[0.8125rem] text-[var(--color-danger)]"
          >
            {error}
          </div>
        )}
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-8 border-t border-[var(--color-border)] bg-[var(--color-surface)] px-6 py-4">
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            disabled={isPending}
            className="btn-secondary rounded-md px-4 py-2 text-[0.875rem] font-medium disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isPending}
            className="btn-primary rounded-md px-4 py-2 text-[0.875rem] font-semibold disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPending ? 'Saving…' : mode === 'create' ? 'Create Project' : 'Save Changes'}
          </button>
        </div>
      </div>
    </form>
  )
}
