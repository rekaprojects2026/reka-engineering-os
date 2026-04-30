/**
 * Shared payment proof URL rules (write + read paths).
 * Only http(s) URLs are accepted to avoid javascript: and other unsafe schemes.
 */

export type ParsedProofLink = { ok: true; href: string | null } | { ok: false; message: string }

export function parsePaymentProofLink(input: string | null | undefined): ParsedProofLink {
  const t = (input ?? '').trim()
  if (!t) return { ok: true, href: null }
  try {
    const u = new URL(t)
    if (u.protocol !== 'http:' && u.protocol !== 'https:') {
      return { ok: false, message: 'Proof link must use http:// or https://.' }
    }
    return { ok: true, href: u.href }
  } catch {
    return { ok: false, message: 'Proof link must be a valid URL.' }
  }
}

/** Safe href for <a> rendering; null means show as plain text (invalid or legacy value). */
export function safePaymentProofHref(raw: string | null | undefined): string | null {
  const r = parsePaymentProofLink(raw)
  return r.ok ? r.href : null
}
