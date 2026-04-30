'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import type { Notification } from '@/types/database'
import {
  markAllNotificationsRead,
  markEngdocsNotificationRead,
  markNotificationRead,
} from '@/lib/notifications/actions'

/** Merged row for OS + EngDocs notification bell. */
export type BellNotificationItem = {
  source: 'os' | 'docs'
  id: string
  title: string
  body: string | null
  link: string | null
  created_at: string
  read: boolean
}

function documentIdFromEngdocsData(data: unknown): string | null {
  if (typeof data !== 'object' || data === null || !('document_id' in data)) return null
  const v = (data as { document_id?: unknown }).document_id
  return typeof v === 'string' ? v : null
}

function engdocsBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_ENGDOCS_APP_URL ?? '').replace(/\/$/, '')
}

function mapOs(n: Notification): BellNotificationItem {
  return {
    source: 'os',
    id: n.id,
    title: n.title,
    body: n.body,
    link: n.link,
    created_at: n.created_at,
    read: Boolean(n.read_at),
  }
}

type EngdocsNotificationRow = {
  id: string
  title: string
  message: string
  data: unknown
  is_read: boolean
  created_at: string
}

function mapDocs(row: EngdocsNotificationRow): BellNotificationItem {
  const base = engdocsBaseUrl()
  const docId = documentIdFromEngdocsData(row.data)
  const link = docId && base ? `${base}/documents/${docId}` : base ? `${base}/` : null
  return {
    source: 'docs',
    id: row.id,
    title: row.title,
    body: row.message,
    link,
    created_at: row.created_at,
    read: row.is_read,
  }
}

function dedupeSortLimit(items: BellNotificationItem[], limit: number): BellNotificationItem[] {
  const seen = new Set<string>()
  const sorted = [...items].sort((a, b) => (a.created_at < b.created_at ? 1 : -1))
  const out: BellNotificationItem[] = []
  for (const it of sorted) {
    const k = `${it.source}:${it.id}`
    if (seen.has(k)) continue
    seen.add(k)
    out.push(it)
    if (out.length >= limit) break
  }
  return out
}

export function useRealtimeNotifications(userId: string | undefined) {
  const router = useRouter()
  const [items, setItems] = useState<BellNotificationItem[]>([])
  const [loading, setLoading] = useState(true)

  const unread = useMemo(() => items.filter((n) => !n.read).length, [items])

  useEffect(() => {
    if (!userId) {
      setItems([])
      setLoading(false)
      return
    }

    const supabase = createClient()
    let cancelled = false

    void (async () => {
      const [osRes, docsRes] = await Promise.all([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
        supabase
          .schema('engdocs')
          .from('notifications')
          .select('id, title, message, data, is_read, created_at')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(20),
      ])

      if (cancelled) return

      const osRows = (!osRes.error && osRes.data ? osRes.data : []) as Notification[]
      const osMapped = osRows.map(mapOs)

      let docsMapped: BellNotificationItem[] = []
      if (!docsRes.error && docsRes.data) {
        docsMapped = (docsRes.data as EngdocsNotificationRow[]).map(mapDocs)
      }

      setItems(dedupeSortLimit([...osMapped, ...docsMapped], 40))
      setLoading(false)
    })()

    const channelOs = supabase
      .channel(`notifications:public:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as Notification
          setItems((prev) => dedupeSortLimit([mapOs(row), ...prev.filter((x) => !(x.source === 'os' && x.id === row.id))], 40))
        },
      )
      .subscribe()

    const channelDocs = supabase
      .channel(`notifications:engdocs:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'engdocs',
          table: 'notifications',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const row = payload.new as EngdocsNotificationRow
          setItems((prev) =>
            dedupeSortLimit([mapDocs(row), ...prev.filter((x) => !(x.source === 'docs' && x.id === row.id))], 40),
          )
        },
      )
      .subscribe()

    return () => {
      cancelled = true
      void supabase.removeChannel(channelOs)
      void supabase.removeChannel(channelDocs)
    }
  }, [userId])

  const onItemClick = useCallback(
    async (n: BellNotificationItem) => {
      if (!n.read) {
        if (n.source === 'docs') {
          await markEngdocsNotificationRead(n.id)
          setItems((prev) => prev.map((x) => (x.source === 'docs' && x.id === n.id ? { ...x, read: true } : x)))
        } else {
          await markNotificationRead(n.id)
          setItems((prev) => prev.map((x) => (x.source === 'os' && x.id === n.id ? { ...x, read: true } : x)))
        }
      }
      if (n.link) {
        if (n.link.startsWith('http://') || n.link.startsWith('https://')) {
          window.location.assign(n.link)
        } else {
          router.push(n.link)
        }
      }
    },
    [router],
  )

  const markAllRead = useCallback(async () => {
    await markAllNotificationsRead()
    setItems((prev) => prev.map((x) => ({ ...x, read: true })))
    router.refresh()
  }, [router])

  return { items, unread, loading, onItemClick, markAllRead }
}
