import { S3Client } from '@aws-sdk/client-s3'

export function getR2Env(): {
  accountId: string
  accessKeyId: string
  secretAccessKey: string
  bucket: string
  publicUrl: string
} | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const accessKeyId = process.env.R2_ACCESS_KEY_ID?.trim()
  const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY?.trim()
  const bucket = process.env.R2_BUCKET_NAME?.trim()
  if (!accountId || !accessKeyId || !secretAccessKey || !bucket) return null
  return {
    accountId,
    accessKeyId,
    secretAccessKey,
    bucket,
    publicUrl: process.env.R2_PUBLIC_URL?.trim() ?? '',
  }
}

export function createR2S3Client(): S3Client {
  const env = getR2Env()
  if (!env) throw new Error('R2 is not configured')
  return new S3Client({
    region: 'auto',
    endpoint: `https://${env.accountId}.r2.cloudflarestorage.com`,
    credentials: {
      accessKeyId: env.accessKeyId,
      secretAccessKey: env.secretAccessKey,
    },
  })
}

/** Optional public URL when R2_PUBLIC_URL (or CDN) is set. */
export function publicObjectUrlForKey(key: string): string | null {
  const env = getR2Env()
  if (!env?.publicUrl || !key.trim()) return null
  const base = env.publicUrl.replace(/\/$/, '')
  const k = key.replace(/^\//, '')
  return `${base}/${k}`
}
