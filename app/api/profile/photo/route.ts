import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { createServerClient } from '@/lib/supabase/server'
import { getSessionProfileOptional } from '@/lib/auth/session'

const MAX_BYTES = 2 * 1024 * 1024

const MIME_TO_EXT: Record<string, string> = {
  'image/png':  'png',
  'image/jpeg': 'jpg',
  'image/jpg':  'jpg',
  'image/webp': 'webp',
}

function objectPathFromPublicUrl(photoUrl: string): string | null {
  const marker = '/avatars/'
  const idx = photoUrl.indexOf(marker)
  if (idx === -1) return null
  const rest = photoUrl.slice(idx + marker.length)
  return rest.split('?')[0]?.trim() || null
}

export async function POST(request: Request) {
  const profile = await getSessionProfileOptional()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data.' }, { status: 400 })
  }

  const raw = formData.get('file')
  if (!raw || !(raw instanceof Blob)) {
    return NextResponse.json({ error: 'Missing file field.' }, { status: 400 })
  }

  const file = raw as File
  const mime = (file.type || '').toLowerCase()
  const ext = MIME_TO_EXT[mime]
  if (!ext) {
    return NextResponse.json({ error: 'Only PNG, JPEG, and WebP images are allowed.' }, { status: 415 })
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: 'Image must be 2 MB or smaller.' }, { status: 413 })
  }

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id || user.id !== profile.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.photo_url) {
    const oldPath = objectPathFromPublicUrl(profile.photo_url)
    if (oldPath?.startsWith(`${user.id}/`)) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  const path = `${user.id}/avatar-${Date.now()}.${ext}`
  const buffer = Buffer.from(await file.arrayBuffer())
  const { error: upErr } = await supabase.storage.from('avatars').upload(path, buffer, {
    contentType: mime,
    upsert: false,
  })

  if (upErr) {
    console.error('[profile/photo] upload', upErr)
    return NextResponse.json({ error: 'Upload failed.' }, { status: 500 })
  }

  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const publicUrl = pub.publicUrl

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ photo_url: publicUrl })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile/photo] profiles update', dbErr)
    await supabase.storage.from('avatars').remove([path])
    return NextResponse.json({ error: 'Could not save profile.' }, { status: 500 })
  }

  revalidatePath('/my-profile')
  revalidatePath('/', 'layout')

  return NextResponse.json({ url: publicUrl })
}

export async function DELETE() {
  const profile = await getSessionProfileOptional()
  if (!profile) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user?.id || user.id !== profile.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (profile.photo_url) {
    const oldPath = objectPathFromPublicUrl(profile.photo_url)
    if (oldPath?.startsWith(`${user.id}/`)) {
      await supabase.storage.from('avatars').remove([oldPath])
    }
  }

  const { error: dbErr } = await supabase
    .from('profiles')
    .update({ photo_url: null })
    .eq('id', user.id)

  if (dbErr) {
    console.error('[profile/photo] DELETE profiles', dbErr)
    return NextResponse.json({ error: 'Could not update profile.' }, { status: 500 })
  }

  revalidatePath('/my-profile')
  revalidatePath('/', 'layout')

  return NextResponse.json({ ok: true })
}
