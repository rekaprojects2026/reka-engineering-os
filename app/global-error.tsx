'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function RootGlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[root global error]', error.message, error.digest ?? '')
  }, [error])

  return (
    <html lang="id">
      <body className="min-h-screen bg-neutral-100 p-6 font-sans antialiased text-neutral-900">
        <div className="mx-auto max-w-md rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
          <h1 className="text-base font-semibold">Ada kendala</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Aplikasi tidak dapat dimuat dengan benar. Coba muat ulang halaman.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Button type="button" onClick={() => reset()}>
              Coba lagi
            </Button>
            <Button type="button" variant="outline" onClick={() => (window.location.href = '/dashboard')}>
              Kembali ke dashboard
            </Button>
          </div>
        </div>
      </body>
    </html>
  )
}
