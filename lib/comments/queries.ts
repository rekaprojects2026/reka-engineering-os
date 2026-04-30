import { createServerClient } from '@/lib/supabase/server'

export type CommentWithAuthor = {
  id: string
  body: string
  parent_id: string | null
  author_id: string
  edited_at: string | null
  created_at: string
  author: {
    id: string
    full_name: string
    photo_url: string | null
  }
  replies: CommentWithAuthor[]
}

type AuthorEmbed = { id: string; full_name: string; photo_url: string | null }

type FlatCommentRow = {
  id: string
  body: string
  parent_id: string | null
  author_id: string
  edited_at: string | null
  created_at: string
  author: AuthorEmbed | AuthorEmbed[] | null
}

function pickAuthor(author: FlatCommentRow['author']): AuthorEmbed {
  if (!author) return { id: '', full_name: 'Unknown', photo_url: null }
  return Array.isArray(author) ? (author[0] ?? { id: '', full_name: 'Unknown', photo_url: null }) : author
}

function mapRow(c: FlatCommentRow): CommentWithAuthor {
  return {
    id: c.id,
    body: c.body,
    parent_id: c.parent_id,
    author_id: c.author_id,
    edited_at: c.edited_at,
    created_at: c.created_at,
    author: pickAuthor(c.author),
    replies: [],
  }
}

/**
 * Ambil semua komentar untuk sebuah task.
 * Top-level dulu, replies di-nest (satu level).
 */
export async function getTaskComments(taskId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id, body, parent_id, author_id, edited_at, created_at,
      author:profiles!author_id(id, full_name, photo_url)
    `,
    )
    .eq('task_id', taskId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const flat = (data ?? []) as unknown as FlatCommentRow[]
  return nestComments(flat.map(mapRow))
}

/**
 * Ambil semua komentar untuk sebuah deliverable.
 */
export async function getDeliverableComments(deliverableId: string): Promise<CommentWithAuthor[]> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('comments')
    .select(
      `
      id, body, parent_id, author_id, edited_at, created_at,
      author:profiles!author_id(id, full_name, photo_url)
    `,
    )
    .eq('deliverable_id', deliverableId)
    .order('created_at', { ascending: true })

  if (error) throw error
  const flat = (data ?? []) as unknown as FlatCommentRow[]
  return nestComments(flat.map(mapRow))
}

export type CommentTargetRow = {
  id: string
  task_id: string | null
  deliverable_id: string | null
  author_id: string
  parent_id: string | null
}

/** Untuk otorisasi mutasi: baris komentar minimal. */
export async function getCommentById(id: string): Promise<CommentTargetRow | null> {
  const supabase = await createServerClient()
  const { data, error } = await supabase
    .from('comments')
    .select('id, task_id, deliverable_id, author_id, parent_id')
    .eq('id', id)
    .maybeSingle()

  if (error || !data) return null
  return data as CommentTargetRow
}

function nestComments(flat: CommentWithAuthor[]): CommentWithAuthor[] {
  const map = new Map<string, CommentWithAuthor>()
  const roots: CommentWithAuthor[] = []

  for (const c of flat) {
    map.set(c.id, { ...c, replies: [] })
  }
  for (const c of map.values()) {
    if (c.parent_id && map.has(c.parent_id)) {
      map.get(c.parent_id)!.replies.push(c)
    } else {
      roots.push(c)
    }
  }
  return roots
}
