import { NextResponse } from 'next/server'
import { getSessionProfileOptional } from '@/lib/auth/session'
import { userCanViewFile } from '@/lib/auth/access-surface'
import { getFileById } from '@/lib/files/queries'
import { presignGetObject } from '@/lib/files/r2-service'
import { getR2Env } from '@/lib/files/r2'

export async function GET(request: Request) {
  const profile = await getSessionProfileOptional()
  if (!profile) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!getR2Env()) {
    return NextResponse.json({ error: 'R2 is not configured on this server.' }, { status: 503 })
  }

  const url = new URL(request.url)
  const fileId = url.searchParams.get('fileId')?.trim()
  if (!fileId) {
    return NextResponse.json({ error: 'Missing fileId.' }, { status: 400 })
  }

  const f = await getFileById(fileId)
  if (!f || f.provider !== 'r2' || !f.r2_key) {
    return NextResponse.json({ error: 'Not found.' }, { status: 404 })
  }

  if (!(await userCanViewFile(profile, f))) {
    return NextResponse.json({ error: 'Forbidden.' }, { status: 403 })
  }

  try {
    const downloadUrl = await presignGetObject(f.r2_key)
    return NextResponse.json({ url: downloadUrl })
  } catch (e) {
    console.error('R2 presign GET failed', e)
    return NextResponse.json({ error: 'Could not create download URL.' }, { status: 500 })
  }
}
