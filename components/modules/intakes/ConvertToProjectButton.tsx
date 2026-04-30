import Link from 'next/link'
import { ArrowRightCircle } from 'lucide-react'

interface ConvertToProjectButtonProps {
  intakeId: string
}

/**
 * Button shown on intake detail page for qualified intakes.
 * Links to the conversion page.
 */
export function ConvertToProjectButton({ intakeId }: ConvertToProjectButtonProps) {
  return (
    <Link
      href={`/intakes/${intakeId}/convert`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        padding: '8px 14px',
        backgroundColor: 'var(--color-primary)',
        color: '#fff',
        borderRadius: '6px',
        fontSize: '0.8125rem',
        fontWeight: 500,
        textDecoration: 'none',
      }}
    >
      <ArrowRightCircle size={14} aria-hidden="true" />
      Convert to Project
    </Link>
  )
}
