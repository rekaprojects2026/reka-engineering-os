'use client'

import { useCallback, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Pencil, Reply, Trash2 } from 'lucide-react'
import { SectionCard } from '@/components/shared/SectionCard'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { cn } from '@/lib/utils/cn'
import { formatRelativeTime, getInitials } from '@/lib/utils/formatters'
import type { CommentWithAuthor } from '@/lib/comments/queries'
import { addComment, deleteComment, editComment } from '@/lib/comments/actions'

export interface CommentSectionProps {
  comments: CommentWithAuthor[]
  taskId?: string
  deliverableId?: string
  currentUserId: string
}

function nameHue(name: string): number {
  let h = 0
  for (let i = 0; i < name.length; i += 1) {
    h = (h * 31 + name.charCodeAt(i)) | 0
  }
  return Math.abs(h) % 360
}

export function CommentSection({
  comments: initialComments,
  taskId,
  deliverableId,
  currentUserId,
}: CommentSectionProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [body, setBody] = useState('')
  const [replyTo, setReplyTo] = useState<{ id: string; label: string } | null>(null)
  const [formError, setFormError] = useState<string | null>(null)

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh()
    })
  }, [router])

  const submitTop = async () => {
    setFormError(null)
    const trimmed = body.trim()
    if (!trimmed) {
      setFormError('Komentar tidak boleh kosong')
      return
    }
    const res = await addComment({
      body: trimmed,
      taskId,
      deliverableId,
      parentId: replyTo?.id,
    })
    if ('error' in res) {
      setFormError(res.error)
      return
    }
    setBody('')
    setReplyTo(null)
    refresh()
  }

  return (
    <SectionCard title="Comments" className="mt-5">
      <div className="flex flex-col gap-4">
        {initialComments.length === 0 ? (
          <p className="text-[0.8125rem] text-[var(--color-text-muted)]">
            Belum ada komentar. Mulai diskusi di bawah.
          </p>
        ) : (
          <ul className="flex list-none flex-col gap-4 p-0 m-0">
            {initialComments.map((c) => (
              <li key={c.id}>
                <CommentItem
                  comment={c}
                  currentUserId={currentUserId}
                  allowReply
                  taskId={taskId}
                  deliverableId={deliverableId}
                  onChanged={refresh}
                  isPending={isPending}
                  onReply={(id, label) => setReplyTo({ id, label })}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="border-t border-[var(--color-border)] pt-4">
          {replyTo && (
            <div className="mb-2 flex items-center justify-between gap-2 text-[0.75rem] text-[var(--color-text-secondary)]">
              <span>
                Membalas <span className="font-medium text-[var(--color-text-primary)]">{replyTo.label}</span>
              </span>
              <Button type="button" variant="ghost" size="sm" className="h-7" onClick={() => setReplyTo(null)}>
                Batal
              </Button>
            </div>
          )}
          {formError && (
            <p className="mb-2 text-[0.75rem] text-[var(--color-danger)]" role="alert">
              {formError}
            </p>
          )}
          <Textarea
            placeholder="Tulis komentar..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            disabled={isPending}
            rows={3}
            maxLength={2000}
            className="mb-2"
          />
          <div className="flex justify-end">
            <Button type="button" size="sm" onClick={() => void submitTop()} disabled={isPending}>
              Kirim
            </Button>
          </div>
        </div>
      </div>
    </SectionCard>
  )
}

function CommentItem({
  comment,
  currentUserId,
  allowReply,
  taskId,
  deliverableId,
  onChanged,
  isPending,
  onReply,
}: {
  comment: CommentWithAuthor
  currentUserId: string
  allowReply: boolean
  taskId?: string
  deliverableId?: string
  onChanged: () => void
  isPending: boolean
  onReply?: (id: string, label: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [editBody, setEditBody] = useState(comment.body)
  const [localError, setLocalError] = useState<string | null>(null)
  const isAuthor = comment.author_id === currentUserId
  const hue = nameHue(comment.author.full_name)
  const initials = getInitials(comment.author.full_name || '?')

  const saveEdit = async () => {
    setLocalError(null)
    const res = await editComment(comment.id, editBody)
    if ('error' in res) {
      setLocalError(res.error)
      return
    }
    setEditing(false)
    onChanged()
  }

  const remove = async () => {
    if (!window.confirm('Hapus komentar ini?')) return
    setLocalError(null)
    const res = await deleteComment(comment.id)
    if ('error' in res) {
      setLocalError(res.error)
      return
    }
    onChanged()
  }

  const startReply = () => {
    onReply?.(comment.id, comment.author.full_name)
  }

  return (
    <div className="group/comment">
      <div className="flex gap-3 items-start">
        <Avatar className="h-9 w-9 shrink-0 self-start border border-[var(--color-border)]">
          {comment.author.photo_url ? (
            <AvatarImage src={comment.author.photo_url} alt="" />
          ) : null}
          <AvatarFallback
            className="text-[0.6875rem] font-semibold text-white"
            style={{ backgroundColor: `hsl(${hue} 42% 42%)` }}
          >
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0">
            <span className="text-[0.8125rem] font-semibold text-[var(--color-text-primary)]">
              {comment.author.full_name}
            </span>
            <time
              className="text-[0.75rem] text-[var(--color-text-muted)]"
              dateTime={comment.created_at}
              title={comment.created_at}
            >
              {formatRelativeTime(comment.created_at)}
            </time>
            {comment.edited_at && (
              <span className="text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--color-text-muted)]">
                edited
              </span>
            )}
          </div>

          {localError && (
            <p className="mt-1 text-[0.75rem] text-[var(--color-danger)]" role="alert">
              {localError}
            </p>
          )}

          {editing ? (
            <div className="mt-2 space-y-2">
              <Textarea
                value={editBody}
                onChange={(e) => setEditBody(e.target.value)}
                disabled={isPending}
                rows={3}
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button type="button" size="sm" onClick={() => void saveEdit()} disabled={isPending}>
                  Simpan
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setEditing(false)
                    setEditBody(comment.body)
                    setLocalError(null)
                  }}
                  disabled={isPending}
                >
                  Batal
                </Button>
              </div>
            </div>
          ) : (
            <p className="mt-1 whitespace-pre-wrap text-[0.8125rem] leading-relaxed text-[var(--color-text-secondary)]">
              {comment.body}
            </p>
          )}

          {!editing && (
            <div
              className={cn(
                'mt-1 flex flex-wrap items-center gap-1 opacity-0 transition-opacity group-hover/comment:opacity-100',
                'focus-within:opacity-100',
              )}
            >
              {allowReply && onReply && (taskId || deliverableId) && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1 px-2 text-[var(--color-text-muted)]"
                  onClick={startReply}
                  disabled={isPending}
                >
                  <Reply size={12} aria-hidden />
                  Reply
                </Button>
              )}
              {isAuthor && (
                <>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[var(--color-text-muted)]"
                    onClick={() => {
                      setEditBody(comment.body)
                      setEditing(true)
                      setLocalError(null)
                    }}
                    disabled={isPending}
                  >
                    <Pencil size={12} aria-hidden />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-7 gap-1 px-2 text-[var(--color-danger)] hover:text-[var(--color-danger)]"
                    onClick={() => void remove()}
                    disabled={isPending}
                  >
                    <Trash2 size={12} aria-hidden />
                    Hapus
                  </Button>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {comment.replies.length > 0 && (
        <ul className="mt-3 ml-6 flex list-none flex-col gap-3 border-l border-[var(--color-border)] pl-4 m-0">
          {comment.replies.map((r) => (
            <li key={r.id}>
              <CommentItem
                comment={r}
                currentUserId={currentUserId}
                allowReply={false}
                taskId={taskId}
                deliverableId={deliverableId}
                onChanged={onChanged}
                isPending={isPending}
                onReply={undefined}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
