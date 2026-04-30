'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

function slugMember(s: string): string {
  const t = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
  return t || 'member'
}

export function DownloadPayslipPdfButton({
  payslipId,
  periodYear,
  periodMonth,
  memberName,
}: {
  payslipId: string
  periodYear: number
  periodMonth: number
  memberName: string
}) {
  const href = `/api/payslips/${payslipId}/pdf`
  const ym = `${periodYear}${String(periodMonth).padStart(2, '0')}`
  const filename = `payslip-${ym}-${slugMember(memberName)}.pdf`

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} target="_blank" rel="noopener noreferrer" download={filename}>
        <Download className="mr-2 h-4 w-4" aria-hidden />
        Download PDF
      </a>
    </Button>
  )
}
