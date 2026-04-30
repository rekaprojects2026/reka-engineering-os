'use client'

import Link from 'next/link'
import { useMemo, useState, useTransition } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import type { ProjectPhase } from '@/lib/phases/queries'
import type { TaskWithRelations } from '@/lib/tasks/task-tree'
import { createPhase, deletePhase, updatePhase, assignTaskToPhase } from '@/lib/phases/actions'
import { TaskStatusBadge } from '@/components/modules/tasks/TaskStatusBadge'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { formatDate } from '@/lib/utils/formatters'

interface PhaseBoardProps {
  phases: ProjectPhase[]
  tasks: TaskWithRelations[]
  projectId: string
  canManage: boolean
  canDeletePhase: boolean
}

export function PhaseBoard({ phases, tasks, projectId, canManage, canDeletePhase }: PhaseBoardProps) {
  const [isPending, startTransition] = useTransition()
  const [createOpen, setCreateOpen] = useState(false)
  const [editPhase, setEditPhase] = useState<ProjectPhase | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const [createName, setCreateName] = useState('')
  const [createDesc, setCreateDesc] = useState('')
  const [createStart, setCreateStart] = useState('')
  const [createEnd, setCreateEnd] = useState('')

  const [editName, setEditName] = useState('')
  const [editDesc, setEditDesc] = useState('')
  const [editStart, setEditStart] = useState('')
  const [editEnd, setEditEnd] = useState('')
  const [editStatus, setEditStatus] = useState<'active' | 'completed' | 'on_hold'>('active')

  const unassigned = useMemo(() => tasks.filter((t) => !t.phase_id), [tasks])

  function openEdit(p: ProjectPhase) {
    setEditPhase(p)
    setEditName(p.name)
    setEditDesc(p.description ?? '')
    setEditStart(p.start_date ?? '')
    setEditEnd(p.end_date ?? '')
    setEditStatus(p.status)
    setFormError(null)
  }

  function tasksForPhase(phaseId: string) {
    return tasks.filter((t) => t.phase_id === phaseId)
  }

  const phaseSelectValue = (task: TaskWithRelations) => task.phase_id ?? '__none__'

  return (
    <div className="space-y-4">
      {canManage && (
        <div className="flex flex-wrap items-center gap-2">
          <Button type="button" size="sm" onClick={() => setCreateOpen(true)}>
            <Plus size={14} aria-hidden className="shrink-0" />
            Tambah Phase
          </Button>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href={`/tasks/new?project_id=${projectId}`}>+ Tambah Task</Link>
          </Button>
        </div>
      )}

      {phases.map((phase) => (
        <Card key={phase.id} className="border-[var(--color-border)] p-4">
          <div className="mb-3 flex flex-wrap items-start justify-between gap-2 border-b border-[var(--color-border)] pb-3">
            <div>
              <h3 className="text-[0.9375rem] font-semibold text-[var(--color-text-primary)]">{phase.name}</h3>
              <p className="mt-0.5 text-[0.75rem] text-[var(--color-text-muted)]">
                {phase.start_date || phase.end_date
                  ? `${phase.start_date ? formatDate(phase.start_date) : '—'} – ${phase.end_date ? formatDate(phase.end_date) : '—'}`
                  : 'Tanpa rentang tanggal'}
              </p>
              <p className="mt-1 text-[0.6875rem] uppercase tracking-wide text-[var(--color-text-muted)]">
                Status: {phase.status.replaceAll('_', ' ')}
              </p>
            </div>
            {canManage && (
              <div className="flex gap-1">
                <Button type="button" variant="ghost" size="sm" className="h-8" onClick={() => openEdit(phase)}>
                  <Pencil size={14} aria-hidden />
                  Edit
                </Button>
                {canDeletePhase && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-8 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                    disabled={isPending}
                    onClick={() => {
                      if (!window.confirm('Hapus phase ini? Task di phase ini akan jadi tanpa phase.')) return
                      startTransition(async () => {
                        const r = await deletePhase(phase.id, projectId)
                        if ('error' in r) alert(r.error)
                      })
                    }}
                  >
                    <Trash2 size={14} aria-hidden />
                    Hapus
                  </Button>
                )}
              </div>
            )}
          </div>
          {phase.description ? (
            <p className="mb-3 text-[0.8125rem] text-[var(--color-text-secondary)]">{phase.description}</p>
          ) : null}
          {tasksForPhase(phase.id).length === 0 ? (
            <p className="text-[0.8125rem] text-[var(--color-text-muted)]">Belum ada task.</p>
          ) : (
            <ul className="m-0 list-none space-y-2 p-0">
              {tasksForPhase(phase.id).map((t) => (
                <li key={t.id} className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                  <Link href={`/tasks/${t.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                    {t.title}
                  </Link>
                  <TaskStatusBadge status={t.status} />
                  {canManage && (
                    <Select
                      value={phaseSelectValue(t)}
                      disabled={isPending}
                      onValueChange={(v) => {
                        const next = v === '__none__' ? null : v
                        startTransition(async () => {
                          const r = await assignTaskToPhase(t.id, next)
                          if ('error' in r) alert(r.error)
                        })
                      }}
                    >
                      <SelectTrigger className="h-8 w-[200px] text-[0.75rem]" aria-label="Pindah ke phase">
                        <SelectValue placeholder="Pindah ke phase" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="__none__">Tanpa phase</SelectItem>
                        {phases.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                </li>
              ))}
            </ul>
          )}
          {canManage && (
            <div className="mt-3 flex justify-end">
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href={`/tasks/new?project_id=${projectId}`}>+ Tambah Task</Link>
              </Button>
            </div>
          )}
        </Card>
      ))}

      <Card className="border-[var(--color-border)] border-dashed p-4">
        <h3 className="mb-2 text-[0.875rem] font-semibold text-[var(--color-text-primary)]">Unassigned Tasks</h3>
        {unassigned.length === 0 ? (
          <p className="text-[0.8125rem] text-[var(--color-text-muted)]">Semua task sudah masuk phase.</p>
        ) : (
          <ul className="m-0 list-none space-y-2 p-0">
            {unassigned.map((t) => (
              <li key={t.id} className="flex flex-wrap items-center gap-2 text-[0.8125rem]">
                <Link href={`/tasks/${t.id}`} className="font-medium text-[var(--color-primary)] hover:underline">
                  {t.title}
                </Link>
                <TaskStatusBadge status={t.status} />
                {canManage && (
                  <Select
                    value={phaseSelectValue(t)}
                    disabled={isPending}
                    onValueChange={(v) => {
                      const next = v === '__none__' ? null : v
                      startTransition(async () => {
                        const r = await assignTaskToPhase(t.id, next)
                        if ('error' in r) alert(r.error)
                      })
                    }}
                  >
                    <SelectTrigger className="h-8 w-[200px] text-[0.75rem]" aria-label="Pindah ke phase">
                      <SelectValue placeholder="Pindah ke phase" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="__none__">Tanpa phase</SelectItem>
                      {phases.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Tambah phase</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            {formError && (
              <p className="text-[0.75rem] text-[var(--color-danger)]" role="alert">
                {formError}
              </p>
            )}
            <div>
              <Label htmlFor="phase-name">Nama</Label>
              <Input
                id="phase-name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                maxLength={100}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="phase-desc">Deskripsi (opsional)</Label>
              <Textarea id="phase-desc" value={createDesc} onChange={(e) => setCreateDesc(e.target.value)} rows={2} className="mt-1" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="phase-start">Mulai</Label>
                <Input id="phase-start" type="date" value={createStart} onChange={(e) => setCreateStart(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="phase-end">Selesai</Label>
                <Input id="phase-end" type="date" value={createEnd} onChange={(e) => setCreateEnd(e.target.value)} className="mt-1" />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>
              Batal
            </Button>
            <Button
              type="button"
              disabled={isPending}
              onClick={() => {
                setFormError(null)
                startTransition(async () => {
                  const r = await createPhase({
                    projectId,
                    name: createName,
                    description: createDesc || undefined,
                    startDate: createStart || undefined,
                    endDate: createEnd || undefined,
                  })
                  if ('error' in r) {
                    setFormError(r.error)
                    return
                  }
                  setCreateName('')
                  setCreateDesc('')
                  setCreateStart('')
                  setCreateEnd('')
                  setCreateOpen(false)
                })
              }}
            >
              Simpan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={editPhase != null} onOpenChange={(o) => !o && setEditPhase(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit phase</DialogTitle>
          </DialogHeader>
          {editPhase && (
            <>
              <div className="space-y-3 py-2">
                {formError && (
                  <p className="text-[0.75rem] text-[var(--color-danger)]" role="alert">
                    {formError}
                  </p>
                )}
                <div>
                  <Label htmlFor="edit-phase-name">Nama</Label>
                  <Input
                    id="edit-phase-name"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={100}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="edit-phase-desc">Deskripsi</Label>
                  <Textarea id="edit-phase-desc" value={editDesc} onChange={(e) => setEditDesc(e.target.value)} rows={2} className="mt-1" />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Label htmlFor="edit-phase-start">Mulai</Label>
                    <Input id="edit-phase-start" type="date" value={editStart} onChange={(e) => setEditStart(e.target.value)} className="mt-1" />
                  </div>
                  <div>
                    <Label htmlFor="edit-phase-end">Selesai</Label>
                    <Input id="edit-phase-end" type="date" value={editEnd} onChange={(e) => setEditEnd(e.target.value)} className="mt-1" />
                  </div>
                </div>
                <div>
                  <Label>Status</Label>
                  <Select value={editStatus} onValueChange={(v) => setEditStatus(v as typeof editStatus)}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="on_hold">On hold</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditPhase(null)}>
                  Batal
                </Button>
                <Button
                  type="button"
                  disabled={isPending}
                  onClick={() => {
                    setFormError(null)
                    startTransition(async () => {
                      const r = await updatePhase(editPhase.id, {
                        name: editName,
                        description: editDesc,
                        startDate: editStart || null,
                        endDate: editEnd || null,
                        status: editStatus,
                      })
                      if ('error' in r) {
                        setFormError(r.error)
                        return
                      }
                      setEditPhase(null)
                    })
                  }}
                >
                  Simpan
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
