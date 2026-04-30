export type ProgressBarTone = 'neutral' | 'danger' | 'warning' | 'primary' | 'success'

const TONE_FILL: Record<ProgressBarTone, string> = {
  neutral: 'var(--color-neutral)',
  danger: 'var(--color-danger)',
  warning: 'var(--color-warning)',
  primary: 'var(--color-primary)',
  success: 'var(--color-success)',
}

interface ProgressBarProps {
  value: number
  height?: number
  className?: string
  /** When set, overrides default fill color rules. */
  tone?: ProgressBarTone
}

export function ProgressBar({ value, height = 6, className, tone }: ProgressBarProps) {
  const clamped = Math.max(0, Math.min(100, value))

  let fillColor: string
  if (tone) {
    fillColor = TONE_FILL[tone]
  } else {
    fillColor = 'var(--color-neutral)'
    if (clamped > 0 && clamped < 100) fillColor = 'var(--color-primary)'
    if (clamped === 100) fillColor = 'var(--color-success)'
  }

  return (
    <div
      className={className}
      style={{
        width: '100%',
        height: `${height}px`,
        backgroundColor: 'var(--color-surface-muted)',
        borderRadius: `${height / 2}px`,
        overflow: 'hidden',
      }}
      role="progressbar"
      aria-valuenow={clamped}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${clamped}% complete`}
    >
      <div
        style={{
          width: `${clamped}%`,
          height: '100%',
          backgroundColor: fillColor,
          borderRadius: `${height / 2}px`,
          transition: 'width 0.3s ease',
        }}
      />
    </div>
  )
}
