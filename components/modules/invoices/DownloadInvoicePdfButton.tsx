'use client'

import { Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DownloadInvoicePdfButton({
  invoiceId,
  invoiceNumber,
}: {
  invoiceId: string
  invoiceNumber: string
}) {
  const href = `/api/invoices/${invoiceId}/pdf`
  const safe = invoiceNumber.replace(/[^a-zA-Z0-9-_.]+/g, '_') || 'invoice'

  return (
    <Button asChild variant="outline" size="sm">
      <a href={href} target="_blank" rel="noopener noreferrer" download={`invoice-${safe}.pdf`}>
        <Download className="mr-2 h-4 w-4" aria-hidden />
        Download PDF
      </a>
    </Button>
  )
}
