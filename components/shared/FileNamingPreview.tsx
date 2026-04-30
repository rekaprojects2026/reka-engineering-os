'use client'

import { generateFileCode } from '@/lib/files/naming'
import type { FileNamingConfig } from '@/lib/files/naming'
import { cn } from '@/lib/utils/cn'

export type FileNamingPreviewProps = {
  config: FileNamingConfig
  projectCode?: string
  discipline?: string
  docType?: string
  sequence?: number
  revision?: number
  className?: string
}

export function FileNamingPreview({
  config,
  projectCode = 'RKA2401',
  discipline = 'MCH',
  docType = 'DR',
  sequence = 1,
  revision = 0,
  className,
}: FileNamingPreviewProps) {
  const code = generateFileCode({
    projectCode,
    disciplineCode: discipline,
    docTypeCode: docType,
    sequenceNumber: sequence,
    revisionIndex: revision,
    separator: config.separator || '-',
    revisionFormat: config.revision_format || 'R0_RA_RB',
  })

  return (
    <p className={cn('text-[0.8125rem] text-[var(--color-text-secondary)]', className)}>
      Contoh:{' '}
      <code className="rounded bg-[var(--color-surface-muted)] px-1.5 py-0.5 font-mono text-[0.8125rem] text-[var(--color-text-primary)]">
        {code}
      </code>
    </p>
  )
}
