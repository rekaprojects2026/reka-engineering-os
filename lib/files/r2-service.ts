import { DeleteObjectCommand, GetObjectCommand, PutObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'
import { createR2S3Client, getR2Env } from '@/lib/files/r2'

export async function presignPutObject(key: string, contentType: string): Promise<string> {
  const env = getR2Env()
  if (!env) throw new Error('R2 not configured')
  const client = createR2S3Client()
  const cmd = new PutObjectCommand({
    Bucket: env.bucket,
    Key: key,
    ContentType: contentType || 'application/octet-stream',
  })
  return getSignedUrl(client, cmd, { expiresIn: 3600 })
}

export async function presignGetObject(key: string): Promise<string> {
  const env = getR2Env()
  if (!env) throw new Error('R2 not configured')
  const client = createR2S3Client()
  const cmd = new GetObjectCommand({ Bucket: env.bucket, Key: key })
  return getSignedUrl(client, cmd, { expiresIn: 300 })
}

export async function deleteFromR2(key: string): Promise<void> {
  const env = getR2Env()
  if (!env || !key.trim()) return
  const client = createR2S3Client()
  await client.send(new DeleteObjectCommand({ Bucket: env.bucket, Key: key }))
}
