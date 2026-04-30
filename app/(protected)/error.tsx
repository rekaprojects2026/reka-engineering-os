'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

export default function ProtectedError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const router = useRouter()

  useEffect(() => {
    console.error('[protected route error]', error.message, error.digest ?? '')
  }, [error])

  return (
    <div className="flex min-h-[50vh] items-center justify-center p-6">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Ada kendala</CardTitle>
          <CardDescription>
            Terjadi kesalahan saat memuat halaman ini. Tim kami dapat melacak masalah jika Anda mencoba lagi atau kembali ke
            dashboard.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-[var(--color-text-muted)]">
            {process.env.NODE_ENV === 'development' ? error.message : 'Silakan coba lagi atau hubungi administrator.'}
          </p>
        </CardContent>
        <CardFooter className="flex flex-wrap gap-2 border-t-0 pt-0">
          <Button type="button" onClick={() => reset()}>
            Coba lagi
          </Button>
          <Button type="button" variant="outline" onClick={() => router.push('/dashboard')}>
            Kembali ke dashboard
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
