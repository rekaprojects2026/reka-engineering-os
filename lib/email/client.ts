import { Resend } from 'resend'

let resendSingleton: Resend | null = null

/**
 * Lazy Resend client so `next build` does not evaluate RESEND_API_KEY during
 * "Collecting page data" (Vercel may not inject all env at that phase).
 * Throws at send time if the key is still missing.
 */
export function getResend(): Resend {
  const key = process.env.RESEND_API_KEY
  if (!key) {
    throw new Error('Missing env var: RESEND_API_KEY')
  }
  if (!resendSingleton) {
    resendSingleton = new Resend(key)
  }
  return resendSingleton
}

export const FROM_ADDRESS =
  process.env.RESEND_FROM ?? 'noreply@reka-engineering.com'
